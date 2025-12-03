import os
import json
import datetime as dt
from typing import List, Optional, Literal, Dict, Any

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    AutoModel,
    AutoTokenizer as AutoTokenizerForEmb,
    StoppingCriteria,
    StoppingCriteriaList,
)
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor


# =========================
# 0) 전역 설정
# =========================
BASE_MODEL = "kakaocorp/kanana-1.5-8b-instruct-2505"
EMB_MODEL = "intfloat/multilingual-e5-large-instruct"

DB_CFG = dict(
    host="127.0.0.1",
    port=5432,
    dbname="civildb",
    user="civilword",
    password="1234"
)

TOP_K_PERMIT = 6
TOP_K_TRAFFIC = 5
TRIGRAM_SIM_THRESHOLD_PERMIT = 0.2
TRIGRAM_SIM_THRESHOLD_TRAFFIC = 0.15

DOMAIN_CONFIG: Dict[str, Dict[str, Any]] = {
    "BUILDING_PERMIT": {
        "style_rules": [
            "아래 [컨텍스트]의 사실만 사용하고 추측 금지.",
            "아래 예시와 같은 형식으로 답변 생성",
            "행정문서체로 정확하게 서술.",
            "요약에 포함된 항목만 안내.",
            "예시)",
            "민원인께서 문의하신 사항은 [민원 요지]로 확인됩니다.",
            "[답변 요지 관련 내용]",
            "추가적인 문의사항은 건축과로 문의바랍니다.",
        ],
        "required_fields": [
            ("허가번호", "permit_no"),
            ("주소", "address"),
            ("허가일", "permit_date"),
            ("용도", "bldg_use"),
            ("연면적(㎡)", "total_floor_area"),
        ],
    },
    "TRAFFIC_ORDINANCE": {
        "style_rules": [
            "아래 [컨텍스트]에 명시된 조례/조문 내용만 사용한다.",
            "아래 예시와 같은 형식으로 답변 생성",
            "추측 금지, 확정적으로 단속하겠다는 약속 금지.",
            "행정문서체로 정확하게 작성.",
            "민원 요지에 해당하는 의무/기준/절차만 안내.",
            "예시)",
            "민원인께서 문의하신 사항은 [민원 요지]로 확인됩니다.",
            "[답변 요지 관련 내용]",
            "추가적인 문의사항은 교통행정과로 문의바랍니다.",
        ],
        "required_fields": [
            ("조례명", "ordinance_name"),
            ("관련 조문", "clause_path"),
            ("시행일", "effective_date"),
        ],
    },
    "GENERAL": {
        "style_rules": [
            "민원 요지에 해당하는 행정 안내 사항만 제시.",
            "근거 자료가 없으면 추측하지 말고 확인이 필요함을 명시.",
        ],
        "required_fields": [],
    },
}


# =========================
# 1) 모델 로딩 (LLM / Embedding)
# =========================
print("LLM 및 임베딩 모델 로딩 중...")

llm_tok = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
if llm_tok.eos_token is None:
    llm_tok.eos_token = "</s>"
if llm_tok.pad_token is None:
    llm_tok.pad_token = llm_tok.eos_token

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)

llm = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
llm.eval()

emb_tok = AutoTokenizerForEmb.from_pretrained(EMB_MODEL, trust_remote_code=True)
emb_model = AutoModel.from_pretrained(
    EMB_MODEL,
    trust_remote_code=True,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)
emb_model.eval()

print("모델 로딩 완료.")


# =========================
# 2) StoppingCriteria: '끝.'에서 강제 종료
# =========================
class StopOnAnyStopWords(StoppingCriteria):
    """
    stop_words 안의 어느 문자열이라도 출력되면 즉시 중단.
    예: ["끝.", "end."]
    """
    def __init__(self, tokenizer, stop_words: List[str]):
        self.stop_ids_list = []
        for w in stop_words:
            ids = tokenizer(
                w,
                add_special_tokens=False,
                return_tensors="pt"
            ).input_ids[0].tolist()
            self.stop_ids_list.append(ids)

    def __call__(self, input_ids, scores, **kwargs):
        # input_ids: (batch, seq_len)
        generated = input_ids[0].tolist()
        for stop_ids in self.stop_ids_list:
            n = len(stop_ids)
            if n <= len(generated) and generated[-n:] == stop_ids:
                return True
        return False

