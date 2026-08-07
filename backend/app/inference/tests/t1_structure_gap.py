"""Test T1: Structure Gap - Patch-patch similarity comparison between real image and noise."""

import io
import base64
import requests
import torch
import numpy as np
from PIL import Image
import torchvision.transforms as T
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def run(model, model_id: str) -> dict:
    """
    Compute structure gap between real image and random noise.
    
    Args:
        model: Loaded transformer model (e.g., Dinov2Model)
        model_id: Identifier for the model
        
    Returns:
        dict with structure_gap (float), similarity_real_png_base64 (str), similarity_noise_png_base64 (str)
    """
    print("Telechargement image demo...")
    
    # 1. Download demo image
    url = "https://raw.githubusercontent.com/pytorch/hub/master/images/dog.jpg"
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    img = Image.open(io.BytesIO(response.content)).convert("RGB")
    
    # 2. Generate random noise of same size
    noise = Image.fromarray(np.random.randint(0, 256, (img.height, img.width, 3), dtype=np.uint8))
    
    # 3. Prepare inputs (resize to model's expected input size if needed)
    # For DINOv2, typical input is 224x224 or 518x518
    # We'll use the model's config if available, otherwise default to 224
    try:
        input_size = model.config.image_size
    except AttributeError:
        input_size = 224
    
    # Resize both images
    img_resized = img.resize((input_size, input_size))
    noise_resized = noise.resize((input_size, input_size))
    
    # Convert to tensors and normalize (ImageNet stats)
    transform = T.Compose([
        T.Lambda(lambda x: torch.tensor(np.array(x)).permute(2, 0, 1).float() / 255.0),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    img_tensor = transform(img_resized).unsqueeze(0)
    noise_tensor = transform(noise_resized).unsqueeze(0)
    
    # 4. Get embeddings from model
    model.eval()
    with torch.no_grad():
        try:
            # Try standard forward pass
            outputs = model(img_tensor)
            if hasattr(outputs, 'last_hidden_state'):
                real_embeddings = outputs.last_hidden_state  # [1, num_patches, hidden_dim]
            elif isinstance(outputs, tuple) and hasattr(outputs[0], 'shape'):
                real_embeddings = outputs[0]
            else:
                raise AttributeError("Model output does not have last_hidden_state")
            
            outputs_noise = model(noise_tensor)
            if hasattr(outputs_noise, 'last_hidden_state'):
                noise_embeddings = outputs_noise.last_hidden_state
            elif isinstance(outputs_noise, tuple) and hasattr(outputs_noise[0], 'shape'):
                noise_embeddings = outputs_noise[0]
            else:
                raise AttributeError("Model output does not have last_hidden_state")
                
        except AttributeError as e:
            raise RuntimeError(f"Model {model_id} does not have standard last_hidden_state output: {e}")
    
    # 5. Compute patch-patch similarity matrices (normalized embeddings, matrix product)
    # Remove CLS token if present (first token)
    if real_embeddings.shape[1] > 1:
        real_patches = real_embeddings[0, 1:, :]  # [num_patches, hidden_dim]
        noise_patches = noise_embeddings[0, 1:, :]
    else:
        real_patches = real_embeddings[0]
        noise_patches = noise_embeddings[0]
    
    # Normalize embeddings
    real_norm = torch.nn.functional.normalize(real_patches, p=2, dim=1)
    noise_norm = torch.nn.functional.normalize(noise_patches, p=2, dim=1)
    
    # Compute similarity matrices (patch x patch)
    sim_real = torch.mm(real_norm, real_norm.t()).cpu().numpy()  # [num_patches, num_patches]
    sim_noise = torch.mm(noise_norm, noise_norm.t()).cpu().numpy()
    
    # 6. Compute structure gap (Frobenius norm of difference)
    structure_gap = float(np.linalg.norm(sim_real - sim_noise, 'fro'))
    
    # 7. Generate PNG base64 for similarity matrices
    def matrix_to_png_base64(matrix, title):
        fig, ax = plt.subplots(figsize=(6, 6))
        im = ax.imshow(matrix, cmap='RdBu_r', vmin=-1, vmax=1)
        ax.set_title(title)
        ax.axis('off')
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8')
    
    similarity_real_png_base64 = matrix_to_png_base64(sim_real, f"Real Image Similarity ({model_id})")
    similarity_noise_png_base64 = matrix_to_png_base64(sim_noise, f"Noise Similarity ({model_id})")
    
    return {
        "structure_gap": structure_gap,
        "similarity_real_png_base64": similarity_real_png_base64,
        "similarity_noise_png_base64": similarity_noise_png_base64
    }