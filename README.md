# World Models Platform

A research platform for exploring, benchmarking, and comparing state-of-the-art World Models and Self-Supervised Vision Models such as **I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3, TD-MPC2, Cosmos, SANA-WM, and Genie**.

The platform provides an interactive environment with a model encyclopedia, a standardized test laboratory, a comparison panel, and a RAG-powered chatbot for scientific papers.

---

## Features

- **���� Model Encyclopedia** — Interactive, animated pages for 12 world models across 6 families (JEPA, MAE, Semantic Baselines, RL World Models, Generative World Models) with masking visualizations, architecture diagrams, parameter scales, and resource links
- **���� Test Lab** — Run 14 standardized evaluation tests (T1–T14) across categories: Structure, Representation, Prediction, Action, Generation; supports three execution tiers (live, async job, archived Kaggle)
- **���� Comparison Panel** — Side-by-side model comparison with metrics, compatible tests, and execution tiers
- **���� RAG Chatbot** — Groq-powered assistant specialized in world models (I-JEPA, V-JEPA2, DreamerV3, VideoMAE, DINOv2, CLIP, TD-MPC2, Cosmos, Genie, etc.)
- **������� Model Registry** — 12 models with manifests defining family, checkpoint, loader, modality, compatible tests, and execution tier
- **���� Paper Scraping (planned)** — Automated ingestion from arXiv, Semantic Scholar, HuggingFace, Papers With Code
- **���� Latent Space Visualization (planned)** — PCA, t-SNE, UMAP with embedding comparison

---

## Tech Stack

### Backend
- **FastAPI** 0.111 — API framework
- **SQLAlchemy** 2.0 + **Alembic** 1.13 — ORM and migrations
- **PostgreSQL** 16 (via psycopg3) — Primary database
- **Redis** 7 + **Celery** 5.4 — Cache, async job queue, scheduler
- **Qdrant** — Vector database for RAG embeddings
- **MinIO** — S3-compatible object storage
- **PyTorch** 2.12 + **TorchVision** 0.27 — Inference backend
- **Transformers** ≥5.14 + **TIMM** 1.0.9 — Model loading (HF hub, TIMM registry)
- **einops**, **pillow**, **numpy**, **pandas**, **scikit-learn**, **matplotlib** — ML utilities
- **Pydantic** 2.9 + **Pydantic Settings** 2.3 — Validation & config
- **Uvicorn** 0.30 — ASGI server
- **Groq API** — LLM for chatbot (llama-3.3-70b-versatile)

### Frontend
- **React** 18.3 + **TypeScript** 5.7
- **Vite** 5.4 + **SWC** — Build tool
- **TailwindCSS** 3.4 — Styling
- **Framer Motion** 13 — Animations
- **Recharts** 2.9 — Charts (scatter, sparklines)
- **TanStack Query** 5 — Server state management
- **Axios** 1.6 — HTTP client
- **React Router** 6.17 — Routing
- **Lucide React** — Icons

### Infrastructure
- **Docker** + **Docker Compose** — Multi-service orchestration
- Services: PostgreSQL, Redis, Qdrant, MinIO, Backend API, Celery Worker, Celery Beat

---

## Project Structure

```
world_models/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routers (models, tests, chat)
│   │   ├── core/             # Config, Celery app, security
│   │   ├── db/               # SQLAlchemy models, session, base
│   │   ├── inference/        # Model loaders, test implementations (T1, T8, T9, T12)
│   │   ├── models_registry/  # JSON manifests for each model
│   │   ├── rag/              # RAG pipeline (planned/partial)
│   │   ├── schemas/          # Pydantic schemas
│   │   └── main.py           # FastAPI app factory
│   ├── alembic/              # Database migrations
│   ├── tests/                # Pytest suite
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, ChatWidget, ComparisonPanel, ModelCard, TaxonomyFilters, TestResultPanel
│   │   ├── pages/            # Home, Encyclopedia, TestLab
│   │   ├── data/             # modelsCatalog.ts, testsCatalog.ts, comparisonData.ts, types.ts
│   │   ├── api/              # Axios client, query hooks
│   │   ├── App.tsx           # Routes + providers
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── infra/
│   ├── docker-compose.yml    # Full stack (DB, Redis, Qdrant, MinIO, Backend, Celery)
│   ├── .env.example          # Template for environment variables
│   └── .env                  # Local overrides (not committed)
│
��── docs/                     # Documentation (empty/placeholder)
```