# =========================
# 3) 공통 유틸
# =========================
def embed_query(text: str) -> np.ndarray:
    """e5 계열 임베딩 (L2 normalize)."""
    device = emb_model.device
    inp = f"query: {text}"
    tokens = emb_tok(
        [inp],
        padding=True,
        truncation=True,
        return_tensors="pt"
    ).to(device)
    with torch.no_grad():
        out = emb_model(**tokens)
        vec = out.last_hidden_state[:, 0, :]
        vec = torch.nn.functional.normalize(vec, p=2, dim=1)
    return vec[0].float().cpu().numpy()


def to_vector_literal(vec: np.ndarray) -> str:
    """pgvector ::vector literal."""
    return "[" + ",".join(f"{float(x):.8f}" for x in vec.tolist()) + "]"


def llm_generate(prompt: str,
                 max_new_tokens: int = 400,
                 temperature: float = 0.7) -> str:
    """
    LLM 호출 후 '### Response:' 뒤만 잘라서 반환.
    '끝.' 또는 'end.'가 등장하면 즉시 중단하고,
    해당 단어 자체도 최종 결과에서 제거한다.
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = llm_tok(
        prompt,
        return_tensors="pt",
        padding=True,
        truncation=True
    ).to(device)

    stopping_criteria = StoppingCriteriaList([
        StopOnAnyStopWords(llm_tok, stop_words=["끝.", "end."])
    ])

    with torch.no_grad():
        outputs = llm.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=temperature,
            top_p=0.9,
            repetition_penalty=1.3,
            eos_token_id=llm_tok.eos_token_id,
            pad_token_id=llm_tok.pad_token_id,
            stopping_criteria=stopping_criteria,
        )

    full_text = llm_tok.decode(outputs[0], skip_special_tokens=True)

    # "### Response:" 이후만 사용
    if "### Response:" in full_text:
        result = full_text.split("### Response:")[-1].strip()
    else:
        result = full_text.strip()

    # '끝.' 또는 'end.'가 있다면 해당 단어 이전까지만 남김
    cut_positions = []
    for marker in ["끝.", "end."]:
        idx = result.find(marker)
        if idx != -1:
            cut_positions.append(idx)
    if cut_positions:
        cut_at = min(cut_positions)
        result = result[:cut_at].rstrip()  # 공백까지 제거

    return result

# =========================
# 4) 도메인 라우팅 (하이브리드 3단)
# =========================
from collections import defaultdict
from typing import Tuple

# A단: 의미 기반 프로토타입
DOMAIN_PROTOTYPES = {
    "BUILDING_PERMIT": [
        "건축 허가, 사용승인, 증축, 용도변경 등 인허가 관련 문의",
        "건축물 설계, 연면적, 대지, 허가 절차 및 승인 문의"
    ],
    "TRAFFIC_ORDINANCE": [
        "불법 주정차 단속, 견인, 과태료 부과에 대한 민원",
        "통학로 안전, 주차 문제와 관련된 조례 안내",
        "작업을 위한 일시 주차 예외 요청, 표지·노면표시 불명확으로 과태료 취소 요구",
        "공사 차량의 주정차 예외 인정 여부와 단속 기준 문의"
    ],
    "GENERAL": [
        "특정 전문 부서로 분류되지 않는 일반 민원"
    ]
}

# B단: 가드레일 규칙
#  - '결정적 증거어'는 도메인을 강하게 시그널링
BUILDING_STRONG = {"사용승인", "건축허가", "허가신청", "허가번호", "연면적", "용도변경"}
TRAFFIC_STRONG  = {"불법주정차", "주차단속", "견인", "과태료", "통학로", "노면표시", "표지판"}

# 약한 힌트(가점용). 단독이면 약함.
BUILDING_WEAK = {"공사", "부지", "건설사"}
TRAFFIC_WEAK  = {"주차", "차량", "단속", "신호", "도로"}

# 프로토타입 임베딩 캐시
_PROTO_TEXTS = [(dom, t) for dom, arr in DOMAIN_PROTOTYPES.items() for t in arr]
_PROTO_EMBS = np.stack([embed_query(t) for _, t in _PROTO_TEXTS], axis=0)  # (N, D)
_PROTO_DOMS = [dom for dom, _ in _PROTO_TEXTS]

def _semantic_scores(query: str) -> Dict[str, float]:
    q = embed_query(query)
    sims = (_PROTO_EMBS @ q).tolist()  # 코사인(정규화 완료 가정)
    best = defaultdict(lambda: -1.0)
    for dom, s in zip(_PROTO_DOMS, sims):
        if s > best[dom]:
            best[dom] = s
    return dict(best)  # {"TRAFFIC_ORDINANCE":0.62, ...}

def _guardrail_boost(text: str) -> Tuple[float, float]:
    # 규칙 가점: strong 1.0, weak 0.3 누적
    b = 0.0; t = 0.0
    for w in BUILDING_STRONG:
        if w in text: b += 1.0
    for w in TRAFFIC_STRONG:
        if w in text: t += 1.0
    for w in BUILDING_WEAK:
        if w in text: b += 0.3
    for w in TRAFFIC_WEAK:
        if w in text: t += 0.3
    return b, t

def _verify_with_llm(summary: str, content: str, top2: Tuple[str, str]) -> str:
    """
    C단: A·B 단계가 애매하거나 충돌할 때만 호출.
    LLM에게 점수화(0~1)와 근거 키워드를 강제하도록 프롬프트 구성.
    """
    prompt = f"""
