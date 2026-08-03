from fastapi import APIRouter

from app.api.v1.endpoints import models, tests, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])