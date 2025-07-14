from pydantic import BaseModel
from datetime import datetime

class UserReplyHistoryResponse(BaseModel):
    id: int
    reply_id: int
    final_content: str
    used_at: datetime

    class Config:
        orm_mode = True
