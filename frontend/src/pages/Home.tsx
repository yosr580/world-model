import { useMemo } from 'react'
import { Link } from 'react-router-dom'

// ============================================================================
// Petit utilitaire déterministe (seed → pseudo-aléatoire stable) pour que les
// éléments flottants ne "sautent" pas à chaque re-render
// ============================================================================
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ============================================================================
// Fond animé — halos lumineux + particules flottantes + formes géométriques
// dérivantes, en respectant prefers-reduced-motion
// ============================================================================
const ACCENT_HEXES = ['#22d3ee', '#e879f9', '#a78bfa', '#fbbf24', '#34d399']

function AmbientBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const rng = mulberry32(2000 + i)
        return {
          id: i,
          left: `${(rng() * 100).toFixed(1)}%`,
          top: `${(rng() * 100).toFixed(1)}%`,
          size: 2 + rng() * 4,
          duration: 12 + rng() * 18,
          delay: -rng() * 24,
          color: ACCENT_HEXES[i % ACCENT_HEXES.length],
        }
      }),
    [],
  )

  const shapes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const rng = mulberry32(5000 + i)
        return {
          id: i,
          left: `${(10 + rng() * 80).toFixed(1)}%`,
          top: `${(10 + rng() * 80).toFixed(1)}%`,
          size: 40 + rng() * 70,
          rotate: rng() * 360,
          duration: 16 + rng() * 14,
          delay: -rng() * 20,
          color: ACCENT_HEXES[(i + 2) % ACCENT_HEXES.length],
          kind: i % 3,
        }
      }),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div className="absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[120px] motion-safe:animate-[float-a_19s_ease-in-out_infinite]" />
      <div className="absolute right-[-10%] top-1/4 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-[130px] motion-safe:animate-[float-b_23s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-400/15 blur-[110px] motion-safe:animate-[float-a_26s_ease-in-out_infinite_reverse]" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-500/20 blur-[110px] motion-safe:animate-[float-b_21s_ease-in-out_infinite_reverse]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-[100px] motion-safe:animate-[float-a_24s_ease-in-out_infinite]" />

      {shapes.map((s) => (
        <div
          key={s.id}
          className="absolute opacity-[0.15] motion-safe:animate-[spin-drift_linear_infinite]"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            transform: `rotate(${s.rotate}deg)`,
          }}
        >
          {s.kind === 0 && (
            <div className="h-full w-full rounded-2xl border-2" style={{ borderColor: s.color }} />
          )}
          {s.kind === 1 && (
            <div
              className="h-full w-full border-2"
              style={{ borderColor: s.color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          )}
          {s.kind === 2 && <div className="h-full w-full rounded-full border-2" style={{ borderColor: s.color }} />}
        </div>
      ))}

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-60 motion-safe:animate-[drift_linear_infinite]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -50px) scale(1.1); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-45px, 40px) scale(1.06); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); }
          25% { transform: translate(16px, -22px); }
          50% { transform: translate(-12px, -36px); }
          75% { transform: translate(-22px, 12px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes spin-drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -25px) rotate(180deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Badge de statut clignotant discret ("live") pour le hero
// ============================================================================
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  )
}

