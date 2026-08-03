from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


router = APIRouter()


class TestID(str, Enum):
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    T4 = "T4"
    T5 = "T5"
    T6 = "T6"
    T7 = "T7"
    T8 = "T8"
    T9 = "T9"
    T10 = "T10"
    T11 = "T11"
    T12 = "T12"


class TestTier(str, Enum):
    LIVE = "live"
    ASYNC_JOB = "async_job"
    ARCHIVED_KAGGLE = "archived_kaggle"


class TestInfo(BaseModel):
    id: TestID
    name: str
    category: str
    description: str
    compatible_models: List[str]
    execution_tier: TestTier
    estimated_duration_seconds: Optional[int] = None


# Catalogue des tests (du document de specs)
TESTS_CATALOG = [
    TestInfo(
        id=TestID.T1,
        name="Légitimité d'entraînement (structure gap photo vs bruit)",
        category="Représentation",
        description="Le modèle distingue-t-il signal réel vs bruit ?",
        compatible_models=["all"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=5,
    ),
    TestInfo(
        id=TestID.T2,
        name="Visualisation du masking",
        category="Visualisation",
        description="Affiche le vrai schéma de masking propre au modèle",
        compatible_models=["I-JEPA", "V-JEPA2", "VideoMAE", "BEiT", "MAE"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=3,
    ),
    TestInfo(
        id=TestID.T3,
        name="Robustesse à l'occlusion spatiale",
        category="Robustesse",
        description="Cosinus vs % occlusion",
        compatible_models=["all"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=10,
    ),
    TestInfo(
        id=TestID.T4,
        name="Robustesse au frame-dropout temporel",
        category="Robustesse",
        description="Cosinus vs % frames manquantes",
        compatible_models=["video"],
        execution_tier=TestTier.ASYNC_JOB,
        estimated_duration_seconds=60,
    ),
    TestInfo(
        id=TestID.T5,
        name="Robustesse au flou / bruit gaussien",
        category="Robustesse",
        description="Cosinus vs intensité de corruption",
        compatible_models=["all"],
        execution_tier=TestTier.ASYNC_JOB,
        estimated_duration_seconds=60,
    ),
    TestInfo(
        id=TestID.T6,
        name="Séparation sémantique (retrieval)",
        category="Sémantique",
        description="Distingue-t-il classe A de classe B (cosinus centré)",
        compatible_models=["all"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=5,
    ),
    TestInfo(
        id=TestID.T7,
        name="Correspondance dense cross-image",
        category="Sémantique",
        description="Retrouve un patch similaire dans une autre image",
        compatible_models=["DINOv2", "CLIP", "I-JEPA"],
        execution_tier=TestTier.ASYNC_JOB,
        estimated_duration_seconds=30,
    ),
    TestInfo(
        id=TestID.T8,
        name="Type de sortie catégorique",
        category="Sortie",
        description="Continu / pixels reconstruits / tokens discrets",
        compatible_models=["all"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=2,
    ),
    TestInfo(
        id=TestID.T9,
        name="Prédiction latente du futur",
        category="Prédiction",
        description="Cosinus prédiction vs vérité (split passé/futur)",
        compatible_models=["V-JEPA2", "DreamerV3"],
        execution_tier=TestTier.ASYNC_JOB,
        estimated_duration_seconds=120,
    ),
    TestInfo(
        id=TestID.T10,
        name="Reconstruction pixel du futur",
        category="Prédiction",
        description="MSE pixel-space sur tubes futurs masqués",
        compatible_models=["VideoMAE", "MAE"],
        execution_tier=TestTier.ASYNC_JOB,
        estimated_duration_seconds=120,
    ),
    TestInfo(
        id=TestID.T11,
        name="Alignement texte-image (zero-shot)",
        category="Alignement",
        description="Rang de la bonne légende",
        compatible_models=["CLIP"],
        execution_tier=TestTier.LIVE,
        estimated_duration_seconds=5,
    ),
    TestInfo(
        id=TestID.T12,
        name="Planification/action-conditionnée",
        category="Action",
        description="Rollout latent conditionné par une action réelle",
        compatible_models=["V-JEPA2-AC", "DreamerV3", "Genie"],
        execution_tier=TestTier.ARCHIVED_KAGGLE,
        estimated_duration_seconds=None,
    ),
]


class RunTestRequest(BaseModel):
    model_id: str
    test_id: TestID
    input_data: dict = Field(default_factory=dict)
    parameters: dict = Field(default_factory=dict)

    model_config = {"protected_namespaces": ()}


class RunTestResponse(BaseModel):
    job_id: str
    status: str
    message: str


@router.get("", response_model=List[TestInfo], summary="Lister tous les tests disponibles")
async def list_tests():
    return TESTS_CATALOG


@router.get("/{test_id}", response_model=TestInfo, summary="Obtenir les détails d'un test")
async def get_test(test_id: TestID):
    for test in TESTS_CATALOG:
        if test.id == test_id:
            return test
    raise HTTPException(status_code=404, detail="Test non trouvé")


@router.post("/run", response_model=RunTestResponse, summary="Lancer un test (async)")
async def run_test(request: RunTestRequest):
    # TODO: créer un job Celery, retourner job_id
    # Pour l'instant, on simule
    import uuid
    return RunTestResponse(
        job_id=str(uuid.uuid4()),
        status="queued",
        message=f"Test {request.test_id} mis en file d'attente pour modèle {request.model_id}",
    )


@router.get("/jobs/{job_id}", summary="Obtenir le statut/résultat d'un job")
async def get_job_result(job_id: str):
    # TODO: récupérer depuis Redis/DB
    return {"job_id": job_id, "status": "pending", "progress": 0.0, "result": None}