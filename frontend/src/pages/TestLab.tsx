import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, runTest } from '../api/client'
import { type ModelItem, type ExecutionTier } from '../components/ModelCard'
import { TestResultPanel } from '../components/TestResultPanel'

// Fonction pour récupérer les modèles (dupliquée depuis Encyclopedia.tsx)
const fetchModels = async (): Promise<ModelItem[]> => {
  const response = await api.get('/models/')
  return response.data.items
}

// Mapping fixe des descriptions de tests
const TEST_DESCRIPTIONS: Record<string, string> = {
  T1: 'Légitimité d\'entraînement — structure réelle vs bruit',
  T2: 'Visualisation du masking',
  T3: 'Robustesse à l\'occlusion spatiale',
  T4: 'Robustesse au frame-dropout temporel',
  T5: 'Robustesse au flou / bruit',
  T6: 'Séparation sémantique',
  T7: 'Correspondance dense cross-image',
  T8: 'Type de sortie (continu / pixels / tokens)',
  T9: 'Prédiction latente du futur',
  T10: 'Reconstruction pixel du futur',
  T11: 'Alignement texte-image',
  T12: 'Planification / action-conditionnée',
}

// Configuration des tiers d'exécution
const TIER_CONFIG: Record<ExecutionTier, { label: string; color: string; bg: string; dot: string }> = {
  live: {
    label: 'Live (quelques secondes)',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    dot: 'bg-emerald-500',
  },
  job_async: {
    label: 'Job asynchrone (peut prendre plus longtemps)',
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    dot: 'bg-amber-500',
  },
  archived_kaggle: {
    label: 'Archivé — non exécutable en direct sur cette plateforme',
    color: 'text-blue-300',
    bg: 'bg-blue-500/15',
    dot: 'bg-blue-500',
  },
}

const TIER_FALLBACK = {
  label: 'Inconnu',
  color: 'text-slate-300',
  bg: 'bg-slate-500/15',
  dot: 'bg-slate-500',
}

export function TestLab() {
  const { data: models, isLoading, error } = useQuery<ModelItem[], Error>({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  const selectedModel = models?.find((m) => m.id === selectedModelId) ?? null
  const executionTier = selectedModel?.manifest.execution_tier
  const tierConfig = executionTier ? TIER_CONFIG[executionTier] : TIER_FALLBACK
  const isArchived = executionTier === 'archived_kaggle'
  const compatibleTests = selectedModel?.manifest.compatible_tests ?? []

  // Mutation pour lancer un test
  const mutation = useMutation({
    mutationFn: ({ modelId, testId }: { modelId: string; testId: string }) => runTest(modelId, testId),
  })

  const handleRunTest = (testId: string) => {
    if (isArchived || mutation.isPending) return
    mutation.mutate({ modelId: selectedModel!.name, testId })
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 text-center text-slate-300">
          Chargement des modèles...
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
        <div className="rounded-[2rem] border border-rose-500 bg-rose-500/10 p-8 text-center text-rose-300">
          Impossible de charger les modèles. Vérifie que l'API backend est active sur{' '}
          <code>http://localhost:8000</code>.
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      {/* Header */}
      <div className="mb-10 rounded-[2rem] border border-slate-700 bg-slate-900/85 p-9 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Laboratoire de tests</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-50">Exécuter les tests de compatibilité</h1>
        <p className="mt-4 max-w-3xl text-slate-300 leading-8">
          Sélectionne un modèle pour voir les tests compatibles selon son manifeste. Le tier d'exécution
          détermine si les tests peuvent être lancés en direct, en job asynchrone, ou sont archivés.
        </p>
      </div>

      <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Model Selector */}
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-slate-50 mb-4">Choisir un modèle</h2>

          {/* Execution Tier Badge */}
          {selectedModel && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tierConfig.bg }}>
              <span className="relative h-2 w-2 rounded-full" style={{ backgroundColor: tierConfig.dot }} />
              <span className="text-sm font-medium" style={{ color: tierConfig.color }}>
                {tierConfig.label}
              </span>
            </div>
          )}

          {/* Model List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {models?.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`w-full text-left rounded-xl p-3 transition-all ${
                  selectedModelId === model.id
                    ? 'border-2 border-cyan-500 bg-slate-800/50'
                    : 'border border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <p className="font-medium text-slate-100">{model.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{model.family}</p>
              </button>
            ))}
          </div>

          {!selectedModel && (
            <p className="mt-4 text-center text-slate-500 text-sm">
              Sélectionne un modèle pour voir ses tests compatibles
            </p>
          )}
        </div>

        {/* Main Content - Tests */}
        <div className="space-y-6">
          {selectedModel ? (
            <>
              <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-50">{selectedModel.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedModel.family}</p>
                  </div>
                  {isArchived && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 text-sm">
                      ⚠ Ce modèle est archivé — les tests ne peuvent pas être lancés
                    </div>
                  )}
                </div>

                {compatibleTests.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    Aucun test compatible déclaré dans le manifeste de ce modèle.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {compatibleTests.map((testId) => {
                      const description = TEST_DESCRIPTIONS[testId] ?? 'Description non disponible'
                      const isRunning = mutation.isPending && mutation.variables?.testId === testId
                      const isError = mutation.isError && mutation.variables?.testId === testId
                      const isSuccess = mutation.isSuccess && mutation.variables?.testId === testId

                      return (
                        <div
                          key={testId}
                          className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-slate-600"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-mono text-cyan-300">
                                  {testId}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 leading-6">{description}</p>
                            </div>
                            <button
                              onClick={() => handleRunTest(testId)}
                              disabled={isArchived || mutation.isPending}
                              className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                isArchived
                                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                  : isRunning
                                  ? 'bg-amber-500/20 text-amber-300 cursor-wait'
                                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100'
                              }`}
                            >
                              {isRunning ? 'Exécution...' : 'Lancer le test'}
                            </button>
                          </div>
                          {isError && (
                            <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 text-sm">
                              Erreur : {mutation.error?.message ?? 'Erreur inconnue'}
                            </div>
                          )}
                          {isSuccess && mutation.data && (
                            <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                              <TestResultPanel
                                testId={testId}
                                result={mutation.isSuccess && mutation.variables?.testId === testId ? mutation.data : null}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-12 text-center text-slate-400">
              <p className="text-lg">Sélectionne un modèle à gauche pour commencer</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}