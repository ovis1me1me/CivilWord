# ingest_permit.py
import os
import json
import math
from datetime import datetime

import pandas as pd
import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor, Json

import torch
from transformers import AutoTokenizer, AutoModel

# =========================
# 설정
# =========================
CSV_PATH = "부산광역시_사하구_건축허가현황_20221121.csv"

DB_CFG = {
    "host": "127.0.0.1",
    "port": 5432,
    "dbname": "civildb",
    "user": "civiluser",
    "password": "116423",
}

# 임베딩 모델 (필요 시 교체: "Qwen/Qwen3-Embedding-4B-bf16")
MODEL = "intfloat/multilingual-e5-large-instruct"
EMB_DIM = 1024  # 모델 출력 차원에 맞출 것

BATCH_FLUSH = 500  # 트랜잭션 커밋 주기


# =========================
# 모델 로딩
# =========================
tokenizer = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
model = AutoModel.from_pretrained(
    MODEL, trust_remote_code=True, torch_dtype=torch.bfloat16, device_map="auto"
)
model.eval()


def encode_texts(texts, is_query=False):
    # e5 계열 권장 프리픽스
    use_e5_prefix = "e5" in MODEL.lower()
    if use_e5_prefix:
        texts = [(f"query: {t}" if is_query else f"passage: {t}") for t in texts]

    x = tokenizer(texts, padding=True, truncation=True, return_tensors="pt").to(model.device)
    with torch.no_grad():
        y = model(**x)
        vec = y.last_hidden_state[:, 0, :]  # CLS
        vec = torch.nn.functional.normalize(vec, p=2, dim=1)
    return vec.float().cpu().numpy()


# =========================
# 유틸
# =========================
def parse_date(s):
    if s is None or (isinstance(s, float) and math.isnan(s)):
        return None
    s = str(s).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%Y%m%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            pass
    return None


def num_or_none(x):
    if x is None:
        return None
    try:
        if isinstance(x, str):
            x = x.replace(",", "").strip()
            if x == "":
                return None
        f = float(x)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except Exception:
        return None


def int_or_zero(x):
    v = num_or_none(x)
    return int(v) if v is not None else 0


def sanitize_for_json(obj):
    # RFC 7159 호환: NaN/Inf 제거
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return obj


# =========================
# 사실 카드(청킹) 생성
# =========================
def make_fact_card(row: dict):
    # 확인된 CSV 컬럼:
    # 건축구분, 허가번호, 대지위치, 지목, 대지면적, 건축면적, 연면적,
    # 건폐율, 용적률, 허가일, 최대지상층수, 최대지하층수, 최고높이(m), 동수,
    # 주용도, 부속용도, 용도지역, 용도지구, 용도구역, 설계사무소명, 감리사무소명, 시공자사무소명, 데이터기준일자
    permit_no = (row.get("허가번호") or "").strip()
    region = ""  # 별도 행정동 칼럼이 없으면 공란, 있으면 매핑
    address = (row.get("대지위치") or "").strip()
    bldg_use = (row.get("주용도") or "").strip()
    total_area = num_or_none(row.get("연면적"))
    fa = f"{total_area:g}" if total_area is not None else "0"
    above = int_or_zero(row.get("최대지상층수"))
    below = int_or_zero(row.get("최대지하층수"))
    pdate = parse_date(row.get("허가일"))

    content = (
        f"[허가번호: {permit_no}] {region} {address}의 건축허가. "
        f"용도: {bldg_use}, 연면적: {fa}㎡, "
        f"층수: 지상 {above}층/지하 {below}층. "
        f"허가일: {pdate or '미기재'}."
    )

    meta = {
        "permit_no": permit_no,
        "region": region,
        "address": address,
        "bldg_use": bldg_use,
        "permit_date": str(pdate) if pdate else None,
    }
    return content, meta


# =========================
# 스키마 생성(없으면)
# =========================
DDL_SCHEMA = f"""
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS permit (
  id BIGSERIAL PRIMARY KEY,
  building_type TEXT,
  permit_no TEXT UNIQUE,
  site_location TEXT,
  land_category TEXT,
  site_area NUMERIC,
  building_area NUMERIC,
  total_floor_area NUMERIC,
  building_coverage_ratio NUMERIC,
  floor_area_ratio NUMERIC,
  permit_date DATE,
  max_floors_above INT,
  max_floors_below INT,
  max_height NUMERIC,
  num_buildings INT,
  main_use TEXT,
  sub_use TEXT,
  zoning_area TEXT,
  zoning_district TEXT,
  zoning_section TEXT,
  design_office TEXT,
  supervision_office TEXT,
  construction_office TEXT,
  data_date DATE,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS rag_chunk (
  id BIGSERIAL PRIMARY KEY,
  permit_id BIGINT REFERENCES permit(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  meta JSONB,
  embedding JSONB NOT NULL
);

-- 인덱스(존재하면 재생성 스킵)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'rag_chunk_vec_idx'
    ) THEN
        EXECUTE 'CREATE INDEX rag_chunk_vec_idx ON permit USING GIN(site_location gin_trgm_ops)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'rag_chunk_trgm_idx'
    ) THEN
        EXECUTE 'CREATE INDEX rag_chunk_trgm_idx ON rag_chunk USING GIN (content gin_trgm_ops)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'permit_location_trgm_idx'
    ) THEN
        EXECUTE 'CREATE INDEX permit_location_trgm_idx ON permit USING GIN (site_location gin_trgm_ops)';
    END IF;
END $$;
"""

