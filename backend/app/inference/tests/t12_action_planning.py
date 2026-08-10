"""Test T12: Action-Conditioned Planning - Rollout latent states conditioned on real actions."""

import io
import base64
import torch
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def run(model, model_id: str) -> dict:
    """
    Evaluate action-conditioned planning / latent rollout.

    For DreamerV3, TD-MPC: rollout latent states given action sequence,
    compare predicted vs actual latent states or reconstructed observations.

    For V-JEPA2-AC: similar latent rollout conditioned on actions.

    For Genie: not executable (closed API).

    Args:
        model: Loaded RL world model
        model_id: Identifier for the model

    Returns:
        dict with rollout_cosine (float), steps_rolled_out (int),
        action_sequence_length (int), visualization_png_base64 (str)
    """
    # Check if model supports action-conditioned rollout
    supports_actions = False
    try:
        if hasattr(model, 'world_model') or hasattr(model, 'dynamics') or \
           hasattr(model, 'transition') or 'Dreamer' in model_id or 'TD-MPC' in model_id:
            supports_actions = True
    except Exception:
        pass

    if not supports_actions:
        return {
            "rollout_cosine": None,
            "steps_rolled_out": 0,
            "action_sequence_length": 0,
            "visualization_png_base64": None,
            "note": f"Model {model_id} does not support action-conditioned latent rollout. Test requires RL world model (DreamerV3, TD-MPC) or V-JEPA2-AC with action inputs.",
            "status": "not_applicable"
        }

    # If model supports actions, we'd run actual evaluation here
    return {
        "rollout_cosine": 0.0,
        "steps_rolled_out": 0,
        "action_sequence_length": 0,
        "visualization_png_base64": None,
        "note": "Action-conditioned model detected but evaluation pipeline not yet implemented. Requires environment interaction data (actions + observations) for proper rollout evaluation.",
        "status": "not_implemented"
    }