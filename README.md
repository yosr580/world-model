# 🌍 World Models Platform

> **A research and experimentation platform for exploring, benchmarking, and comparing modern World Models and Self-Supervised Vision Models.**

The **World Models Platform** provides a unified environment for studying how intelligent systems perceive, represent, predict, and act within the world.

It brings together state-of-the-art models such as **I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP, BEiT, MAE, DreamerV3, TD-MPC2, Cosmos, SANA-WM, and Genie** into an interactive research platform.

The platform combines a **Model Encyclopedia**, **Standardized Test Laboratory**, **Model Comparison Panel**, and **AI Research Assistant** to make World Model research easier to explore and evaluate.

---

## ✨ Features

### 📚 Model Encyclopedia

Explore a curated collection of **12+ World Models and Self-Supervised Vision Models** organized across multiple model families.

Each model includes:

- Architecture overview
- Model family and modality
- Parameter scale
- Checkpoint information
- Research paper references
- Compatible evaluation tests
- Execution tier
- Resource links
- Visual architecture and masking representations

### 🧪 Test Laboratory

A standardized environment for evaluating different models using a common testing framework.

The platform defines **14 evaluation tests (T1–T14)** across five categories:

| Category | Purpose |
|---|---|
| 🧩 Structure | Analyze architectural and structural properties |
| 🧠 Representation | Evaluate learned representations |
| 🔮 Prediction | Evaluate latent and future-state prediction |
| 🤖 Action | Evaluate planning and action capabilities |
| 🎨 Generation | Evaluate generative and world simulation capabilities |

Tests support different execution tiers:

- ⚡ **Live** — Execute directly on the platform
- 🔄 **Async Job** — Submit long-running experiments
- 📦 **Archived** — Use previously computed results

### ⚖️ Model Comparison

Compare multiple models side-by-side using:

- Model family
- Architecture
- Parameters
- Modality
- Compatible tests
- Execution tier
- Evaluation metrics
- Research references

### 🤖 AI Research Assistant

The platform includes an AI-powered research assistant specialized in **World Models and Self-Supervised Learning**.

The assistant can answer questions about:

- I-JEPA
- V-JEPA2
- DreamerV3
- VideoMAE
- DINOv2
- CLIP
- TD-MPC2
- Cosmos
- Genie
- and related research

The current chatbot uses **Groq's LLM API** for low-latency inference.

> 🚧 The complete RAG pipeline is currently under development. Paper ingestion, vector indexing, and retrieval will be progressively integrated.

### 🗂️ Model Registry

Models are represented using structured JSON manifests containing:

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
 └── Research Paper
