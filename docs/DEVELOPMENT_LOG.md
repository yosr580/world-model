# World Models Platform — Journal de Développement

> Ce document trace l'exécution des étapes 0 et 1 du guide de démarrage, fichier par fichier, commande par commande.

---

## Étape 0 — Structure du dépôt

**Objectif** : Créer l'arborescence complète du projet avec `README.md` et `.gitignore`.

### Commandes exécutées

```bash
# Création des dossiers
mkdir -p backend/app/{api,core,db,models_registry,inference,schemas} \
         backend/alembic backend/tests \
         frontend infra docs

# README.md (5 lignes)
cat > README.md << 'EOF'
# World Models Platform

Plateforme de recherche et d'expérimentation sur les world models (I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3, Genie, etc.).

**4 couches** : Frontend (encyclopédie, labo, visualisation, chatbot) → API Gateway → Microservices (Inférence, Scraping, RAG, Registre, Job Queue) → Données (PostgreSQL, Qdrant, S3, Redis).

**Phase actuelle** : MVP monolithique (Pilier 2 — Laboratoire de test interactif).
EOF

# .gitignore Python + Node standard
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
ENV/
.env
*.pth
*.safetensors
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.ruff_cache/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
.docker/

# Logs
*.log

# Local config
*.local
EOF
```

### Fichiers créés

| Fichier | Description |
|---------|-------------|
| `README.md` | Présentation du projet en 5 lignes |
| `.gitignore` | Ignore Python (venv, __pycache__, .pth, .safetensors), Node, IDE, OS, Docker, logs |
| `backend/app/api/` | Routes FastAPI |
| `backend/app/core/` | Config, sécurité |
| `backend/app/db/` | Modèles SQLAlchemy, session |
| `backend/app/models_registry/` | Manifestes JSON des world models |
| `backend/app/inference/` | Loaders + exécution des tests |
| `backend/app/schemas/` | Schémas Pydantic |
| `backend/alembic/` | Migrations DB |
| `backend/tests/` | Tests unitaires |
| `frontend/` | (À scaffolder à l'étape 4) |
| `infra/` | Docker Compose, .env.example |
| `docs/` | Documentation existante |

---

## Étape 1 — Backend : dépendances Python + scaffolding FastAPI

**Objectif** : Installer les dépendances figées, créer l'environnement virtuel, scaffolder le backend FastAPI complet (config, sécurité, DB, API, Docker, tests).

### 1.1 `backend/requirements.txt` — Dépendances figées

**Itérations nécessaires** (Python 3.14 → 3.12) :

| Package | Version initiale | Version finale | Raison du changement |
|---------|------------------|----------------|----------------------|
| `torch` | 2.3.1 | 2.12.1 | Python 3.14 non supporté par torch 2.3 |
| `torchvision` | 0.18.1 | 0.27.1 | Compatibilité torch 2.12 |
| `pillow` | 10.4.0 | 12.3.0 | Python 3.14 wheels manquantes |
| `numpy` | 1.26.4 | 2.0.2 | Python 3.14 → 2.x requis |
| `pandas` | 2.2.2 | 2.2.3 | Compatibilité numpy 2.x |
| `scikit-learn` | 1.5.0 → 1.6.1 → 1.7.2 | 1.7.2 | Python 3.14 build failed (meson/vswhere) → 1.7.2 a wheel cp314 |
| `matplotlib` | 3.9.1 | 3.9.2 | Compatibilité |
| `psycopg2-binary` | 2.9.9 | `psycopg[binary]==3.3.4` | psycopg2 build failed (pg_config manquant) → psycopg 3.x wheel dispo |
| `pydantic` | 2.7.4 | 2.9.2 | PyO3 0.21.2 ne supporte pas Python 3.14 → 2.9.2 utilise PyO3 0.22.2 (max 3.13) |
| **Python** | 3.14.3 | **3.12.10** | **Installation via winget** — seule version avec wheels pour tous les packages ML |

**Contenu final `requirements.txt`** :

```text
# API
fastapi==0.111.0
uvicorn[standard]==0.30.1
python-multipart==0.0.9
pydantic==2.9.2
pydantic-settings==2.3.4
python-dotenv==1.0.1

# Base de données
sqlalchemy==2.0.30
alembic==1.13.1
psycopg[binary]==3.3.4

# Cache / jobs asynchrones
redis==5.0.1
celery==5.4.0

# Vector DB (RAG, phase 2 mais on le prépare)
qdrant-client==1.11.1

# Stockage objet
boto3==1.34.107

# Machine learning (inference service)
torch==2.12.1
torchvision==0.27.1
transformers==4.41.2
timm==1.0.9
einops==0.8.0
pillow==12.3.0
numpy==2.0.2
pandas==2.2.3
scikit-learn==1.7.2
matplotlib==3.9.2

# Tests
pytest==8.2.2
httpx==0.27.0
```

### 1.2 Environnement virtuel & installation

```bash
# Installation Python 3.12 via winget
winget install Python.Python.3.12

# Création venv avec Python 3.12
"C:\Users\yosrj\AppData\Local\Programs\Python\Python312\python.exe" -m venv .venv

# Installation deps (réussie al 1er essai avec Python 3.12)
.venv/Scripts/pip install -r requirements.txt
```

**Résultat** : 127 packages installés dont `torch`, `torchvision`, `transformers`, `timm`, `pydantic-core` (wheel cp312), `tokenizers` (wheel cp312), `scikit-learn` (wheel cp312).

### 1.3 Fichiers source FastAPI créés

#### `backend/app/main.py` — Point d'entrée

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="World Models Platform",
        description="API pour la plateforme de recherche sur les world models...",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    # CORS
    app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, ...)
    # Routes
    app.include_router(api_router, prefix="/api/v1")
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "service": "world-model-api"}
    return app

