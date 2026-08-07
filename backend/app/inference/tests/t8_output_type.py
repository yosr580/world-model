"""Test T8: Output Type - Determine model output type from family metadata."""

def run(model, model_id: str, manifest: dict) -> dict:
    """
    Determine output type based on model family from manifest.
    
    Args:
        model: Loaded transformer model (unused)
        model_id: Identifier for the model (unused)
        manifest: Model manifest dict containing 'family' key
        
    Returns:
        dict with output_type and description based on family mapping
    """
    family = manifest.get("family", "")
    
    mapping = {
        "JEPA": {"output_type": "continuous_latent", "description": "Embedding continu, jamais de pixels"},
        "MAE": {"output_type": "reconstructed_pixels", "description": "Reconstruction pixel via decodeur"},
        "DINOv2": {"output_type": "continuous_embedding", "description": "Embedding continu pour usage aval"},
        "CLIP": {"output_type": "continuous_embedding", "description": "Embedding continu pour usage aval"},
        "Dreamer": {"output_type": "latent_state_rl", "description": "Etat latent utilise pour la planification/le controle"},
        "TD-MPC": {"output_type": "latent_state_rl", "description": "Etat latent utilise pour la planification/le controle"},
        "Cosmos": {"output_type": "generated_video", "description": "Video generee, pixel-space"},
        "Genie": {"output_type": "n/a", "description": "Modele ferme, type de sortie non verifiable independamment"},
    }
    
    return mapping.get(family, {"output_type": "unknown", "description": "Famille non cartographiee"})