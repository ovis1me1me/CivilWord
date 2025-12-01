# ingest_traffic.py
import os
import json
import math
from datetime import datetime
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import torch
from transformers import AutoTokenizer, AutoModel

# =========================
# 1. 설정
# =========================
CSV_PATH = "saha_traffic.csv"
DB_CFG = {
    "host": "127.0.0.1",
    "port": 5432,
    "dbname": "civildb",
    "user": "civilword",
    "password": "1234",
}
MODEL = "intfloat/multilingual-e5-large-instruct"
EMB_DIM = 1024
BATCH_FLUSH = 100

# =========================
# 2. 임베딩 모델 로딩
# =========================
print("임베딩 모델을 로딩합니다...")
tokenizer = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
model = AutoModel.from_pretrained(
    MODEL, trust_remote_code=True, torch_dtype=torch.bfloat16, device_map="auto"
)
model.eval()
print("모델 로딩 완료.")

def encode_texts(texts, is_query=False):
    prefix = 'query: ' if is_query else 'passage: '
    texts_with_prefix = [f"{prefix}{t}" for t in texts]
    x = tokenizer(texts_with_prefix, padding=True, truncation=True, return_tensors="pt").to(model.device)
    with torch.no_grad():
        y = model(**x)
        vec = y.last_hidden_state[:, 0, :]
        vec = torch.nn.functional.normalize(vec, p=2, dim=1)
    return vec.float().cpu().numpy()

# =========================
# 3. 유틸리티 함수
# =========================
def parse_date(s):
    if pd.isna(s): return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%Y%m%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except (ValueError, TypeError):
            pass
    return None

def sanitize_for_json(obj):
    if isinstance(obj, (int, str, bool)) or obj is None: return obj
    if isinstance(obj, float):
        return None if math.isnan(obj) or math.isinf(obj) else obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return str(obj)

# =========================
# 4. 사실 카드(청킹) 생성 규칙
# =========================
def make_fact_card(row: dict):
    ordinance_name = str(row.get("조례명") or "").strip()
    clause_path = str(row.get("조문 계층 경로") or "").strip()
    content_text = str(row.get("실제 본문 내용 (조문 텍스트)") or "").strip().replace('\n', ' ')
    ordinance_field = str(row.get("조례 분야") or "").strip()
    effective_date = parse_date(row.get("제·개정·시행일자"))
    content = (
        f"부산광역시 사하구 {ordinance_field} 분야의 조례인 '{ordinance_name}'의 {clause_path}에 대한 내용입니다. "
        f"내용은 다음과 같습니다: \"{content_text}\" "
        f"이 조항의 시행일자는 {effective_date or '미기재'}입니다."
    )
    meta = {
        "ordinance_name": ordinance_name,
        "clause_path": clause_path,
        "ordinance_field": ordinance_field,
        "effective_date": str(effective_date) if effective_date else None,
        "source_url": row.get("원문 페이지 URL")
    }
    return content, meta

# =========================
# 5. DB 스키마 정의 (DDL) - ✨ 시나리오 2 적용!
# =========================
DDL_SCHEMA = f"""
-- 확장 기능 활성화 (공통)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 교통 조례 원본 테이블 (고유 이름 사용)
CREATE TABLE IF NOT EXISTS traffic_ordinance (
    id BIGSERIAL PRIMARY KEY,
    unique_id TEXT UNIQUE,
    ordinance_name TEXT,
    jurisdiction TEXT,
    clause_path TEXT,
    chunk_order INT,
    content_text TEXT,
    clause_title TEXT,
    parent_clause_no TEXT,
    basis_law TEXT,
    effective_date DATE,
    ordinance_field TEXT,
    source_url TEXT,
    remarks TEXT,
    raw JSONB
);

-- ✨ [변경] 교통 조례 전용 RAG 청크 테이블 생성
CREATE TABLE IF NOT EXISTS rag_chunk_traffic (
    id BIGSERIAL PRIMARY KEY,
    ordinance_id BIGINT REFERENCES traffic_ordinance(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    meta JSONB,
    embedding VECTOR({EMB_DIM})
);

-- ✨ [변경] 교통 조례 전용 인덱스 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relname = 'rag_chunk_traffic_vec_idx') THEN
        CREATE INDEX rag_chunk_traffic_vec_idx ON rag_chunk_traffic USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relname = 'rag_chunk_traffic_trgm_idx') THEN
        CREATE INDEX rag_chunk_traffic_trgm_idx ON rag_chunk_traffic USING GIN (content gin_trgm_ops);
    END IF;
END $$;
"""

