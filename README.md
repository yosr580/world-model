# 🌍 World Models Platform

> **A research platform for exploring, benchmarking, and comparing state-of-the-art World Models and Self-Supervised Vision Models.**

The **World Models Platform** is an interactive research and experimentation environment designed to explore how modern AI systems **perceive, represent, predict, plan, and simulate the world**.

The platform brings together state-of-the-art models such as **I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3, TD-MPC2, Cosmos, SANA-WM, and Genie** into a unified environment.

It provides a **Model Encyclopedia**, **Standardized Test Laboratory**, **Model Comparison Panel**, **Model Registry**, and an **AI Research Assistant** for scientific exploration.

---

# ✨ Features

## 📚 Model Encyclopedia

Explore a curated collection of modern World Models and Self-Supervised Vision Models organized into several families.

Each model provides information about:

- Architecture
- Model family
- Modality
- Parameter scale
- Checkpoint
- Research paper
- Reference repository
- Compatible evaluation tests
- Execution tier
- Research resources
- Visual architecture information

---

## 🧪 Test Laboratory

A standardized environment for evaluating models using a common testing framework.

The platform defines **14 standardized tests (T1–T14)** across five categories:

| Category | Description |
|---|---|
| 🧩 Structure | Evaluate architectural and structural properties |
| 🧠 Representation | Evaluate learned representations |
| 🔮 Prediction | Evaluate latent and future-state prediction |
| 🤖 Action | Evaluate planning and action capabilities |
| 🎨 Generation | Evaluate generative and simulation capabilities |

Tests support three execution tiers:

- ⚡ **Live** — Execute directly on the platform
- 🔄 **Async Job** — Execute as a background job
- 📦 **Archived** — Use previously computed benchmark results

---

## ⚖️ Model Comparison

Compare models side-by-side using:

- Model family
- Architecture
- Parameters
- Modality
- Compatible tests
- Execution tier
- Metrics
- Research references

---

## 🤖 AI Research Assistant

The platform includes an AI-powered assistant specialized in World Models and Self-Supervised Learning.

It can answer questions about:

- I-JEPA
- V-JEPA2
- DreamerV3
- VideoMAE
- DINOv2
- CLIP
- TD-MPC2
- Cosmos
- Genie
- JEPA
- World Models
- Predictive representation learning

The chatbot currently uses **Groq API** for low-latency LLM inference.

> 🚧 The complete RAG pipeline is partially implemented and will progressively integrate scientific papers and vector search.

---

## 🗂️ Model Registry

Each model is described using a structured JSON manifest containing information such as:

```text
Model
 ├── ID
 ├── Family
 ├── Loader
 ├── Checkpoint
 ├── Reference Repository
 ├── Modality
 ├── Predictor Support
 ├── Compatible Tests
 ├── Execution Tier
 ├── License
 └── Paper
```

---

# 🏗️ Architecture

```text
                         ┌──────────────────────────┐
                         │        FRONTEND          │
                         │     React + TypeScript   │
                         │       Vite + Tailwind    │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       FASTAPI API        │
                         │       API Gateway        │
                         └────────────┬─────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
       ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
       │ Model Registry  │   │  Test Engine    │   │  Chat / RAG     │
       │                 │   │                 │   │                 │
       │ Model Loaders   │   │ T1 → T14        │   │ Groq LLM        │
       │ Checkpoints     │   │ Evaluation      │   │ Qdrant          │
       └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
                │                     │                     │
                └─────────────────────┼─────────────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │        DATA LAYER        │
                         ├──────────────────────────┤
                         │ PostgreSQL               │
                         │ Redis                    │
                         │ Qdrant                   │
                         │ MinIO / S3               │
                         └──────────────────────────┘
```

The current implementation runs as an **MVP monolithic backend** while keeping the architecture modular for future scaling.

---

# 🧰 Tech Stack

## Backend

