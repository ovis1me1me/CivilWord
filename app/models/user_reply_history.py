# app/models/user_reply_history.py
'''
사용자가 최종 선택한 답변을 기록하는 히스토리 모델

- 하나의 답변(Reply)에 대해 사용자가 "확정"한 내용을 저장
- reply_id를 통해 어떤 답변을 채택했는지 추적 가능
- user_uid를 통해 해당 답변을 선택한 사용자를 식별
- final_content는 JSONB 형식으로 저장되며, 확정된 답변의 내용을 포함
- used_at은 사용자가 선택을 완료한 시점을 자동 기록
- 하나의 사용자는 여러 답변 히스토리를 가질 수 있음

주요 용도:
- 개인화된 답변 이력 관리
- 향후 추천, 유사도 비교, 재활용 기반 데이터 구축 등
'''


from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class UserReplyHistory(Base):
    __tablename__ = "user_reply_history"

    id = Column(Integer, primary_key=True, index=True)

    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)  # 외부 식별자 기준 연결
    reply_id = Column(Integer, ForeignKey("reply.id"))  # 답변 ID

    final_content = Column(JSONB)  # 확정된 답변 내용
    used_at = Column(DateTime, default=datetime.utcnow)  # 사용 시각

    # 관계 설정
    reply = relationship("Reply", back_populates="history")
    user = relationship("User", back_populates="reply_history")
