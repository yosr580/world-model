from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel


router = APIRouter()


class ModelBase(BaseModel):
    id: str
    name: str
    family: str
    checkpoint: str
    modality: str
    license: str
    params_millions: Optional[float] = None
    verified_reproducible: bool = False
    execution_tier: str  # live, async_job, archived_kaggle
    compatible_tests: List[str] = []


class ModelCreate(ModelBase):
    pass


class ModelResponse(ModelBase):
    class Config:
        from_attributes = True


# Données de démo (seront remplacées par la DB)
DEMO_MODELS = [
    ModelResponse(
        id="ijepa-vith16",
        name="I-JEPA ViT-H/16",
        family="JEPA",
        checkpoint="facebook/ijepa-vith16",
        modality="image",
        license="open-weight",
        params_millions=632,
        verified_reproducible=True,
        execution_tier="live",
        compatible_tests=["T1", "T2", "T3", "T6", "T8"],
    ),
    ModelResponse(
        id="vjepa2-vitl-fpc64-256",
        name="V-JEPA2 ViT-L FPC64",
        family="JEPA",
        checkpoint="facebook/vjepa2-vitl-fpc64-256",
        modality="video",
        license="open-weight",
        params_millions=300,
        verified_reproducible=True,
        execution_tier="async_job",
        compatible_tests=["T1", "T2", "T3", "T4", "T5", "T6", "T8", "T9"],
    ),
    ModelResponse(
        id="videomae-vitb",
        name="VideoMAE ViT-B",
        family="MAE",
        checkpoint="MCG-NJU/videomae-base",
        modality="video",
        license="open-weight",
        params_millions=86,
        verified_reproducible=False,
        execution_tier="async_job",
        compatible_tests=["T1", "T2", "T3", "T4", "T10"],
    ),
    ModelResponse(
        id="dinov2-vitb14",
        name="DINOv2 ViT-B/14",
        family="DINOv2",
        checkpoint="facebook/dinov2-base",
        modality="image",
        license="open-weight",
        params_millions=86,
        verified_reproducible=True,
        execution_tier="live",
        compatible_tests=["T1", "T3", "T6", "T7", "T8"],
    ),
    ModelResponse(
        id="clip-vitb32",
        name="CLIP ViT-B/32",
        family="CLIP",
        checkpoint="openai/clip-vit-base-patch32",
        modality="image",
        license="open-weight",
        params_millions=88,
        verified_reproducible=True,
        execution_tier="live",
        compatible_tests=["T1", "T3", "T6", "T8", "T11"],
    ),
    ModelResponse(
        id="beit-vitb16",
        name="BEiT ViT-B/16",
        family="BEiT",
        checkpoint="microsoft/beit-base-patch16-224",
        modality="image",
        license="open-weight",
        params_millions=86,
        verified_reproducible=False,
        execution_tier="live",
        compatible_tests=["T1", "T2", "T3", "T6", "T8"],
    ),
]


@router.get("", response_model=List[ModelResponse], summary="Lister tous les modèles")
async def list_models(
    family: Optional[str] = None,
    modality: Optional[str] = None,
    license: Optional[str] = None,
    verified_only: bool = False,
):
    models = DEMO_MODELS
    if family:
        models = [m for m in models if m.family.lower() == family.lower()]
    if modality:
        models = [m for m in models if m.modality.lower() == modality.lower()]
    if license:
        models = [m for m in models if m.license.lower() == license.lower()]
    if verified_only:
        models = [m for m in models if m.verified_reproducible]
    return models


@router.get("/{model_id}", response_model=ModelResponse, summary="Obtenir un modèle par ID")
async def get_model(model_id: str):
    for model in DEMO_MODELS:
        if model.id == model_id:
            return model
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Modèle non trouvé")


@router.post("", response_model=ModelResponse, summary="Créer un nouveau modèle")
async def create_model(model: ModelCreate):
    # TODO: persist in DB
    return model