다음 민원을 교통(TRAFFIC_ORDINANCE) vs 건축(BUILDING_PERMIT) 중 어디에 더 적합한지 판정하라.
1) 핵심 주제를 한 줄로 요약
2) 각 도메인 관련도 점수 (0~1, 소수 2자리)
3) 근거 키워드 3개 이내
4) 최종 선택: TRAFFIC_ORDINANCE 또는 BUILDING_PERMIT 중 하나만

[요약]
{summary}

[민원]
{content}

[출력형식]
핵심: ...
관련도: BUILDING=0.xx, TRAFFIC=0.xx
근거: ...
최종: <LABEL>
끝.
"""
    out = llm_generate(prompt, max_new_tokens=200, temperature=0.2)
    # 단순 파서: '최종: LABEL' 라인만 추출
    label = "GENERAL"
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("최종:"):
            v = line.split(":", 1)[1].strip()
            if v in ("BUILDING_PERMIT", "TRAFFIC_ORDINANCE"):
                label = v
            break
    return label

def route_domain(content: str, summary: str) -> Literal["BUILDING_PERMIT","TRAFFIC_ORDINANCE","GENERAL"]:
    """
    하이브리드 3단 라우팅:
    A) 임베딩 프로토타입 스코어
    B) 가드레일 규칙 가점
    C) 불확실/충돌 시 LLM 검증
    """
    text = (summary + " " + content).strip()
    sem = _semantic_scores(text)  # A단

    # 기본 스코어 세팅
    b_sem = sem.get("BUILDING_PERMIT", -1.0)
    t_sem = sem.get("TRAFFIC_ORDINANCE", -1.0)

    # B단: 규칙 가점
    b_boost, t_boost = _guardrail_boost(text)
    b_score = b_sem + 0.08 * b_boost  # 가점 계수는 경험적으로 조정
    t_score = t_sem + 0.08 * t_boost

    # 확신도 기준
    MIN_ABS = 0.30
    MARGIN  = 0.12

    # 1차 결정
    top_dom = "GENERAL"
    if max(b_score, t_score) < MIN_ABS:
        top_dom = "GENERAL"
    else:
        top_dom = "BUILDING_PERMIT" if b_score > t_score else "TRAFFIC_ORDINANCE"
        # 근소 차이면 C단 검증
        if abs(b_score - t_score) < MARGIN:
            # A단 상위 2개 전달(설명 강제용, 미사용이면 제거 가능)
            top2 = tuple(sorted(["BUILDING_PERMIT","TRAFFIC_ORDINANCE"], key=lambda d: sem.get(d,-1.0), reverse=True)[:2])
            ver = _verify_with_llm(summary, content, top2)  # C단
            if ver in ("BUILDING_PERMIT","TRAFFIC_ORDINANCE"):
                top_dom = ver

    return top_dom



# =========================
# 5) 도메인별 Retriever
# =========================
PERMIT_SQL = """
WITH vec AS (
  SELECT
    c.id,
    c.content,
    (c.meta
      || jsonb_build_object(
           'permit_no', p.permit_no,
           'address', p.site_location,
           'permit_date', p.permit_date,
           'bldg_use', p.main_use,
           'total_floor_area', p.total_floor_area
         )
    ) AS meta,
    1 - (c.embedding <=> %(qemb_vec)s::vector) AS vscore
  FROM rag_chunk c
  JOIN permit p ON p.id = c.permit_id
  WHERE (%(address)s IS NULL OR p.site_location ILIKE %(address_like)s)
    AND (%(date_from)s IS NULL OR p.permit_date >= %(date_from)s)
    AND (%(date_to)s   IS NULL OR p.permit_date <  %(date_to)s)
  ORDER BY c.embedding <=> %(qemb_vec)s::vector
  LIMIT 100
),
kw AS (
  SELECT
    c.id,
    c.content,
    (c.meta
      || jsonb_build_object(
           'permit_no', p.permit_no,
           'address', p.site_location,
           'permit_date', p.permit_date,
           'bldg_use', p.main_use,
           'total_floor_area', p.total_floor_area
         )
    ) AS meta,
    similarity(c.content, %(qtext)s) AS kscore
  FROM rag_chunk c
  JOIN permit p ON p.id = c.permit_id
  WHERE (c.content ILIKE %(qtext_like)s
         OR similarity(c.content, %(qtext)s) > %(sim_thres)s)
    AND (%(address)s IS NULL OR p.site_location ILIKE %(address_like)s)
    AND (%(date_from)s IS NULL OR p.permit_date >= %(date_from)s)
    AND (%(date_to)s   IS NULL OR p.permit_date <  %(date_to)s)
  ORDER BY kscore DESC
  LIMIT 100
)
SELECT
  COALESCE(v.id, k.id) AS id,
  COALESCE(v.content, k.content) AS content,
  COALESCE(v.meta, k.meta) AS meta,
  COALESCE(v.vscore, 0)*0.6 + COALESCE(k.kscore, 0)*0.4 AS score