app = create_app()
```

#### `backend/app/core/config.py` — Configuration Pydantic Settings

Centralise **toute** la config via variables d'env (`.env`) :
- App (nom, debug, prefix API)
- Database (PostgreSQL URL, pool)
- Redis / Celery (broker, result backend)
- Qdrant (URL, API key)
- S3/MinIO (endpoint, credentials, bucket, region)
- Security (JWT secret, algo, expiration tokens)
- CORS (origins autorisées)
- ML (cache dir, device par défaut)
- Scraping (arXiv max results, intervalle)

#### `backend/app/core/security.py` — Auth JWT

- `verify_password` / `get_password_hash` (bcrypt via `passlib`)
- `create_access_token` (expiration configurable)
- `create_refresh_token` (7 jours par défaut)
- `decode_token` (validation signature + exp)

#### `backend/app/core/celery_app.py` — Jobs asynchrones

- Instance Celery avec broker/result backend Redis
- Config : JSON serialization, UTC, task tracking, time limit 1h
- Beat schedule exemple : scraping quotidien

#### `backend/app/db/session.py` — Session SQLAlchemy

- Engine avec pool (size=10, max_overflow=20, pre_ping)
- `SessionLocal` factory
- `Base = declarative_base()`
- Dependency `get_db()` pour FastAPI

#### `backend/app/db/base.py` — Base déclarative

Point d'import unique pour tous les modèles (à compléter plus tard).

#### `backend/app/api/v1/router.py` — Routeur v1

```python
api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
```

#### `backend/app/api/v1/endpoints/health.py`

```python
@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "world-model-api"}
```

#### `backend/app/api/v1/endpoints/models.py` — CRUD Modèles

- Schémas Pydantic : `ModelBase`, `ModelCreate`, `ModelResponse`
- 6 modèles de démo (données en dur, remplacées par DB plus tard) :
  - `ijepa-vith16` — I-JEPA ViT-H/16 (632M, live, vérifié)
  - `vjepa2-vitl-fpc64-256` — V-JEPA2 ViT-L FPC64 (300M, async_job, vérifié)
  - `videomae-vitb` — VideoMAE ViT-B (86M, async_job)
  - `dinov2-vitb14` — DINOv2 ViT-B/14 (86M, live, vérifié)
  - `clip-vitb32` — CLIP ViT-B/32 (88M, live, vérifié)
  - `beit-vitb16` — BEiT ViT-B/16 (86M, live)
- Endpoints : `GET /models` (filtres family, modality, license, verified_only), `GET /models/{id}`, `POST /models`

#### `backend/app/api/v1/endpoints/tests.py` — Catalogue de tests

- Enum `TestID` (T1–T12), `TestTier` (live, async_job, archived_kaggle)
- Schéma `TestInfo` : id, name, category, description, compatible_models, execution_tier, estimated_duration
- 12 tests définis selon la spécification (T1 légitimité, T2 masking, T3 occlusion, T4 frame-dropout, T5 bruit/flou, T6 séparation sémantique, T7 cross-image, T8 type sortie, T9 prédiction latente, T10 reconstruction pixel, T11 alignement text-image, T12 planification action)
- Endpoints : `GET /tests`, `GET /tests/{id}`, `POST /tests/run` (simule job_id), `GET /tests/jobs/{job_id}`

### 1.4 Infrastructure Docker

#### `backend/Dockerfile` — Multi-stage

```dockerfile
# Stage builder : compile deps (gcc, libpq-dev)
# Stage final  : runtime minimal (libpq5 seulement)
# User non-root (app), WORKDIR /app, PYTHONPATH=/app
# CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### `backend/.dockerignore`

