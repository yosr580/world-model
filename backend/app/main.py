from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.models import router as models_router


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

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()