FROM vec v
FULL OUTER JOIN kw k ON v.id = k.id
ORDER BY score DESC
LIMIT %(topk)s;
"""

def fetch_permit_contexts(
    query_text: str,
    query_emb: np.ndarray,
    address: Optional[str] = None,
    date_from: Optional[dt.date] = None,
    date_to: Optional[dt.date] = None,
    topk: int = TOP_K_PERMIT,
    sim_thres: float = TRIGRAM_SIM_THRESHOLD_PERMIT,
):
    conn = psycopg2.connect(**DB_CFG)
    try:
        params = {
            "qemb_vec": to_vector_literal(query_emb),
            "qtext": query_text,
            "qtext_like": f"%{query_text}%",
            "address": address,
            "address_like": f"%{address}%" if address else None,
            "date_from": date_from,
            "date_to": date_to,
            "sim_thres": sim_thres,
            "topk": topk,
        }
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(PERMIT_SQL, params)
            rows = cur.fetchall()
    finally:
        conn.close()
    return rows


TRAFFIC_SQL = """
WITH vec AS (
    SELECT 
        c.id, c.content, c.meta,
        1 - (c.embedding <=> %(qemb_vec)s::vector) AS vscore
    FROM rag_chunk_traffic c
    ORDER BY c.embedding <=> %(qemb_vec)s::vector
    LIMIT 100
),
kw AS (
    SELECT 
        c.id, c.content, c.meta,
        similarity(c.content, %(qtext)s) AS kscore
    FROM rag_chunk_traffic c
    WHERE similarity(c.content, %(qtext)s) > %(sim_thres)s
    ORDER BY kscore DESC
    LIMIT 100
)
SELECT 
    COALESCE(v.id, k.id) AS id,
    COALESCE(v.content, k.content) AS content,
    COALESCE(v.meta, k.meta) AS meta,
    COALESCE(v.vscore, 0) * 0.6 + COALESCE(k.kscore, 0) * 0.4 AS score
