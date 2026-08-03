from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, Field, field_validator
from pydantic import ConfigDict


class ModelBase(BaseModel):
    name: str = Field(min_length=1)
    family: str | None = None
    checkpoint_id: str | None = None
    license: str | None = None
    paradigm: str | None = None
    modality: str | None = None
    params_millions: float | None = None
    verified_reproducible: bool = False
    manifest: dict | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("name must not be empty or whitespace")
        return value


class ModelCreate(ModelBase):
    source_paper_id: UUID | None = None


class ModelRead(ModelBase):
    id: UUID
    source_paper_id: UUID | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelListResponse(BaseModel):
    items: list[ModelRead]
    total: int
    page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)
