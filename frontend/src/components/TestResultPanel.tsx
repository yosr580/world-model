import { type ExecutionTier } from './ModelCard'

interface TestResultPanelProps {
  testId: string
  result: any
}

export function TestResultPanel({ testId, result }: TestResultPanelProps) {
  // Si result est null/undefined, affiche rien
  if (!result) {
    return null
  }

  // Pour T1 : structure_gap + 2 images
  if (testId === 'T1') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold text-emerald-300 font-mono">
              {result.structure_gap ?? 'N/A'}
            </span>
            <span className="text-sm text-slate-400">
              structure_gap
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-6">
            Plus ce nombre est élevé, plus le modèle distingue une image réelle du bruit — signe qu'il a
            effectivement appris une structure.
          </p>
        </div>

        {result.similarity_real_png_base64 && result.similarity_noise_png_base64 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs font-medium text-slate-400 mb-2 text-center">Image réelle</p>
              <img
                src={`data:image/png;base64,${result.similarity_real_png_base64}`}
                alt="Similarité avec image réelle"
                className="w-full h-auto rounded-md border border-slate-700"
              />
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs font-medium text-slate-400 mb-2 text-center">Bruit aléatoire</p>
              <img
                src={`data:image/png;base64,${result.similarity_noise_png_base64}`}
                alt="Similarité avec bruit aléatoire"
                className="w-full h-auto rounded-md border border-slate-700"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Pour T8 : output_type en badge + description
  if (testId === 'T8') {
    const outputType = result.output_type ?? 'inconnu'
    const description = result.description ?? 'Aucune description disponible'

    // Couleur du badge selon output_type
    const getBadgeColor = (type: string) => {
      switch (type) {
        case 'continuous_embedding':
          return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        case 'pixel_reconstruction':
          return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        case 'token_prediction':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        case 'action_conditioned':
          return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        default:
          return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getBadgeColor(outputType)}`}>
            {outputType}
          </span>
        </div>
        <p className="text-slate-300 text-sm leading-6">{description}</p>
      </div>
    )
  }

  // Pour tout autre testId
  return (
    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-sm">
      Ce test n'est pas encore implémenté côté backend — résultat non disponible
    </div>
  )
}