FROM vec v
FULL OUTER JOIN kw k ON v.id = k.id
ORDER BY score DESC
LIMIT %(topk)s;
"""

def fetch_traffic_contexts(
    query_text: str,
    query_emb: np.ndarray,
    topk: int = TOP_K_TRAFFIC,
    sim_thres: float = TRIGRAM_SIM_THRESHOLD_TRAFFIC,
):
    conn = psycopg2.connect(**DB_CFG)
    try:
        params = {
            "qemb_vec": to_vector_literal(query_emb),
            "qtext": query_text,
            "sim_thres": sim_thres,
            "topk": topk,
        }
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(TRAFFIC_SQL, params)
            rows = cur.fetchall()
    finally:
        conn.close()
    return rows


# =========================
# 6) 프롬프트 빌더
# =========================
def build_prompt_generic(
    domain_key: str,
    content: str,
    summary: str,
    contexts: List[dict]
) -> str:
    cfg = DOMAIN_CONFIG[domain_key]

    style_rules_text = "\n".join([f"- {rule}" for rule in cfg["style_rules"]])

    bullet_lines = []
    required_fields = cfg["required_fields"]
    table_lines = []

    if required_fields:
        header_cells = ["항목"] + [label for (label, _) in required_fields]
        header_md = "| " + " | ".join(header_cells) + " |"
        align_md = "|" + "|".join([":--:"] + [":--" for _ in required_fields]) + "|"
        table_lines.append(header_md)
        table_lines.append(align_md)

    if contexts:
        for i, row in enumerate(contexts, 1):
            meta = row.get("meta") or {}
            bullet_lines.append(f"- 항목{i}) {row.get('content','')}")
            if required_fields:
                values = []
                for (_, field_key) in required_fields:
                    values.append(str(meta.get(field_key, "-")))
                table_lines.append("| " + " | ".join([str(i)] + values) + " |")
    else:
        bullet_lines.append("(검색된 근거가 없습니다)")
        if required_fields:
            table_lines.append("(표시할 데이터 없음)")

    # 프롬프트 내에 "끝."으로 마무리하라고 강제
    prompt = (
        "당신은 공공기관 민원 답변 자동작성 AI입니다.\n"
        "아래 규칙을 반드시 준수하십시오.\n"
        f"{style_rules_text}\n\n"
        f"[답변 요약]: {summary}\n"
        f"[민원 내용]: {content}\n\n"
        "[컨텍스트]\n" + "\n".join(bullet_lines) + "\n\n"
        "1. 모르면 모른다고 대답하고 확실한 경우에만 대답하십시오.\n"
        f"2. {summary}에 포함된 내용으로만 답변을 구성하십시오.\n"
        "3. 총 세 부분으로만 작성하십시오:\n"
        "   (1) 민원 요지 확인\n"
        "   (2) 확인된 사실 안내\n"
        "   (3) 문의 안내\n"
        "4. (1), (2), (3) 같은 소제목은 붙이지 마십시오.\n"
        "5. 마지막 문장은 반드시 '끝.' 또는 'end.' 로 마무리하고 그 이후에는 아무 것도 출력하지 마십시오.\n"
    )

    if required_fields:
        prompt += "[근거 데이터 표]\n" + "\n".join(table_lines) + "\n\n"

    prompt += (
        "위 지침에 따라 답변만 작성하십시오.\n"
        "### Response:\n"
    )
    return prompt


# =========================
# 7) 도메인별 체인
# =========================
def run_building_permit(content: str, summary: str) -> str:
    # 변경: 요약을 가중하기 위해 쿼리에 summary 포함
    qemb = embed_query(f"{summary} {content}")
    ctxs = fetch_permit_contexts(
        query_text=content,
        query_emb=qemb,
        address=None,
        date_from=None,
        date_to=None,
        topk=TOP_K_PERMIT,
        sim_thres=TRIGRAM_SIM_THRESHOLD_PERMIT,
    )
    prompt = build_prompt_generic("BUILDING_PERMIT", content, summary, ctxs)
    return llm_generate(prompt, max_new_tokens=400, temperature=0.7)


def run_traffic(content: str, summary: str) -> str:
    # 변경: 요약을 가중하기 위해 쿼리에 summary 포함
    qemb = embed_query(f"{summary} {content}")
    ctxs = fetch_traffic_contexts(
        query_text=content,
        query_emb=qemb,
        topk=TOP_K_TRAFFIC,
        sim_thres=TRIGRAM_SIM_THRESHOLD_TRAFFIC,
    )
    prompt = build_prompt_generic("TRAFFIC_ORDINANCE", content, summary, ctxs)
    return llm_generate(prompt, max_new_tokens=512, temperature=0.7)

def run_general(content: str, summary: str) -> str:
    ctxs: List[dict] = []
    prompt = build_prompt_generic("GENERAL", content, summary, ctxs)
    return llm_generate(prompt, max_new_tokens=300, temperature=0.7)

# =========================
# 8) 요약 함수 (짧은 / 긴)
# =========================

def summarize_short(text: str) -> str:
    """
    짧은 요약: 민원 핵심 주제를 짧게 요약.
    예: "옥외광고물 위반 현수막", "불법주정차 과태료 민원"
    """
    prompt = f"""