# =========================
# 6. DB 데이터 적재 (Upsert) - ✨ 시나리오 2 적용!
# =========================
def upsert(conn, row: dict):
    params = {
        "unique_id": row.get("고유 식별자"),
        "ordinance_name": row.get("조례명"),
        "jurisdiction": row.get("관할 지자체명"),
        "clause_path": row.get("조문 계층 경로"),
        "chunk_order": int(row.get("동일 조문 계층 경로 내 청크 순서") or 0),
        "content_text": row.get("실제 본문 내용 (조문 텍스트)"),
        "clause_title": row.get("조문 제목 (있을 경우)"),
        "parent_clause_no": row.get("상위 조문번호"),
        "basis_law": row.get("근거법령명"),
        "effective_date": parse_date(row.get("제·개정·시행일자")),
        "ordinance_field": row.get("조례 분야"),
        "source_url": row.get("원문 페이지 URL"),
        "remarks": row.get("비고"),
        "raw": Json(sanitize_for_json(row), dumps=lambda o: json.dumps(o, ensure_ascii=False)),
    }
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # traffic_ordinance 테이블에 데이터 삽입/업데이트 (변경 없음)
        cur.execute(
            """
            INSERT INTO traffic_ordinance (
                unique_id, ordinance_name, jurisdiction, clause_path, chunk_order, content_text,
                clause_title, parent_clause_no, basis_law, effective_date, ordinance_field, source_url, remarks, raw
            ) VALUES (
                %(unique_id)s, %(ordinance_name)s, %(jurisdiction)s, %(clause_path)s, %(chunk_order)s, %(content_text)s,
                %(clause_title)s, %(parent_clause_no)s, %(basis_law)s, %(effective_date)s, %(ordinance_field)s,
                %(source_url)s, %(remarks)s, %(raw)s
            )
            ON CONFLICT (unique_id) DO UPDATE SET
                ordinance_name = EXCLUDED.ordinance_name,
                content_text = EXCLUDED.content_text,
                effective_date = EXCLUDED.effective_date,
                raw = EXCLUDED.raw
            RETURNING id;
            """, params
        )
        ordinance_id = cur.fetchone()['id']

        # ✨ [변경] rag_chunk_traffic 테이블에 최신 데이터 반영
        cur.execute("DELETE FROM rag_chunk_traffic WHERE ordinance_id = %s", (ordinance_id,))
        
        content, meta = make_fact_card(row)
        vector = encode_texts([content])[0].tolist()

        cur.execute(
            "INSERT INTO rag_chunk_traffic (ordinance_id, content, meta, embedding) VALUES (%s, %s, %s, %s)",
            (ordinance_id, content, Json(meta), vector)
        )

# =========================
# 7. 메인 실행 함수
# =========================
def main():
    print(f"'{CSV_PATH}' 파일을 로딩합니다...")
    try:
        df = pd.read_csv(CSV_PATH, encoding='utf-8')
    except UnicodeDecodeError:
        print("UTF-8 디코딩 실패. CP949 인코딩으로 다시 시도합니다.")
        df = pd.read_csv(CSV_PATH, encoding='cp949')
    df = df.where(pd.notna(df), None)
    print(f"총 {len(df)}개의 행을 읽었습니다.")
    conn = None
    try:
        conn = psycopg2.connect(**DB_CFG)
        print("데이터베이스에 성공적으로 연결되었습니다.")
        with conn, conn.cursor() as cur:
            print("DB 스키마를 확인하고 필요시 생성합니다 (교통 조례용)...")
            cur.execute(DDL_SCHEMA)
            print("스키마 준비 완료.")
        total_rows = len(df)
        for i, r in df.iterrows():
            row = dict(r)
            if not row.get("고유 식별자"):
                print(f"경고: {i+1}번째 행의 '고유 식별자'가 없어 건너뜁니다.")
                continue
            upsert(conn, row)
            if (i + 1) % 10 == 0 or (i + 1) == total_rows:
                print(f"진행 상황: {i + 1}/{total_rows}")
            if (i + 1) % BATCH_FLUSH == 0:
                conn.commit()
                print(f"--- [commit] {i+1}개 행 처리 완료 ---")
        conn.commit()
        print(f"\n최종 완료: 총 {total_rows}개 행을 DB에 적재했습니다.")
    except psycopg2.OperationalError as e:
        print(f"\n[오류] 데이터베이스 연결에 실패했습니다: {e}")
        print("DB_CFG의 접속 정보(호스트, 포트, DB명, 사용자, 비밀번호)가 올바른지 확인하세요.")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\n[오류] 작업 중 예외가 발생했습니다: {e}")
    finally:
        if conn:
            conn.close()
            print("데이터베이스 연결을 종료했습니다.")

if __name__ == "__main__":
    main()