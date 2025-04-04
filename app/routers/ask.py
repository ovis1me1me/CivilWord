# /api/ask 경로를 처리하는 모듈 

from fastapi import APIRouter
from app.schemas.ask import AskRequest, AskResponse
from app.services.llm_service import generate_response

router = APIRouter(prefix="/api/ask", tags=["민원자동응답"])


@router.post("/", response_model=AskResponse)
def ask_handler(request: AskRequest):
	answer = generate_response(request.query)
	return AskResponse(answer=answer)