당신은 민원 내용을 '핵심 주제'로만 요약하는 AI입니다.

[지침]
- 반드시 민원의 핵심 사안을 요약하십시오.
- 지역명이나 도로명이 있다면 포함하십시오.
- 가능한 한 짧은 명사구(문장 X)로 작성하십시오.
- 불필요한 수식어는 제거하고, 핵심 사건/대상 위주로 표현하십시오.
- 예: "화명1동 불법주차", "신호등 고장", "도로 파손", "옥외광고물 위반 현수막"
- 설명 문장, 접속사, 존댓말 문장은 쓰지 마십시오.
- 마지막에 반드시 '끝.'으로 마무리하십시오.

[입력 민원]
{text.strip()}

[출력 형식]
- 민원 핵심 한 줄 (명사구)만 작성하고 끝에 '끝.'을 붙입니다.

### Response:
"""
    out = llm_generate(
        prompt,
        max_new_tokens=64,
        temperature=0.3,
    )

    # 혹시 여러 줄이 나오면 첫 줄만 사용
    summary = out.strip().splitlines()[0].strip()
    return summary


def summarize_long(text: str) -> str:
    """
    긴 요약: 민원 내용을 2~4문장 정도의 행정문서체 요약으로 생성.
    (도메인 라우팅용 보조 요약이나, 화면 표시용 요약에 사용)
    """
    prompt = f"""
