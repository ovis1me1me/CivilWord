import os
from dotenv import load_dotenv

load_dotenv() # .env파일 로드

# LLM과 연결될 핵심 서비스 로직
# 임시로 문자열 반환
def generate_response(prompt: str) -> str:
    api_key = os.getenv("LLM_API_KEY", "키 없음")   # .env에 값 없으면 키 없음 출력
    return f"[임시 응답] '{prompt}'에 대한 답변입니다.(APO KEY: {api_key})"

