from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def embed_text(text: str) -> list[float]:
    """Encode text into a vector embedding using a local sentence transformer model."""
    return _model.encode(text).tolist()