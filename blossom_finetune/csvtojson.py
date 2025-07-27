import pandas as pd
import json

# CSV 경로
csv_path = "output/blossom_expanded.csv"
jsonl_path = "train/train_dataset.jsonl"

# CSV 파일 읽기
df = pd.read_csv(csv_path)

# 열 이름 확인 (summary, generated_response)
with open(jsonl_path, "w", encoding="utf-8") as f:
    for _, row in df.iterrows():
        prompt = row["summary"].strip()
        completion = row["generated_response"].strip()
        json_obj = {"prompt": prompt, "completion": completion}
        f.write(json.dumps(json_obj, ensure_ascii=False) + "\n")

print("✅ JSONL 파일로 변환 완료:", jsonl_path)
