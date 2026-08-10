from fastapi import APIRouter
from pydantic import BaseModel
import httpx
from app.core.config import settings

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []

SYSTEM_PROMPT = (
    "Tu es un assistant specialise en intelligence artificielle, et en particulier en world "
    "models (I-JEPA, V-JEPA2, DreamerV3, VideoMAE, DINOv2, CLIP, TD-MPC2, Cosmos, Genie, etc.). "
    "Tu aides les utilisateurs d'une plateforme de recherche sur les world models a comprendre "
    "ces architectures, leurs differences, leurs cas d'usage. Reponds en francais, de facon "
    "claire et concise. Si tu n'es pas sur d'une information tres specifique, dis-le plutot "
    "que d'inventer."
)

@router.post("/message", response_model=ChatResponse)
def chat_message(req: ChatRequest):
    try:
        with httpx.Client(timeout=30) as http_client:
            response = http_client.post(
                f"{settings.GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": req.message},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 400,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
    except Exception as e:
        return ChatResponse(reply=f"Erreur: {str(e)}", sources=[])

    return ChatResponse(reply=reply, sources=[])
