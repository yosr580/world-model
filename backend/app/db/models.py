import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base


class Paper(Base):
    __tablename__ = "papers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=True)
    authors = Column(ARRAY(String), nullable=True)
    source = Column(String, nullable=True)
    url = Column(String, nullable=True)
    published_at = Column(DateTime, nullable=True)
    ingestion_status = Column(String, nullable=True, default="pending")
    trust_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Model(Base):
    __tablename__ = "models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    family = Column(String, nullable=True)
    checkpoint_id = Column(String, nullable=True)
    license = Column(String, nullable=True)
    paradigm = Column(String, nullable=True)
    modality = Column(String, nullable=True)
    params_millions = Column(Float, nullable=True)
    verified_reproducible = Column(Boolean, default=False)
    source_paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id"), nullable=True)
    manifest = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    source_paper = relationship("Paper")


class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"), nullable=True)
    test_id = Column(String, nullable=False)
    input_hash = Column(String, nullable=True)
    params = Column(JSONB, nullable=True)
    metrics = Column(JSONB, nullable=True)
    artifact_urls = Column(ARRAY(String), nullable=True)
    execution_mode = Column(String, nullable=True)
    kaggle_notebook_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String, nullable=True, default="queued")
    test_result_id = Column(UUID(as_uuid=True), ForeignKey("test_results.id"), nullable=True)
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
