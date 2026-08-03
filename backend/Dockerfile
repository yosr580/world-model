# Dockerfile pour le backend FastAPI (CPU par défaut, GPU via --build-arg)
ARG PYTHON_VERSION=3.12
ARG BASE_IMAGE=python:${PYTHON_VERSION}-slim

FROM ${BASE_IMAGE} AS builder

# Installer les dépendances système pour compiler les packages Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copier requirements.txt et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# --- Stage final ---
FROM ${BASE_IMAGE}

# Installer runtime dependencies seulement
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copier l'utilisateur et les packages installés depuis builder
COPY --from=builder /home/app/.local /home/app/.local
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copier le code source
COPY --chown=app:app ./app ./app

# Variables d'environnement
ENV PATH="/home/app/.local/bin:${PATH}" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1

USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]