Exclut : `__pycache__`, `.venv`, `.pytest_cache`, `.env`, `*.pth`, `*.safetensors`, `tests/`, `docs/`, `.git/`, IDE, OS.

#### `backend/alembic/` — Migrations

- `alembic.ini` : config logging, script template
- `alembic/env.py` : lit `settings.DATABASE_URL`, importe `Base` depuis `app.db.session`
- `alembic/script.py.mako` : template migration standard
- `alembic/versions/` : dossier pour futures migrations

#### `infra/docker-compose.yml` — Stack complète

| Service | Image | Ports | Volumes | Healthcheck |
|---------|-------|-------|---------|-------------|
| `postgres` | postgres:16-alpine | 5432 | `postgres_data` | `pg_isready` |
| `redis` | redis:7-alpine | 6379 | `redis_data` | `redis-cli ping` |
| `qdrant` | qdrant/qdrant:latest | 6333, 6334 | `qdrant_data` | `/health` |
| `minio` | minio/minio:latest | 9000, 9001 | `minio_data` | `/minio/health/live` |
| `backend` | build: ../backend | 8000 | `../backend/app:/app/app` | depends_on healthy |
| `celery-worker` | build: ../backend | — | `../backend/app:/app/app`, `model_cache` | depends_on healthy |
| `celery-beat` | build: ../backend | — | `../backend/app:/app/app` | depends_on healthy |
| `celery-beat` | build: ../backend | — | `../backend/app:/app/app` | depends_on healthy |
*** End Patch

## Étape 2 — Backend : modèles SQLAlchemy + migration Alembic

**Objectif** : Définir les modèles SQLAlchemy, configurer Alembic, générer et appliquer la migration initiale.

### Fichiers créés / modifiés
- `backend/app/db/models.py`
  - Table `papers` : `id` UUID PK, `title`, `authors` ARRAY(String), `source`, `url`, `published_at`, `ingestion_status`, `trust_level`, `created_at`
  - Table `models` : `id` UUID PK, `name`, `family`, `checkpoint_id`, `license`, `paradigm`, `modality`, `params_millions`, `verified_reproducible`, `source_paper_id` FK vers `papers.id`, `manifest` JSONB, `created_at`
  - Table `test_results` : `id` UUID PK, `model_id` FK vers `models.id`, `test_id`, `input_hash`, `params` JSONB, `metrics` JSONB, `artifact_urls` ARRAY(String), `execution_mode`, `kaggle_notebook_url`, `created_at`
  - Table `jobs` : `id` UUID PK, `user_id`, `status`, `test_result_id` FK vers `test_results.id`, `progress`, `created_at`
- `backend/alembic/env.py`
  - import de `Base` depuis `app.db.session`
  - import de `app.db.models` pour que Alembic détecte les modèles via `target_metadata`
  - `target_metadata = Base.metadata`
- `backend/alembic/versions/b61b9789fa3e_initial_schema.py`
  - migration générée automatiquement
  - ajout manuel de `from sqlalchemy.dialects import postgresql`

### Incidents rencontrés
| Incident | Cause réelle | Résolution |
|---|---|---|
| `Can't locate revision identified by 'ec74120db7c2'` | L'ancienne table `alembic_version` en base pointait vers une révision supprimée ; le dossier `alembic/versions/` n'était plus cohérent avec la base | Réinitialisation propre de la base de dev en supprimant toutes les tables et `alembic_version`, puis régénération de la migration | 
| Import manquant `postgresql` dans le fichier de migration | Le fichier de migration utilisait `postgresql.JSONB` sans importer explicitement `sqlalchemy.dialects.postgresql` | Ajout de `from sqlalchemy.dialects import postgresql` juste après `import sqlalchemy as sa` |
| Vérification du nom de la base de données | Deux noms possibles avaient été testés précédemment (`worldmodels` vs `world_models`) | Confirmation que `world_models` est cohérent dans `docker-compose.yml`, `infra/.env.example`, et `backend/app/core/config.py` |