---

## Prerequisites

- **Python** 3.12+
- **Node.js** 18+ (with npm)
- **Docker** & **Docker Compose** (for databases and services)
- **PostgreSQL** 16 (provided via Docker)
- **Git**

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd world_models
```

### 2. Set up the backend virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Configure environment variables

```bash
cp infra/.env.example infra/.env
# Edit infra/.env with your values (see Environment Variables section below)
```

### 4. Start infrastructure services (PostgreSQL, Redis, Qdrant, MinIO)

```bash
cd infra
docker compose up -d
```

### 5. Run database migrations

```bash
cd ../backend
alembic upgrade head
```

### 6. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Project

### Start the backend API (from `backend/` directory)

```bash
# With virtual environment activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

### Start the frontend dev server (from `frontend/` directory)

```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### Run with Docker Compose (full stack)

```bash
cd infra
docker compose up -d --build
```

This starts all services including the backend API, Celery worker, and Celery beat scheduler.

---

## Environment Variables

Create `infra/.env` from `infra/.env.example` and adjust as needed. **Never commit real secrets.**

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| **Application** | | |
| `APP_NAME` | Platform name | `"World Models Platform"` |
| `DEBUG` | Enable debug mode | `true` / `false` |
| `API_V1_PREFIX` | API version prefix | `/api/v1` |
| **Database (PostgreSQL)** | | |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql+psycopg://postgres:postgres@localhost:5432/world_models` |
| `DATABASE_POOL_SIZE` | Connection pool size | `10` |
| `DATABASE_MAX_OVERFLOW` | Max overflow connections | `20` |
| **Redis / Celery** | | |
| `REDIS_URL` | Redis for caching | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery message broker | `redis://localhost:6379/1` |
| `CELERY_RESULT_BACKEND` | Celery results backend | `redis://localhost:6379/2` |
| **Vector DB (Qdrant)** | | |
| `QDRANT_URL` | Qdrant HTTP endpoint | `http://localhost:6333` |
| `QDRANT_API_KEY` | Qdrant API key (if secured) | `""` |
| **Object Storage (MinIO / S3)** | | |
| `S3_ENDPOINT_URL` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `S3_BUCKET` | Bucket name | `world-models` |
| `S3_REGION` | S3 region | `us-east-1` |
| **Security** | | |
| `SECRET_KEY` | JWT signing key (min 32 chars in prod) | `dev-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| **CORS** | | |
| `CORS_ORIGINS` | Allowed origins (JSON array) | `["http://localhost:3000","http://localhost:5173"]` |
| **ML / Inference** | | |
| `MODEL_CACHE_DIR` | Local cache for model weights | `./models_cache` |
| `DEFAULT_DEVICE` | Torch device | `cpu` (or `cuda`) |
| **Scraping (planned)** | | |
| `ARXIV_MAX_RESULTS` | Max papers per query | `100` |
| `SCRAPING_INTERVAL_HOURS` | Scheduled scrape interval | `24` |
| **Groq Chatbot** | | |
| `GROQ_API_KEY` | Groq API key (required for chat) | `""` |
| `GROQ_BASE_URL` | Groq API base | `https://api.groq.com/openai/v1` |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |

### Notes
- The backend reads `.env` from `../infra/.env` relative to `backend/app/core/config.py`
- For local development without Docker, update `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `S3_ENDPOINT_URL` to `localhost`
- `GROQ_API_KEY` is required for the chatbot to function — obtain one from [console.groq.com](https://console.groq.com)

---

## API Endpoints (Current)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/models/` | List models (paginated) |
| `POST` | `/api/models/` | Create model |
| `GET` | `/api/models/{id}` | Get model by ID |
| `POST` | `/api/tests/run` | Run a test on a model |
| `POST` | `/api/chat/message` | Send message to RAG chatbot |

---

## License

Research project — open for academic and educational use.
