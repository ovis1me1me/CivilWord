import psycopg2
import pandas as pd
from datetime import datetime

# 최종 CSV 파일 경로에서 데이터 불러오기
df = pd.read_csv("./data/final/saha_crawling_data.csv", encoding='utf-8-sig')

# PostgreSQL 연결
conn = psycopg2.connect(
    host="localhost",
    dbname="postgres",
    user="postgres",
    password="1234",  # 실제 비밀번호 입력
    port=5432
)
cur = conn.cursor()

# 기존 테이블 삭제 후 새로 생성
cur.execute("""
    DROP TABLE IF EXISTS saha_crawling_data
""")

cur.execute("""
    CREATE TABLE saha_crawling_data (
        id SERIAL PRIMARY KEY,
        title TEXT,
        status VARCHAR(20),
        write_date TIMESTAMP,
        department TEXT,
        content TEXT,
        answer TEXT
    )
""")
# 데이터 삽입
for idx, row in df.iterrows():
    try:
        # 날짜 문자열을 DATE로 변환
        write_date = None
        if pd.notna(row["작성일"]):
            try:
                write_date = datetime.strptime(row["작성일"], "%Y-%m-%d %H:%M:%S")  # 날짜와 시간을 포함한 형식
                # print(f"날짜 확인: {write_date}")
            except ValueError:
                write_date = None
                # print(f"날짜 변환 오류: {write_date}")

        cur.execute("""
            INSERT INTO saha_crawling_data (title, status, write_date, department, content, answer)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            row["제목"],
            row["답변상태"],
            write_date,
            row["담당부서"],
            row["작성내용"],
            row["답변내용"]
        ))
    except Exception as e:
        print(f"⚠️ {idx + 1}번째 행 삽입 중 오류 발생: {e}")
        conn.rollback()  # 트랜잭션 롤백 후 다음 삽입 진행

# 커밋하고 연결 종료
conn.commit()
cur.close()
conn.close()
print("✅ DB 저장 완료")