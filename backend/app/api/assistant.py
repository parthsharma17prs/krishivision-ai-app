from fastapi import APIRouter
from app.schemas.schemas import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Farmer Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
def chat_with_assistant(req: AssistantChatRequest):
    res = assistant_service.chat(user_query=req.query, language=req.language or "English")
    return {
        "farm_id": req.farm_id,
        "user_query": req.query,
        "response_text": res["response_text"],
        "detected_language": res["detected_language"],
        "suggested_followups": res["suggested_followups"],
        "mode": res["mode"]
    }
