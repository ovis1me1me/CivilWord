import csv
import datetime
import json

def parse_datetime(date_str):
    """문자열을 datetime 객체로 변환"""
    return datetime.datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")

# 결과 저장용 리스트
converted = []

# CSV 파일 경로 (필요시 변경)
csv_file_path = "사하구_민원_크롤링_결과.csv"

# CSV 열: 제목, 작성일, 담당부서, 작성내용, 답변내용
with open(csv_file_path, newline='', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        created_at = parse_datetime(row["작성일"])
        reply_content = row["답변내용"].strip()

        converted.append({
            "title": row["제목"],
            "content": row["작성내용"],
            "is_public": True,  # 공란이므로 전부 공개 처리
            "created_at": created_at.isoformat(),  # JSON 직렬화를 위해 문자열로 변환
            "summary": None,
            "reply_summary": None,
            "reply_status": "답변완료" if reply_content else "답변전",
            "reply_content": reply_content if reply_content else None
        })

# 결과를 JSON 파일로 저장 (선택)
with open("converted_complaints.json", "w", encoding="utf-8") as f:
    json.dump(converted, f, ensure_ascii=False, indent=2)

# 출력 확인
print(json.dumps(converted, ensure_ascii=False, indent=2))
