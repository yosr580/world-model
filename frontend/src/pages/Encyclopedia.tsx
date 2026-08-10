import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ModelCardContainer, type ModelItem } from '../components/ModelCard'
import { TaxonomyFilters } from '../components/TaxonomyFilters'

const fetchModels = async (): Promise<ModelItem[]> => {
  const response = await api.get('/models/')
  return response.data.items
}

export function Encyclopedia() {
  const { data, isLoading, error } = useQuery<ModelItem[], Error>({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  const [filteredModels, setFilteredModels] = useState<ModelItem[]>([])

  useEffect(() => {
    setFilteredModels(data ?? [])
  }, [data])

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <div className="mb-10 rounded-[2rem] border border-slate-700 bg-slate-900/85 p-9 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Encyclopédie</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-50">World Models et tests techniques</h1>
        <p className="mt-4 max-w-3xl text-slate-300 leading-8">
          Cette page présente la taxonomie des world models, leur statut de reproductibilité et le potentiel
          des tests live vs asynchrones. Les modèles listés ici sont la base de la plateforme.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold text-slate-50">À propos des world models</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Les world models permettent de représenter un environnement sans supervision explicite, ce qui rend
            possible la prédiction, la planification, et la comparaison de dynamiques visuelles. Ils sont utilisés
            ici pour évaluer la robustesse, la reconstruction, et la qualité des sorties dans un cadre unifié.
          </p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              <strong className="text-cyan-300">I-JEPA</strong> et <strong className="text-cyan-300">V-JEPA2</strong> sont des modèles
              auto-supervisés orientés vers la prédiction vidéo et les représentations latentes.
            </p>
            <p>
              <strong className="text-cyan-300">VideoMAE</strong> se concentre sur la reconstruction vidéo via des auto-encodeurs masqués.
            </p>
            <p>
              <strong className="text-cyan-300">DINOv2</strong> et <strong className="text-cyan-300">CLIP</strong> sont des modèles de correspondance image-texte
              utiles pour l’évaluation sémantique et les tâches de retrieval.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <h2 className="text-2xl font-semibold text-slate-50">Tests proposés</h2>
            <ul className="mt-4 space-y-3 text-slate-300">
              <li>• T1 : structure gap réel vs bruit</li>
              <li>• T3 : robustesse à l’occlusion spatiale</li>
              <li>• T4 : robustesse au frame-dropout</li>
              <li>• T6 : séparation sémantique</li>
              <li>• T11 : alignement texte-image</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <h2 className="text-2xl font-semibold text-slate-50">Faisabilité</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Les tests légers peuvent tourner en live pour les petits modèles. Les évaluations longues et les checkpoints
              volumineux sont gérés comme jobs asynchrones ou archives Kaggle.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 text-center text-slate-300">
            Chargement des modèles...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-500 bg-rose-500/10 p-8 text-center text-rose-300">
            Impossible de charger les modèles. Vérifie que l'API backend est active sur <code>http://localhost:8000</code>.
          </div>
        ) : (
          <>
            {data && data.length > 0 && (
              <TaxonomyFilters models={data} onFilterChange={setFilteredModels} />
            )}
            <ModelCardContainer models={filteredModels} />
          </>
        )}
      </section>
    </main>
  )
}
