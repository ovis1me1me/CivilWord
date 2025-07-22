import requests
import re

def split_summary_items(text: str) -> list:
    """Blossom 응답을 쉼표(,) 기준으로 분리"""
    items = text.strip().split(",")
    return [s.strip() for s in items if s.strip()]

def summarize_with_blossom(text: str) -> str:
    """
    Blossom 8B로 프롬프트 기반 요약 수행 + {summarizeN} prefix 붙이기
    """
    prompt = f"""
당신은 민원 내용을 핵심 주제 1개로 요약하는 AI입니다.


다음 민원을 보고 핵심 사안을 요약하십시오.
- 반드시 민원의 핵심 주제만 요약하십시오.
- 형식은 자유롭되, 가능한 짧게 작성하십시오.
- 불필요한 수식어는 제거하고 장소/사건 위주로 표현하십시오.
- 예: "화명1동 불법주차", "신호등 고장", "도로 파손"

입력:
{text.strip()}

출력:
    """

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "azure99/blossom-v6.1:8b",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        res.raise_for_status()
        output = res.json()["response"].strip()

            # 단일 요약 항목으로 포맷
        formatted = f" {output}"
        return formatted

    except Exception as e:
        return f"[요약 실패: {str(e)}]"


# 테스트 실행
if __name__ == "__main__":
    test_text = """
서울시 영등포구 문래로20길 46(문래역 이안 오피스텔) 단지 내에 설치된 현수막 2건에 대해 아래와
같은 사유로 민원을 접수합니다.
해당 현수막은 단지 내부에 설치되었으나, 외부 도로에서도 문구 전체가 명확히 식별 가능하여 사실상
옥외광고물에 해당합니다.
「옥외광고물 등의 관리와 옥외광고산업 진흥에 관한 법률」 제2조 제1호, 제3조 및 같은 법 시행령 제3
조 등에 따라, 해당 현수막은 다음과 같은 사유로 법규 위반에 해당됩니다.
1. 무단 게시 및 허가되지 않은 위치 설치:
-현수막은 허가된 게시대가 아닌, 단지 내 가로수(나무)에 직접 부착되어 있습니다. 이는 「옥외광고물
등 관리법」과 서울시 조례에서 명확히 금지하고 있는 행위로, 수목 훼손 및 도시 경관 저해 우려가 있
으며 불법 광고물로 간주됩니다.
2. 부적절한 문구와 사회적 갈등 조장 우려:
현수막에는 특정 입주민 또는 집단을 가해자로 지칭하거나, 불특정 입주민을 잠정적 피해자로 설정하
는 내용이 포함되어 있으며, 이는 공동체 내 편견, 혐오, 갈등을 조장할 수 있는 부적절한 사회적 메시
지를 담고 있습니다.
3. 안전 문제:
사람이 많이 다니고 차량 통행이 잦은 공간의 가로수에 설치되어 있어, 강풍 등의 기상 요인 발생 시
현수막 낙하, 나뭇가지 손상, 차량 파손 등의 안전사고 위험이 큽니다.
위와 같은 사유로 해당 현수막의 설치는 법적·사회적·물리적 문제를 모두 야기하고 있으므로, 구청의
신속한 철거 명령 및 재발 방지를 위한 행정 조치를 요청드립니다.
감사합니다

    """
    result = summarize_with_blossom(test_text)
    print("요약 결과:\n", result)
