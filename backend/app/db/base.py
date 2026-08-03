"""Base déclarative SQLAlchemy et export des modèles."""

from app.db.session import Base

# Import des modèles pour qu'ils soient enregistrés dans Base.metadata
from app.db.models import Model, Paper, TestResult, Job  # noqa: F401

__all__ = ["Base", "Model", "Paper", "TestResult", "Job"]