import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, StoppingCriteria, StoppingCriteriaList
from typing import List, Literal

# =========================
# 0) 전역 설정
# =========================
BASE_MODEL = "kakaocorp/kanana-1.5-8b-instruct-2505"

BUILDING_STRONG = {"사용승인", "건축허가", "허가신청", "허가번호", "연면적", "용도변경"}
TRAFFIC_STRONG  = {"불법주정차", "주차단속", "견인", "과태료", "통학로", "노면표시", "표지판"}

BUILDING_WEAK = {"공사", "부지", "건설사"}
TRAFFIC_WEAK  = {"주차", "차량", "단속", "신호", "도로"}

DOMAIN_CONFIG = {
    "BUILDING_PERMIT": {
        "style_rules": [
            "공공기관 민원 답변 스타일을 준수하십시오.",
            "정확한 정보만 사용하고 추측하지 마십시오.",
        ],
    },
    "TRAFFIC_ORDINANCE": {
        "style_rules": [
            "도로교통법 관련 민원 답변 스타일을 준수하십시오.",
            "정확한 정보를 제공하십시오.",
        ],
    },
    "GENERAL": {
        "style_rules": [
            "일반 민원 답변 스타일을 준수하십시오.",
        ],
    }
}

# =========================
# 1) 모델 로딩
# =========================
print("LLM 모델 로딩 중...")
llm_tok = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
if llm_tok.eos_token is None:
    llm_tok.eos_token = "</s>"
if llm_tok.pad_token is None:
    llm_tok.pad_token = llm_tok.eos_token

llm = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    # device_map="auto",
    device_map={"": "cuda"},
    torch_dtype=torch.float16,
    trust_remote_code=True,
)
llm.eval()
print("모델 로딩 완료.")

# =========================
# 2) StoppingCriteria
# =========================
class StopOnAnyStopWords(StoppingCriteria):
    def __init__(self, tokenizer, stop_words: List[str]):
        self.stop_ids_list = []
        for w in stop_words:
            ids = tokenizer(w, add_special_tokens=False, return_tensors="pt").input_ids[0].tolist()
            self.stop_ids_list.append(ids)

    def __call__(self, input_ids, scores, **kwargs):
        generated = input_ids[0].tolist()
        for stop_ids in self.stop_ids_list:
            n = len(stop_ids)
            if n <= len(generated) and generated[-n:] == stop_ids:
                return True
        return False

# =========================
# 3) LLM 호출
# =========================
def llm_generate(prompt: str, max_new_tokens: int = 400, temperature: float = 0.7) -> str:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = llm_tok(prompt, return_tensors="pt", padding=True, truncation=True).to(device)

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
    if "### Response:" in full_text:
        result = full_text.split("### Response:")[-1].strip()
    else:
        result = full_text.strip()

    # '끝.' 또는 'end.' 제거
    cut_positions = [pos for pos in [result.find("끝."), result.find("end.")] if pos != -1]
    if cut_positions:
        result = result[:min(cut_positions)].rstrip()

    return result

# =========================
# 4) 도메인 라우팅
# =========================
def route_domain(content: str, summary: str) -> Literal["BUILDING_PERMIT","TRAFFIC_ORDINANCE","GENERAL"]:
    text = (summary + " " + content).strip()
    b_score = sum([1.0 for w in BUILDING_STRONG if w in text]) + sum([0.3 for w in BUILDING_WEAK if w in text])
    t_score = sum([1.0 for w in TRAFFIC_STRONG if w in text]) + sum([0.3 for w in TRAFFIC_WEAK if w in text])

    if max(b_score, t_score) == 0:
        return "GENERAL"
    return "BUILDING_PERMIT" if b_score >= t_score else "TRAFFIC_ORDINANCE"

# =========================
# 5) 프롬프트 빌더 (RAG 제거)
# =========================
def build_prompt(domain_key: str, content: str, summary: str) -> str:
    cfg = DOMAIN_CONFIG[domain_key]
    style_rules_text = "\n".join([f"- {rule}" for rule in cfg["style_rules"]])

    prompt = (
        "당신은 공공기관 민원 답변 자동작성 AI입니다.\n"
        "아래 규칙을 반드시 준수하십시오.\n"
        f"{style_rules_text}\n\n"
        f"[답변 요약]: {summary}\n"
        f"[민원 내용]: {content}\n\n"
        "1. 모르면 모른다고 대답하고 확실한 경우에만 대답하십시오.\n"
        f"2. {summary}에 포함된 내용을 기반으로 답변을 구성하십시오.\n"
        "3. 총 세 부분으로만 작성하십시오:\n"
        "   (1) 민원 요지 확인\n"
        "   (2) 확인된 사실 안내\n"
        "   (3) 문의 안내\n"
        "4. (1), (2), (3) 같은 소제목은 붙이지 마십시오.\n"
        "5. 마지막 문장은 반드시 '끝.' 또는 'end.' 로 마무리하십시오.\n"
        "위 지침에 따라 답변만 작성하십시오.\n"
        "### Response:\n"
    )
    return prompt

# =========================
# 6) 도메인별 실행
# =========================
def run_domain(content: str, summary: str, domain_key: str) -> str:
    prompt = build_prompt(domain_key, content, summary)
    max_tokens = 400 if domain_key == "BUILDING_PERMIT" else 512 if domain_key == "TRAFFIC_ORDINANCE" else 300
    return llm_generate(prompt, max_new_tokens=max_tokens, temperature=0.7)

# =========================
# 7) 간단 요약
# =========================
def summarize_short(text: str) -> str:
    prompt = f"""
당신은 민원 내용을 '핵심 주제'로만 요약하는 AI입니다.
- 반드시 민원의 핵심 사안을 요약하십시오.
- 가능한 한 짧은 명사구로 작성하십시오.
- 마지막에 반드시 '끝.'으로 마무리하십시오.

[입력 민원]
{text.strip()}

### Response:
"""
    out = llm_generate(prompt, max_new_tokens=64, temperature=0.3)
    summary = out.strip().splitlines()[0].strip()
    return summary

# =========================
# 8) 실행 예시
# =========================
if __name__ == "__main__":
    content = "하단동 498-19 허가가 안 난 건가요? 몇 개월째 방치돼 있어 미관상 안 좋습니다."
    summary = summarize_short(content)

    domain = route_domain(content, summary)
    print(f"[Router] Domain = {domain}")

    answer = run_domain(content, summary, domain)
    print(answer)
# =========================
# 9) 기존 시스템 호환용 wrapper
# =========================

def run_building_permit(content: str, summary: str) -> str:
    return run_domain(content, summary, "BUILDING_PERMIT")

def run_traffic(content: str, summary: str) -> str:
    return run_domain(content, summary, "TRAFFIC_ORDINANCE")

def run_general(content: str, summary: str) -> str:
    return run_domain(content, summary, "GENERAL")

def summarize(text: str) -> str:
    return summarize_short(text)
