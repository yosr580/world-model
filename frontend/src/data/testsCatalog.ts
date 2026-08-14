/**
 * Test Catalog for World Models Test Lab
 * Defines all available tests, their categories, compatible model families, and execution requirements.
 */

import type { TestDefinition, ExecutionTier } from './types';

export const TESTS_CATALOG: TestDefinition[] = [
  // Structure & Representation Tests
  {
    id: 'T1',
    name: 'Structure Gap Analysis',
    description: 'Measures the structural similarity between encoded representations and ground truth using linear probing and representation alignment metrics.',
    category: 'structure',
    compatible_families: ['CLIP', 'DINOv2', 'JEPA', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live', 'job_async'],
    estimated_duration_seconds: 30,
    requires_gpu: true,
  },
  {
    id: 'T2',
    name: 'Temporal Consistency',
    description: 'Evaluates whether video representations maintain temporal coherence across frames using frame-to-frame similarity and motion consistency metrics.',
    category: 'structure',
    compatible_families: ['JEPA', 'SEED', 'VideoMAE'],
    compatible_tiers: ['live', 'job_async'],
    estimated_duration_seconds: 45,
    requires_gpu: true,
  },
  {
    id: 'T3',
    name: 'Semantic Alignment',
    description: 'Tests alignment between visual representations and semantic concepts using zero-shot classification and retrieval benchmarks.',
    category: 'structure',
    compatible_families: ['CLIP', 'DINOv2', 'JEPA', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live'],
    estimated_duration_seconds: 60,
    requires_gpu: true,
  },
  {
    id: 'T4',
    name: 'Masked Reconstruction Quality',
    description: 'Measures reconstruction fidelity under various masking strategies (random, block, temporal) for masked autoencoder models.',
    category: 'representation',
    compatible_families: ['JEPA', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live', 'job_async'],
    estimated_duration_seconds: 120,
    requires_gpu: true,
  },
  {
    id: 'T5',
    name: 'Feature Space Geometry',
    description: 'Analyzes the geometric properties of the learned feature space including clustering, separability, and manifold structure.',
    category: 'representation',
    compatible_families: ['CLIP', 'DINOv2', 'JEPA', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live'],
    estimated_duration_seconds: 45,
    requires_gpu: false,
  },
  {
    id: 'T6',
    name: 'Cross-Modal Retrieval',
    description: 'Evaluates cross-modal retrieval performance (image-to-text, text-to-image, video-to-text) for multimodal models.',
    category: 'representation',
    compatible_families: ['CLIP', 'JEPA', 'SEED', 'VideoMAE'],
    compatible_tiers: ['live'],
    estimated_duration_seconds: 90,
    requires_gpu: true,
  },
  {
    id: 'T7',
    name: 'Linear Probe Classification',
    description: 'Standard linear probing benchmark on downstream classification tasks (ImageNet, Kinetics, etc.) to measure representation quality.',
    category: 'representation',
    compatible_families: ['CLIP', 'DINOv2', 'JEPA', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live', 'job_async'],
    estimated_duration_seconds: 180,
    requires_gpu: true,
  },

  // Prediction & Generation Tests
  {
    id: 'T8',
    name: 'Next-Frame Prediction',
    description: 'Evaluates next-frame prediction quality using FVD, PSNR, and SSIM metrics on standard video prediction benchmarks.',
    category: 'prediction',
    compatible_families: ['CLIP', 'DINOv2', 'JEPA', 'Cosmos', 'Sana', 'SEED', 'VideoMAE', 'MAE'],
    compatible_tiers: ['live', 'job_async'],
    estimated_duration_seconds: 120,
    requires_gpu: true,
  },
  {
    id: 'T9',
    name: 'Latent Dynamics Prediction',
    description: 'Tests long-horizon latent state prediction for world models with explicit dynamics models (Dreamer, TD-MPC2, SEED, V-JEPA2, Cosmos, Sana).',
    category: 'prediction',
    compatible_families: ['Dreamer', 'TD-MPC2', 'SEED', 'JEPA', 'Cosmos', 'Sana'],
    compatible_tiers: ['job_async', 'archived_kaggle'],
    estimated_duration_seconds: 300,
    requires_gpu: true,
  },

  // Action & Planning Tests
  {
    id: 'T10',
    name: 'Action-Conditioned Generation',
    description: 'Evaluates video generation conditioned on action sequences for interactive world models.',
    category: 'action',
    compatible_families: ['Cosmos', 'Sana', 'SEED'],
    compatible_tiers: ['job_async'],
    estimated_duration_seconds: 240,
    requires_gpu: true,
  },
  {
    id: 'T11',
    name: 'Counterfactual Reasoning',
    description: 'Tests the ability to reason about alternative outcomes given different action choices.',
    category: 'action',
    compatible_families: ['Dreamer', 'TD-MPC2', 'SEED', 'Cosmos', 'Sana'],
    compatible_tiers: ['job_async', 'archived_kaggle'],
    estimated_duration_seconds: 300,
    requires_gpu: true,
  },
  {
    id: 'T12',
    name: 'Action Planning & Control',
    description: 'Measures planning and control performance in simulated environments using model-predictive control or policy evaluation.',
    category: 'action',
    compatible_families: ['Dreamer', 'TD-MPC2', 'World Models (Ha & Schmidhuber)'],
    compatible_tiers: ['archived_kaggle'],
    estimated_duration_seconds: 600,
    requires_gpu: true,
  },

  // Generation Tests
  {
    id: 'T13',
    name: 'Unconditional Video Generation',
    description: 'Evaluates unconditional video generation quality using FVD on standard benchmarks (UCF101, Kinetics).',
    category: 'generation',
    compatible_families: ['Cosmos', 'Sana', 'SEED', 'VideoMAE'],
    compatible_tiers: ['job_async'],
    estimated_duration_seconds: 300,
    requires_gpu: true,
  },
  {
    id: 'T14',
    name: 'Text-to-Video Generation',
    description: 'Measures text-to-video generation quality and prompt adherence using human evaluation and automated metrics.',
    category: 'generation',
    compatible_families: ['Cosmos', 'Sana', 'SEED'],
    compatible_tiers: ['job_async'],
    estimated_duration_seconds: 300,
    requires_gpu: true,
  },
];

/**
 * Get a test by its ID
 */
export function getTestById(id: string): TestDefinition | undefined {
  return TESTS_CATALOG.find(test => test.id === id);
}

/**
 * Get all tests in a specific category
 */
export function getTestsByCategory(category: TestDefinition['category']): TestDefinition[] {
  return TESTS_CATALOG.filter(test => test.category === category);
}

/**
 * Get all tests compatible with a model family
 */
export function getTestsByFamily(familyName: string): TestDefinition[] {
  return TESTS_CATALOG.filter(test => test.compatible_families.includes(familyName));
}

/**
 * Get all tests compatible with an execution tier
 */
export function getTestsByTier(tier: ExecutionTier): TestDefinition[] {
  return TESTS_CATALOG.filter(test => test.compatible_tiers.includes(tier));
}

/**
 * Get all unique test categories
 */
export function getTestCategories(): TestDefinition['category'][] {
  return ['structure', 'prediction', 'representation', 'action', 'generation'];
}

/**
 * Get all unique execution tiers from tests
 */
export function getTestTiers(): ExecutionTier[] {
  return ['live', 'job_async', 'archived_kaggle'];
}