| Technology | Purpose |
|---|---|
| Python 3.12+ | Backend runtime |
| FastAPI 0.111 | REST API |
| SQLAlchemy 2.0 | ORM |
| Alembic 1.13 | Database migrations |
| PostgreSQL 16 | Relational database |
| Redis 7 | Cache / broker |
| Celery 5.4 | Background jobs |
| Qdrant | Vector database |
| MinIO | S3-compatible object storage |
| PyTorch | Model inference |
| TorchVision | Vision utilities |
| Transformers | Model loading |
| TIMM | Vision model registry |
| Pydantic 2 | Validation |
| Uvicorn | ASGI server |
| Groq API | LLM inference |

## Frontend

| Technology | Purpose |
|---|---|
| React 18.3 | UI framework |
| TypeScript 5.7 | Type-safe development |
| Vite 5.4 | Build tool |
| TailwindCSS 3.4 | Styling |
| Framer Motion 13 | Animations |
| Recharts 2.9 | Charts |
| TanStack Query 5 | Server state |
| Axios | HTTP client |
| React Router 6 | Routing |
| Lucide React | Icons |

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL
- Redis
- Qdrant
- MinIO
- Celery
- Celery Beat

---

# 🧠 Supported Model Families

### JEPA / Predictive Representation Learning

- I-JEPA
- V-JEPA2

### Masked Autoencoders

- VideoMAE
- MAE
- BEiT

### Semantic / Vision Models

- DINOv2
- CLIP

### Reinforcement Learning World Models

- DreamerV3
- TD-MPC2

### Generative World Models

- Cosmos
- SANA-WM
- Genie

---

# 📁 Project Structure

```text
world_models/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── models.py
│   │   │   ├── tests.py
│   │   │   └── chat.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── celery_app.py
│   │   │   └── security.py
│   │   │
│   │   ├── db/
│   │   │   ├── models.py
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   │
│   │   ├── inference/
│   │   │   ├── loaders.py
│   │   │   └── tests/
│   │   │
│   │   ├── models_registry/
│   │   │   └── *.json
│   │   │
│   │   ├── rag/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   ├── ChatWidget/
│   │   │   ├── ComparisonPanel/
│   │   │   ├── ModelCard/
│   │   │   ├── TaxonomyFilters/
│   │   │   └── TestResultPanel/
│   │   │
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Encyclopedia/
│   │   │   └── TestLab/
│   │   │
│   │   ├── data/
│   │   ├── api/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── infra/
│   ├── docker-compose.yml
│   ├── .env.example
│   └── .env
│
├── docs/
├── .gitignore
└── README.md
```

---

# 🚀 Installation

## Prerequisites

Make sure you have:

- Python **3.12+**
- Node.js **18+**
- npm
- Docker
- Docker Compose
- Git

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd world_models
```

---

## 2. Backend Virtual Environment

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS

```bash
python -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

---

## 3. Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

# 🔐 Environment Configuration

Create the environment file from the example.

### Windows

```powershell
Copy-Item infra\.env.example infra\.env
```

### Linux / macOS

```bash
cp infra/.env.example infra/.env
```

Edit:

```text
infra/.env
```

Example configuration:

```env
APP_NAME="World Models Platform"
DEBUG=true

DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/world_models

REDIS_URL=redis://localhost:6379/0

CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=world-models
S3_REGION=us-east-1

SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256

MODEL_CACHE_DIR=./models_cache
DEFAULT_DEVICE=cpu

GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
```

> ⚠️ **Never commit real secrets or API keys to GitHub.**

---

# 🐳 Docker Infrastructure

The project uses Docker Compose for infrastructure.

Start PostgreSQL, Redis and Qdrant:

```bash
cd infra
docker compose up -d postgres redis qdrant
```

Check containers:

```bash
docker ps -a
```

You should see:

```text
world-models-postgres
world-models-redis
world-models-qdrant
```

To start the complete stack:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

---

# 🗄️ Database Migrations

