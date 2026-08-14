// src/data/types.ts
// Types partagés pour le catalogue statique de modèles et de tests.
// Rien ici n'appelle l'API backend : tout est figé en dur, sourcé depuis
// les papiers officiels et/ou les runs réels des notebooks Kaggle de Yosr.

export type ModelFamily =
  | 'jepa'
  | 'mae'
  | 'clip'
  | 'dinov2'
  | 'world-models'
  | 'dreamer'
  | 'tdmpc'
  | 'cosmos'
  | 'genie'

export interface FamilyMeta {
  id: ModelFamily
  label: string
  tagline: string
  color: string // classe tailwind text-*
  bg: string // classe tailwind bg-*
}

// Comment le test est réellement exécutable pour cette entrée
export type ExecutionTier =
  | 'live_demo' // pur front (canvas/svg), rejoue un algorithme réel du papier sur une vraie photo, aucune inférence
  | 'kaggle_notebook' // inférence réelle déjà faite dans un notebook Kaggle de Yosr -> on montre résultats + lien
  | 'external_repo' // poids/checkpoints réels dispo (HF, torch.hub, GitHub officiel) mais pas exécutable ici
  | 'closed_preview' // pas de poids ouverts, accès uniquement via preview propriétaire (ex: Genie 3)

export interface KaggleNotebookRef {
  label: string
  url: string
}

export interface ExternalLink {
  label: string
  url: string
}

export interface ModelParams {
  totalParamsM?: number // en millions
  hiddenSize?: number
  numLayers?: number
  numHeads?: number
  patchSize?: number
  tubeletSize?: number
  imageSize?: number
  note?: string // pour les cas non-ViT (World Models, TD-MPC2...) ou incertains
}

export interface ModelSpec {
  id: string
  family: ModelFamily
  name: string
  subtitle: string // ex: "ViT-B/16, ImageNet-1K"
  description: string
  trainingObjective: string
  huggingfaceId?: string
  paperUrl: string
  codeUrl?: string
  projectUrl?: string
  extraLinks?: ExternalLink[]
  params?: ModelParams
  executionTier: ExecutionTier
  compatibleTests: string[] // ids référencés dans testsCatalog.ts
  kaggleNotebooks?: KaggleNotebookRef[]
  verified: boolean // false = donnée à re-vérifier avant publication (ex: SANA-WM)
}

export type VisualizationKind =
  | 'masking-demo' // MaskingPreview.tsx, algorithme réel rejoué sur photo réelle
  | 'similarity-heatmap' // matrice de similarité patch-patch, chiffres réels
  | 'robustness-sweep' // courbe occlusion / blur / frame-dropout, chiffres réels
  | 'pca-scatter' // PCA des embeddings, description + chiffres
  | 'comparison-table' // tableau comparatif entre modèles (issu des notebooks Group A/B)
  | 'conceptual' // pas de visualisation exécutable, texte + schéma + liens (world models fermés)

export interface TestResultDatum {
  label: string
  value: string
  sourceNote?: string // ex: "mesuré dans le notebook I-JEPA Image Lab, section 12"
}

export interface TestDefinition {
  id: string
  title: string
  shortDescription: string
  longDescription: string
  visualization: VisualizationKind
  measuredResults?: TestResultDatum[]
}