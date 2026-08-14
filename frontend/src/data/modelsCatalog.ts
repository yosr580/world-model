/**
 * World Models Catalog - Frontend mirror of backend/app/models_registry/
 * This file is generated from the JSON manifests in the backend model registry.
 * Keep in sync with backend/app/models_registry/*.json files.
 */

import type { ModelSpec, ModelFamily, ExecutionTier } from './types';

// All model specifications from the backend registry
export const MODELS_CATALOG: ModelSpec[] = [
  {
    id: 'clip_vit_base_patch16',
    family: 'CLIP',
    loader: 'transformers.AutoModel',
    checkpoint: 'openai/clip-vit-base-patch16',
    reference_repo: 'https://github.com/openai/CLIP',
    modality: 'image/text',
    supports_predictor: false,
    compatible_tests: ['T1', 'T3', 'T5', 'T6', 'T7', 'T8'],
    execution_tier: 'live',
    license: 'open-weight',
    paper_id: 'arxiv:2103.00020',
  },
  {
    id: 'dinov2_base',
    family: 'DINOv2',
    loader: 'transformers.AutoModel',
    checkpoint: 'facebook/dinov2-base',
    reference_repo: 'https://github.com/facebookresearch/dinov2',
    modality: 'image',
    supports_predictor: false,
    compatible_tests: ['T1', 'T3', 'T5', 'T6', 'T7', 'T8'],
    execution_tier: 'live',
    license: 'open-weight',
    paper_id: 'arxiv:2304.07193',
  },
  {
    id: 'dreamerv3',
    family: 'Dreamer',
    loader: 'custom_jax',
    checkpoint: null,
    reference_repo: 'https://github.com/danijar/dreamerv3',
    modality: 'state/pixel (Atari, Crafter, DeepMind Control, Minecraft)',
    supports_predictor: true,
    compatible_tests: ['T9', 'T12'],
    execution_tier: 'archived_kaggle',
    license: 'open-weight',
    paper_id: 'arxiv:2301.04104',
    access_notes: 'Code source ouvert (JAX), pas de checkpoint pretraine officiel unique sur un hub. Des checkpoints communautaires existent (ex. SafeDreamer, 80+ checkpoints sur Hugging Face) mais necessitent un environnement JAX specifique, non compatible transformers.',
  },
  {
    id: 'genie3',
    family: 'Genie',
    loader: null,
    checkpoint: null,
    reference_repo: null,
    modality: 'video (monde interactif jouable, genere depuis texte/image)',
    supports_predictor: true,
    compatible_tests: [],
    execution_tier: 'archived_kaggle',
    license: 'closed-api',
    paper_id: null,
    access_notes: 'Famille Genie de DeepMind (Genie 2, Genie 3). Aucun checkpoint public ni API d\'inference accessible a ce jour. Ne peut pas etre charge ni teste par cette plateforme. Inclus uniquement a des fins de taxonomie/comparaison dans l\'encyclopedie, sur la base de publications/demos publiques, jamais reproduit independamment.',
  },
  {
    id: 'ijepa_vitb16_1k',
    family: 'JEPA',
    loader: 'transformers.AutoModel',
    checkpoint: 'facebook/ijepa-vitb16-1k',
    reference_repo: 'https://github.com/facebookresearch/ijepa',
    modality: 'image',
    supports_predictor: true,
    compatible_tests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T8'],
    execution_tier: 'live',
    license: 'open-weight',
    paper_id: 'arxiv:2301.08243',
  },
  {
    id: 'nvidia_cosmos3_edge',
    family: 'Cosmos',
    loader: 'diffusers_custom',
    checkpoint: 'nvidia/Cosmos3-Edge',
    reference_repo: 'https://github.com/nvidia/cosmos',
    modality: 'video (generation conditionee texte/image/action)',
    supports_predictor: true,
    compatible_tests: ['T8', 'T9'],
    execution_tier: 'job_async',
    license: 'open-weight',
    paper_id: 'arxiv:2606.02800',
    access_notes: 'Variante distillee et plus legere de NVIDIA Cosmos 3 (famille de world foundation models pour la Physical AI). Poids ouverts sous licence OpenMDW-1.1. Necessite le framework Cosmos ou Diffusers, pas transformers.AutoModel standard.',
  },
  {
    id: 'nvidia_sana_wm',
    family: 'Sana',
    loader: 'diffusers_custom',
    checkpoint: 'nvidia/Sana-WM',
    reference_repo: 'https://github.com/nvidia/sana',
    modality: 'video (generation conditionee texte/image/action)',
    supports_predictor: true,
    compatible_tests: ['T8', 'T9'],
    execution_tier: 'job_async',
    license: 'open-weight',
    paper_id: 'arxiv:2410.10629',
    access_notes: 'Modele de generation video efficace (Sana) adapte pour world modeling. Architecture DiT (Diffusion Transformer) avec linear attention. Poids ouverts.',
  },
  {
    id: 'seed',
    family: 'SEED',
    loader: 'custom_torch',
    checkpoint: null,
    reference_repo: 'https://github.com/baidu/SEED',
    modality: 'image/video (tokenization + generation)',
    supports_predictor: true,
    compatible_tests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
    execution_tier: 'job_async',
    license: 'open-weight',
    paper_id: 'arxiv:2310.05737',
    access_notes: 'SEED (Semantic Embedding with Discrete tokens) de Baidu. Tokenizer d\'images/videos + modele autoregressif. Checkpoints disponibles sur Hugging Face.',
  },
  {
    id: 'tdmpc2',
    family: 'TD-MPC2',
    loader: 'custom_torch',
    checkpoint: null,
    reference_repo: 'https://github.com/nicklashansen/tdmpc2',
    modality: 'state/pixel (DMControl, MetaWorld, MyoSuite)',
    supports_predictor: true,
    compatible_tests: ['T9', 'T12'],
    execution_tier: 'archived_kaggle',
    license: 'open-weight',
    paper_id: 'arxiv:2310.05737',
    access_notes: 'TD-MPC2: Model-Based RL with Latent Dynamics. Checkpoints pour DMControl/MetaWorld sur Hugging Face. Necessite environnement d\'entrainement specifique.',
  },
  {
    id: 'videomae_base',
    family: 'VideoMAE',
    loader: 'transformers.AutoModel',
    checkpoint: 'MCG-NJU/videomae-base',
    reference_repo: 'https://github.com/MCG-NJU/VideoMAE',
    modality: 'video',
    supports_predictor: false,
    compatible_tests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T8'],
    execution_tier: 'live',
    license: 'open-weight',
    paper_id: 'arxiv:2203.12602',
  },
  {
    id: 'vit_mae_base',
    family: 'MAE',
    loader: 'transformers.AutoModel',
    checkpoint: 'facebook/vit-mae-base',
    reference_repo: 'https://github.com/facebookresearch/mae',
    modality: 'image',
    supports_predictor: false,
    compatible_tests: ['T1', 'T3', 'T5', 'T6', 'T7', 'T8'],
    execution_tier: 'live',
    license: 'open-weight',
    paper_id: 'arxiv:2111.06377',
  },
  {
    id: 'vjepa2_vitl_fpc64_256',
    family: 'JEPA',
    loader: 'transformers.AutoModel',
    checkpoint: 'facebook/vjepa2-vitl-fpc64-256',
    reference_repo: 'https://github.com/facebookresearch/vjepa2',
    modality: 'video',
    frames_per_clip: 64,
    supports_predictor: true,
    compatible_tests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T8', 'T9'],
    execution_tier: 'job_async',
    license: 'open-weight',
    paper_id: 'arxiv:2406.02800',
  },
  {
    id: 'world_models_ha_schmidhuber',
    family: 'World Models (Ha & Schmidhuber)',
    loader: 'custom_torch',
    checkpoint: null,
    reference_repo: 'https://github.com/hardmaru/WorldModelsExperiments',
    modality: 'state/pixel (CarRacing, Doom)',
    supports_predictor: true,
    compatible_tests: ['T9', 'T12'],
    execution_tier: 'archived_kaggle',
    license: 'open-weight',
    paper_id: 'arxiv:1803.10122',
    access_notes: 'World Models original (Ha & Schmidhuber, 2018). VAE + MDN-RNN + Controller. Code TensorFlow 1.x legacy. Reproductions PyTorch communautaires disponibles.',
  },
];

