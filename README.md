# 🌍 World Models Platform

A research platform for exploring, benchmarking, and comparing state-of-the-art World Models and Self-Supervised Vision Models such as **I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3**, and future architectures.

The project aims to provide researchers and engineers with an interactive environment to:

- 📚 Explore world models through a searchable encyclopedia
- 🧪 Run standardized evaluation tests
- 📊 Visualize latent representations
- 🤖 Query scientific papers using a RAG-powered assistant
- 📈 Compare multiple models under identical conditions

---

# Project Status

**Current phase:** MVP Backend Foundation

Implemented:

- ✅ Project architecture
- ✅ FastAPI backend
- ✅ PostgreSQL database
- ✅ SQLAlchemy models
- ✅ Alembic migrations
- ✅ Docker infrastructure
- ✅ REST API
- ✅ Initial automated tests

In progress:

- ⏳ Model registry
- ⏳ Inference engine
- ⏳ Interactive testing laboratory

Planned:

- 🔜 React frontend
- 🔜 Scientific paper scraping
- 🔜 RAG chatbot
- 🔜 Latent space visualization
- 🔜 Enterprise mode

---

# Vision

The final platform will consist of four independent layers.

```
Frontend
      │
      ▼
API Gateway
      │
      ▼
Inference │ Scraping │ RAG │ Registry │ Job Queue
      │
      ▼
PostgreSQL │ Qdrant │ Redis │ Object Storage
```

The architecture is designed to remain modular, scalable and easily extensible as new world models become available.

---

# Current Features

## Backend

- FastAPI application
- Modular project architecture
- REST API
- CORS configuration
- Health endpoint
- Model CRUD endpoints

---

## Database

PostgreSQL database with SQLAlchemy ORM.

Current entities:

- Papers
- Models
- Test Results
- Jobs

Database schema is versioned using Alembic migrations.

---

## Infrastructure

Docker Compose environment including:

- PostgreSQL
- Redis
- Qdrant
- Backend API

Designed for reproducible local development.

---

## API

Current endpoints

```
GET  /health

GET  /api/models/

GET  /api/models/{id}

POST /api/models/
```

Future endpoints will include:

```
POST /api/tests/run

GET /api/tests

GET /api/papers

POST /api/chat

GET /api/embeddings
```

---

# Technology Stack

## Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- Uvicorn

## Machine Learning

- PyTorch
- Transformers
- TIMM
- TorchVision
- NumPy
- Scikit-Learn
- Matplotlib

## Databases

- PostgreSQL
- Qdrant
- Redis

## Infrastructure

- Docker
- Docker Compose

## Future Frontend

- React
- Vite
- TailwindCSS

---

# Planned Features

## World Model Encyclopedia

- Detailed model pages
- Research papers
- Training datasets
- Architecture diagrams
- Reproducibility badges

---

## Interactive Laboratory

Run standardized experiments on supported models.

Examples:

- T1 Structure Gap
- T2 Mask Visualization
- T3 Occlusion Robustness
- T4 Frame Dropout
- T5 Noise Robustness
- T6 Semantic Separation
- T7 Cross-image Correspondence
- T8 Output Type
- T9 Latent Prediction
- T10 Reconstruction
- T11 Image-Text Alignment
- T12 Action Planning

---

## Latent Space Visualization

Interactive visualization using

- PCA
- t-SNE
- UMAP

with embedding comparison between models.

---

## RAG Chatbot

Scientific assistant able to answer questions using indexed papers.

Sources:

- arXiv
- Semantic Scholar
- HuggingFace
- Papers With Code

---

## Automated Scientific Monitoring

Automatic discovery of:

- new papers
- new checkpoints
- new benchmarks

through scheduled pipelines.

---

# Repository Structure

```
world-model/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── inference/
│   │   ├── models_registry/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│
├── infra/
│
└── docs/
```

---

# Development Roadmap

## Phase 1

Backend MVP

- [x] Project structure
- [x] FastAPI
- [x] Database
- [x] Docker
- [x] CRUD API
- [ ] Model Registry
- [ ] Inference Service
- [ ] Live Tests (T1, T8)

---

## Phase 2

Research Platform

- [ ] Paper Scraping
- [ ] Encyclopedia
- [ ] RAG Chatbot

---

## Phase 3

Interactive Lab

- [ ] Celery jobs
- [ ] GPU execution
- [ ] Latent visualization
- [ ] Benchmark dashboard

---

## Phase 4

Enterprise Edition

- [ ] User authentication
- [ ] Model upload
- [ ] Automated reports
- [ ] Kubernetes deployment

---

# Installation

```bash
git clone <repository>

cd world-model
```

Create the backend environment

```bash
python -m venv .venv

pip install -r backend/requirements.txt
```

Start infrastructure

```bash
docker compose up -d
```

Run migrations

```bash
alembic upgrade head
```

Launch API

```bash
uvicorn app.main:app --reload
```

API available at

```
http://localhost:8000
```

Swagger documentation

```
http://localhost:8000/docs
```

---

# Long-Term Goal

Build an open research platform allowing anyone to explore, compare, evaluate and understand modern World Models through a unified interface combining experimentation, visualization, documentation and scientific retrieval.

---

# License

Research project.
