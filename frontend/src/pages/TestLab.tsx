// src/pages/TestLab.tsx
//
// VERSION 100% AUTONOME — UN SEUL FICHIER.
// Aucun import autre que React. Aucun fetch, aucune API, aucune DB,
// aucune image chargée depuis une URL externe (remplacée par un SVG
// généré localement). Tout — types, catalogue de modèles, catalogue de
// tests, données de comparaison, démo de masking, tableau de comparaison —
// est défini dans ce seul fichier.
//
// Pour l'utiliser : remplace intégralement le contenu de
// src/pages/TestLab.tsx par ce fichier. Rien d'autre à créer, rien
// d'autre à importer.

import { useMemo, useState } from 'react'

// =====================================================================
// TYPES (inline, plus besoin de src/data/types.ts)
// =====================================================================

type ModelFamily = 'jepa' | 'mae' | 'clip' | 'dinov2' | 'world-models' | 'dreamer' | 'tdmpc' | 'cosmos' | 'genie'

type ExecutionTier = 'live_demo' | 'kaggle_notebook' | 'external_repo' | 'closed_preview'

interface FamilyMeta {
  id: ModelFamily
  label: string
  tagline: string
  color: string
  bg: string
}

interface LinkRef {
  label: string
  url: string
}

interface ModelParams {
  totalParamsM?: number
  hiddenSize?: number
  numLayers?: number
  numHeads?: number
  patchSize?: number
  tubeletSize?: number
  imageSize?: number
  note?: string
}

interface ModelSpec {
  id: string
  family: ModelFamily
  name: string
  subtitle: string
  description: string
  trainingObjective: string
  paperUrl: string
  codeUrl?: string
  projectUrl?: string
  extraLinks?: LinkRef[]
  params?: ModelParams
  executionTier: ExecutionTier
  compatibleTests: string[]
  kaggleNotebooks?: LinkRef[]
  verified: boolean
}

type VisualizationKind = 'masking-demo' | 'similarity-heatmap' | 'robustness-sweep' | 'pca-scatter' | 'comparison-table' | 'conceptual'

interface TestResultDatum {
  label: string
  value: string
  sourceNote?: string
}

interface TestDefinition {
  id: string
  title: string
  shortDescription: string
  longDescription: string
  visualization: VisualizationKind
  measuredResults?: TestResultDatum[]
}

interface ComparisonRow {
  metric: string
  values: Record<string, string>
  winner?: string
  note?: string
}

interface ComparisonSet {
  id: string
  title: string
  models: string[]
  sourceNotebook: LinkRef
  rows: ComparisonRow[]
}

type MaskMode = 'ijepa-block' | 'vjepa2-tube' | 'mae-random' | 'videomae-random' | 'beit-random' | 'dinov2-multicrop'

// =====================================================================
// DONNÉES — FAMILLES
// =====================================================================