당신은 공공 민원 내용을 행정문서체로 요약하는 AI입니다.

[지침]
- 전화번호를 넣지마라.
- 아래 민원 내용을 2~4문장으로 요약하십시오.
- 핵심 배경, 요청 사항, 관련 법/제도 쟁점을 포함해 간결히 정리하십시오.
- 문체는 공공기관 행정문서체(서술형 존댓말)를 사용하십시오.
- 목록, 번호, 불릿 없이 일반 문장만 작성하십시오.
- 마지막 문장은 반드시 '끝.'으로 마무리하십시오.

[입력 민원]
{text.strip()}

[출력 형식]
- 2~4문장 행정문서체 요약을 작성하고 마지막에 '끝.'을 붙입니다.

### Response:
"""
    out = llm_generate(
        prompt,
        max_new_tokens=200,
        temperature=0.4,
    )

    summary = out.strip()
    return summary


def summarize(text: str, mode: Literal["short", "long"] = "short") -> str:
    """
    통합 인터페이스:
    - mode="short" → summarize_short
    - mode="long"  → summarize_long
    """
    if mode == "short":
        return summarize_short(text)
    elif mode == "long":
        return summarize_long(text)
    else:
        raise ValueError(f"Unknown summarize mode: {mode}")

# =========================
# 9) 메인 실행 예시
# =========================
if __name__ == "__main__":
    content1 = "하단동 498-19 허가가 안 난 건가요? 몇 개월째 방치돼 있어 미관상 안 좋습니다."
    summary1 = "해당 부지의 허가번호, 허가일, 용도, 공사 예정 안내."

    content2 = "저가 소유한 집은 주소가 부산광역시 사하구 옥천로 55-10 입니다. 감천도로에서 샛길로 3번째 아랫집입니다. 이 집은 홀로 사시는 할머니에게 월세를 주고 있습니다. 홀로 사시는 할머니 부탁으로, 장마가 오기 전에 집 페인트 칠을 하기 위해서 도로에 주차를 했습니다. 작업을 하다보니 한 번씩 차에 가서 이런 저런 도구들을 가져와야 합니다. 무더운 날이라 차로 가서 도구를 가져오는 것이 귀찮기도 하지만 힘들기도 합니다. 몇 전에도 한번 과태료를 낸 기억이 있습니다. 이번에 가서 도로 사정을 보니,도로 건너편에는 주정차금지 안내판이 있는데, 저가 주차한 쪽에는 주차금지 안내판를 보지 못했습니다. 또 도로 선이, 이전에 보지 못한 점선으로 되어 있고, 도로 주변에는 사업을 하는 분들의 트럭이 주차가 되어 있는 것을 보고, 저의 생각에 구청에서 작업을 위해서 주차할 수 있도록 배려를 해 주었다는생각이 들었습니다.저의 민원은 이렇습니다. 집 위치가 산 동네다 보니, 거기다 개발이 되지 않는 곳이다 보니, 집을 보수하는데 있어서, 차를 주차를 해야 할 때, 교통에 방해가 되지 않는 한도 내에서 주정차 과태료를 면제해 주셨으면 하는 민원입니다. 동네가 개발도 안되고, 날씨도 덥고, 몸도 힘든데, 과태료 고지서까지 날아오니, 마음이 쓰리네요. 동네 공사 차량에 대해서는 주정차 금지를 예외 시켜 주실 것을 건의 드립니다."
    summary2 = "부득이한 사유에 대한 도로교통법 안내, 의견진술서와 증빙 서류 제출."

    test_content = content1
    test_summary = summary1

    dom = route_domain(test_content, test_summary)
    print(f"[Router] Domain = {dom}")

    if dom == "BUILDING_PERMIT":
        answer = run_building_permit(test_content, test_summary)
    elif dom == "TRAFFIC_ORDINANCE":
        answer = run_traffic(test_content, test_summary)
    else:
        answer = run_general(test_content, test_summary)
        
    print(answer)
