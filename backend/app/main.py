from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.models import router as models_router
from app.api.tests import router as tests_router
from app.api.chat import router as chat_router


def create_app() -> FastAPI:
    app = FastAPI(title="World Models Platform API")

    # CORS for local development only; this should be restricted in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(models_router, prefix="/api/models", tags=["models"])
    app.include_router(tests_router, prefix="/api/tests", tags=["tests"])
    app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()