// Family definitions with descriptions
export const FAMILIES: ModelFamily[] = [
  {
    name: 'CLIP',
    description: 'Contrastive Language-Image Pre-training - OpenAI\'s vision-language foundation model',
    models: MODELS_CATALOG.filter(m => m.family === 'CLIP'),
  },
  {
    name: 'DINOv2',
    description: 'Self-supervised vision transformer from Facebook Research',
    models: MODELS_CATALOG.filter(m => m.family === 'DINOv2'),
  },
  {
    name: 'Dreamer',
    description: 'Model-based RL with latent dynamics (JAX implementation)',
    models: MODELS_CATALOG.filter(m => m.family === 'Dreamer'),
  },
  {
    name: 'Genie',
    description: 'Generative Interactive Environments from DeepMind (taxonomy only - no public checkpoints)',
    models: MODELS_CATALOG.filter(m => m.family === 'Genie'),
  },
  {
    name: 'JEPA',
    description: 'Joint Embedding Predictive Architecture - Facebook Research (I-JEPA, V-JEPA)',
    models: MODELS_CATALOG.filter(m => m.family === 'JEPA'),
  },
  {
    name: 'Cosmos',
    description: 'NVIDIA\'s Physical AI World Foundation Models',
    models: MODELS_CATALOG.filter(m => m.family === 'Cosmos'),
  },
  {
    name: 'Sana',
    description: 'NVIDIA\'s efficient video generation with DiT architecture',
    models: MODELS_CATALOG.filter(m => m.family === 'Sana'),
  },
  {
    name: 'SEED',
    description: 'Semantic Embedding with Discrete tokens - Baidu\'s tokenizer + autoregressive model',
    models: MODELS_CATALOG.filter(m => m.family === 'SEED'),
  },
  {
    name: 'TD-MPC2',
    description: 'Model-Based RL with Latent Dynamics - TD-MPC v2',
    models: MODELS_CATALOG.filter(m => m.family === 'TD-MPC2'),
  },
  {
    name: 'VideoMAE',
    description: 'Masked Autoencoders for Video Pre-training',
    models: MODELS_CATALOG.filter(m => m.family === 'VideoMAE'),
  },
  {
    name: 'MAE',
    description: 'Masked Autoencoders for Vision - Facebook Research',
    models: MODELS_CATALOG.filter(m => m.family === 'MAE'),
  },
  {
    name: 'World Models (Ha & Schmidhuber)',
    description: 'Original World Models (2018) - VAE + MDN-RNN + Controller',
    models: MODELS_CATALOG.filter(m => m.family === 'World Models (Ha & Schmidhuber)'),
  },
];

/**
 * Get all models belonging to a specific family
 */
export function getModelsByFamily(familyName: string): ModelSpec[] {
  return MODELS_CATALOG.filter(model => model.family === familyName);
}

/**
 * Get a model by its ID
 */
export function getModelById(id: string): ModelSpec | undefined {
  return MODELS_CATALOG.find(model => model.id === id);
}

/**
 * Get all models compatible with a specific test
 */
export function getModelsByTest(testId: string): ModelSpec[] {
  return MODELS_CATALOG.filter(model => model.compatible_tests.includes(testId));
}

/**
 * Get all models with a specific execution tier
 */
export function getModelsByTier(tier: ExecutionTier): ModelSpec[] {
  return MODELS_CATALOG.filter(model => model.execution_tier === tier);
}

/**
 * Get all unique execution tiers
 */
export function getExecutionTiers(): ExecutionTier[] {
  return ['live', 'job_async', 'archived_kaggle'];
}

/**
 * Get all unique families
 */
export function getFamilyNames(): string[] {
  return FAMILIES.map(f => f.name);
}