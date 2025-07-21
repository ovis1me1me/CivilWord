from pydantic import BaseModel
from datetime import datetime
from typing import Any 

class UserReplyHistoryResponse(BaseModel):
    id: int
    reply_id: int
    final_content: Any
    used_at: datetime

    class Config:
        orm_mode = True
