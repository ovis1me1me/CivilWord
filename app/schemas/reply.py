from pydantic import BaseModel
from datetime import datetime
from typing import Any,List

class ReplyBase(BaseModel):
    id:int
    complaint_id: int
    content: Any
    created_at: datetime

    class Config:
        orm_mode = True

class SimpleContent(BaseModel):
    content: Any

class Section(BaseModel):
    title: str
    text: str
# ✅ 그 다음 정의: AnswerSummaryItem
class AnswerSummaryItem(BaseModel):
    review: str
    sections: List[Section]
    
class AnswerBlock(BaseModel):
    review: str
    sections: List[Section]

class ReplySummaryUpdateRequest(BaseModel):
    answer_summary: List[AnswerSummaryItem]

class ReplySummaryRequest(BaseModel):
    answer_summary: List[AnswerSummaryItem]