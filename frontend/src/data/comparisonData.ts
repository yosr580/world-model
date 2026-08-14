/**
 * Comparison Data for World Models Test Lab
 * Defines comparison sets for benchmarking models against each other.
 */

import type { ComparisonSet } from './types';

export const COMPARISON_SETS: ComparisonSet[] = [
  {
    id: 'clip_vs_dinov2',
    name: 'CLIP vs DINOv2 - Vision Foundation Models',
    description: 'Compare OpenAI CLIP and Facebook DINOv2 on representation quality, zero-shot classification, and retrieval tasks.',
    model_ids: ['clip_vit_base_patch16', 'dinov2_base'],
    test_ids: ['T1', 'T3', 'T5', 'T6', 'T7'],
    metric: 'accuracy',
  },
  {
    id: 'jepa_family',
    name: 'JEPA Family Comparison',
    description: 'Compare I-JEPA (image) and V-JEPA2 (video) on masked reconstruction, temporal consistency, and prediction tasks.',
    model_ids: ['ijepa_vitb16_1k', 'vjepa2_vitl_fpc64_256'],
    test_ids: ['T1', 'T2', 'T3', 'T4', 'T5', 'T8', 'T9'],
    metric: 'accuracy',
  },
  {
    id: 'video_generation_models',
    name: 'Video Generation World Models',
    description: 'Compare NVIDIA Cosmos, Sana, and SEED on video generation quality and action-conditioned generation.',
    model_ids: ['nvidia_cosmos3_edge', 'nvidia_sana_wm', 'seed'],
    test_ids: ['T8', 'T9', 'T10', 'T13', 'T14'],
    metric: 'fvd',
  },
  {
    id: 'model_based_rl',
    name: 'Model-Based RL World Models',
    description: 'Compare DreamerV3, TD-MPC2, and original World Models on latent dynamics prediction and planning.',
    model_ids: ['dreamerv3', 'tdmpc2', 'world_models_ha_schmidhuber'],
    test_ids: ['T9', 'T11', 'T12'],
    metric: 'accuracy',
  },
  {
    id: 'live_inference_models',
    name: 'Live Inference Models (Real-time)',
    description: 'Compare models that support live inference tier on standard benchmarks.',
    model_ids: ['clip_vit_base_patch16', 'dinov2_base', 'ijepa_vitb16_1k', 'videomae_base', 'vit_mae_base'],
    test_ids: ['T1', 'T3', 'T5', 'T6', 'T7', 'T8'],
    metric: 'latency',
  },
  {
    id: 'masked_autoencoders',
    name: 'Masked Autoencoder Family',
    description: 'Compare MAE, VideoMAE, I-JEPA, V-JEPA2, and SEED on masked reconstruction quality.',
    model_ids: ['vit_mae_base', 'videomae_base', 'ijepa_vitb16_1k', 'vjepa2_vitl_fpc64_256', 'seed'],
    test_ids: ['T1', 'T2', 'T3', 'T4', 'T5', 'T7'],
    metric: 'psnr',
  },
  {
    id: 'nvidia_physical_ai',
    name: 'NVIDIA Physical AI Models',
    description: 'Compare Cosmos and Sana world foundation models for Physical AI applications.',
    model_ids: ['nvidia_cosmos3_edge', 'nvidia_sana_wm'],
    test_ids: ['T8', 'T9', 'T10', 'T13', 'T14'],
    metric: 'fvd',
  },
  {
    id: 'all_open_weight',
    name: 'All Open-Weight Models',
    description: 'Comprehensive comparison of all open-weight models across all compatible tests.',
    model_ids: [
      'clip_vit_base_patch16',
      'dinov2_base',
      'ijepa_vitb16_1k',
      'nvidia_cosmos3_edge',
      'nvidia_sana_wm',
      'seed',
      'videomae_base',
      'vit_mae_base',
      'vjepa2_vitl_fpc64_256',
    ],
    test_ids: ['T1', 'T3', 'T5', 'T7', 'T8'],
    metric: 'accuracy',
  },
  {
    id: 'execution_tier_comparison',
    name: 'Execution Tier Comparison',
    description: 'Compare model performance across different execution tiers (live vs job_async vs archived).',
    model_ids: [
      'clip_vit_base_patch16',      // live
      'vjepa2_vitl_fpc64_256',      // job_async
      'dreamerv3',                   // archived_kaggle
    ],
    test_ids: ['T1', 'T8'],
    metric: 'latency',
  },
];

/**
 * Get a comparison set by its ID
 */
export function getComparisonSetById(id: string): ComparisonSet | undefined {
  return COMPARISON_SETS.find(set => set.id === id);
}

/**
 * Get all comparison sets that include a specific model
 */
export function getComparisonSetsByModel(modelId: string): ComparisonSet[] {
  return COMPARISON_SETS.filter(set => set.model_ids.includes(modelId));
}

/**
 * Get all comparison sets that include a specific test
 */
export function getComparisonSetsByTest(testId: string): ComparisonSet[] {
  return COMPARISON_SETS.filter(set => set.test_ids.includes(testId));
}

/**
 * Get all unique metrics used in comparison sets
 */
export function getComparisonMetrics(): ComparisonSet['metric'][] {
  return ['accuracy', 'latency', 'memory', 'fvd', 'psnr', 'ssim'];
}