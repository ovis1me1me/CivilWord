import datetime as dt
from typing import List, Literal

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    StoppingCriteria,
    StoppingCriteriaList,
)

# =========================
# 0) 전역 설정
# =========================
BASE_MODEL = "kakaocorp/kanana-1.5-8b-instruct-2505"

print("LLM 로딩 중...")

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

print("모델 로딩 완료.")


# =========================
# 1) StoppingCriteria: '끝.'에서 강제 종료
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
# 2) 공통 LLM 호출 유틸
# =========================
def llm_generate(
    prompt: str,
    max_new_tokens: int = 400,
    temperature: float = 0.7,
) -> str:
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
# 3) 요약 함수 (짧은 / 긴)
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
    """
    prompt = f"""
당신은 공공 민원 내용을 행정문서체로 요약하는 AI입니다.

[지침]
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
# 4) 단일 답변 생성 (도메인/DB/RAG 없음)
# =========================
def build_prompt_reply(content: str, summary: str) -> str:
    """
    RAG / 도메인 라우팅 없이,
    '민원 내용 + 답변에 들어갈 주요 내용'만 가지고 일반적인 행정문서체 답변 생성.
    """
    prompt = f"""
당신은 공공기관 민원 답변을 작성하는 AI입니다.
이 서비스를 사용하는 사람은 민원공무원입니다.
공무원이 민원 내용을 토대로 [답변에 들어갈 주요내용]을 작성합니다.
당신은 공무원이 작성한 [답변에 들어갈 주요내용]을 기반으로 아래 지침에 따라 공무원 스타일의 답변을 생성합니다.


[지침]
- 외부 법령, 조례, 데이터베이스에 대한 구체적인 내용은 함부로 단정하지 마십시오.
- 확실하지 않은 부분은 "추가 확인이 필요하다"라고 명시하십시오.
- 문체는 공공기관 행정문서체(존댓말 서술형)를 사용하십시오.
- 전체 구조는 다음 세 부분으로만 구성하십시오.
  1. 민원 요지 확인 (1~2문장)
  2. 확인된 사실 및 안내 (2~5문장)
  3. 추가 문의 안내 (1문장)
- 숫자 "1. 2. 3." 같은 번호는 실제로 쓰지 말고 문단만 나누지 말고 자연스러운 한 문단으로 이어서 작성하십시오.
- 마지막 문장은 반드시 '끝.' 또는 'end.' 로 마무리하고 그 이후에는 아무 것도 출력하지 마십시오.

[민원 내용]
{summary.strip()}

[답변에 들어갈 주요 내용]
{content.strip()}

위 지침을 지켜서 답변만 작성하십시오.

### Response:
"""
    return prompt


def generate_reply(content: str, summary: str) -> str:
    prompt = build_prompt_reply(content, summary)
    return llm_generate(prompt, max_new_tokens=400, temperature=0.5)


# =========================
# 5) 메인 실행 예시
# =========================
if __name__ == "__main__":
    content = "하단동 498-19 허가가 안 난 건가요? 몇 개월째 방치돼 있어 미관상 안 좋습니다."
    short_sum = summarize(content, mode="short")
    long_sum = summarize(content, mode="long")

    print("[Short summary]")
    print(short_sum)
    print("\n[Long summary]")
    print(long_sum)
    print("\n[Answer]")
    answer = generate_reply(content, long_sum)
    print(answer)
