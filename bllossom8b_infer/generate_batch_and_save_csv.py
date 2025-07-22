import pandas as pd
import requests
import time
import os

# 파일 로드
df = pd.read_csv("output/summaries.csv")
results = []

# 프롬프트 템플릿
instruction = instruction = """다음 문장은 민원에 대한 간단한 답변 요약입니다. 이를 민원인에게 회신하는 공공기관 답변 문체로 자연스럽게 바꿔주세요. 
문장은 공적인 서술체로 정리하고, 불필요한 인사말은 포함하지 마세요.

예시:
- 답변 요약: 무단 투기 쓰레기 조치 완료.
- 공공문체: 무단 투기된 쓰레기에 대해 조치를 완료하였습니다.

- 답변 요약: 화명1동 불법주차 계도완료.
- 공공문체: 화명1동 일대 불법 주정차 차량에 대해 현장 계도 조치를 완료하였습니다.

- 답변 요약: 공원벤치 수리 요청함.
- 공공문체: 공원 내 파손된 벤치에 대해 수리를 요청하였습니다.

아래 문장을 공공기관 회신 문체로 바꿔주세요:

"""



def query_llm(prompt):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "azure99/blossom-v6.1:8b",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        response.raise_for_status()
        return response.json()["response"].strip()
    except Exception as e:
        return f"[⚠️ LLM 응답 실패: {str(e)}]"

# 이전에 저장된 것 복구 (있을 경우)
save_path = "output/blossom_expanded_partial.csv"
if os.path.exists(save_path):
    prev_df = pd.read_csv(save_path)
    results = list(prev_df.itertuples(index=False, name=None))
    start_idx = len(results)
else:
    start_idx = 0

# 계속 이어서 처리
for i in range(start_idx, len(df)):
    summary = df.iloc[i]["summary"]
    prompt = f"### Instruction:\n{instruction}### Input:\n{summary}\n### Response:\n"

    response = query_llm(prompt)
    print(f"[{i+1:04d}] {summary} -> {response[:50]}...")
    results.append((summary, response))

    # 매 10건마다 임시 저장
    if (i + 1) % 10 == 0:
        pd.DataFrame(results, columns=["summary", "generated_response"]).to_csv(save_path, index=False)
        print(f"💾 {i+1}개 저장됨 (임시)")

    time.sleep(0.2)

# 최종 저장
final_path = "output/blossom_expanded.csv"
pd.DataFrame(results, columns=["summary", "generated_response"]).to_csv(final_path, index=False)
print(f"✅ 최종 저장 완료: {final_path}")
