# /api/ask 경로를 처리하는 모듈 

from fastapi import APIRouter
from app.schemas.ask import AskRequest, AskResponse
from app.services.llm_service import generate_response

# 이 라우터에 등록된 모든 경로는 /api/ask로 시작 
router = APIRouter(prefix="/api/ask", tags=["민원자동응답"])

# api/ask/
@router.post("/", response_model=AskResponse)
def ask_handler(request: AskRequest):
	answer = generate_response(request.query)
	return AskResponse(answer=answer)
