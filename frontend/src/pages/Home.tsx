import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <section className="mb-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/30">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Plateforme World Models</p>
            <h1 className="mt-5 text-5xl font-semibold text-slate-50">Explorer, comparer et tester les world models</h1>
            <p className="mt-6 max-w-2xl leading-8 text-slate-300">
              Une démo technique pour visualiser les modèles I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP et MAE.
              Retrouvez les fiches de chaque modèle, leur taxonomie, leur statut de reproductibilité, et l’accès direct au laboratoire de tests.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/encyclopedia"
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Aller à l'encyclopédie
              </Link>
              <a
                href="https://github.com/yosr580/world-model"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400"
              >
                Voir le dépôt Git
              </a>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-950/90 p-8 text-slate-300 shadow-xl shadow-slate-950/40">
            <h2 className="text-2xl font-semibold text-slate-50">Vision technique</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7">
              <li>
                <strong className="text-cyan-300">API FastAPI</strong> pour exposer le registre des modèles et lancer les tests.
              </li>
              <li>
                <strong className="text-cyan-300">Base PostgreSQL</strong> pour les métadonnées et les résultats d’évaluation.
              </li>
              <li>
                <strong className="text-cyan-300">Frontend React</strong> consultable en local avec les fiches des modèles.
              </li>
              <li>
                <strong className="text-cyan-300">Architecture évolutive</strong> vers microservices, RAG, et jobs asynchrones.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-50">Modèles couverts</h3>
          <p className="mt-4 text-slate-300 leading-7">
            I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP et MAE sont accessibles via un registre unifié
            et prêts à être comparés selon leur famille, modalité, et statut reproductible.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-50">Tests standardisés</h3>
          <p className="mt-4 text-slate-300 leading-7">
            Chaque modèle est décrit pour les tests T1 à T12. Le backend distingue ce qui peut être exécuté en live
            et ce qui doit rester en job asynchrone ou archive Kaggle.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-50">Organisation projet</h3>
          <p className="mt-4 text-slate-300 leading-7">
            Frontend minimal + backend prêt pour extensibilité. Objectif MVP : catalogue, tests simples, interface enrichie.
          </p>
        </article>
      </section>
    </main>
  )
}
