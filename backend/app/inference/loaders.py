"""Model loaders for inference service."""

from typing import Any, Dict, Optional
from transformers import (
    AutoModel,
    AutoModelForImageClassification,
    CLIPModel,
    Dinov2Model,
    IJepaModel,
    ViTMAEModel,
    VideoMAEModel,
)

# Global cache for loaded models
_model_cache: Dict[str, Any] = {}


def load_model(manifest: Dict[str, Any]) -> Any:
    """
    Load a model based on the manifest configuration.

    Args:
        manifest: Dictionary containing model configuration with keys:
            - family: Model family (JEPA, DINOv2, CLIP, MAE)
            - loader: Loader type (must be transformers.AutoModel or equivalent)
            - id: Unique identifier for caching
            - checkpoint: Optional checkpoint identifier
            - modality: For MAE models (image or video)

    Returns:
        Loaded model instance.

    Raises:
        ValueError: If loader is not supported or family is unknown.
    """
    model_id = manifest.get("id")
    if not model_id:
        raise ValueError("manifest must contain 'id'")

    # Return cached model if available
    if model_id in _model_cache:
        return _model_cache[model_id]

    loader = manifest.get("loader")
    family = manifest.get("family")

    # Validate loader - only support standard HF transformers loaders
    supported_loaders = {
        "transformers.AutoModel",
        "transformers.AutoModelForImageClassification",
        "transformers.CLIPModel",
        "transformers.Dinov2Model",
        "transformers.IJepaModel",
        "transformers.ViTMAEModel",
        "transformers.VideoMAEModel",
        None,  # Allow None for backward compatibility
    }

    if loader not in supported_loaders:
        raise ValueError(
            f"Loader non supporté par l'inference service actuel: {loader}"
        )

    # Load model based on family
    checkpoint = manifest.get("checkpoint")

    if family == "JEPA":
        if checkpoint:
            model = IJepaModel.from_pretrained(checkpoint)
        else:
            raise ValueError(f"Manifest JEPA sans checkpoint defini: {manifest.get('id')}")

    elif family == "DINOv2":
        model = Dinov2Model.from_pretrained(
            checkpoint or "facebook/dinov2-base"
        )

    elif family == "CLIP":
        model = CLIPModel.from_pretrained(
            checkpoint or "openai/clip-vit-base-patch32"
        )

    elif family == "MAE":
        modality = manifest.get("modality", "image")
        if modality == "video":
            model = VideoMAEModel.from_pretrained(
                checkpoint or "MCG-NJU/videomae-base"
            )
        else:
            model = ViTMAEModel.from_pretrained(
                checkpoint or "facebook/vit-mae-base"
            )

    else:
        raise ValueError(f"Famille de modèle inconnue: {family}")

    # Cache the loaded model
    _model_cache[model_id] = model
    return model