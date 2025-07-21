from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg2://postgres:116423@localhost/civildb")

with engine.connect() as conn:
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS urh_content_tsv_idx
        ON user_reply_history
        USING gin(to_tsvector('simple', final_content::text));
    """))
    print("✔ Full text search index created.")
