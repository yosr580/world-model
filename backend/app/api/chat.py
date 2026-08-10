from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []

@router.post("/message", response_model=ChatResponse)
def chat_message(req: ChatRequest):
    return ChatResponse(
        reply=(
            "Le chatbot n'est pas encore connecte a une base documentaire indexee. "
            "Cette fonctionnalite arrive dans une prochaine etape. "
            "En attendant, consulte l'Encyclopedie ou le Laboratoire de test pour explorer les modeles."
        ),
        sources=[],
    )