type ModelItem = {
  id: string
  name: string
  family: string
  modality: string
  license: string
  verified_reproducible: boolean
  created_at: string
}

export function ModelCard({ model }: { model: ModelItem }) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-cyan-400">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{model.family}</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-50">{model.name}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              model.verified_reproducible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/70 text-slate-300'
            }`}
          >
            {model.verified_reproducible ? 'Vérifié' : 'Non vérifié'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Modalité</span>
            <span className="mt-2 block text-slate-100">{model.modality}</span>
          </div>
          <div className="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Licence</span>
            <span className="mt-2 block text-slate-100">{model.license}</span>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-400">
          Entré en base le {new Date(model.created_at).toLocaleDateString('fr-FR')}.
        </p>
      </div>
    </article>
  )
}
