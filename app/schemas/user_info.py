from pydantic import BaseModel

class UserInfoCreate(BaseModel):
    user_id: str
    name: str
    department: str
    contact: str
    category: str