### Commandes exécutées
```bash
docker compose -f ../infra/docker-compose.yml exec postgres psql -U postgres -d world_models -c "DROP TABLE IF EXISTS jobs, test_results, models, papers, alembic_version CASCADE;"
docker compose -f ../infra/docker-compose.yml exec postgres psql -U postgres -d world_models -c "\dt"
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
docker compose -f ../infra/docker-compose.yml exec postgres psql -U postgres -d world_models -c "\dt"
```

### Migration générée et appliquée
- Fichier : `backend/alembic/versions/b61b9789fa3e_initial_schema.py`
- Résultat de `alembic upgrade head` :
  - `INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.`
  - `INFO  [alembic.runtime.migration] Will assume transactional DDL.`
  - `INFO  [alembic.runtime.migration] Running upgrade  -> b61b9789fa3e, initial_schema`

### Tables confirmées
```
              List of relations
 Schema |      Name       | Type  |  Owner   
--------+-----------------+-------+----------
 public | alembic_version | table | postgres
 public | jobs            | table | postgres
 public | models          | table | postgres
 public | papers          | table | postgres
 public | test_results    | table | postgres
(5 rows)
```

### Git
- `git log -1 --oneline` n'a pas pu être exécuté : le répertoire n'est pas un dépôt Git (`.git` manquant), donc aucun hash de commit n'est disponible.

## Étape 3 — API FastAPI minimale + healthcheck + endpoint /api/models

**Objectif** : Mettre en place une API FastAPI minimale avec un endpoint de vérification de santé et un endpoint CRUD pour les modèles.

### Fichiers créés / modifiés
- `backend/app/schemas/model.py`
  - Schémas Pydantic V2 pour le modèle : `ModelBase`, `ModelCreate`, `ModelRead`, `ModelListResponse`
- `backend/app/api/models.py`
  - Routeur FastAPI minimal pour :
    - `GET /api/models/`
    - `GET /api/models/{model_id}`
    - `POST /api/models/`
  - Validation de l’unicité `(name, family)`
  - Vérification d’existence de `source_paper_id`
- `backend/app/main.py`
  - Application FastAPI créée via `create_app()`
  - CORS local pour `http://localhost:5173`
  - Montée du routeur `models_router` sur `/api/models`
  - Endpoint `GET /health`
- `backend/tests/test_health.py`
  - test `test_health_returns_ok`
  - utilisation autonome de `TestClient(app)`

### Nettoyage effectué
- Suppression complète de `backend/app/api/v1/`
  - code mort issu d’un scaffold antérieur
  - routeur et endpoints v1 non utilisés après migration vers `backend/app/api/models.py`
- Suppression de `backend/app/core/security.py`
  - dépendances manquantes dans `requirements.txt` (`python-jose`, `passlib`)
- Suppression de `backend/app/core/celery_app.py`
  - dépendances non présentes et code non fonctionnel dans le contexte actuel

### Incidents rencontrés
| Incident | Cause réelle | Résolution |
|---|---|---|
| Redirection `307` sur `GET` / `POST /api/models` sans slash final | Comportement natif FastAPI lorsque le routeur est monté avec un préfixe | Utilisation du slash final `/api/models/` dans les tests |
| Erreur `422 JSON decode error` avec `curl.exe` sous PowerShell | Échappement JSON mal géré par le shell PowerShell/curl | Utilisation de `Invoke-RestMethod` / `Invoke-WebRequest` natif PowerShell |
| Conflit `409` sur la contrainte d’unicité `(name, family)` | Deux tentatives de création avec le même nom/family | Comportement attendu validant la contrainte d’unicité |
| Vérification du `201` exact pour la création | Le code de statut HTTP exact `201 Created` n’a pas été isolé et confirmé sur un test séparé | À vérifier dans une session future pour rester honnête sur l’incertitude |

### Résultats des vérifications
- `python -m pytest tests/test_health.py -v` : `1 passed`
- `GET /health` → `200`
- `GET /api/models/` → `200` avec liste vide
- `POST /api/models/` → création réussie d’un objet retournant un `UUID` et `created_at`