def ensure_schema(conn):
    with conn, conn.cursor() as cur:
        cur.execute(DDL_SCHEMA)

# =========================
# DB 업서트
# =========================
def upsert(conn, row: dict):
    from psycopg2.extras import RealDictCursor, Json

    # 1) CSV → 안전한 파라미터 dict로 매핑
    params = {
        "building_type": row.get("건축구분"),
        "permit_no": (row.get("허가번호") or "").strip(),
        "site_location": row.get("대지위치"),
        "land_category": row.get("지목"),
        "site_area": num_or_none(row.get("대지면적")),
        "building_area": num_or_none(row.get("건축면적")),
        "total_floor_area": num_or_none(row.get("연면적")),
        "building_coverage_ratio": num_or_none(row.get("건폐율")),
        "floor_area_ratio": num_or_none(row.get("용적률")),
        "permit_date": parse_date(row.get("허가일")),
        "max_floors_above": int_or_zero(row.get("최대지상층수")),
        "max_floors_below": int_or_zero(row.get("최대지하층수")),
        "max_height": num_or_none(row.get("최고높이(m)")),
        "num_buildings": int_or_zero(row.get("동수")),
        "main_use": row.get("주용도"),
        "sub_use": row.get("부속용도"),
        "zoning_area": row.get("용도지역"),
        "zoning_district": row.get("용도지구"),
        "zoning_section": row.get("용도구역"),
        "design_office": row.get("설계사무소명"),
        "supervision_office": row.get("감리사무소명"),
        "construction_office": row.get("시공자사무소명"),
        "data_date": parse_date(row.get("데이터기준일자")),
    }

    # 2) raw JSON 준비(NaN/Inf 제거 + allow_nan=False)
    clean_row = sanitize_for_json(row)
    params["raw"] = Json(
        clean_row,
        dumps=lambda o: json.dumps(o, ensure_ascii=False, allow_nan=False),
    )

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 3) permit 업서트 (모든 플레이스홀더는 dict 키와 1:1)
        cur.execute(
            """
            INSERT INTO permit (
                building_type, permit_no, site_location, land_category,
                site_area, building_area, total_floor_area,
                building_coverage_ratio, floor_area_ratio, permit_date,
                max_floors_above, max_floors_below, max_height,
                num_buildings, main_use, sub_use,
                zoning_area, zoning_district, zoning_section,
                design_office, supervision_office, construction_office,
                data_date, raw
            )
            VALUES (
                %(building_type)s, %(permit_no)s, %(site_location)s, %(land_category)s,
                %(site_area)s, %(building_area)s, %(total_floor_area)s,
                %(building_coverage_ratio)s, %(floor_area_ratio)s, %(permit_date)s,
                %(max_floors_above)s, %(max_floors_below)s, %(max_height)s,
                %(num_buildings)s, %(main_use)s, %(sub_use)s,
                %(zoning_area)s, %(zoning_district)s, %(zoning_section)s,
                %(design_office)s, %(supervision_office)s, %(construction_office)s,
                %(data_date)s, %(raw)s
            )
            ON CONFLICT (permit_no) DO UPDATE SET
                site_location = EXCLUDED.site_location,
                total_floor_area = EXCLUDED.total_floor_area,
                permit_date = EXCLUDED.permit_date,
                main_use = EXCLUDED.main_use,
                data_date = EXCLUDED.data_date,
                raw = EXCLUDED.raw
            RETURNING id;
            """,
            params,  # ✅ dict를 그대로 전달
        )
        pid = cur.fetchone()["id"]

        # 4) rag_chunk 중복 방지
        cur.execute("DELETE FROM rag_chunk WHERE permit_id = %s", (pid,))

        # 5) 사실 카드 + 임베딩 + rag_chunk 인서트 (여긴 위치 파라미터 %s 사용 유지)
        content, meta = make_fact_card(row)
        vec = encode_texts([content], is_query=False)[0].tolist()
        json_meta = json.dumps(meta, ensure_ascii=False)
        json_vec= json.dumps(meta, ensure_ascii=False)
        cur.execute(
            """
            INSERT INTO rag_chunk (permit_id, content, meta, embedding)
            VALUES (%s, %s, %s, %s)
            """,
            (pid,content,json_meta, json_vec),
        )


# =========================
# 메인
# =========================
def main():
    # CSV 로딩
    df = pd.read_csv(CSV_PATH, encoding="cp949")
    # DataFrame의 NaN을 None으로 치환(숫자/문자 혼합 컬럼 안전)
    df = df.where(pd.notna(df), None)

    conn = psycopg2.connect(**DB_CFG)
    conn.autocommit = False

    try:
        ensure_schema(conn)

        count = 0
        for _, r in df.iterrows():
            row = dict(r)
            upsert(conn, row)
            count += 1
            if count % BATCH_FLUSH == 0:
                conn.commit()
                print(f"[commit] {count} rows")

        conn.commit()
        print(f"done: {count} rows")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