const FAMILIES: FamilyMeta[] = [
  { id: 'jepa', label: 'JEPA', tagline: 'Prédiction de représentations masquées (jamais de pixels)', color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
  { id: 'mae', label: 'MAE', tagline: 'Autoencodeurs masqués — reconstruction de pixels', color: 'text-orange-300', bg: 'bg-orange-500/15' },
  { id: 'clip', label: 'CLIP', tagline: 'Alignement contrastif image-texte', color: 'text-rose-300', bg: 'bg-rose-500/15' },
  { id: 'dinov2', label: 'DINOv2', tagline: 'Self-distillation multi-crop, correspondance dense émergente', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  { id: 'world-models', label: 'World Models (VAE-RNN-Controller)', tagline: 'VAE + MDN-RNN + contrôleur linéaire, Ha & Schmidhuber 2018', color: 'text-violet-300', bg: 'bg-violet-500/15' },
  { id: 'dreamer', label: 'Dreamer', tagline: 'Acteur-critique entraîné par imagination latente (RSSM)', color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/15' },
  { id: 'tdmpc', label: 'TD-MPC', tagline: 'MPC decoder-free dans l\'espace latent', color: 'text-indigo-300', bg: 'bg-indigo-500/15' },
  { id: 'cosmos', label: 'Cosmos', tagline: 'Foundation models omnimodaux pour l\'IA physique (NVIDIA)', color: 'text-lime-300', bg: 'bg-lime-500/15' },
  { id: 'genie', label: 'Genie', tagline: 'Mondes 3D interactifs générés en temps réel (DeepMind)', color: 'text-sky-300', bg: 'bg-sky-500/15' },
]

// =====================================================================
// DONNÉES — MODÈLES
// =====================================================================

const MODELS: ModelSpec[] = [
  {
    id: 'ijepa-vitb16',
    family: 'jepa',
    name: 'I-JEPA',
    subtitle: 'ViT-B/16, ImageNet-1K',
    description:
      "Un encodeur de contexte voit un grand bloc visible de l'image ; un prédicteur devine, sans jamais voir les pixels, la représentation latente de 4 blocs cibles masqués (encodeur cible mis à jour par EMA). Aucune augmentation de données.",
    trainingObjective: 'Masked-latent regression (multi-block masking, EMA teacher, pas de reconstruction pixel)',
    paperUrl: 'https://arxiv.org/abs/2301.08243',
    codeUrl: 'https://github.com/facebookresearch/ijepa',
    params: { totalParamsM: 85.8, hiddenSize: 768, numLayers: 12, numHeads: 12, patchSize: 16, imageSize: 224 },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T2', 'T3', 'T5', 'T6', 'T7', 'T8'],
    kaggleNotebooks: [
      { label: 'I-JEPA Image Lab', url: 'https://www.kaggle.com/code/yosserjabloun/i-jepa-image-lab' },
      { label: 'Group A : I-JEPA vs MAE vs BEiT', url: 'https://www.kaggle.com/code/yosserjabloun/group-a-i-jepa-vs-mae-vs-beit' },
      { label: 'Group B : I-JEPA vs DINOv2 vs CLIP', url: 'https://www.kaggle.com/code/yosserjabloun/group-b-i-jepa-vs-dinov2-vs-clip' },
    ],
    verified: true,
  },
  {
    id: 'vjepa2-vitl',
    family: 'jepa',
    name: 'V-JEPA2',
    subtitle: 'ViT-L, 64 frames, 256px',
    description:
      "Masking multi-block étendu en tubes spatio-temporels (masks courts = union de 8 blocs ~15% ; masks longs = union de 2 blocs ~70%, ratio d'aspect 0.75-1.5). Le checkpoint contient encodeur ET vrai prédicteur.",
    trainingObjective: 'Masked-latent regression spatio-temporelle (tube masking, EMA teacher)',
    paperUrl: 'https://arxiv.org/abs/2506.09985',
    codeUrl: 'https://github.com/facebookresearch/vjepa2',
    params: { totalParamsM: 326.0, hiddenSize: 1024, numLayers: 24, numHeads: 16, patchSize: 16, tubeletSize: 2, imageSize: 256 },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T2', 'T3', 'T4', 'T8', 'T9', 'T12'],
    kaggleNotebooks: [
      { label: 'World Models Testing — V-JEPA2', url: 'https://www.kaggle.com/code/yosserjabloun/world-models-testing-v-jepa2' },
      { label: 'Comparaison (V-JEPA2 et modèles similaires)', url: 'https://www.kaggle.com/code/yosserjabloun/comparison-vjepa2-and-other-similar-models' },
    ],
    verified: true,
  },
  {
    id: 'vit-mae-base',
    family: 'mae',
    name: 'ViT-MAE',
    subtitle: 'base',
    description:
      "~75% des patches masqués aléatoirement (scatter). Un léger décodeur (8 couches, dim. 512) reconstruit les pixels bruts. Pas de teacher EMA, pas de prédicteur de représentations.",
    trainingObjective: 'Reconstruction pixel des patches masqués (masking ratio ~75%)',
    paperUrl: 'https://arxiv.org/abs/2111.06377',
    codeUrl: 'https://github.com/facebookresearch/mae',
    params: { totalParamsM: 111.9, hiddenSize: 768, numLayers: 12, numHeads: 12, patchSize: 16, imageSize: 224, note: 'encodeur 85.8M + décodeur ~26.1M' },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T2', 'T3', 'T5', 'T6', 'T8'],
    kaggleNotebooks: [{ label: 'Group A : I-JEPA vs MAE vs BEiT', url: 'https://www.kaggle.com/code/yosserjabloun/group-a-i-jepa-vs-mae-vs-beit' }],
    verified: true,
  },
  {
    id: 'videomae-base',
    family: 'mae',
    name: 'VideoMAE',
    subtitle: 'base',
    description: "Analogue vidéo de MAE : masque ~90% de tubes spatio-temporels, reconstruit les pixels via un décodeur. Pas de teacher EMA.",
    trainingObjective: 'Reconstruction pixel de tubes spatio-temporels masqués',
    paperUrl: 'https://arxiv.org/abs/2203.12602',
    codeUrl: 'https://github.com/MCG-NJU/VideoMAE',
    params: { totalParamsM: 86.2, hiddenSize: 768, numLayers: 12, numHeads: 12, patchSize: 16, tubeletSize: 2 },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T2', 'T3', 'T4', 'T8', 'T10'],
    kaggleNotebooks: [{ label: 'Comparaison (V-JEPA2 et modèles similaires)', url: 'https://www.kaggle.com/code/yosserjabloun/comparison-vjepa2-and-other-similar-models' }],
    verified: true,
  },
  {
    id: 'clip-vitb16',
    family: 'clip',
    name: 'CLIP',
    subtitle: 'ViT-B/16',
    description: "Alignement contrastif image-texte sur 400M paires. Pas de masking, pas de teacher EMA.",
    trainingObjective: 'Contrastive image-text alignment (400M paires)',
    paperUrl: 'https://arxiv.org/abs/2103.00020',
    codeUrl: 'https://github.com/openai/CLIP',
    params: { totalParamsM: 149.0, hiddenSize: 768, numLayers: 12, numHeads: 12, patchSize: 16, imageSize: 224, note: 'tour vision 85.8M + tour texte 63.2M' },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T3', 'T5', 'T6', 'T7', 'T8', 'T11'],
    kaggleNotebooks: [{ label: 'Group B : I-JEPA vs DINOv2 vs CLIP', url: 'https://www.kaggle.com/code/yosserjabloun/group-b-i-jepa-vs-dinov2-vs-clip' }],
    verified: true,
  },
  {
    id: 'dinov2-base',
    family: 'dinov2',
    name: 'DINOv2',
    subtitle: 'base',
    description: "Crops globaux + locaux, self-distillation (teacher EMA). Augmentation lourde. Correspondance dense émergente sans supervision.",
    trainingObjective: 'Self-distillation multi-crop, teacher EMA',
    paperUrl: 'https://arxiv.org/abs/2304.07193',
    codeUrl: 'https://github.com/facebookresearch/dinov2',
    params: { totalParamsM: 86.6, hiddenSize: 768, numLayers: 12, numHeads: 12, patchSize: 14, imageSize: 224 },
    executionTier: 'kaggle_notebook',
    compatibleTests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    kaggleNotebooks: [
      { label: 'Group B : I-JEPA vs DINOv2 vs CLIP', url: 'https://www.kaggle.com/code/yosserjabloun/group-b-i-jepa-vs-dinov2-vs-clip' },
      { label: 'Comparaison (V-JEPA2 et modèles similaires)', url: 'https://www.kaggle.com/code/yosserjabloun/comparison-vjepa2-and-other-similar-models' },
    ],
    verified: true,
  },
  {
    id: 'world-models-2018',
    family: 'world-models',
    name: 'World Models',
    subtitle: 'Ha & Schmidhuber (2018)',
    description:
      "VAE convolutionnel (z, dim. 32) + MDN-RNN (256 unités, 5 mixtures) + contrôleur linéaire (≈867 paramètres, CMA-ES). Le contrôleur peut être entraîné entièrement 'dans le rêve' du RNN.",
    trainingObjective: 'VAE (reconstruction pixel) + MDN-RNN (dynamique latente) + contrôleur évolutif (CMA-ES)',
    paperUrl: 'https://arxiv.org/abs/1803.10122',
    projectUrl: 'https://worldmodels.github.io/',
    params: { note: 'VAE z=32 ; MDN-RNN 256 unités / 5 mixtures ; contrôleur ≈867 paramètres (CarRacing-v0)' },
    executionTier: 'external_repo',
    compatibleTests: ['WM1'],
    verified: true,
  },
  {
    id: 'dreamerv3',
    family: 'dreamer',
    name: 'DreamerV3',
    subtitle: '—',
    description: "World model récurrent (RSSM) + acteur-critique entraîné par imagination latente. Un seul jeu d'hyperparamètres sur >150 tâches, dont Minecraft (diamant) from scratch.",
    trainingObjective: 'RSSM + acteur-critique entraîné dans l\'imagination latente',
    paperUrl: 'https://arxiv.org/abs/2301.04104',
    codeUrl: 'https://github.com/danijar/dreamerv3',
    params: { note: 'de 8M (XS) à 200M (XL) de paramètres selon la taille' },
    executionTier: 'external_repo',
    compatibleTests: ['WM2'],
    verified: true,
  },
  {
    id: 'tdmpc2',
    family: 'tdmpc',
    name: 'TD-MPC2',
    subtitle: '—',
    description: "MPC dans un espace latent appris, sans décodeur pixel (decoder-free). Policy prior pour guider la recherche d'actions. 104 tâches, un seul jeu d'hyperparamètres.",
    trainingObjective: 'Dynamique latente + MPC guidé par policy prior, multi-tâches',
    paperUrl: 'https://arxiv.org/abs/2310.16828',
    projectUrl: 'https://www.nicklashansen.com/td-mpc2',
    params: { note: '5 tailles : 5M / 19M / 48M / 140M / 317M' },
    executionTier: 'external_repo',
    compatibleTests: ['WM3'],
    verified: true,
  },
  {
    id: 'cosmos3-nano-edge',
    family: 'cosmos',
    name: 'Cosmos 3',
    subtitle: 'Edge / Nano (NVIDIA)',
    description:
      "Omnimodel mixture-of-transformers (raisonneur autorégressif + diffusion), lancé le 1er juin 2026. Nano (16B) / Super (64B) initialisés depuis Qwen3-VL ; Edge (4B, from scratch, 20 juillet 2026) tourne en temps réel (15Hz, 640x360) sur Jetson Thor.",
    trainingObjective: 'Pré-entraînement omnimodal (vidéo/image/texte/action) sur données physiques',
    paperUrl: 'https://arxiv.org/abs/2501.03575',
    codeUrl: 'https://github.com/nvidia-cosmos',
    extraLinks: [{ label: 'Cosmos 3 Edge sur Hugging Face', url: 'https://huggingface.co/blog/nvidia/cosmos3edge' }],
    params: { note: 'Nano 16B / Super 64B (init. Qwen3-VL) ; Edge 4B dont 2B raisonneur dense' },
    executionTier: 'external_repo',
    compatibleTests: ['WM4'],
    verified: true,
  },
  {
    id: 'sana-wm',
    family: 'cosmos',
    name: 'SANA-WM',
    subtitle: 'famille Cosmos (NVIDIA)',
    description: "Variante annoncée de la famille Cosmos. Informations non vérifiées de façon indépendante — à confirmer avant de publier des chiffres précis.",
    trainingObjective: 'À vérifier',
    paperUrl: 'https://arxiv.org/abs/2605.15178',
    projectUrl: 'https://nvlabs.github.io/Sana/WM',
    executionTier: 'external_repo',
    compatibleTests: [],
    verified: false,
  },
  {
    id: 'genie3',
    family: 'genie',
    name: 'Genie 3',
    subtitle: 'Google DeepMind',
    description:
      "Monde 3D interactif temps réel généré à partir d'un prompt texte, 20-24 fps, 720p, cohérent sur plusieurs minutes. Fermé : aucun poids ni code public, accès uniquement via preview (Project Genie, US).",
    trainingObjective: 'Génération vidéo autorégressive conditionnée par actions',
    paperUrl: 'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/',
    projectUrl: 'https://deepmind.google/models/genie/',
    executionTier: 'closed_preview',
    compatibleTests: ['WM5'],
    verified: true,
  },
]

// =====================================================================
// DONNÉES — TESTS
// =====================================================================

const TESTS: Record<string, TestDefinition> = {
  T1: {
    id: 'T1',
    title: "Légitimité d'entraînement — structure réelle vs bruit",
    shortDescription: 'Le modèle voit-il une vraie structure, ou est-il non entraîné ?',
    longDescription:
      "Matrice de similarité cosinus patch-à-patch sur une vraie photo vs sur du bruit gaussien pur. Un encodeur entraîné produit une matrice plus structurée sur la photo.",
    visualization: 'similarity-heatmap',
    measuredResults: [
      { label: 'I-JEPA (ViT-B/16)', value: '+0.0068', sourceNote: 'Group A & B' },
      { label: 'V-JEPA2 (ViT-L)', value: '−0.339', sourceNote: 'Comparaison V-JEPA2/VideoMAE/DINOv2' },
      { label: 'MAE (ViT base)', value: '−0.274', sourceNote: 'Group A' },
      { label: 'DINOv2 (base)', value: '−0.488 / −0.028 selon set', sourceNote: 'Group A vs Group B' },
      { label: 'CLIP (ViT-B/16)', value: '−0.028', sourceNote: 'Group B' },
    ],
  },
  T2: {
    id: 'T2',
    title: 'Visualisation du masking',
    shortDescription: "À quoi ressemble le masque d'entraînement sur une image ?",
    longDescription: "Rejoue l'algorithme de masking exact du papier (mêmes ratios, mêmes formes de blocs) sur une image de démo générée localement. Aucune inférence.",
    visualization: 'masking-demo',
  },
  T3: {
    id: 'T3',
    title: "Robustesse à l'occlusion spatiale",
    shortDescription: "L'embedding reste-t-il stable si une partie de l'image est masquée ?",
    longDescription: 'Occlusion progressive (0-90%) et mesure de similarité cosinus à l\'embedding propre.',
    visualization: 'robustness-sweep',
    measuredResults: [
      { label: 'I-JEPA @ 50% / 90% occlusion', value: '0.998 / 0.993', sourceNote: 'Group A' },
      { label: 'MAE @ 50% / 90%', value: '0.860 / 0.673', sourceNote: 'Group A' },
      { label: 'DINOv2 @ 50% / 90%', value: '0.888 / −0.015', sourceNote: 'Group B' },
      { label: 'CLIP @ 50% / 90%', value: '0.819 / 0.440', sourceNote: 'Group B' },
      { label: 'V-JEPA2 @ 50%', value: '0.839', sourceNote: 'Comparaison vidéo' },
    ],
  },
  T4: {
    id: 'T4',
    title: 'Robustesse au frame-dropout temporel',
    shortDescription: 'Pour les modèles vidéo : effet de frames supprimées.',
    longDescription: 'Suppression croissante de frames du clip, mesure de dérive de l\'embedding pooled.',
    visualization: 'robustness-sweep',
    measuredResults: [
      { label: 'V-JEPA2 @ 50% frames droppées', value: '0.907', sourceNote: 'Comparaison vidéo' },
      { label: 'VideoMAE @ 50%', value: '0.886', sourceNote: 'Comparaison vidéo' },
      { label: 'DINOv2 (frame-wise) @ 50%', value: '1.000 (insensible, 1 seule frame vue)', sourceNote: 'Comparaison vidéo' },
    ],
  },
  T5: {
    id: 'T5',
    title: 'Robustesse au flou / bruit',
    shortDescription: "L'augmentation lourde à l'entraînement (DINOv2) se voit-elle au test ?",
    longDescription: 'Flou gaussien croissant (kernel 1 à 23) sur la même photo.',
    visualization: 'robustness-sweep',
    measuredResults: [
      { label: 'I-JEPA @ flou fort', value: '0.9995', sourceNote: 'Group B' },
      { label: 'DINOv2 @ flou fort', value: '0.442', sourceNote: 'Group B' },
      { label: 'CLIP @ flou fort', value: '0.500', sourceNote: 'Group B' },
    ],
  },
  T6: {
    id: 'T6',
    title: 'Séparation sémantique',
    shortDescription: 'Deux images de contenu différent sont-elles bien séparées ?',
    longDescription: 'Cosinus centré entre deux embeddings pooled de contenu différent. Valeur basse = bonne séparation.',
    visualization: 'pca-scatter',
    measuredResults: [
      { label: 'I-JEPA (Group A / Group B)', value: '−0.007 / −0.115' },
      { label: 'DINOv2 (Group B)', value: '−0.229' },
      { label: 'CLIP vision (Group B)', value: '−0.341' },
    ],
  },
  T7: {
    id: 'T7',
    title: 'Correspondance dense cross-image',
    shortDescription: 'Un patch "tête" retrouve-t-il un patch "tête" dans une autre photo ?',
    longDescription: "Patch requête sur une image, recherche des k plus proches en cosinus dans une image différente. Test signature de DINOv2.",
    visualization: 'pca-scatter',
  },
  T8: {
    id: 'T8',
    title: 'Type de sortie (continu / pixels / tokens)',
    shortDescription: 'Que retourne réellement le modèle ?',
    longDescription: 'I-JEPA/DINOv2/CLIP/V-JEPA2 : vecteur continu. MAE/VideoMAE : pixels reconstruits. BEiT : tokens discrets (vocab. 8192).',
    visualization: 'comparison-table',
  },
  T9: {
    id: 'T9',
    title: 'Prédiction latente du futur',
    shortDescription: "Le prédicteur devine-t-il des frames jamais vues ?",
    longDescription: "Split temporel 70/30 : le vrai prédicteur de V-JEPA2 devine la représentation du futur à partir du passé.",
    visualization: 'robustness-sweep',
    measuredResults: [
      { label: 'V-JEPA2 — cosinus prédit vs réel (apparié)', value: '0.523', sourceNote: 'V-JEPA2 corrigé, section 8' },
      { label: 'V-JEPA2 — baseline shuffled', value: '0.396', sourceNote: 'contrôle : preuve d\'une prédiction spécifique' },
    ],
  },
  T10: {
    id: 'T10',
    title: 'Reconstruction pixel du futur',
    shortDescription: 'Pour VideoMAE : qualité de reconstruction des dernières frames.',
    longDescription: 'Masquage des 30% derniers groupes temporels, erreur de reconstruction pixel (MSE).',
    visualization: 'robustness-sweep',
    measuredResults: [{ label: 'VideoMAE — MSE reconstruction futur', value: '1.014', sourceNote: 'Comparaison vidéo, section 10' }],
  },
  T11: {
    id: 'T11',
    title: 'Alignement texte-image',
    shortDescription: 'Le modèle classe-t-il la bonne légende parmi plusieurs ?',
    longDescription: 'Spécifique à CLIP. I-JEPA/DINOv2/V-JEPA2 n\'ont pas de tour texte : test non applicable.',
    visualization: 'comparison-table',
  },
  T12: {
    id: 'T12',
    title: 'Planification / action-conditionnée',
    shortDescription: 'Le modèle conditionne-t-il ses prédictions sur une action ?',
    longDescription: 'V-JEPA2-AC : checkpoint post-entraîné sur données robotiques réelles. Cœur de DreamerV3/TD-MPC2/Cosmos.',
    visualization: 'conceptual',
  },
  WM1: {
    id: 'WM1',
    title: 'Boucle perception → mémoire → contrôle',
    shortDescription: "De l'observation brute à l'action, étape par étape.",
    longDescription: 'VAE (z, dim. 32) → MDN-RNN (256 unités, 5 mixtures) → contrôleur linéaire (≈867 paramètres, CMA-ES), entraînable "dans le rêve".',
    visualization: 'conceptual',
    measuredResults: [
      { label: 'Latent z (VAE)', value: '32 dimensions' },
      { label: 'MDN-RNN', value: '256 unités cachées, 5 mixtures gaussiennes' },
      { label: 'Contrôleur (CarRacing-v0)', value: '≈867 paramètres, CMA-ES' },
    ],
  },
  WM2: {
    id: 'WM2',
    title: 'Imagination latente (rollout rêvé)',
    shortDescription: "L'agent s'entraîne-t-il en imaginant des trajectoires ?",
    longDescription: 'DreamerV3 : RSSM + acteur-critique entraîné sur trajectoires imaginées. Un seul jeu d\'hyperparamètres sur >150 tâches.',
    visualization: 'conceptual',
    measuredResults: [
      { label: 'Tailles de modèle', value: '8M (XS) à 200M (XL)' },
      { label: 'Résultat signature', value: 'diamant Minecraft, from scratch' },
    ],
  },
  WM3: {
    id: 'WM3',
    title: "MPC dans l'espace latent",
    shortDescription: "Planification sans reconstruction pixel.",
    longDescription: 'TD-MPC2 : dynamique latente + MPC guidé par policy prior, decoder-free, 104 tâches.',
    visualization: 'conceptual',
    measuredResults: [
      { label: 'Tailles de modèle', value: '5M / 19M / 48M / 140M / 317M' },
      { label: 'Décodeur pixel', value: 'aucun (decoder-free)' },
    ],
  },
  WM4: {
    id: 'WM4',
    title: 'Génération vidéo + action temps réel (Cosmos 3)',
    shortDescription: 'Vidéo physiquement plausible + commandes robot en temps réel.',
    longDescription: 'Cosmos 3 : mixture-of-transformers, tours autorégressive + diffusion. Edge tourne à 15Hz sur Jetson Thor.',
    visualization: 'conceptual',
    measuredResults: [
      { label: 'Nano / Super', value: '16B / 64B, sortis le 31 mai 2026' },
      { label: 'Edge', value: '4B (2B raisonneur dense), from scratch, 20 juillet 2026' },
      { label: 'Cadence Edge', value: '15 Hz, 640x360, 32 actions/inférence' },
    ],
  },
  WM5: {
    id: 'WM5',
    title: 'Monde 3D interactif temps réel (Genie 3)',
    shortDescription: "Génération d'un monde explorable en réaction aux actions.",
    longDescription: 'Genie 3 : autorégressif, 20-24 fps, 720p, cohérence de quelques minutes. Fermé, pas de poids publics.',
    visualization: 'conceptual',
    measuredResults: [
      { label: 'Cadence / résolution', value: '20-24 fps, 720p' },
      { label: 'Ouverture', value: 'fermé — aucun poids ni code public' },
    ],
  },
}

// =====================================================================
// DONNÉES — COMPARAISONS
// =====================================================================

const COMPARISONS: ComparisonSet[] = [
  {
    id: 'group-a',
    title: 'I-JEPA vs MAE vs BEiT',
    models: ['I-JEPA', 'MAE', 'BEiT'],
    sourceNotebook: { label: 'Group A', url: 'https://www.kaggle.com/code/yosserjabloun/group-a-i-jepa-vs-mae-vs-beit' },
    rows: [
      { metric: 'Paramètres, encodeur (M)', values: { 'I-JEPA': '85.8', MAE: '85.8', BEiT: '85.7' } },
      { metric: 'Structure gap photo − bruit', values: { 'I-JEPA': '+0.0068', MAE: '−0.2745', BEiT: '−0.3438' }, winner: 'I-JEPA' },
      { metric: 'cos-sim @ 50% occlusion', values: { 'I-JEPA': '0.9982', MAE: '0.8602', BEiT: '0.9077' }, winner: 'I-JEPA' },
      { metric: 'cos-sim @ 90% occlusion', values: { 'I-JEPA': '0.9930', MAE: '0.6733', BEiT: '0.7540' }, winner: 'I-JEPA' },
      { metric: 'Sortie native', values: { 'I-JEPA': 'embeddings continus', MAE: 'pixels reconstruits', BEiT: 'tokens discrets' }, note: 'catégoriquement différent' },
    ],
  },
  {
    id: 'group-b',
    title: 'I-JEPA vs DINOv2 vs CLIP',
    models: ['I-JEPA', 'DINOv2', 'CLIP'],
    sourceNotebook: { label: 'Group B', url: 'https://www.kaggle.com/code/yosserjabloun/group-b-i-jepa-vs-dinov2-vs-clip' },
    rows: [
      { metric: 'Paramètres, tour vision (M)', values: { 'I-JEPA': '85.8', DINOv2: '86.6', CLIP: '85.8' } },
      { metric: 'Tour texte (M)', values: { 'I-JEPA': 'aucune', DINOv2: 'aucune', CLIP: '63.2' } },
      { metric: 'Structure gap photo − bruit', values: { 'I-JEPA': '+0.0068', DINOv2: '−0.4881', CLIP: '−0.0279' }, winner: 'I-JEPA' },
      { metric: 'cos-sim @ 90% occlusion', values: { 'I-JEPA': '0.4400', DINOv2: '−0.0155', CLIP: '0.4400' }, winner: 'I-JEPA' },
      { metric: 'Alignement texte-image', values: { 'I-JEPA': 'non applicable', DINOv2: 'non applicable', CLIP: 'oui' }, note: 'gap structurel' },
    ],
  },
  {
    id: 'video-comparison',
    title: 'V-JEPA2 vs VideoMAE vs DINOv2 (frame-wise)',
    models: ['V-JEPA2', 'VideoMAE', 'DINOv2'],
    sourceNotebook: { label: 'Comparaison V-JEPA2', url: 'https://www.kaggle.com/code/yosserjabloun/comparison-vjepa2-and-other-similar-models' },
    rows: [
      { metric: 'Paramètres (M)', values: { 'V-JEPA2': '326.0', VideoMAE: '86.2', DINOv2: '86.6' } },
      { metric: 'Modélisation temporelle native ?', values: { 'V-JEPA2': 'oui', VideoMAE: 'oui', DINOv2: 'non' } },
      { metric: 'cos-sim @ 50% frame-dropout', values: { 'V-JEPA2': '0.9067', VideoMAE: '0.8864', DINOv2: '1.0000' }, winner: 'DINOv2', note: 'DINOv2 insensible car frame-wise' },
      { metric: 'Prédiction latente du futur', values: { 'V-JEPA2': 'oui (cos=0.523)', VideoMAE: 'adapté, pixel (MSE=1.01)', DINOv2: 'non applicable' }, note: 'unités différentes' },
    ],
  },
]

// =====================================================================
// GÉNÉRATION DE MASQUES (algorithmes réels des notebooks)
// =====================================================================

interface Block {
  top: number
  left: number
  h: number
  w: number
}

function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

function sampleBlock(gridSize: number, scaleRange: [number, number], arRange: [number, number]): Block {
  const total = gridSize * gridSize
  const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0])
  const ar = arRange[0] + Math.random() * (arRange[1] - arRange[0])
  const area = scale * total
  const h = Math.min(Math.max(Math.round(Math.sqrt(area / ar)), 1), gridSize)
  const w = Math.min(Math.max(Math.round(Math.sqrt(area * ar)), 1), gridSize)
  return { top: randInt(gridSize - h + 1), left: randInt(gridSize - w + 1), h, w }
}

function blockCells(b: Block, gridSize: number): Set<number> {
  const s = new Set<number>()
  for (let r = b.top; r < b.top + b.h; r++) for (let c = b.left; c < b.left + b.w; c++) s.add(r * gridSize + c)
  return s
}

function generateIJepaMask(gridSize: number) {
  let context: Set<number>
  let targetUnion: Set<number>
  do {
    const targetBlocks = Array.from({ length: 4 }, () => sampleBlock(gridSize, [0.15, 0.2], [0.75, 1.5]))
    targetUnion = new Set<number>()
    targetBlocks.forEach((b) => blockCells(b, gridSize).forEach((c) => targetUnion.add(c)))
    const ctxBlock = sampleBlock(gridSize, [0.85, 1.0], [1.0, 1.0])
    context = new Set([...blockCells(ctxBlock, gridSize)].filter((c) => !targetUnion.has(c)))
  } while (context.size < 10)
  return { masked: targetUnion }
}

function generateVJepa2Mask(gridSize: number) {
  const masked = new Set<number>()
  for (let i = 0; i < 8; i++) blockCells(sampleBlock(gridSize, [0.15, 0.15], [0.75, 1.5]), gridSize).forEach((c) => masked.add(c))
  for (let i = 0; i < 2; i++) blockCells(sampleBlock(gridSize, [0.7, 0.7], [0.75, 1.5]), gridSize).forEach((c) => masked.add(c))
  return { masked }
}

function generateRandomMask(gridSize: number, ratio: number) {
  const total = gridSize * gridSize
  const nMask = Math.round(total * ratio)
  const all = Array.from({ length: total }, (_, i) => i)
  for (let i = all.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    const tmp = all[i]
    all[i] = all[j]
    all[j] = tmp
  }
  return { masked: new Set(all.slice(0, nMask)) }
}

const MASK_MODE_BY_MODEL: Record<string, MaskMode> = {
  'ijepa-vitb16': 'ijepa-block',
  'vjepa2-vitl': 'vjepa2-tube',
  'vit-mae-base': 'mae-random',
  'videomae-base': 'videomae-random',
  'dinov2-base': 'dinov2-multicrop',
}

const GRID_SIZE_BY_MODEL: Record<string, number> = {
  'ijepa-vitb16': 14,
  'vjepa2-vitl': 16,
  'vit-mae-base': 14,
  'videomae-base': 14,
  'dinov2-base': 16,
}

const MODE_META: Record<MaskMode, { label: string; ratioNote: string; color: string; sourceNote: string }> = {
  'ijepa-block': { label: 'I-JEPA — block masking', ratioNote: '1 bloc contexte (~85-100%) + 4 blocs cibles (~15-20% chacun)', color: '#22d3ee', sourceNote: 'sample_ijepa_masks(), notebooks I-JEPA' },
  'vjepa2-tube': { label: 'V-JEPA2 — multi-block tube masking', ratioNote: 'union de 8 blocs courts (~15%) + union de 2 blocs longs (~70%)', color: '#f43f5e', sourceNote: 'build_multiblock3d_masks(), vérifié contre arXiv:2404.08471' },
  'mae-random': { label: 'MAE — masking aléatoire', ratioNote: '75% des patches masqués, tirage uniforme', color: '#fb923c', sourceNote: 'Group A' },
  'videomae-random': { label: 'VideoMAE — masking aléatoire de tubes', ratioNote: '~90% des tubes masqués', color: '#fbbf24', sourceNote: 'papier VideoMAE, arXiv:2203.12602' },
  'beit-random': { label: 'BEiT — masking aléatoire, tokens discrets', ratioNote: '~40% des patches masqués', color: '#a78bfa', sourceNote: 'Group A' },
  'dinov2-multicrop': { label: 'DINOv2 — multi-crop', ratioNote: '1 crop global + plusieurs crops locaux, self-distillation', color: '#34d399', sourceNote: 'Group B' },
}

// Image de démo générée localement (SVG en dur, aucune requête réseau)
function DemoScene() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill="#1e293b" />
      <rect width="200" height="120" fill="#0ea5e9" opacity="0.35" />
      <circle cx="150" cy="40" r="22" fill="#fbbf24" />
      <polygon points="0,200 40,110 80,200" fill="#166534" />
      <polygon points="60,200 110,90 170,200" fill="#15803d" />
      <polygon points="120,200 160,130 200,200" fill="#166534" />
      <rect x="0" y="170" width="200" height="30" fill="#334155" />
      <circle cx="30" cy="150" r="10" fill="#f87171" />
      <circle cx="170" cy="60" r="6" fill="#f1f5f9" opacity="0.8" />
      <circle cx="180" cy="80" r="4" fill="#f1f5f9" opacity="0.6" />
    </svg>
  )
}

