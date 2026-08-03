from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import Model, Paper
from app.db.session import get_db
from app.schemas.model import ModelCreate, ModelListResponse, ModelRead

router = APIRouter()


@router.get("/", response_model=ModelListResponse)
def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ModelListResponse:
    skip = (page - 1) * page_size
    query = db.query(Model)
    total = query.count()
    items = query.offset(skip).limit(page_size).all()
    return ModelListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=ModelRead, status_code=201)
def create_model(model_create: ModelCreate, db: Session = Depends(get_db)) -> ModelRead:
    existing_model = (
        db.query(Model)
        .filter(Model.name == model_create.name, Model.family == model_create.family)
        .first()
    )
    if existing_model is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Model with name '{model_create.name}' and family '{model_create.family}' already exists",
        )

    if model_create.source_paper_id is not None:
        paper = db.query(Paper).filter(Paper.id == model_create.source_paper_id).first()
        if paper is None:
            raise HTTPException(
                status_code=400,
                detail=f"Paper {model_create.source_paper_id} does not exist",
            )

    model = Model(**model_create.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.get("/{model_id}", response_model=ModelRead)
def read_model(model_id: UUID, db: Session = Depends(get_db)) -> ModelRead:
    model = db.query(Model).filter(Model.id == model_id).first()
    if model is None:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return model