// ============================================================================
// Carte de fonctionnalité — glow + translation au survol
// ============================================================================
const FEATURE_STYLES = {
  cyan: {
    ring: 'hover:border-cyan-400/60 hover:shadow-[0_0_60px_-15px_rgba(34,211,238,0.55)]',
    glow: 'from-cyan-500/20',
    dot: 'bg-cyan-400',
    text: 'text-cyan-300',
  },
  fuchsia: {
    ring: 'hover:border-fuchsia-400/60 hover:shadow-[0_0_60px_-15px_rgba(232,121,249,0.5)]',
    glow: 'from-fuchsia-500/20',
    dot: 'bg-fuchsia-400',
    text: 'text-fuchsia-300',
  },
  amber: {
    ring: 'hover:border-amber-400/60 hover:shadow-[0_0_60px_-15px_rgba(251,191,36,0.5)]',
    glow: 'from-amber-500/20',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
} as const

type FeatureColor = keyof typeof FEATURE_STYLES

function FeatureCard({
  color,
  title,
  description,
}: {
  color: FeatureColor
  title: string
  description: string
}) {
  const style = FEATURE_STYLES[color]
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/30 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.015] ${style.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${style.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${style.dot} shadow-[0_0_10px_currentColor]`} style={{ color: 'inherit' }} />
        <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
      </div>
      <p className="relative mt-4 leading-7 text-slate-300">{description}</p>
      <div
        className={`relative mt-5 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 transition-transform duration-500 group-hover:scale-x-100 ${style.text}`}
      />
    </article>
  )
}

// ============================================================================
// Page principale
// ============================================================================
export function Home() {
  const vision = [
    { label: 'API FastAPI', desc: 'pour exposer le registre des modèles et lancer les tests.', color: 'cyan' as const },
    { label: 'Base PostgreSQL', desc: 'pour les métadonnées et les résultats d\u2019évaluation.', color: 'fuchsia' as const },
    { label: 'Frontend React', desc: 'consultable en local avec les fiches des modèles.', color: 'violet' as const },
    { label: 'Architecture évolutive', desc: 'vers microservices, RAG, et jobs asynchrones.', color: 'amber' as const },
  ]

  const visionDot: Record<string, string> = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    fuchsia: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]',
    violet: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  }
  const visionText: Record<string, string> = {
    cyan: 'text-cyan-300',
    fuchsia: 'text-fuchsia-300',
    violet: 'text-violet-300',
    amber: 'text-amber-300',
  }

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <AmbientBackground />

      {/* Hero */}
      <section className="mb-10 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2">
              <LiveDot />
              <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Plateforme World Models</p>
            </div>
            <h1
              className="mt-5 bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-5xl font-semibold text-transparent motion-safe:animate-[gradient-shift_8s_ease_infinite]"
              style={{ backgroundSize: '200% 200%' }}
            >
              Explorer, comparer et tester les world models
            </h1>
            <p className="mt-6 max-w-2xl leading-8 text-slate-300">
              Une démo technique pour visualiser les modèles I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP et MAE.
              Retrouvez les fiches de chaque modèle, leur taxonomie, leur statut de reproductibilité, et l'accès direct au laboratoire de tests.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/encyclopedia"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_-5px_rgba(34,211,238,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_0_35px_-5px_rgba(34,211,238,0.9)] active:translate-y-0"
              >
                <span className="relative z-10">Aller à l'encyclopédie →</span>
                <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
              <a
                href="https://github.com/yosr580/world-model"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 px-6 py-3 text-sm font-semibold text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/70 hover:text-fuchsia-200 hover:shadow-[0_0_25px_-8px_rgba(232,121,249,0.6)]"
              >
                Voir le dépôt Git
              </a>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-slate-950/90 p-8 text-slate-300 shadow-xl shadow-slate-950/50 transition-shadow duration-500 hover:shadow-[0_0_50px_-10px_rgba(167,139,250,0.35)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl motion-safe:animate-[pulse-glow_4s_ease-in-out_infinite]" />
            <h2 className="relative text-2xl font-semibold text-slate-50">Vision technique</h2>
            <ul className="relative mt-6 space-y-4 text-sm leading-7">
              {vision.map((v) => (
                <li
                  key={v.label}
                  className="group/item flex items-start gap-3 rounded-xl p-2 -m-2 transition-colors duration-200 hover:bg-slate-900/60"
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${visionDot[v.color]} transition-transform duration-200 group-hover/item:scale-150`} />
                  <span>
                    <strong className={visionText[v.color]}>{v.label}</strong> {v.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Cartes de fonctionnalités */}
      <section className="grid gap-6 lg:grid-cols-3">
        <FeatureCard
          color="cyan"
          title="Modèles couverts"
          description="I-JEPA, V-JEPA2, VideoMAE, DINOv2, CLIP et MAE sont accessibles via un registre unifié et prêts à être comparés selon leur famille, modalité, et statut reproductible."
        />
        <FeatureCard
          color="fuchsia"
          title="Tests standardisés"
          description="Chaque modèle est décrit pour les tests T1 à T12. Le backend distingue ce qui peut être exécuté en live et ce qui doit rester en job asynchrone ou archive Kaggle."
        />
        <FeatureCard
          color="amber"
          title="Organisation projet"
          description="Frontend minimal + backend prêt pour extensibilité. Objectif MVP : catalogue, tests simples, interface enrichie."
        />
      </section>
    </main>
  )
}