From the backend directory:

```bash
cd backend
alembic upgrade head
```

---

# 🖥️ Local Development — Windows

This section describes the recommended workflow for running the platform locally on Windows.

> **Important:** Keep the backend and frontend terminals open while using the platform.

---

## 🔄 Step 0 — Get the Latest GitHub Changes

Before starting the application:

```powershell
cd C:\Users\yosrj\world_models
git pull origin main
```

If your main branch has another name, replace `main` accordingly.

---

# 🐳 Terminal 1 — Docker Infrastructure

Open **PowerShell Terminal 1**:

```powershell
cd C:\Users\yosrj\world_models\infra
docker compose up -d postgres redis qdrant
docker ps -a
```

Verify that these containers are running:

```text
world-models-postgres
world-models-redis
world-models-qdrant
```

Ideally, they should show:

```text
Up (healthy)
```

If necessary:

```powershell
docker compose up -d
```

Then:

```powershell
docker ps -a
```

---

# ⚡ Terminal 2 — Backend

Open **PowerShell Terminal 2**.

```powershell
cd C:\Users\yosrj\world_models\backend
```

Stop existing Python processes:

```powershell
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
```

Start FastAPI:

```powershell
.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for:

```text
INFO:     Application startup complete.
```

The backend is available at:

```text
http://localhost:8000
```

### ⚠️ Important

If you see:

- traceback
- import error
- database error
- connection error
- configuration error
- `Connection refused`

**Do not continue to the frontend.**

Fix the backend first.

Keep this terminal open.

---

# 🔍 Terminal 3 — Backend Verification

Open **PowerShell Terminal 3**.

## Health Check

```powershell
curl.exe http://localhost:8000/health --max-time 5
```

## Models API

```powershell
curl.exe http://localhost:8000/api/models/ --max-time 5
```

## Chatbot API

```powershell
curl.exe -X POST "http://localhost:8000/api/chat/message" -H "Content-Type: application/json" -d "{\"message\": \"test\"}" --max-time 15
```

All three commands should return a response.

Expected flow:

```text
/health
   ↓
Backend OK

/api/models/
   ↓
Model API OK

/api/chat/message
   ↓
Chatbot API OK
```

If any command returns:

```text
Failed to connect
Connection refused
Operation timed out
```

stop and fix the backend.

---

# 🎨 Terminal 4 — Frontend

Open **PowerShell Terminal 4**:

```powershell
cd C:\Users\yosrj\world_models\frontend
```

Stop existing Node processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Start Vite:

```powershell
npx vite
```

Wait for:

```text
VITE ready in ... ms

➜  Local:   http://localhost:5173/
```

Keep this terminal open.

---

# 🌐 Open the Application

Open your browser:

```text
http://localhost:5173
```

Perform a hard refresh:

```text
Ctrl + Shift + R
```

---

# 🔄 Complete Local Startup Flow

```text
1. git pull
       │
       ▼
2. Docker
   PostgreSQL
   Redis
   Qdrant
       │
       ▼
3. FastAPI Backend
   localhost:8000
       │
       ▼
4. Verify API
   /health
   /api/models/
   /api/chat/message
       │
       ▼
5. Vite Frontend
   localhost:5173
       │
       ▼
6. Browser
   http://localhost:5173
```

---

# 🔁 Starting the Project Again

Once everything is configured, the normal workflow is:

### Terminal 1

```powershell
cd C:\Users\yosrj\world_models\infra
docker compose up -d postgres redis qdrant
```

### Terminal 2

```powershell
cd C:\Users\yosrj\world_models\backend
.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3

```powershell
curl.exe http://localhost:8000/health --max-time 5
```

### Terminal 4

```powershell
cd C:\Users\yosrj\world_models\frontend
npx vite
```

Then:

```text
http://localhost:5173
```

---

# 🚀 Updating the Application After a GitHub Update

Whenever new code is pushed to GitHub:

## 1. Pull the Changes

```powershell
cd C:\Users\yosrj\world_models
git pull origin main
```

---

## 2. If Frontend Dependencies Changed

```powershell
cd frontend
npm install
```

---

## 3. If Backend Dependencies Changed

```powershell
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 4. If Database Models Changed

Run:

```powershell
cd backend
alembic upgrade head
```

---

## 5. Restart Backend

Stop the current backend:

```text
Ctrl + C
```

Then:

```powershell
.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for:

```text
INFO:     Application startup complete.
```

---

## 6. Restart Frontend

Stop Vite:

```text
Ctrl + C
```

Then:

```powershell
cd C:\Users\yosrj\world_models\frontend
npx vite
```

---

## 7. Refresh Browser

Open:

```text
http://localhost:5173
```

Then:

```text
Ctrl + Shift + R
```

---

# 🛑 Stopping the Platform

Stop the backend:

```text
Ctrl + C
```

Stop the frontend:

```text
Ctrl + C
```

Stop Docker infrastructure:

```powershell
cd C:\Users\yosrj\world_models\infra
docker compose stop
```

To stop and remove containers:

```powershell
docker compose down
```

> ⚠️ `docker compose down` removes containers but does not remove persistent volumes unless `-v` is explicitly used.

---

# 🌐 API

## Health

```http
GET /health
```

Checks whether the backend is running.

---

## Models

```http
GET /api/models/
```

Returns the available models.

```http
POST /api/models/
```

Creates a model.

```http
GET /api/models/{id}
```

Returns a specific model.

---

## Tests

```http
POST /api/tests/run
```

Runs an evaluation test against a model.

---

## Chatbot

```http
POST /api/chat/message
```

Sends a question to the World Models research assistant.

---

# 📊 Evaluation Framework

The platform is designed around 14 standardized tests:

| Test | Category | Status |
|---|---|---|
| T1 | Structure | ✅ Implemented |
| T2 | Structure | 🚧 In Development |
| T3 | Structure | 🚧 In Development |
| T4 | Representation | 🚧 In Development |
| T5 | Representation | 🚧 In Development |
| T6 | Representation | 🚧 In Development |
| T7 | Prediction | 🚧 In Development |
| T8 | Representation | ✅ Implemented |
| T9 | Prediction | ✅ Implemented |
| T10 | Prediction | 🚧 In Development |
| T11 | Action | 🚧 In Development |
| T12 | Action | ✅ Implemented |
| T13 | Generation | 🚧 In Development |
| T14 | Generation | 🚧 In Development |

---

# 🧬 Model Loading Pipeline

```text
Model Name
    │
    ▼
Model Registry
    │
    ▼
JSON Manifest
    │
    ├── ID
    ├── Family
    ├── Checkpoint
    ├── Loader
    ├── Modality
    ├── Compatible Tests
    └── Execution Tier
    │
    ▼
Model Loader
    │
    ▼
PyTorch Model
    │
    ▼
Evaluation Test
    │
    ▼
Result
```

The platform supports model loading through:

- Hugging Face Transformers
- TIMM
- PyTorch
- Custom loaders

---

# 🤖 Chatbot Architecture

The current chatbot pipeline is:

```text
User Question
      │
      ▼
FastAPI
      │
      ▼
Chat Endpoint
      │
      ▼
Groq API
      │
      ▼
LLM
      │
      ▼
World Models Response
```

The planned RAG architecture is:

```text
Scientific Papers
      │
      ▼
Scraping / Ingestion
      │
      ▼
Document Chunking
      │
      ▼
Embeddings
      │
      ▼
Qdrant
      │
      ▼
Retriever
      │
      ▼
LLM
      │
      ▼
Citation-Aware Answer
```

---

# 🔬 Research Roadmap

## Phase 1 — Core Platform

