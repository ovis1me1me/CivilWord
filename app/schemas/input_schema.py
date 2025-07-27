# app/schemas/input.py (예상 경로)
'''
단일 텍스트 입력을 위한 기본 요청 스키마

- LLM 기반 요약, 분석, 유사도 평가 등에서 단일 문자열(content) 입력을 받기 위한 구조
- 예: 민원 본문을 기반으로 요약하거나, 벡터화하기 위한 입력 형식

필드:
- content: 처리할 텍스트 데이터 (예: 민원 내용)

용도:
- 간단한 POST 요청에서 JSON 본문으로 텍스트 한 줄을 받기 위한 표준 구조
'''


from pydantic import BaseModel

class InputSchema(BaseModel):
    content: str
