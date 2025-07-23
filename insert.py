from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.complaint_history import ComplaintHistory  # 실제 경로 확인
import random

# 실제 JSONB 더미 데이터
def make_reply_summary(i):
    return {
        "{section1_1}": f"해당 민원은 관련 부서에 이첩되어 검토 중입니다. (번호: {i+1})",
        "{section1_2}": "향후 조치 계획은 추후 공지될 예정입니다."
    }

def make_reply_content(i):
    return {
        "{section1_1}": f"해당 내용은 {2025 - i}년 {7 - (i % 3)}월경 확인된 사안입니다.",
        "{section1_2}": "관계 부서와 협의하여 처리하였습니다.",
        "{section1_3}": f"귀하의 의견에 감사드리며, 유사 민원 재발 방지를 위해 노력하겠습니다."
    }

def insert_dummy_complaints():
    db: Session = SessionLocal()

    titles = [
        "화명1동 주차문제 해결 요청",
        "당리동 전신주 위험 신고",
        "도시가스 배관 노후화 문제",
        "횡단보도 설치 민원",
        "학교 앞 불법 주정차 단속 요청",
        "가로등 고장 신고",
        "도로 포트홀 긴급 보수 요청",
        "공원 내 흡연 단속 강화",
        "재활용 수거함 부족 문제",
        "버스 정류장 벤치 설치 요청"
    ]

    contents = [
        "화명1동 지역의 상습 불법 주차로 주민 불편이 가중되고 있습니다.",
        "당리동 71번길 전신주가 기울어져 낙사 위험이 있습니다.",
        "도시가스 배관이 노후되어 누출 위험이 우려됩니다.",
        "횡단보도가 없어 주민들의 보행 안전이 위협받고 있습니다.",
        "학교 앞 차량의 불법 주정차가 심각하여 어린이 안전에 위협이 됩니다.",
        "가로등이 고장 나 야간에 매우 어둡습니다.",
        "도로에 깊은 포트홀이 발생하여 차량 손상이 우려됩니다.",
        "공원 내 흡연 행위로 이용객이 불쾌함을 겪고 있습니다.",
        "재활용 수거함이 부족하여 쓰레기가 무단 투기되고 있습니다.",
        "버스 정류장에 앉을 곳이 없어 노약자들이 불편을 겪습니다."
    ]

    dummy_data = []
    for i in range(10):
        ch = ComplaintHistory(
            user_uid=f"test-uid-{i % 3}",  # 세 명의 테스트 사용자
            title=titles[i],
            content=contents[i],
            is_public=bool(i % 2),
            created_at=datetime.utcnow() - timedelta(days=i),
            summary=f"{titles[i]}.",
            reply_summary=make_reply_summary(i),
            reply_content=make_reply_content(i),
            reply_status=random.choice(["답변전", "답변중", "답변완료"]),
            moved_at=datetime.utcnow() - timedelta(days=i//2)
        )
        dummy_data.append(ch)

    db.add_all(dummy_data)
    db.commit()
    db.close()
    print("✅ 실내용 더미 민원 10건 삽입 완료")

if __name__ == "__main__":
    insert_dummy_complaints()