- [x] Backend architecture
- [x] Frontend architecture
- [x] Model registry
- [x] Model CRUD API
- [x] Model loading
- [x] Initial evaluation tests
- [x] Test execution API
- [x] Initial chatbot
- [x] Docker infrastructure

## Phase 2 — Benchmarking

- [ ] Complete T1–T14
- [ ] Automated benchmarking
- [ ] Persistent experiment results
- [ ] Advanced comparison metrics
- [ ] Async experiment execution
- [ ] GPU execution

## Phase 3 — RAG

- [ ] arXiv ingestion
- [ ] Semantic Scholar ingestion
- [ ] Hugging Face metadata ingestion
- [ ] Papers With Code integration
- [ ] Document chunking
- [ ] Embedding pipeline
- [ ] Qdrant indexing
- [ ] Retrieval-Augmented Generation
- [ ] Citation-aware responses

## Phase 4 — Visualization

- [ ] Latent-space visualization
- [ ] PCA
- [ ] t-SNE
- [ ] UMAP
- [ ] Embedding comparison
- [ ] Attention visualization
- [ ] Prediction visualization
- [ ] Interactive experiment dashboards

## Phase 5 — Scalable Research Infrastructure

- [ ] Distributed inference
- [ ] GPU workers
- [ ] Experiment scheduling
- [ ] Dataset management
- [ ] Experiment reproducibility
- [ ] Model versioning
- [ ] Result versioning

---

# 📊 Current Project Status

| Component | Status |
|---|---|
| Frontend | 🟢 Functional MVP |
| Backend API | 🟢 Functional MVP |
| Model Registry | 🟢 Implemented |
| Model Loading | 🟢 Implemented |
| Test Framework | 🟡 Partial |
| PostgreSQL | 🟢 Implemented |
| Redis | 🟢 Infrastructure Ready |
| Celery | 🟢 Infrastructure Ready |
| Qdrant | 🟡 Infrastructure Ready |
| MinIO | 🟡 Infrastructure Ready |
| Chatbot | 🟢 Prototype |
| RAG | 🟡 Partial |
| Paper Scraping | 🔵 Planned |
| Latent Visualization | 🔵 Planned |
| GPU Inference | 🔵 Planned |

### Status Legend

- 🟢 Implemented
- 🟡 Partially implemented
- 🔵 Planned
- 🚧 In Development

---

# 🧪 Testing

Run backend tests:

```bash
cd backend
pytest
```

Run the frontend development server:

```bash
cd frontend
npm run dev
```

Run the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

---

# 🔒 Security

Never commit sensitive information.

The following should remain private:

```text
.env
API keys
Database passwords
JWT secrets
Cloud credentials
Model access tokens
```

Use:

```text
infra/.env.example
```

to document required environment variables without exposing real credentials.

---

# 🌱 Development Principles

The project follows several principles:

### Modularity

Each major component should remain independently maintainable.

### Reproducibility

Experiments should be reproducible through standardized configurations and recorded results.

### Extensibility

New models and evaluation tests should be easy to add.

### Comparability

Different model families should be evaluated using common interfaces and metrics.

### Research-Oriented Design

The platform prioritizes experimentation, visualization, benchmarking, and scientific exploration.

---

# 🎯 Vision

The ultimate goal of the **World Models Platform** is to move beyond simply cataloguing models.

The platform aims to provide a unified experimental environment where researchers can investigate:

> **How does a model perceive the world?**
>
> **What does it represent?**
>
> **Can it predict what happens next?**
>
> **Can it plan?**
>
> **Can it simulate future states?**
>
> **How do different World Model paradigms compare under the same evaluation framework?**

---

# 📜 License

Research project — open for academic and educational use.

---

# 👥 Contributors

Developed as a research and engineering project exploring:

- World Models
- Self-Supervised Learning
- JEPA
- Predictive Representation Learning
- Computer Vision
- Reinforcement Learning
- Generative Models
- AI Agents
- Model Benchmarking

Contributions, experiments, and research ideas are welcome.