function MaskingPreview({ mode, gridSize = 14 }: { mode: MaskMode; gridSize?: number }) {
  const [seed, setSeed] = useState(0)
  const meta = MODE_META[mode]

  const mask = useMemo(() => {
    if (mode === 'ijepa-block') return generateIJepaMask(gridSize)
    if (mode === 'vjepa2-tube') return generateVJepa2Mask(gridSize)
    if (mode === 'mae-random') return generateRandomMask(gridSize, 0.75)
    if (mode === 'videomae-random') return generateRandomMask(gridSize, 0.9)
    if (mode === 'beit-random') return generateRandomMask(gridSize, 0.4)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gridSize, seed])

  const localCrops = useMemo(() => {
    if (mode !== 'dinov2-multicrop') return []
    return Array.from({ length: 4 }, () => ({ size: 20 + Math.random() * 15, x: Math.random() * 75, y: Math.random() * 75 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, seed])

  const cellPct = 100 / gridSize

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="mt-0.5 text-xs text-slate-400">{meta.ratioNote}</p>
        </div>
        <button onClick={() => setSeed((s) => s + 1)} className="rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30">
          Re-échantillonner
        </button>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-lg border border-slate-700">
        <DemoScene />

        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          {Array.from({ length: gridSize + 1 }, (_, i) => (
            <line key={`h${i}`} x1="0%" y1={`${i * cellPct}%`} x2="100%" y2={`${i * cellPct}%`} stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />
          ))}
          {Array.from({ length: gridSize + 1 }, (_, i) => (
            <line key={`v${i}`} x1={`${i * cellPct}%`} y1="0%" x2={`${i * cellPct}%`} y2="100%" stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />
          ))}
        </svg>

        {mask &&
          Array.from(mask.masked).map((idx) => {
            const r = Math.floor(idx / gridSize)
            const c = idx % gridSize
            return (
              <div
                key={idx}
                className="absolute"
                style={{ top: `${r * cellPct}%`, left: `${c * cellPct}%`, width: `${cellPct}%`, height: `${cellPct}%`, backgroundColor: 'black', opacity: 0.62 }}
              />
            )
          })}

        {mode === 'dinov2-multicrop' && (
          <>
            <div className="absolute inset-[2%] rounded border-2" style={{ borderColor: '#22d3ee' }} />
            {localCrops.map((crop, i) => (
              <div key={i} className="absolute rounded border-2" style={{ top: `${crop.y}%`, left: `${crop.x}%`, width: `${crop.size}%`, height: `${crop.size}%`, borderColor: '#facc15' }} />
            ))}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        {mask && (
          <span>
            {mask.masked.size} / {gridSize * gridSize} patches masqués ({Math.round((100 * mask.masked.size) / (gridSize * gridSize))}%)
          </span>
        )}
        {mode === 'dinov2-multicrop' && <span>1 crop global + {localCrops.length} crops locaux</span>}
        <span className="italic">source : {meta.sourceNote}</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-600">Image de démo générée localement (SVG), aucune requête réseau.</p>
    </div>
  )
}

function ComparisonPanel({ set }: { set: ComparisonSet }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-50">{set.title}</h3>
        <a href={set.sourceNotebook.url} target="_blank" rel="noreferrer" className="whitespace-nowrap rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/25">
          Notebook complet ↗
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-slate-400">
              <th className="py-2 pr-4 font-medium">Métrique</th>
              {set.models.map((m) => (
                <th key={m} className="py-2 pr-4 font-medium text-slate-200">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row) => (
              <tr key={row.metric} className="border-b border-slate-800/60 align-top">
                <td className="py-2.5 pr-4 text-slate-300">{row.metric}</td>
                {set.models.map((m) => (
                  <td key={m} className={`py-2.5 pr-4 ${row.winner === m ? 'rounded-lg bg-emerald-500/15 font-semibold text-emerald-300' : 'text-slate-200'}`}>
                    {row.values[m] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {set.rows.some((r) => r.note) && (
        <div className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
          {set.rows.filter((r) => r.note).map((r) => (
            <p key={r.metric}><span className="text-slate-400">{r.metric} :</span> {r.note}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

const TIER_CONFIG: Record<ExecutionTier, { label: string; color: string; bg: string; dot: string }> = {
  live_demo: { label: 'Démo live dans le navigateur', color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
  kaggle_notebook: { label: 'Résultats mesurés dans un notebook Kaggle', color: 'text-cyan-300', bg: 'bg-cyan-500/15', dot: 'bg-cyan-500' },
  external_repo: { label: 'Poids réels disponibles — exécutable hors de cette page', color: 'text-amber-300', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  closed_preview: { label: 'Fermé — aucun poids ni code public', color: 'text-rose-300', bg: 'bg-rose-500/15', dot: 'bg-rose-500' },
}

type Tab = 'models' | 'comparisons'

export function TestLab() {
  const [tab, setTab] = useState<Tab>('models')
  const [selectedFamily, setSelectedFamily] = useState<ModelFamily>('jepa')
  const [selectedModelId, setSelectedModelId] = useState<string>('ijepa-vitb16')
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  const familyModels = useMemo(() => MODELS.filter((m) => m.family === selectedFamily), [selectedFamily])
  const selectedModel = MODELS.find((m) => m.id === selectedModelId)
  const tierConfig = selectedModel ? TIER_CONFIG[selectedModel.executionTier] : undefined
  const selectedTest = selectedTestId ? TESTS[selectedTestId] : null

  function handleSelectFamily(family: ModelFamily) {
    setSelectedFamily(family)
    const first = MODELS.find((m) => m.family === family)
    if (first) {
      setSelectedModelId(first.id)
      setSelectedTestId(null)
    }
  }

  function handleSelectModel(id: string) {
    setSelectedModelId(id)
    setSelectedTestId(null)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <div className="mb-8 rounded-[2rem] border border-slate-700 bg-slate-900/85 p-9 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Laboratoire de tests</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-50">Explorer les world models</h1>
        <p className="mt-4 max-w-3xl text-slate-300 leading-8">
          Page 100% statique et autonome : aucun appel réseau, aucune base de données, aucune image externe.
          Les démos de masking rejouent l'algorithme exact du papier sur une image générée localement.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <button onClick={() => setTab('models')} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === 'models' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
          Modèles &amp; tests
        </button>
        <button onClick={() => setTab('comparisons')} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === 'comparisons' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
          Comparaisons entre modèles
        </button>
      </div>

      {tab === 'comparisons' ? (
        <div className="space-y-8">
          {COMPARISONS.map((set) => <ComparisonPanel key={set.id} set={set} />)}
        </div>
      ) : (
        <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/20">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Familles</h2>
              <div className="space-y-1">
                {FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFamily(f.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedFamily === f.id ? `${f.bg} ${f.color} font-medium` : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/20">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Modèles — {FAMILIES.find((f) => f.id === selectedFamily)?.label}
              </h2>
              <div className="space-y-2">
                {familyModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full rounded-xl p-3 text-left transition-all ${selectedModelId === m.id ? 'border-2 border-cyan-500 bg-slate-800/50' : 'border border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`}
                  >
                    <p className="font-medium text-slate-100">{m.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{m.subtitle}</p>
                    {!m.verified && <p className="mt-1 text-[11px] text-amber-400">⚠ infos à vérifier</p>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedModel && (
              <>
                <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-50">{selectedModel.name}</h2>
                      <p className="mt-1 text-sm text-slate-400">{selectedModel.subtitle}</p>
                    </div>
                    {tierConfig && (
                      <span className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${tierConfig.bg} ${tierConfig.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${tierConfig.dot}`} />
                        {tierConfig.label}
                      </span>
                    )}
                  </div>

                  <p className="mb-4 text-sm leading-6 text-slate-300">{selectedModel.description}</p>
                  <p className="mb-4 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Objectif d'entraînement : </span>
                    {selectedModel.trainingObjective}
                  </p>

                  {selectedModel.params && (
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {selectedModel.params.totalParamsM !== undefined && <ParamChip label="Paramètres" value={`${selectedModel.params.totalParamsM} M`} />}
                      {selectedModel.params.hiddenSize && <ParamChip label="Hidden size" value={String(selectedModel.params.hiddenSize)} />}
                      {selectedModel.params.numLayers && <ParamChip label="Couches" value={String(selectedModel.params.numLayers)} />}
                      {selectedModel.params.numHeads && <ParamChip label="Têtes" value={String(selectedModel.params.numHeads)} />}
                      {selectedModel.params.patchSize && <ParamChip label="Patch size" value={String(selectedModel.params.patchSize)} />}
                      {selectedModel.params.tubeletSize && <ParamChip label="Tubelet size" value={String(selectedModel.params.tubeletSize)} />}
                      {selectedModel.params.imageSize && <ParamChip label="Image size" value={String(selectedModel.params.imageSize)} />}
                    </div>
                  )}
                  {selectedModel.params?.note && <p className="mb-4 text-xs italic text-slate-500">{selectedModel.params.note}</p>}

                  <div className="flex flex-wrap gap-2">
                    <LinkPill href={selectedModel.paperUrl} label="Papier ↗" />
                    {selectedModel.codeUrl && <LinkPill href={selectedModel.codeUrl} label="Code officiel ↗" />}
                    {selectedModel.projectUrl && <LinkPill href={selectedModel.projectUrl} label="Site du projet ↗" />}
                    {selectedModel.extraLinks?.map((l) => <LinkPill key={l.url} href={l.url} label={`${l.label} ↗`} />)}
                    {selectedModel.kaggleNotebooks?.map((nb) => <LinkPill key={nb.url} href={nb.url} label={`📓 ${nb.label} ↗`} accent />)}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                  <h3 className="mb-4 text-lg font-semibold text-slate-50">Tests compatibles</h3>
                  {selectedModel.compatibleTests.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun test interactif pour ce modèle — voir les liens ci-dessus.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedModel.compatibleTests.map((tid) => {
                        const t = TESTS[tid]
                        if (!t) return null
                        const active = selectedTestId === tid
                        return (
                          <button
                            key={tid}
                            onClick={() => setSelectedTestId(tid)}
                            className={`rounded-xl border p-4 text-left transition-colors ${active ? 'border-cyan-500 bg-slate-800/60' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`}
                          >
                            <span className="mb-1 inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-mono text-cyan-300">{tid}</span>
                            <p className="text-sm font-medium text-slate-100">{t.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{t.shortDescription}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {selectedTest && (
                  <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                    <h3 className="text-lg font-semibold text-slate-50">{selectedTest.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{selectedTest.longDescription}</p>

                    {selectedTest.visualization === 'masking-demo' && MASK_MODE_BY_MODEL[selectedModel.id] && (
                      <div className="mt-5">
                        <MaskingPreview mode={MASK_MODE_BY_MODEL[selectedModel.id]} gridSize={GRID_SIZE_BY_MODEL[selectedModel.id] ?? 14} />
                      </div>
                    )}

                    {selectedTest.measuredResults && selectedTest.measuredResults.length > 0 && (
                      <div className="mt-5 overflow-hidden rounded-xl border border-slate-700">
                        <table className="w-full text-sm">
                          <tbody>
                            {selectedTest.measuredResults.map((r, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'}>
                                <td className="px-4 py-2.5 text-slate-300">{r.label}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-cyan-300">{r.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {selectedTest.measuredResults.some((r) => r.sourceNote) && (
                          <div className="space-y-1 border-t border-slate-700 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
                            {selectedTest.measuredResults.filter((r) => r.sourceNote).map((r, i) => (
                              <p key={i}><span className="text-slate-400">{r.label} :</span> {r.sourceNote}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTest.visualization === 'conceptual' && (
                      <p className="mt-4 text-xs italic text-slate-500">
                        Pas de checkpoint testable directement ici — voir les liens vers le papier / le code officiel ci-dessus.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

function ParamChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function LinkPill({ href, label, accent = false }: { href: string; label: string; accent?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${accent ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
      {label}
    </a>
  )
}