from pydantic import BaseModel

class InputSchema(BaseModel):
    content: str
