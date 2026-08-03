# World Models Platform

Plateforme de recherche et d'expérimentation sur les world models (I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3, Genie, etc.).

**4 couches** : Frontend (encyclopédie, labo, visualisation, chatbot) → API Gateway → Microservices (Inférence, Scraping, RAG, Registre, Job Queue) → Données (PostgreSQL, Qdrant, S3, Redis).

**Phase actuelle** : MVP monolithique (Pilier 2 — Laboratoire de test interactif).