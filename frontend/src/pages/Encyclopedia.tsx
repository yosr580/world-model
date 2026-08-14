import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Puzzle,
  Brain,
  GitCompare,
  History,
  Ruler,
  LayoutGrid,
  FlaskConical,
  PlayCircle,
  Star,
} from 'lucide-react'

// ============================================================================
// Design tokens
//   cyan    -> JEPA (prédiction en espace latent)
//   fuchsia -> MAE (reconstruction pixel)
//   violet  -> Baselines sémantiques (CLIP, DINOv2)
//   amber   -> World models RL / dynamique latente (Dreamer, TD-MPC2, Ha&Schmidhuber)
//   rose    -> World models génératifs / interactifs (Cosmos, SANA-WM, Genie)
//   slate   -> Neutre (histoire, contexte général)
// ============================================================================
type FamilyKey = 'jepa' | 'mae' | 'semantic' | 'rl' | 'generative'

const FAMILY_STYLES: Record<
  FamilyKey,
  { badge: string; ring: string; dot: string; glow: string; label: string; text: string; hex: string; hexSoft: string }
> = {
  jepa: {
    badge: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    ring: 'hover:border-cyan-400/60 hover:shadow-[0_0_60px_-12px_rgba(34,211,238,0.65)]',
    dot: 'bg-cyan-400',
    glow: 'from-cyan-500/20',
    label: 'JEPA — prédiction latente',
    text: 'text-cyan-300',
    hex: '#22d3ee',
    hexSoft: 'rgba(34,211,238,0.35)',
  },
  mae: {
    badge: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200',
    ring: 'hover:border-fuchsia-400/60 hover:shadow-[0_0_60px_-12px_rgba(232,121,249,0.6)]',
    dot: 'bg-fuchsia-400',
    glow: 'from-fuchsia-500/20',
    label: 'MAE — reconstruction pixel',
    text: 'text-fuchsia-300',
    hex: '#e879f9',
    hexSoft: 'rgba(232,121,249,0.35)',
  },
  semantic: {
    badge: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
    ring: 'hover:border-violet-400/60 hover:shadow-[0_0_60px_-12px_rgba(167,139,250,0.6)]',
    dot: 'bg-violet-400',
    glow: 'from-violet-500/20',
    label: 'Baseline sémantique',
    text: 'text-violet-300',
    hex: '#a78bfa',
    hexSoft: 'rgba(167,139,250,0.35)',
  },
  rl: {
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    ring: 'hover:border-amber-400/60 hover:shadow-[0_0_60px_-12px_rgba(251,191,36,0.6)]',
    dot: 'bg-amber-400',
    glow: 'from-amber-500/20',
    label: 'World model RL — dynamique latente',
    text: 'text-amber-300',
    hex: '#fbbf24',
    hexSoft: 'rgba(251,191,36,0.35)',
  },
  generative: {
    badge: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
    ring: 'hover:border-rose-400/60 hover:shadow-[0_0_60px_-12px_rgba(251,113,133,0.6)]',
    dot: 'bg-rose-400',
    glow: 'from-rose-500/20',
    label: 'World model génératif / interactif',
    text: 'text-rose-300',
    hex: '#fb7185',
    hexSoft: 'rgba(251,113,133,0.35)',
  },
}

const NEUTRAL_STYLE = {
  badge: 'border-slate-400/40 bg-slate-400/10 text-slate-200',
  ring: 'hover:border-slate-400/60 hover:shadow-[0_0_60px_-12px_rgba(148,163,184,0.5)]',
  dot: 'bg-slate-400',
  glow: 'from-slate-400/20',
  label: 'Contexte',
  text: 'text-slate-300',
  hex: '#94a3b8',
  hexSoft: 'rgba(148,163,184,0.35)',
}

const FAMILY_ORDER: FamilyKey[] = ['jepa', 'mae', 'semantic', 'rl', 'generative']

// ============================================================================
// Petits utilitaires déterministes (seed → pseudo-aléatoire stable)
// pour que les diagrammes ne "sautent" pas à chaque re-render
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

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  }
  return h
}

// ============================================================================
// 0. Utilitaires d'animation à l'entrée dans le viewport (scroll-reveal) et
//    parallaxe légère à la souris — purement additifs, respectent
//    prefers-reduced-motion via les classes motion-safe.
// ============================================================================
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-safe:${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setPos({ x, y })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return pos
}

// ============================================================================
// 1. Simulateur de masking JEPA — élément interactif signature (Chapitre 1)
// ============================================================================
const GRID_COLS = 6
const GRID_ROWS = 4
const TOTAL_PATCHES = GRID_COLS * GRID_ROWS

const DEFAULT_MASK = new Set<number>([8, 9, 10, 14, 15, 16, 20, 21, 22])

function coordsOf(index: number) {
  return { row: Math.floor(index / GRID_COLS), col: index % GRID_COLS }
}

function randomBlockMask(): Set<number> {
  const blockRows = 2 + Math.floor(Math.random() * 2)
  const blockCols = 2 + Math.floor(Math.random() * 3)
  const startRow = Math.floor(Math.random() * (GRID_ROWS - blockRows + 1))
  const startCol = Math.floor(Math.random() * (GRID_COLS - blockCols + 1))
  const mask = new Set<number>()
  for (let r = startRow; r < startRow + blockRows; r++) {
    for (let c = startCol; c < startCol + blockCols; c++) {
      mask.add(r * GRID_COLS + c)
    }
  }
  return mask
}

function PatchMaskingDemo() {
  const [masked, setMasked] = useState<Set<number>>(DEFAULT_MASK)

  const togglePatch = (index: number) => {
    setMasked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const visibleCount = TOTAL_PATCHES - masked.size
  const maskedCount = masked.size

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Terrain de jeu</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Cache un morceau de l'image, et regarde l'IA deviner
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Clique sur des cases pour changer quels fragments sont montrés à l'IA (visibles) et lesquels
            sont cachés (masqués). L'IA ne voit jamais les pixels cachés — elle doit deviner leur{' '}
            <em>représentation</em>, un résumé abstrait, pas leur apparence exacte.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMasked(randomBlockMask())}
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:scale-105 hover:bg-amber-400/20 active:scale-95"
          >
            Masque aléatoire
          </button>
          <button
            onClick={() => setMasked(new Set(DEFAULT_MASK))}
            className="rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2 text-xs font-medium text-slate-300 transition hover:scale-105 hover:bg-slate-800 active:scale-95"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="relative mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
        <div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: TOTAL_PATCHES }, (_, i) => {
              const isMasked = masked.has(i)
              const { row, col } = coordsOf(i)
              return (
                <button
                  key={i}
                  onClick={() => togglePatch(i)}
                  title={`patch (${row}, ${col}) — ${isMasked ? 'masqué (cible)' : 'visible (contexte)'}`}
                  className={`h-11 w-11 rounded-md border text-[9px] font-mono transition-all duration-150 hover:scale-110 sm:h-12 sm:w-12 ${
                    isMasked
                      ? 'border-fuchsia-400/70 bg-fuchsia-500/25 text-fuchsia-200 shadow-[0_0_14px_-2px_rgba(232,121,249,0.6)] hover:bg-fuchsia-500/40'
                      : 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/25'
                  }`}
                >
                  {row},{col}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-400 sm:text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-cyan-400/60 bg-cyan-400/20" />
              visible ({visibleCount}) → l'IA les voit
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-fuchsia-400/60 bg-fuchsia-500/25" />
              masqué ({maskedCount}) → l'IA doit deviner
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <FlowStep
            color="cyan"
            title="1. Elle regarde ce qui est visible"
            subtitle={`${visibleCount} cases visibles → un résumé Sx (encodeur de contexte)`}
          />
          <FlowArrow label="elle essaie de prédire la suite" />
          <FlowStep
            color="amber"
            title="2. Elle devine — sans voir les pixels cachés"
            subtitle="le prédicteur produit une estimation Ŝy pour chaque case cachée"
          />
          <FlowArrow label="on compare le résumé deviné au vrai résumé (pas les pixels)" dashed />
          <FlowStep
            color="fuchsia"
            title="3. On vérifie sa réponse"
            subtitle={`${maskedCount} cases cachées → le vrai résumé Sy sert de correction`}
          />
        </div>
      </div>
    </div>
  )
}

function FlowStep({
  color,
  title,
  subtitle,
}: {
  color: 'cyan' | 'fuchsia' | 'amber' | 'violet' | 'rose' | 'slate'
  title: string
  subtitle: string
}) {
  const styles = {
    cyan: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200',
    fuchsia: 'border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-200',
    amber: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
    violet: 'border-violet-400/50 bg-violet-500/10 text-violet-200',
    rose: 'border-rose-400/50 bg-rose-500/10 text-rose-200',
    slate: 'border-slate-600 bg-slate-800/50 text-slate-200',
  }[color]
  return (
    <div className={`rounded-xl border px-4 py-3 transition-transform duration-200 hover:scale-[1.02] ${styles}`}>
      <p className="text-sm font-semibold sm:text-base">{title}</p>
      <p className="mt-1 font-mono text-[11px] leading-5 text-slate-300">{subtitle}</p>
    </div>
  )
}

function FlowArrow({ label, dashed, down = true }: { label: string; dashed?: boolean; down?: boolean }) {
  if (!down) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-1 text-[10px] text-slate-500">
        <span className={`h-px w-full ${dashed ? 'border-t border-dashed border-slate-600' : 'bg-slate-600'}`} />
        <span className="mt-1 text-center leading-tight">{label} →</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 pl-2 text-[11px] text-slate-500">
      <span className={`h-6 w-px ${dashed ? 'border-l border-dashed border-slate-600' : 'bg-slate-600'}`} />
      <span>↓ {label}</span>
    </div>
  )
}

// ============================================================================
// 2. Explorateur d'espace latent vs variable latente (Chapitre 2)
// ============================================================================
type LatentPoint = { x: number; y: number; z: number; category: string }

const CLUSTER_CENTERS: { category: string; cx: number; cy: number; color: string }[] = [
  { category: 'chat', cx: -6, cy: 4, color: '#22d3ee' },
  { category: 'chien', cx: -5, cy: -3, color: '#38bdf8' },
  { category: 'voiture', cx: 5, cy: 5, color: '#a78bfa' },
  { category: 'route', cx: 6, cy: -4, color: '#f472b6' },
]

function seedLatentPoints(): LatentPoint[] {
  const points: LatentPoint[] = []
  CLUSTER_CENTERS.forEach((cluster) => {
    for (let i = 0; i < 9; i++) {
      points.push({
        x: cluster.cx + (Math.random() - 0.5) * 3,
        y: cluster.cy + (Math.random() - 0.5) * 3,
        z: 40,
        category: cluster.category,
      })
    }
  })
  return points
}

function randomZ() {
  return { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 }
}

function LatentSpaceExplorer() {
  const [points] = useState<LatentPoint[]>(() => seedLatentPoints())
  const [zPoint, setZPoint] = useState(randomZ())
  const [focus, setFocus] = useState<'space' | 'variable'>('space')

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Espace vs variable</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            « Espace latent » et « variable latente » — ce n'est pas la même chose
          </h3>
        </div>
        <div className="flex rounded-full border border-slate-700 bg-slate-800/60 p-1 text-xs">
          <button
            onClick={() => setFocus('space')}
            className={`rounded-full px-4 py-2 font-medium transition ${
              focus === 'space' ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Espace latent
          </button>
          <button
            onClick={() => setFocus('variable')}
            className={`rounded-full px-4 py-2 font-medium transition ${
              focus === 'variable' ? 'bg-amber-400/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Variable latente z
          </button>
        </div>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div
          className={`h-72 rounded-2xl border p-4 transition-shadow ${
            focus === 'space'
              ? 'border-cyan-400/50 shadow-[0_0_40px_-12px_rgba(34,211,238,0.6)]'
              : 'border-slate-700'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis type="number" dataKey="x" tick={false} stroke="#334155" label={{ value: 'dim. i', position: 'insideBottom', fill: '#64748b', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" tick={false} stroke="#334155" label={{ value: 'dim. j', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <ZAxis type="number" dataKey="z" range={[40, 41]} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelFormatter={() => ''}
                formatter={(_value: number, _name: string, entry: any) => [entry?.payload?.category, 'embedding']}
              />
              <Scatter data={points} fillOpacity={focus === 'variable' ? 0.25 : 0.85}>
                {points.map((p, i) => (
                  <Cell key={i} fill={CLUSTER_CENTERS.find((c) => c.category === p.category)?.color ?? '#22d3ee'} />
                ))}
              </Scatter>
              <Scatter
                data={[{ x: zPoint.x, y: zPoint.y, z: focus === 'variable' ? 220 : 90, category: 'z' }]}
                shape="diamond"
                fill="#fbbf24"
                fillOpacity={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-between">
          {focus === 'space' ? (
            <div className="space-y-3 text-base leading-7 text-slate-300">
              <p>
                L'<strong className="text-cyan-300">espace latent</strong>, c'est tout le nuage de points
                ci-contre : l'ensemble des résumés que l'IA peut produire. Chaque point est le résumé d'un
                morceau d'image — les objets similaires (chat/chien, voiture/route) se regroupent
                naturellement pendant l'entraînement, sans qu'on leur ait jamais donné d'étiquette.
              </p>
              <p className="text-slate-400">
                On parle d'« espace latent » quand on décrit la <em>structure globale</em> : sa taille, sa
                forme, le fait que des concepts proches y soient proches.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-base leading-7 text-slate-300">
              <p>
                La <strong className="text-amber-300">variable latente z</strong> (le losange orange) est un
                seul point, tiré pour une prédiction précise — pas tout l'espace. Elle encode « la partie de
                la réponse qu'on ne peut pas deviner à partir du contexte seul » (ex. la voiture tourne-t-elle
                à gauche ou à droite ?).
              </p>
              <p className="text-slate-400">
                On parle de « variable latente » quand on décrit un <em>choix ponctuel</em> fait pour une
                prédiction donnée — d'où le nom : une variable, pas un espace entier.
              </p>
            </div>
          )}
          <button
            onClick={() => setZPoint(randomZ())}
            className="mt-4 self-start rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:scale-105 hover:bg-amber-400/20 active:scale-95"
          >
            ↺ Ré-échantillonner z
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 3. Frise chronologique (Chapitre 4)
// ============================================================================
const TIMELINE = [
  { year: '1990', title: 'RNN world model', detail: 'Schmidhuber — contrôleur + modèle du monde récurrent, rollouts imaginés pour planifier.' },
  { year: '2018', title: 'World Models (Ha & Schmidhuber)', detail: 'VAE + LSTM + petit contrôleur — un agent joue "dans son rêve" et bat l\'agent entraîné en direct.' },
  { year: '2020', title: 'DreamerV2', detail: 'Espace latent discret (RSSM) — premier agent à score humain sur les 55 jeux Atari, entraîné en imagination.' },
  { year: '2022', title: 'JEPA (LeCun)', detail: 'Architecture modulaire à 6 blocs ; prédiction en espace de représentation, pas en pixels.' },
  { year: '2024', title: 'Sora (OpenAI)', detail: 'Présenté comme "world simulator" — génération vidéo respectant approximativement des lois physiques.' },
  { year: '2025', title: 'Cosmos, Genie 3, Marble', detail: 'NVIDIA, DeepMind, World Labs — passage du labo au produit ; Genie 3 : mondes 3D interactifs en temps réel.' },
  { year: '2026', title: 'AMI Labs, Physis v0.1', detail: 'LeCun quitte Meta pour AMI Labs (JEPA) ; BAAI publie un "general world foundation model".' },
]

function Timeline() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <p className="relative text-xs uppercase tracking-[0.35em] text-cyan-300/80">Chronologie</p>
      <h3 className="relative mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">Des RNN de 1990 aux world models commerciaux</h3>
      <div className="relative mt-8 space-y-0">
        {TIMELINE.map((item, i) => (
          <div
            key={item.year}
            className="flex gap-5"
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-all duration-300 ${
                  activeIdx === i
                    ? 'scale-125 border-cyan-300 bg-cyan-400/30 text-cyan-100 shadow-[0_0_18px_-2px_rgba(34,211,238,0.8)]'
                    : 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {i < TIMELINE.length - 1 && <span className="w-px flex-1 bg-slate-700" />}
            </div>
            <div className="pb-8">
              <p className="font-mono text-xs text-amber-300/90">{item.year}</p>
              <p className={`mt-1 text-lg font-semibold transition-colors ${activeIdx === i ? 'text-cyan-200' : 'text-slate-100'}`}>
                {item.title}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 4. LLM vs World Model — comparaison (Chapitre 3)
// ============================================================================
const COMPARISON = [
  { axis: 'Ce qui est prédit', llm: 'Le token suivant (mot)', wm: "L'état futur de l'environnement" },
  { axis: 'Nature de la prédiction', llm: 'Statistique (corrélation)', wm: 'Causale / simulée (intervention)' },
  { axis: 'Mémoire', llm: 'Statique — poids figés après entraînement', wm: 'Dynamique — état latent mis à jour en continu' },
  { axis: 'Résultat sur planification (Flux)', llm: '~11% de victoires', wm: '~79% de victoires (accès à l\'espace latent)' },
]

function ComparisonGrid() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-[90px]"
        aria-hidden="true"
      />
      <p className="relative text-xs uppercase tracking-[0.35em] text-fuchsia-300/80">Le diagnostic</p>
      <h3 className="relative mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">Pourquoi un LLM n'est pas un world model</h3>
      <p className="relative mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
        Un LLM sait « mettre des mots les uns à la suite des autres » de façon très convaincante. Un world
        model, lui, a une idée — même grossière — de comment le <em>monde</em> évolue. D'où l'hallucination
        structurelle du premier : ce n'est pas un bug, c'est l'absence d'une simulation du monde derrière
        les mots.
      </p>
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700">
        <div className="grid grid-cols-3 bg-slate-800/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div className="p-3">Axe</div>
          <div className="p-3 text-cyan-300">LLM classique</div>
          <div className="p-3 text-amber-300">World model</div>
        </div>
        {COMPARISON.map((row, i) => (
          <div
            key={row.axis}
            className={`grid grid-cols-3 text-sm transition-colors hover:bg-slate-800/40 ${i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'}`}
          >
            <div className="p-3 font-medium text-slate-200">{row.axis}</div>
            <div className="p-3 text-slate-400">{row.llm}</div>
            <div className="p-3 text-slate-300">{row.wm}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 4b. Comparateur d'échelle de paramètres (log scale, interactif) — Chapitre 5
// ============================================================================
const PARAM_SCALE: { id: string; label: string; family: FamilyKey; millions: number; note: string }[] = [
  { id: 'wm18', label: 'World Models (C)', family: 'rl', millions: 0.001, note: '~1 000 paramètres — le contrôleur seul' },
  { id: 'ijepa', label: 'I-JEPA ViT-B', family: 'jepa', millions: 86, note: '86M — encodeur ViT-B/16' },
  { id: 'mae', label: 'ViT-MAE base', family: 'mae', millions: 86, note: '86M — encodeur + décodeur léger' },
  { id: 'videomae', label: 'VideoMAE base', family: 'mae', millions: 86, note: '86M — extension vidéo de MAE' },
  { id: 'dino', label: 'DINOv2 base', family: 'semantic', millions: 86, note: '86M — student/teacher ViT-B' },
  { id: 'clip', label: 'CLIP ViT-B/16', family: 'semantic', millions: 150, note: '~150M — deux encodeurs combinés' },
  { id: 'vjepa2', label: 'V-JEPA2 ViT-L', family: 'jepa', millions: 300, note: '~300M — encodeur vidéo ViT-L' },
  { id: 'dreamer', label: 'DreamerV3 (XL)', family: 'rl', millions: 200, note: 'jusqu\'à ~200M selon la taille choisie' },
  { id: 'tdmpc2', label: 'TD-MPC2 (5 tâches)', family: 'rl', millions: 300, note: '5M à 300M selon le nombre de tâches' },
  { id: 'sana', label: 'SANA-WM', family: 'generative', millions: 600, note: '~600M — estimation, non confirmée publiquement' },
  { id: 'cosmos', label: 'Cosmos 3 Nano', family: 'generative', millions: 16000, note: '16B — variante "edge" temps réel' },
  { id: 'genie', label: 'Genie 3', family: 'generative', millions: 20000, note: 'non divulgué — ordre de grandeur estimé' },
]

function ParamScaleBand() {
  const [hovered, setHovered] = useState<string | null>(null)
  const sorted = useMemo(() => [...PARAM_SCALE].sort((a, b) => a.millions - b.millions), [])
  const minLog = Math.log10(Math.min(...sorted.map((s) => s.millions)))
  const maxLog = Math.log10(Math.max(...sorted.map((s) => s.millions)))

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <p className="relative text-xs uppercase tracking-[0.35em] text-rose-300/80">Ordres de grandeur</p>
      <h3 className="relative mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
        Du contrôleur à 1 000 paramètres au modèle à 16 milliards
      </h3>
      <p className="relative mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
        Échelle logarithmique : chaque barre représente un facteur ×10 par rapport à la précédente. Survole
        une barre pour voir le détail — la taille du modèle ne dit rien de sa qualité, seulement de son coût
        de calcul.
      </p>
      <div className="relative mt-8 space-y-2.5">
        {sorted.map((m) => {
          const style = FAMILY_STYLES[m.family]
          const pct = ((Math.log10(m.millions) - minLog) / (maxLog - minLog)) * 100
          const widthPct = Math.max(pct, 3)
          const isHovered = hovered === m.id
          return (
            <div
              key={m.id}
              className="group flex items-center gap-3"
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-32 shrink-0 truncate text-right text-[11px] text-slate-400 group-hover:text-slate-200">
                {m.label}
              </span>
              <div className="relative h-6 flex-1 rounded-full bg-slate-800/60">
                <div
                  className={`h-6 rounded-full transition-all duration-500 ${style.dot} ${
                    isHovered ? 'opacity-100 shadow-[0_0_18px_-2px] ' : 'opacity-70'
                  }`}
                  style={{ width: `${widthPct}%`, boxShadow: isHovered ? `0 0 18px -2px ${style.hex}` : undefined }}
                />
                {isHovered && (
                  <div className="pointer-events-none absolute left-0 top-7 z-10 w-64 rounded-lg border border-slate-700 bg-slate-950/95 p-2.5 text-[10px] leading-4 text-slate-300 shadow-xl">
                    <span className={style.text}>{m.note}</span>
                  </div>
                )}
              </div>
              <span className="w-20 shrink-0 text-left font-mono text-[10px] text-slate-500">
                {m.millions >= 1000 ? `${(m.millions / 1000).toFixed(m.millions % 1000 === 0 ? 0 : 1)}B` : `${m.millions}M`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// 5. Le Cabinet : les 12 modèles, mécaniques d'entraînement détaillées (Chapitre 8)
// ============================================================================

const MASK_GRID_COLS = 10
const MASK_GRID_ROWS = 6
const MASK_TOTAL = MASK_GRID_COLS * MASK_GRID_ROWS

function makeUnionBlocks(seed: number, count: number, scale: number, aspectRange: [number, number] = [0.75, 1.5]) {
  const rng = mulberry32(seed)
  const s = new Set<number>()
  for (let i = 0; i < count; i++) {
    const ar = aspectRange[0] + rng() * (aspectRange[1] - aspectRange[0])
    const area = MASK_TOTAL * scale
    const h = Math.max(1, Math.min(MASK_GRID_ROWS, Math.round(Math.sqrt(area / ar))))
    const w = Math.max(1, Math.min(MASK_GRID_COLS, Math.round(Math.sqrt(area * ar))))
    const top = Math.floor(rng() * (MASK_GRID_ROWS - h + 1))
    const left = Math.floor(rng() * (MASK_GRID_COLS - w + 1))
    for (let r = top; r < top + h; r++) for (let c = left; c < left + w; c++) s.add(r * MASK_GRID_COLS + c)
  }
  return s
}

function makeRandomSet(seed: number, ratio: number) {
  const rng = mulberry32(seed)
  const indices = Array.from({ length: MASK_TOTAL }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return new Set(indices.slice(0, Math.round(MASK_TOTAL * ratio)))
}

type MaskConfig =
  | { kind: 'jepa-image'; targetBlocks: number; targetScale: number }
  | { kind: 'jepa-video-tube'; shortBlocks: number; shortScale: number; longBlocks: number; longScale: number }
  | { kind: 'mae-random'; ratio: number }
  | { kind: 'mae-random-tube'; ratio: number }

function computeMask(seed: number, cfg: MaskConfig): { target: Set<number>; ratioLabel: string } {
  if (cfg.kind === 'jepa-image') {
    const target = makeUnionBlocks(seed, cfg.targetBlocks, cfg.targetScale, [0.75, 1.5])
    return { target, ratioLabel: `${Math.round((target.size / MASK_TOTAL) * 100)}% cible (contexte = reste)` }
  }
  if (cfg.kind === 'jepa-video-tube') {
    const short = makeUnionBlocks(seed, cfg.shortBlocks, cfg.shortScale, [0.75, 1.5])
    const long = makeUnionBlocks(seed + 101, cfg.longBlocks, cfg.longScale, [0.75, 1.5])
    const target = new Set<number>([...short, ...long])
    return { target, ratioLabel: `~${Math.round((target.size / MASK_TOTAL) * 100)}% masqué, répété en tube sur le temps` }
  }
  if (cfg.kind === 'mae-random-tube') {
    const target = makeRandomSet(seed, cfg.ratio)
    return { target, ratioLabel: `~${Math.round(cfg.ratio * 100)}% masqué aléatoirement, tubes spatio-temporels` }
  }
  const target = makeRandomSet(seed, cfg.ratio)
  return { target, ratioLabel: `~${Math.round(cfg.ratio * 100)}% masqué aléatoirement, patch par patch` }
}

function MaskGridPreview({ seed, cfg, family }: { seed: number; cfg: MaskConfig; family: FamilyKey }) {
  const { target, ratioLabel } = useMemo(() => computeMask(seed, cfg), [seed, cfg])
  const style = FAMILY_STYLES[family]
  const isJepa = cfg.kind === 'jepa-image' || cfg.kind === 'jepa-video-tube'
  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${MASK_GRID_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: MASK_TOTAL }, (_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[2px] transition-colors ${
              target.has(i) ? style.dot + ' opacity-80' : 'bg-slate-800/70'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        <span className={style.text}>{ratioLabel}</span>
        {isJepa ? ' — masqué = cible du prédicteur, jamais vu par l\'encodeur de contexte.' : ' — masqué = reconstruit en pixels par le décodeur.'}
      </p>
    </div>
  )
}

function DreamLoopDiagram() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <FlowStep color="amber" title="V — VAE" subtitle="frame pixel → vecteur latent (32 dims)" />
        <FlowStep color="amber" title="M — MDN-RNN" subtitle="prédit le prochain vecteur latent + récompense" />
        <FlowStep color="amber" title="C — Contrôleur" subtitle="~1000 paramètres → action, à partir de V+M" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-2 text-[11px] text-amber-200">
        ↺ Le contrôleur est entraîné entièrement « dans le rêve » de M — aucune interaction avec l'environnement réel pendant cette phase.
      </div>
      <p className="text-[11px] leading-5 text-slate-400">
        Score rapporté par les auteurs : un agent entraîné uniquement en rêve obtient un score comparable
        ou supérieur à un agent entraîné en direct dans l'environnement (les chiffres exacts varient selon
        les versions du papier et de l'expérience — 906±77 vs 820±58 dans une version, jusqu'à ~1600 vs
        ~600 dans une autre).
      </p>
    </div>
  )
}

function RssmDiagram() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <FlowStep color="amber" title="Encodeur" subtitle="observation pixel → embedding" />
        <FlowStep color="amber" title="RSSM" subtitle="état récurrent (déterministe + latent catégoriel)" />
        <FlowStep color="amber" title="Têtes prédictives" subtitle="reconstruction, récompense, continuation" />
        <FlowStep color="amber" title="Acteur-critique" subtitle="entraîné sur des rollouts imaginés en latent" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-2 text-[11px] text-amber-200">
        ↺ Imagination multi-pas entièrement dans l'espace latent — l'environnement réel n'est touché que
        pour exécuter la 1ʳᵉ action (horizon glissant, comme un MPC).
      </div>
      <p className="text-[11px] leading-5 text-slate-400">
        DreamerV2/V3 : premier agent latent à atteindre un score de niveau humain sur les 55 jeux Atari,
        entraîné uniquement via ce cycle d'imagination.
      </p>
    </div>
  )
}

function MpcDiagram() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <FlowStep color="amber" title="Encodeur" subtitle="observation → état latent z" />
        <FlowStep color="amber" title="Modèle de dynamique" subtitle="prédit z(t+1) à partir de (z(t), a(t))" />
        <FlowStep color="amber" title="Modèles récompense / Q" subtitle="score chaque trajectoire simulée" />
        <FlowStep color="amber" title="Planificateur (MPPI/CEM)" subtitle="échantillonne des séquences d'actions, garde la meilleure" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-2 text-[11px] text-amber-200">
        ↺ Seule la première action du meilleur plan est exécutée, puis on replanifie — exactement le
        schéma « Mode-2 / MPC » décrit dans l'architecture cognitive de LeCun.
      </div>
      <p className="text-[11px] leading-5 text-slate-400">
        TD-MPC2 combine dynamique latente apprise et recherche en ligne — utile pour le contrôle continu
        multi-tâches (locomotion, manipulation).
      </p>
    </div>
  )
}

function ContrastiveDiagram() {
  const seed = 7
  const rng = mulberry32(seed)
  const n = 5
  const grid = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0.72 + rng() * 0.2 : 0.05 + rng() * 0.25)),
  )
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FlowStep color="violet" title="Encodeur image" subtitle="image → embedding partagé" />
        <FlowStep color="violet" title="Encodeur texte" subtitle="légende → embedding partagé, même espace" />
      </div>
      <p className="text-[11px] text-slate-400">
        Matrice de similarité cosinus sur un batch (illustrative) — la diagonale (paires vraies) est tirée
        vers le haut, le reste vers le bas (perte InfoNCE symétrique image↔texte) :
      </p>
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {grid.flatMap((row, i) =>
          row.map((v, j) => (
            <div
              key={`${i}-${j}`}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[9px] font-mono text-slate-950"
              style={{ backgroundColor: `rgba(167,139,250,${v})`, color: v > 0.5 ? '#0f172a' : '#cbd5e1' }}
              title={`sim(image${i}, texte${j}) = ${v.toFixed(2)}`}
            >
              {v.toFixed(2)}
            </div>
          )),
        )}
      </div>
    </div>
  )
}

function TeacherStudentDiagram() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-400">
        Multi-crop : 2 vues globales (grandes, forte résolution) + plusieurs vues locales (petites, basse
        résolution) d'une même image, sans label.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-violet-300/80">Student (gradient)</p>
          <FlowStep color="violet" title="Toutes les vues" subtitle="globales + locales → prédiction de distribution" />
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-violet-300/80">Teacher (EMA, pas de gradient)</p>
          <FlowStep color="violet" title="Vues globales seulement" subtitle="θ̄ ← λθ̄ + (1−λ)θ — cible à imiter" />
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-violet-400/40 bg-violet-400/5 px-4 py-2 text-[11px] text-violet-200">
        Anti-effondrement par centrage + affûtage (« sharpening ») de la distribution du teacher — une
        stratégie différente de la régularisation variance/covariance de JEPA (VICReg), même objectif :
        empêcher toutes les sorties de converger vers une constante.
      </div>
    </div>
  )
}

function DiffusionDiagram({ label }: { label: string }) {
  const steps = ['t = T (bruit pur)', 't = 3T/4', 't = T/2', 't = T/4', 't = 0 (sortie)']
  return (
    <div className="space-y-3">
      <FlowStep color="rose" title="Conditionnement" subtitle="texte, image de départ, action, ou frames passées" />
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className="flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-rose-400/40 text-center text-[9px] text-rose-200"
              style={{ backgroundColor: `rgba(251,113,133,${0.06 + (i / (steps.length - 1)) * 0.22})` }}
            >
              {s}
            </div>
            {i < steps.length - 1 && <span className="shrink-0 text-slate-600">→</span>}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-rose-400/40 bg-rose-400/5 px-4 py-2 text-[11px] text-rose-200">
        {label}
      </div>
    </div>
  )
}

function AutoregressiveDiagram() {
  const frames = ['frame 1', 'frame 2', 'frame 3', 'frame 4', 'frame 5']
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {frames.map((f, i) => (
          <div key={f} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border border-rose-400/40 bg-rose-400/10 text-[10px] text-rose-200">
                {f}
              </div>
              <span className="text-[9px] text-slate-500">↑ action utilisateur</span>
            </div>
            {i < frames.length - 1 && <span className="shrink-0 text-slate-600">→</span>}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-rose-400/40 bg-rose-400/5 px-4 py-2 text-[11px] text-rose-200">
        Génération image par image en temps réel (~24 img/s, ~720p), chaque frame conditionnée sur
        l'historique et sur l'action envoyée par l'utilisateur à cet instant — un monde jouable, pas une
        vidéo pré-calculée.
      </div>
    </div>
  )
}

function LossSparkline({ seed, color }: { seed: number; color: string }) {
  const points = useMemo(() => {
    const rng = mulberry32(seed)
    const n = 24
    const vals: number[] = []
    let v = 0.9 + rng() * 0.1
    for (let i = 0; i < n; i++) {
      const decay = Math.exp(-i / (7 + rng() * 4))
      const noise = (rng() - 0.5) * 0.04
      v = 0.08 + decay * (0.9 - 0.08) + noise
      vals.push(Math.max(0.03, v))
    }
    return vals
  }, [seed])

  const w = 220
  const h = 48
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - v * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 5"
        className="motion-safe:animate-[dash-flow_2.2s_linear_infinite]"
      />
      <path d={path} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -22; }
        }
      `}</style>
    </svg>
  )
}

// --- Catalogue des 12 modèles, enrichi (année, paramètres, faits additionnels) ---
type Mechanics =
  | { kind: 'mask'; cfg: MaskConfig }
  | { kind: 'dream-loop' }
  | { kind: 'rssm' }
  | { kind: 'mpc' }
  | { kind: 'contrastive' }
  | { kind: 'teacher-student' }
  | { kind: 'diffusion'; note: string }
  | { kind: 'autoregressive' }

interface ModelSpec {
  id: string
  displayName: string
  fullName: string
  family: FamilyKey
  year: string
  params: string
  input: string
  output: string
  utility: string
  facts: string[]
  mechanics: Mechanics
}

const MODEL_SPECS: ModelSpec[] = [
  {
    id: 'ijepa_vitb16_1k',
    displayName: 'JEPA',
    fullName: 'I-JEPA (ViT-B/16, ImageNet-1K)',
    family: 'jepa',
    year: '2023',
    params: '86M',
    input:
      "Image statique découpée en patches (14×14 ou 16×16 px). Un grand bloc de contexte (échelle 0.85–1.0 de l'image) et 4 blocs cibles plus petits (échelle 0.15–0.2 chacun) sont échantillonnés, sans chevauchement.",
    output:
      "Embeddings latents prédits (Ŝy) pour les 4 blocs cibles — comparés en espace latent (MSE) aux vraies embeddings produites par l'encodeur cible EMA. Jamais de pixels reconstruits.",
    utility:
      "Backbone visuel auto-supervisé réutilisable : classification, détection, segmentation en aval, sans étiquettes pendant le pré-entraînement.",
    facts: [
      "Publié par Meta AI (LeCun et al.), premier JEPA d'image à grande échelle.",
      "Pas d'augmentation de données forte (crop/color jitter) contrairement à DINO — le masquage seul suffit.",
      "Encodeur cible mis à jour par moyenne mobile exponentielle (EMA), jamais par rétropropagation directe.",
    ],
    mechanics: { kind: 'mask', cfg: { kind: 'jepa-image', targetBlocks: 4, targetScale: 0.17 } },
  },
  {
    id: 'vjepa2_vitl_fpc64_256',
    displayName: 'JEPA',
    fullName: 'V-JEPA2 (ViT-L, 64 frames, 256px)',
    family: 'jepa',
    year: '2025',
    params: '300M',
    input:
      'Clip vidéo (64 frames), grille spatio-temporelle 32×16×16. Masquage "multiblock3d" vérifié : union de 8 blocs courts (~15% de la frame) et 2 blocs longs (~70%), la même empreinte spatiale étant répétée en tube sur toute la durée du clip.',
    output:
      "Embeddings latents futurs prédits pour les tubes masqués (jusqu'à ~80% des tokens). Dans un test réel sur un clip, similarité cosinus prédite/vraie ≈0.54 contre ≈0.37 pour un contrôle mélangé — preuve d'une prédiction spécifique à la position, pas générique.",
    utility:
      "Compréhension d'action vidéo (Something-Something v2), et base pour un prédicteur conditionné par l'action en robotique (rollouts latents).",
    facts: [
      "Successeur direct de V-JEPA (2024), entraîné sur bien plus d'heures de vidéo.",
      "Utilisé comme composant de prédiction pour des politiques de contrôle robotique en zero-shot.",
      "Le masquage en tube force le modèle à prédire une continuité temporelle, pas juste spatiale.",
    ],
    mechanics: {
      kind: 'mask',
      cfg: { kind: 'jepa-video-tube', shortBlocks: 8, shortScale: 0.15, longBlocks: 2, longScale: 0.7 },
    },
  },
  {
    id: 'vit_mae_base',
    displayName: 'MAE',
    fullName: 'ViT-MAE (base)',
    family: 'mae',
    year: '2021',
    params: '86M',
    input: "Image découpée en patches, masquage aléatoire indépendant patch par patch (~75% des patches retirés).",
    output: "Pixels reconstruits pour les patches masqués, via un décodeur léger recevant tokens visibles + tokens de masque.",
    utility: "Baseline de reconstruction pixel ; sert de point de comparaison direct avec I-JEPA (latent vs pixel) sur la même famille de tâches.",
    facts: [
      "Le décodeur est volontairement léger et asymétrique — tout le calcul lourd reste dans l'encodeur.",
      "Un ratio de masquage aussi élevé (75%) est ce qui rend la tâche non triviale malgré le manque de structure du masque.",
      "Sert historiquement de référence pour évaluer si JEPA apporte un vrai gain à structure de masquage égale.",
    ],
    mechanics: { kind: 'mask', cfg: { kind: 'mae-random', ratio: 0.75 } },
  },
  {
    id: 'videomae_base',
    displayName: 'MAE',
    fullName: 'VideoMAE (base)',
    family: 'mae',
    year: '2022',
    params: '86M',
    input: "Clip vidéo, masquage aléatoire très agressif de tubes spatio-temporels (~90% masqué).",
    output: "Pixels reconstruits des tubes masqués, comparés aux pixels réels (perte L2 en espace pixel).",
    utility: "Représentations vidéo pour la reconnaissance d'action ; contraste direct avec V-JEPA2 (pixel vs latent, même modalité vidéo).",
    facts: [
      "Le ratio de masquage extrême (90%) compense la forte redondance temporelle des vidéos.",
      "Entraîné sans aucune donnée annotée, uniquement sur des clips bruts.",
      "Comparé côte à côte à V-JEPA2 sur la plateforme pour illustrer pixel vs latent en vidéo.",
    ],
    mechanics: { kind: 'mask', cfg: { kind: 'mae-random-tube', ratio: 0.9 } },
  },
  {
    id: 'clip_vit_base_patch16',
    displayName: 'CLIP',
    fullName: 'CLIP (ViT-B/16)',
    family: 'semantic',
    year: '2021',
    params: '150M',
    input: "Paires (image, légende texte) — pas de masquage, tout le contenu est visible des deux côtés.",
    output: "Deux embeddings alignés dans un espace multimodal partagé, entraînés par contrastif (InfoNCE) pour que les paires vraies aient une similarité cosinus élevée.",
    utility: "Classification zero-shot, retrieval image-texte ; référence d'alignement sémantique pour l'évaluation des autres modèles.",
    facts: [
      "Entraîné sur ~400M paires image-texte collectées sur le web (WIT).",
      "Aucune étiquette de classe explicite — la supervision vient entièrement du texte associé.",
      "Sert de test d'alignement texte-image (T11) sur la plateforme, en comparaison des autres familles.",
    ],
    mechanics: { kind: 'contrastive' },
  },
  {
    id: 'dinov2_base',
    displayName: 'DINOv2',
    fullName: 'DINOv2 (base)',
    family: 'semantic',
    year: '2023',
    params: '86M',
    input: "Image, découpée en vues multiples (multi-crop) : 2 vues globales + plusieurs vues locales, sans label.",
    output: "Embeddings denses ; le student prédit la distribution produite par le teacher (EMA du student) — pas de reconstruction pixel.",
    utility: "Features visuelles générales exploitables sans fine-tuning ; benchmark de structuration sémantique pour les autres modèles de la plateforme.",
    facts: [
      "Combine des idées de DINO (auto-distillation) et iBOT (masquage) dans une seule recette.",
      "Entraîné sur un jeu de données curaté automatiquement (LVD-142M), sans annotation humaine.",
      "Les features sont si structurées qu'elles permettent une segmentation non supervisée par simple clustering.",
    ],
    mechanics: { kind: 'teacher-student' },
  },
  {
    id: 'world_models_ha_schmidhuber',
    displayName: 'World Models (VAE-RNN-Controller)',
    fullName: 'World Models — Ha & Schmidhuber (2018)',
    family: 'rl',
    year: '2018',
    params: '~1K (contrôleur)',
    input: "Frames pixel de l'environnement (ex. VizDoom TakeCover).",
    output: "Vecteur latent (V, VAE) → état latent prédit (M, MDN-RNN) → action choisie par un petit contrôleur C (~1000 paramètres).",
    utility: "Le contrôleur s'entraîne entièrement « dans le rêve » de M, sans jamais interagir avec l'environnement réel pendant cette phase — un des tout premiers world models modernes.",
    facts: [
      "Le contrôleur C est optimisé par stratégie évolutive (CMA-ES), pas par descente de gradient.",
      "Popularisé par un article interactif largement partagé (distill.pub), au-delà du cercle académique.",
      "Point de départ conceptuel direct de toute la lignée DreamerV1→V3.",
    ],
    mechanics: { kind: 'dream-loop' },
  },
  {
    id: 'dreamerv3',
    displayName: 'Dreamer',
    fullName: 'DreamerV3',
    family: 'rl',
    year: '2023',
    params: 'jusqu\'à 200M',
    input: "Observations pixel + récompense de l'environnement.",
    output: "États latents imaginés (rollouts multi-pas dans un RSSM à variables catégorielles discrètes) et politique acteur-critique entraînée entièrement sur ces rollouts.",
    utility: "RL efficace en échantillons pour contrôle continu, robotique, jeux — la politique n'interagit avec le monde réel que pour exécuter l'action, jamais pendant son entraînement.",
    facts: [
      "Un seul jeu d'hyperparamètres fonctionne sur plus de 150 tâches différentes, sans réglage par tâche.",
      "Premier agent à extraire des diamants dans Minecraft sans apprentissage préalable spécifique à la tâche.",
      "Les variables latentes catégorielles (plutôt que continues) stabilisent fortement l'entraînement du RSSM.",
    ],
    mechanics: { kind: 'rssm' },
  },
  {
    id: 'tdmpc2',
    displayName: 'TD-MPC',
    fullName: 'TD-MPC2',
    family: 'rl',
    year: '2023',
    params: '5M – 300M',
    input: "Observation (état ou pixels) + banque d'actions candidates à évaluer.",
    output: "État latent suivant prédit + valeur/récompense estimée pour chaque trajectoire candidate, utilisés pour sélectionner la meilleure séquence d'actions en ligne.",
    utility: "Contrôle continu multi-tâches (locomotion, manipulation) via optimisation de trajectoires en espace latent — équivalent pratique du Mode-2/MPC de l'architecture LeCun.",
    facts: [
      "Un unique modèle de 300M de paramètres peut être entraîné sur 80 tâches simultanément.",
      "Combine apprentissage par différence temporelle (TD) et planification en ligne (MPC), d'où le nom.",
      "Aucune reconstruction de pixels n'est jamais nécessaire — tout se passe dans l'espace latent appris.",
    ],
    mechanics: { kind: 'mpc' },
  },
  {
    id: 'nvidia_cosmos3_edge',
    displayName: 'Cosmos',
    fullName: 'Cosmos 3 (Edge/Nano, NVIDIA)',
    family: 'generative',
    year: '2025',
    params: '16B (Nano)',
    input: "Vidéo/flux capteurs + conditionnement (texte ou action). Nano : 16B paramètres, pensé pour l'inférence temps réel embarquée.",
    output: "Vidéo générée qui prédit l'évolution physique de la scène, avec tokens d'action optionnels en sortie.",
    utility: "Raisonnement physique temps réel embarqué pour la robotique et la conduite autonome ; génération de données synthétiques annotées.",
    facts: [
      "Décliné en plusieurs tailles (Nano/Edge, Super) selon le compromis latence/qualité recherché.",
      "Pensé pour tourner sur du matériel embarqué de véhicule ou de robot, pas seulement en datacenter.",
      "Peut aussi servir de simulateur pour générer des données d'entraînement synthétiques à grande échelle.",
    ],
    mechanics: { kind: 'diffusion', note: "Cosmos 3 combine génération de monde par diffusion et conscience physique — la variante Super (64B) sert plutôt à la génération de données synthétiques à grande échelle, hors ligne." },
  },
  {
    id: 'nvidia_sana_wm',
    displayName: 'Cosmos',
    fullName: 'SANA-WM (famille Cosmos, NVIDIA)',
    family: 'generative',
    year: '2025',
    params: '~600M',
    input: "Frames passées + conditionnement texte/action.",
    output: "Frames futures générées par un processus de diffusion (débruitage itératif de dizaines d'étapes).",
    utility: "Simulation vidéo du monde à haute résolution, alternative moins coûteuse que les variantes Cosmos les plus lourdes pour certains cas d'usage.",
    facts: [
      "Conçu comme option plus légère que Cosmos 3 Super pour des déploiements avec budget de calcul réduit.",
      "Le coût d'inférence dépend directement du nombre d'étapes de débruitage choisi.",
      "Peut être conditionné à la fois par du texte et par des actions discrètes selon le cas d'usage.",
    ],
    mechanics: { kind: 'diffusion', note: "Comme Sora et Cosmos, SANA-WM génère image par image via débruitage — le coût d'inférence scale avec le nombre d'étapes de diffusion et l'horizon de planification, contrairement à un LLM (coût linéaire en longueur de séquence)." },
  },
  {
    id: 'genie3',
    displayName: 'Genie',
    fullName: 'Genie 3 (Google DeepMind)',
    family: 'generative',
    year: '2025',
    params: 'non divulgué',
    input: "Description textuelle ou image de départ, décrivant un monde à générer.",
    output: "Environnement 3D interactif généré image par image en temps réel (~24 img/s, ~720p, plusieurs minutes de navigation cohérente).",
    utility: "Mondes navigables jouables en temps réel — entraînement d'agents incarnés, prototypage rapide d'environnements sans les construire à la main.",
    facts: [
      "Troisième génération après Genie 1 (2D, actions latentes non supervisées) et Genie 2 (3D, horizon court).",
      "Maintient une cohérence spatiale sur plusieurs minutes de navigation, contrairement aux versions précédentes.",
      "Accès actuellement restreint — pas de poids ouverts, utilisé via démonstration/API contrôlée par DeepMind.",
    ],
    mechanics: { kind: 'autoregressive' },
  },
]

// ============================================================================
// Ressources — cartes par modèle, liens avec aperçu au survol
// ============================================================================
type ResourceLink = { label: string; url: string; source: string; blurb: string }

const MODEL_RESOURCES: Record<string, ResourceLink[]> = {
  ijepa_vitb16_1k: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2301.08243', source: 'arXiv:2301.08243', blurb: "Prédit des représentations plutôt que des pixels, sans augmentations de données artisanales." },
    { label: 'Code officiel', url: 'https://github.com/facebookresearch/ijepa', source: 'GitHub · Meta AI', blurb: 'Implémentation PyTorch officielle publiée avec le papier CVPR 2023.' },
  ],
  vjepa2_vitl_fpc64_256: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2506.09985', source: 'arXiv:2506.09985', blurb: 'Combine vidéo web à grande échelle et données robotiques pour un world model planifiable.' },
    { label: 'Code officiel', url: 'https://github.com/facebookresearch/vjepa2', source: 'GitHub · Meta AI', blurb: 'Poids pré-entraînés et scripts pour reproduire les résultats de planification.' },
  ],
  vit_mae_base: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2111.06377', source: 'arXiv:2111.06377', blurb: 'Masque 75% des patches et reconstruit les pixels manquants via un décodeur léger.' },
    { label: 'Code officiel', url: 'https://github.com/facebookresearch/mae', source: 'GitHub · Meta AI', blurb: 'Ré-implémentation PyTorch/GPU officielle, avec checkpoints pré-entraînés.' },
  ],
  videomae_base: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2203.12602', source: 'arXiv:2203.12602', blurb: 'Masquage extrême de tubes vidéo (90 à 95%) pour un pré-entraînement économe en données.' },
    { label: 'Code officiel', url: 'https://github.com/MCG-NJU/VideoMAE', source: 'GitHub · MCG-NJU', blurb: "Repo de référence de l'équipe autrice, avec configs d'entraînement." },
  ],
  clip_vit_base_patch16: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2103.00020', source: 'arXiv:2103.00020', blurb: 'Apprend un espace image-texte partagé sur 400M paires, sans étiquettes de classe.' },
    { label: 'Code officiel', url: 'https://github.com/openai/CLIP', source: 'GitHub · OpenAI', blurb: 'Modèle et poids originaux publiés par OpenAI.' },
  ],
  dinov2_base: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2304.07193', source: 'arXiv:2304.07193', blurb: 'Features visuelles universelles, entraînées sans supervision sur un jeu curé automatiquement.' },
    { label: 'Code officiel', url: 'https://github.com/facebookresearch/dinov2', source: 'GitHub · Meta AI', blurb: 'Checkpoints multi-tailles et outils de visualisation des features.' },
  ],
  world_models_ha_schmidhuber: [
    { label: 'Papier', url: 'https://arxiv.org/abs/1803.10122', source: 'arXiv:1803.10122', blurb: 'Un RNN génératif compressé sert de "rêve" pour entraîner un contrôleur minimal.' },
    { label: 'Version interactive', url: 'https://worldmodels.github.io', source: 'distill.pub', blurb: "Article interactif d'origine, avec démos jouables dans le navigateur." },
  ],
  dreamerv3: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2301.04104', source: 'arXiv:2301.04104', blurb: "Un seul jeu d'hyperparamètres maîtrise des dizaines de domaines très différents." },
    { label: 'Code officiel', url: 'https://github.com/danijar/dreamerv3', source: 'GitHub · Danijar Hafner', blurb: "Implémentation de référence de l'auteur principal." },
  ],
  tdmpc2: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2310.16828', source: 'arXiv:2310.16828', blurb: 'Combine différence temporelle et planification en ligne dans un espace latent appris.' },
    { label: 'Site du projet', url: 'https://www.nicklashansen.com/td-mpc2', source: 'Page projet', blurb: 'Résultats, vidéos et modèles multi-tâches téléchargeables.' },
  ],
  nvidia_cosmos3_edge: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2501.03575', source: 'arXiv:2501.03575', blurb: 'Plateforme de world models généralistes, personnalisables pour la robotique et la conduite.' },
    { label: 'Code officiel', url: 'https://github.com/nvidia-cosmos', source: 'GitHub · NVIDIA', blurb: 'Organisation regroupant les repos Cosmos, poids ouverts inclus.' },
  ],
  nvidia_sana_wm: [
    { label: 'Papier', url: 'https://arxiv.org/abs/2605.15178', source: 'arXiv:2605.15178', blurb: 'Génère des vidéos 720p d\'une minute, contrôlées par trajectoire caméra, sur un seul GPU.' },
    { label: 'Site du projet', url: 'https://nvlabs.github.io/Sana/WM', source: 'Page projet · NVLabs', blurb: 'Démos vidéo et détails techniques du modèle.' },
  ],
  genie3: [
    { label: 'Annonce de recherche', url: 'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/', source: 'DeepMind', blurb: 'Mondes 3D interactifs en temps réel, générés à partir d\'un simple prompt texte.' },
    { label: 'Fiche modèle', url: 'https://deepmind.google/models/genie/', source: 'DeepMind', blurb: "Vue d'ensemble officielle des capacités et limites actuelles de Genie 3." },
  ],
}

// --- Un lien avec aperçu flottant au survol ---
function ResourceLinkChip({ link, hex }: { link: ResourceLink; hex: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all duration-200 hover:-translate-y-0.5"
        style={{ borderColor: hovered ? hex : undefined, color: hovered ? hex : undefined }}
      >
        {link.label} ↗
      </a>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: hex }}>
              {link.source}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{link.blurb}</p>
            <span
              className="absolute -bottom-1 left-5 h-2 w-2 rotate-45 border-b border-r border-slate-700 bg-slate-950"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Une carte par modèle ---
function ResourceLinksSection() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {MODEL_SPECS.map((spec) => {
        const style = FAMILY_STYLES[spec.family]
        const links = MODEL_RESOURCES[spec.id] ?? []
        return (
          <div
            key={spec.id}
            className={`group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-0.5 ${style.ring}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
              <p className="text-sm font-semibold text-slate-100">{spec.displayName}</p>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{spec.fullName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <ResourceLinkChip key={l.url} link={l} hex={style.hex} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Aperçu visuel Input/Output — icônes abstraites déduites de la mécanique ---
type IOKind = 'image' | 'video' | 'text-image' | 'multicrop' | 'pixels' | 'latent' | 'joint-embedding' | 'state-action' | 'video-gen'

function getIOKinds(spec: ModelSpec): { input: IOKind; output: IOKind } {
  const m = spec.mechanics
  if (m.kind === 'mask') {
    if (m.cfg.kind === 'jepa-image') return { input: 'image', output: 'latent' }
    if (m.cfg.kind === 'jepa-video-tube') return { input: 'video', output: 'latent' }
    if (m.cfg.kind === 'mae-random') return { input: 'image', output: 'pixels' }
    return { input: 'video', output: 'pixels' }
  }
  if (m.kind === 'contrastive') return { input: 'text-image', output: 'joint-embedding' }
  if (m.kind === 'teacher-student') return { input: 'multicrop', output: 'latent' }
  if (m.kind === 'dream-loop' || m.kind === 'rssm' || m.kind === 'mpc') return { input: 'state-action', output: 'latent' }
  return { input: 'text-image', output: 'video-gen' }
}

const IO_LABELS: Record<IOKind, string> = {
  image: 'Image',
  video: 'Clip vidéo',
  'text-image': 'Texte + image',
  multicrop: 'Multi-crop',
  pixels: 'Pixels reconstruits',
  latent: 'Vecteur latent',
  'joint-embedding': 'Embedding partagé',
  'state-action': 'État + action',
  'video-gen': 'Vidéo générée',
}

function IOPreviewIcon({ kind, hex }: { kind: IOKind; hex: string }) {
  const cellStyle = { backgroundColor: hex }
  if (kind === 'image' || kind === 'pixels') {
    return (
      <div className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="h-2 w-2 rounded-[1px] opacity-70" style={i === 4 ? cellStyle : { backgroundColor: hex, opacity: 0.25 }} />
        ))}
      </div>
    )
  }
  if (kind === 'video' || kind === 'video-gen') {
    return (
      <div className="flex gap-[2px]">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="h-5 w-3 rounded-[1px]" style={{ backgroundColor: hex, opacity: 0.3 + i * 0.18 }} />
        ))}
      </div>
    )
  }
  if (kind === 'text-image' || kind === 'joint-embedding') {
    return (
      <div className="flex items-center gap-1">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: hex, opacity: 0.7 }} />
        <span className="h-4 w-4 -translate-x-1.5 rounded-full border" style={{ borderColor: hex, opacity: 0.7 }} />
      </div>
    )
  }
  if (kind === 'multicrop') {
    return (
      <div className="relative h-5 w-6">
        <span className="absolute left-0 top-0 h-4 w-5 rounded-[2px]" style={{ backgroundColor: hex, opacity: 0.25 }} />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-[2px]" style={{ backgroundColor: hex, opacity: 0.6 }} />
      </div>
    )
  }
  if (kind === 'state-action') {
    return (
      <div className="flex items-center gap-1">
        <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: hex, opacity: 0.7 }} />
        <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: hex }} />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex, opacity: 0.4 + i * 0.25 }} />
      ))}
    </div>
  )
}

function IOPreviewRow({ spec, hex }: { spec: ModelSpec; hex: string }) {
  const { input, output } = useMemo(() => getIOKinds(spec), [spec])
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition-colors group-hover:bg-slate-950/60">
      <div className="flex items-center gap-2">
        <IOPreviewIcon kind={input} hex={hex} />
        <span className="text-[10px] text-slate-400">{IO_LABELS[input]}</span>
      </div>
      <span className="text-slate-600">→</span>
      <div className="flex items-center gap-2">
        <IOPreviewIcon kind={output} hex={hex} />
        <span className="text-[10px] text-slate-400">{IO_LABELS[output]}</span>
      </div>
    </div>
  )
}

// --- Carte détaillée d'un modèle — tilt au survol, badges, détails dépliables ---
function ModelSpecCard({ spec }: { spec: ModelSpec }) {
  const style = FAMILY_STYLES[spec.family]
  const seed = hashString(spec.id)
  const [expanded, setExpanded] = useState(false)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const cardRef = useRef<HTMLDivElement | null>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: py * -4, ry: px * 4 })
  }
  const resetTilt = () => setTilt({ rx: 0, ry: 0 })

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-7 transition-all duration-300 ease-out hover:-translate-y-1 ${style.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${style.glow} to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100`}
      />
      <div
        className={`pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr ${style.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60`}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot} shadow-[0_0_10px_currentColor]`} style={{ color: style.hex }} />
          <div>
            <h3 className="text-xl font-semibold text-slate-50">{spec.displayName}</h3>
            <p className="text-[11px] text-slate-500">{spec.fullName}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wide ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 font-mono text-[10px] text-slate-300">
          📅 {spec.year}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 font-mono text-[10px] text-slate-300">
          ⚙ {spec.params}
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors group-hover:border-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Input</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{spec.input}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors group-hover:border-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Output</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{spec.output}</p>
        </div>
      </div>

      <div className="relative mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Utilité</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{spec.utility}</p>
      </div>

      <div className="relative mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Mécanique d'entraînement
        </p>
        <div className="mt-4">
          {spec.mechanics.kind === 'mask' && (
            <MaskGridPreview seed={seed} cfg={spec.mechanics.cfg} family={spec.family} />
          )}
          {spec.mechanics.kind === 'dream-loop' && <DreamLoopDiagram />}
          {spec.mechanics.kind === 'rssm' && <RssmDiagram />}
          {spec.mechanics.kind === 'mpc' && <MpcDiagram />}
          {spec.mechanics.kind === 'contrastive' && <ContrastiveDiagram />}
          {spec.mechanics.kind === 'teacher-student' && <TeacherStudentDiagram />}
          {spec.mechanics.kind === 'diffusion' && <DiffusionDiagram label={spec.mechanics.note} />}
          {spec.mechanics.kind === 'autoregressive' && <AutoregressiveDiagram />}
        </div>
      </div>

      <IOPreviewRow spec={spec} hex={style.hex} />

      <button
        onClick={() => setExpanded((v) => !v)}
        className="relative mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-950/60"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {expanded ? 'Masquer les détails' : 'En savoir plus'}
        </span>
        <span className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      <div
        className={`relative grid transition-all duration-300 ease-out ${
          expanded ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            {spec.facts.map((f, i) => (
              <li key={i} className="flex gap-2 text-xs leading-5 text-slate-300">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition-colors group-hover:bg-slate-950/60">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Convergence (illustrative)</p>
        <div className="w-40">
          <LossSparkline seed={seed} color={style.hex} />
        </div>
      </div>
    </div>
  )
}

function ModelExplorer() {
  const [activeFamily, setActiveFamily] = useState<FamilyKey | 'all'>('all')
  const families: (FamilyKey | 'all')[] = ['all', ...FAMILY_ORDER]
  const visible = activeFamily === 'all' ? MODEL_SPECS : MODEL_SPECS.filter((m) => m.family === activeFamily)

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {families.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFamily(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition hover:scale-105 active:scale-95 ${
              activeFamily === f
                ? f === 'all'
                  ? 'border-slate-400 bg-slate-200 text-slate-900'
                  : FAMILY_STYLES[f].badge
                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'Tous (12)' : FAMILY_STYLES[f].label}
          </button>
        ))}
      </div>

      <div className="grid gap-7 xl:grid-cols-2">
        {visible.map((spec, i) => (
          <Reveal key={spec.id} delay={(i % 2) * 90}>
            <ModelSpecCard spec={spec} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 6. Comparaison des stratégies de masquage (Chapitre 7)
// ============================================================================
function makeSpatialBlockMask(seed: number): Set<number> {
  const rng = mulberry32(seed)
  const h = 2 + Math.floor(rng() * 2)
  const w = 3 + Math.floor(rng() * 3)
  const top = Math.floor(rng() * (5 - h + 1))
  const left = Math.floor(rng() * (8 - w + 1))
  const s = new Set<number>()
  for (let r = top; r < top + h; r++) for (let c = left; c < left + w; c++) s.add(r * 8 + c)
  return s
}

function makeTubeMask(seed: number): Set<number> {
  const rng = mulberry32(seed)
  const s = new Set<number>()
  for (let i = 0; i < 3; i++) {
    const h = 1 + Math.floor(rng() * 2)
    const w = 1 + Math.floor(rng() * 2)
    const top = Math.floor(rng() * (5 - h + 1))
    const left = Math.floor(rng() * (8 - w + 1))
    for (let r = top; r < top + h; r++) for (let c = left; c < left + w; c++) s.add(r * 8 + c)
  }
  const bh = 3
  const bw = 4
  const btop = Math.floor(rng() * (5 - bh + 1))
  const bleft = Math.floor(rng() * (8 - bw + 1))
  for (let r = btop; r < btop + bh; r++) for (let c = bleft; c < bleft + bw; c++) s.add(r * 8 + c)
  return s
}

function makeRandomMask(seed: number, ratio: number): Set<number> {
  const rng = mulberry32(seed)
  const indices = Array.from({ length: 40 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return new Set(indices.slice(0, Math.round(40 * ratio)))
}

function MaskGrid({ masked, colorClass }: { masked: Set<number>; colorClass: string }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(8, minmax(0, 1fr))` }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} className={`aspect-square rounded-[3px] transition-colors duration-300 ${masked.has(i) ? colorClass : 'bg-slate-800/70'}`} />
      ))}
    </div>
  )
}

function MaskingComparison() {
  const [seed, setSeed] = useState(7)
  const ijepaMask = useMemo(() => makeSpatialBlockMask(seed), [seed])
  const vjepaMask = useMemo(() => makeTubeMask(seed + 1), [seed])
  const maeMask = useMemo(() => makeRandomMask(seed + 2, 0.75), [seed])
  const videomaeMask = useMemo(() => makeRandomMask(seed + 3, 0.9), [seed])

  const cards = [
    { title: 'I-JEPA', sub: 'un bloc spatial contigu masqué (cible), reste = contexte', mask: ijepaMask, color: 'bg-cyan-400/70', ratioLabel: `${Math.round((ijepaMask.size / 40) * 100)}% masqué` },
    { title: 'V-JEPA2', sub: 'union de blocs + tube étendu dans le temps (~80% masqué)', mask: vjepaMask, color: 'bg-cyan-300/70', ratioLabel: `${Math.round((vjepaMask.size / 40) * 100)}% masqué` },
    { title: 'ViT-MAE', sub: 'patches choisis au hasard, indépendamment les uns des autres', mask: maeMask, color: 'bg-fuchsia-400/70', ratioLabel: '~75% masqué' },
    { title: 'VideoMAE', sub: 'même logique aléatoire, appliquée à des tubes spatio-temporels', mask: videomaeMask, color: 'bg-fuchsia-300/70', ratioLabel: '~90% masqué' },
  ]

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Comparaison</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Comment chaque famille masque — et pourquoi ça change ce qu'elle apprend
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            JEPA masque des <em>blocs contigus</em> (structure prévisible à deviner en latent) ; MAE masque
            au <em>hasard, patch par patch</em> (le modèle reconstruit des pixels, pas une structure). Le
            ratio masqué est aussi révélateur : plus il est élevé, moins le modèle peut « tricher » en
            copiant les voisins.
          </p>
        </div>
        <button
          onClick={() => setSeed((s) => s + 10)}
          className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 transition hover:scale-105 hover:bg-cyan-400/20 active:scale-95"
        >
          ↺ Nouveau tirage
        </button>
      </div>

      <div className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">{c.title}</p>
              <span className="text-[10px] font-mono text-slate-500">{c.ratioLabel}</span>
            </div>
            <div className="mt-3">
              <MaskGrid masked={c.mask} colorClass={c.color} />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 8. Bandes illustrées — paradigmes et usages (Chapitre 6)
// ============================================================================
function ParadigmBand() {
  const items: { label: string; hex: string; style: (typeof FAMILY_STYLES)[FamilyKey]; ioKind: IOKind; desc: string }[] = [
    {
      label: 'JEPA — espace latent',
      hex: FAMILY_STYLES.jepa.hex,
      style: FAMILY_STYLES.jepa,
      ioKind: 'latent',
      desc: "Prédit une représentation abstraite du contenu masqué. Ne reconstruit jamais de pixels — seulement ce qui compte sémantiquement.",
    },
    {
      label: 'MAE — pixels',
      hex: FAMILY_STYLES.mae.hex,
      style: FAMILY_STYLES.mae,
      ioKind: 'pixels',
      desc: "Reconstruit les pixels manquants directement. Force le modèle à apprendre les détails visuels fins, pas seulement le sens.",
    },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((it) => (
        <div
          key={it.label}
          className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${it.style.badge} border-opacity-40 ${it.style.ring}`}
        >
          <div className="flex items-center gap-3">
            <IOPreviewIcon kind={it.ioKind} hex={it.hex} />
            <span className="text-sm font-semibold">{it.label}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-300">{it.desc}</p>
        </div>
      ))}
    </div>
  )
}

function UsageBand() {
  const items: { label: string; models: string; style: (typeof FAMILY_STYLES)[FamilyKey]; desc: string }[] = [
    {
      label: 'Sémantique',
      models: 'DINOv2 · CLIP',
      style: FAMILY_STYLES.semantic,
      desc: "Baselines de représentation — servent de référence pour juger la qualité sémantique des autres modèles.",
    },
    {
      label: 'Planification',
      models: 'World Models · DreamerV3 · TD-MPC2',
      style: FAMILY_STYLES.rl,
      desc: "Apprennent une dynamique latente pour simuler des futurs possibles et choisir une action, sans toucher au monde réel.",
    },
    {
      label: 'Génératif',
      models: 'Cosmos 3 · SANA-WM · Genie 3',
      style: FAMILY_STYLES.generative,
      desc: "Génèrent directement des mondes vidéo interactifs ou conditionnés, image par image.",
    },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${it.style.badge} border-opacity-40 ${it.style.ring}`}
        >
          <span className={`h-2 w-2 rounded-full ${it.style.dot}`} />
          <p className="mt-2 text-sm font-semibold">{it.label}</p>
          <p className="text-[11px] text-slate-400">{it.models}</p>
          <p className="mt-3 text-xs leading-5 text-slate-300">{it.desc}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// 7. Éléments flottants d'ambiance
// ============================================================================
function AmbientBackground() {
  const mouse = useMouseParallax()

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const rng = mulberry32(1000 + i)
        return {
          id: i,
          left: `${(rng() * 100).toFixed(1)}%`,
          top: `${(rng() * 100).toFixed(1)}%`,
          size: 2 + rng() * 3.5,
          duration: 12 + rng() * 18,
          delay: -rng() * 20,
          color: [FAMILY_STYLES.jepa.hex, FAMILY_STYLES.mae.hex, FAMILY_STYLES.rl.hex, FAMILY_STYLES.generative.hex, FAMILY_STYLES.semantic.hex][i % 5],
        }
      }),
    [],
  )

  const nodes = useMemo(() => {
    const rng = mulberry32(77)
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      x: 8 + rng() * 84,
      y: 8 + rng() * 84,
      color: [FAMILY_STYLES.jepa.hex, FAMILY_STYLES.rl.hex, FAMILY_STYLES.generative.hex][i % 3],
    }))
  }, [])
  const edges = useMemo(() => {
    const list: [number, number][] = []
    for (let i = 0; i < nodes.length; i++) {
      const next = (i + 1) % nodes.length
      const dx = nodes[i].x - nodes[next].x
      const dy = nodes[i].y - nodes[next].y
      if (Math.sqrt(dx * dx + dy * dy) < 55) list.push([i, next])
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 2; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (Math.sqrt(dx * dx + dy * dy) < 26) list.push([i, j])
      }
    }
    return list
  }, [nodes])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div
        className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/15 blur-[110px] transition-transform duration-500 motion-safe:animate-[float-a_18s_ease-in-out_infinite]"
        style={{ transform: `translate(${mouse.x * -14}px, ${mouse.y * -10}px)` }}
      />
      <div
        className="absolute right-0 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/15 blur-[120px] transition-transform duration-500 motion-safe:animate-[float-b_22s_ease-in-out_infinite]"
        style={{ transform: `translate(${mouse.x * 12}px, ${mouse.y * 8}px)` }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-500/15 blur-[100px] transition-transform duration-500 motion-safe:animate-[float-a_25s_ease-in-out_infinite_reverse]"
        style={{ transform: `translate(${mouse.x * -8}px, ${mouse.y * 12}px)` }}
      />
      <div
        className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-[100px] transition-transform duration-500 motion-safe:animate-[float-b_20s_ease-in-out_infinite_reverse]"
        style={{ transform: `translate(${mouse.x * 10}px, ${mouse.y * -8}px)` }}
      />
      <div
        className="absolute right-1/4 top-2/3 h-64 w-64 rounded-full bg-rose-500/15 blur-[90px] transition-transform duration-500 motion-safe:animate-[float-a_21s_ease-in-out_infinite]"
        style={{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -14}px)` }}
      />

      <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={nodes[a].color}
            strokeWidth={0.15}
            strokeOpacity={0.5}
          />
        ))}
        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={0.55}
            fill={n.color}
            className="motion-safe:animate-[pulse-node_4s_ease-in-out_infinite]"
            style={{ animationDelay: `${n.id * 0.4}s`, transformOrigin: `${n.x}px ${n.y}px` }}
          />
        ))}
      </svg>

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-50 motion-safe:animate-[drift_linear_infinite]"
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
          50% { transform: translate(30px, -40px) scale(1.08); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-35px, 30px) scale(1.05); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); }
          25% { transform: translate(14px, -18px); }
          50% { transform: translate(-10px, -30px); }
          75% { transform: translate(-18px, 10px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes pulse-node {
          0%, 100% { r: 0.55; opacity: 0.7; }
          50% { r: 1.1; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// SYSTÈME DE PARCOURS GUIDÉ — feuille de route gamifiée, XP, déblocage
// pas-à-pas, checkpoints quiz. Conçu pour quelqu'un qui ne connaît RIEN à l'IA.
// L'ordre a été entièrement repensé : on commence par le geste le plus
// concret et intuitif (jouer à cache-cache avec une image) avant d'introduire
// le moindre mot de jargon. Chaque notion abstraite arrive seulement après
// que son intuition ait été vécue.
// ============================================================================

type StepAccent = FamilyKey | 'neutral'

const ACCENT_GRADIENT: Record<StepAccent, string> = {
  jepa: 'from-cyan-500/25 via-cyan-500/5 to-transparent',
  mae: 'from-fuchsia-500/25 via-fuchsia-500/5 to-transparent',
  semantic: 'from-violet-500/25 via-violet-500/5 to-transparent',
  rl: 'from-amber-500/25 via-amber-500/5 to-transparent',
  generative: 'from-rose-500/25 via-rose-500/5 to-transparent',
  neutral: 'from-slate-500/20 via-slate-500/5 to-transparent',
}

const ACCENT_TITLE_GRADIENT: Record<StepAccent, string> = {
  jepa: 'from-cyan-200 via-sky-100 to-white',
  mae: 'from-fuchsia-200 via-pink-100 to-white',
  semantic: 'from-violet-200 via-purple-100 to-white',
  rl: 'from-amber-200 via-yellow-100 to-white',
  generative: 'from-rose-200 via-pink-100 to-white',
  neutral: 'from-slate-200 via-slate-100 to-white',
}

const ACCENT_TEXT: Record<StepAccent, string> = {
  jepa: 'text-cyan-300',
  mae: 'text-fuchsia-300',
  semantic: 'text-violet-300',
  rl: 'text-amber-300',
  generative: 'text-rose-300',
  neutral: 'text-slate-300',
}

const ACCENT_BTN: Record<StepAccent, string> = {
  jepa: 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25 shadow-[0_0_30px_-8px_rgba(34,211,238,0.6)]',
  mae: 'border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-400/25 shadow-[0_0_30px_-8px_rgba(232,121,249,0.6)]',
  semantic: 'border-violet-400/50 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25 shadow-[0_0_30px_-8px_rgba(167,139,250,0.6)]',
  rl: 'border-amber-400/50 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25 shadow-[0_0_30px_-8px_rgba(251,191,36,0.6)]',
  generative: 'border-rose-400/50 bg-rose-400/15 text-rose-100 hover:bg-rose-400/25 shadow-[0_0_30px_-8px_rgba(251,113,133,0.6)]',
  neutral: 'border-slate-400/50 bg-slate-400/15 text-slate-100 hover:bg-slate-400/25',
}

function getAccentStyle(accent: StepAccent) {
  return accent === 'neutral' ? NEUTRAL_STYLE : FAMILY_STYLES[accent]
}

// Étiquettes courtes affichées dans la barre de progression et le compteur XP
const STEP_LABELS = [
  'Bienvenue',
  'Cache-cache',
  'Petit contrôle',
  'Espace latent',
  'Petit contrôle',
  'Étape franchie',
  'LLM vs World Model',
  'Petit contrôle',
  'Chronologie',
  'Échelle',
  'Paradigmes',
  'Masquage comparé',
  'Petit contrôle',
  'Étape franchie',
  'Le cabinet',
  'Pour aller plus loin',
]

const QUIZ_STEPS = new Set([2, 4, 7, 12])
const XP_PER_QUIZ = 25

// --- Feuille de route affichée à l'accueil : un vrai jeu de piste ---
function JourneyMap({ onJump }: { onJump: (i: number) => void }) {
  const chapters: { step: number; num: number; title: string; desc: string; icon: typeof Puzzle; accent: StepAccent }[] = [
    { step: 1, num: 1, title: 'Le jeu du cache-cache', desc: 'Apprendre sans professeur, en devinant', icon: Puzzle, accent: 'jepa' },
    { step: 3, num: 2, title: "L'espace latent", desc: "Où vivent les idées de l'IA", icon: Brain, accent: 'semantic' },
    { step: 6, num: 3, title: 'LLM vs World Model', desc: 'Un mot de plus, ou un monde entier', icon: GitCompare, accent: 'jepa' },
    { step: 8, num: 4, title: 'Chronologie', desc: "35 ans d'histoire, en accéléré", icon: History, accent: 'neutral' },
    { step: 9, num: 5, title: 'Ordres de grandeur', desc: 'De 1 000 paramètres à 20 milliards', icon: Ruler, accent: 'rl' },
    { step: 10, num: 6, title: 'Paradigmes & usages', desc: 'Deux façons de prédire, trois usages', icon: LayoutGrid, accent: 'semantic' },
    { step: 11, num: 7, title: 'Masquage comparé', desc: 'Qui cache quoi, et pourquoi ça change tout', icon: Puzzle, accent: 'jepa' },
    { step: 14, num: 8, title: 'Le cabinet', desc: '12 modèles, en détail', icon: FlaskConical, accent: 'generative' },
    { step: 15, num: 9, title: 'Pour aller plus loin', desc: 'Les sources, pour chaque modèle', icon: PlayCircle, accent: 'rl' },
  ]

  return (
    <div className="relative mt-6">
      <div className="absolute left-7 top-8 bottom-8 w-px bg-gradient-to-b from-cyan-400/60 via-violet-400/40 to-rose-400/60 sm:left-8" />
      <div className="space-y-3">
        {chapters.map((c) => {
          const style = getAccentStyle(c.accent)
          const Icon = c.icon
          return (
            <button
              key={c.step}
              onClick={() => onJump(c.step)}
              className="group relative flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/70 sm:gap-5 sm:p-5"
            >
              <span
                className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold sm:h-16 sm:w-16 sm:text-base ${style.badge}`}
              >
                {String(c.num).padStart(2, '0')}
              </span>
              <Icon className={`hidden h-6 w-6 shrink-0 sm:block ${style.text}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-100 sm:text-lg">{c.title}</p>
                <p className="truncate text-xs text-slate-400 sm:text-sm">{c.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-slate-300" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgressRail({
  total,
  current,
  xp,
  onJump,
}: {
  total: number
  current: number
  xp: number
  onJump: (i: number) => void
}) {
  return (
    <div className="sticky top-4 z-40 mb-8 flex flex-col items-center gap-2 rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 shadow-xl shadow-slate-950/50 backdrop-blur-xl">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const done = i < current
          const active = i === current
          const locked = i > current
          return (
            <button
              key={i}
              onClick={() => !locked && onJump(i)}
              disabled={locked}
              title={locked ? 'Étape pas encore débloquée' : STEP_LABELS[i]}
              className={`group relative flex items-center transition-all duration-300 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-500 ${
                  active
                    ? 'w-8 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]'
                    : done
                    ? 'w-4 bg-cyan-400/60 group-hover:bg-cyan-400'
                    : 'w-2 bg-slate-700'
                }`}
              />
            </button>
          )
        })}
        <span className="ml-1 whitespace-nowrap text-[11px] font-mono text-slate-500">
          {current + 1} / {total}
        </span>
      </div>
      <div className="flex w-full items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="truncate font-semibold text-slate-200">{STEP_LABELS[current]}</span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-mono font-semibold text-amber-200">
          <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {xp} XP
        </span>
      </div>
    </div>
  )
}

function StepShell({
  accent = 'neutral',
  chapterNumber,
  kicker,
  title,
  lede,
  children,
  onContinue,
  continueLabel = 'Continuer',
  showContinue = true,
}: {
  accent?: StepAccent
  chapterNumber?: number
  kicker: string
  title: string
  lede?: string
  children: React.ReactNode
  onContinue?: () => void
  continueLabel?: string
  showContinue?: boolean
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 48, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.97 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[2.5rem] border border-slate-700 bg-gradient-to-br ${ACCENT_GRADIENT[accent]} bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 sm:p-10 lg:p-14`}
    >
      {chapterNumber && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 right-4 select-none text-[7rem] font-black leading-none text-slate-800/50 sm:-top-10 sm:right-8 sm:text-[11rem]"
        >
          0{chapterNumber}
        </span>
      )}
      <p className={`relative text-xs font-semibold uppercase tracking-[0.5em] sm:text-sm ${ACCENT_TEXT[accent]}`}>{kicker}</p>
      <h2
        className={`relative mt-4 max-w-4xl bg-gradient-to-r bg-clip-text text-4xl font-bold leading-[1.05] text-transparent sm:text-5xl md:text-6xl lg:text-7xl ${ACCENT_TITLE_GRADIENT[accent]}`}
      >
        {title}
      </h2>
      {lede && <p className="relative mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9 md:text-2xl">{lede}</p>}

      <div className="relative mt-10">{children}</div>

      {showContinue && onContinue && (
        <div className="relative mt-10 flex justify-center">
          <button
            onClick={onContinue}
            className={`group flex items-center gap-3 rounded-full border px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-105 active:scale-95 sm:text-lg ${ACCENT_BTN[accent]}`}
          >
            {continueLabel}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </motion.section>
  )
}

function QuizCheckpoint({
  accent,
  question,
  options,
  correctIndex,
  explanation,
  onPassed,
}: {
  accent: StepAccent
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  onPassed: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const isCorrect = selected === correctIndex

  const handlePick = (i: number) => {
    if (isCorrect) return
    setSelected(i)
    setAttempts((a) => a + 1)
  }

  return (
    <StepShell
      accent={accent}
      kicker="Petit contrôle — juste pour vérifier"
      title={question}
      showContinue={isCorrect}
      onContinue={onPassed}
      continueLabel={`Bien joué (+${XP_PER_QUIZ} XP), la suite →`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt, i) => {
          const picked = selected === i
          const showAsCorrect = isCorrect && i === correctIndex
          const showAsWrong = picked && !isCorrect
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={isCorrect}
              className={`flex items-center gap-3 rounded-2xl border p-5 text-left text-base transition-all duration-300 sm:text-lg ${
                showAsCorrect
                  ? 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
                  : showAsWrong
                  ? 'border-rose-400 bg-rose-400/10 text-rose-200'
                  : 'border-slate-700 bg-slate-950/50 text-slate-200 hover:border-slate-500 hover:bg-slate-900'
              }`}
            >
              {showAsCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
              {showAsWrong && <XCircle className="h-5 w-5 shrink-0 text-rose-400" />}
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-5 rounded-2xl border p-5 text-sm leading-6 sm:text-base ${
                isCorrect
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-100'
              }`}
            >
              {isCorrect ? (
                <span className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" /> Exactement !
                </span>
              ) : (
                <span className="font-semibold">
                  {attempts >= 2 ? 'La bonne réponse est surlignée en vert.' : 'Pas tout à fait — réessaie.'}
                </span>
              )}
              <p className="mt-2 text-slate-300">{explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {attempts >= 2 && !isCorrect && (
        <button
          onClick={() => setSelected(correctIndex)}
          className="mt-4 text-xs text-slate-500 underline hover:text-slate-300"
        >
          Révéler la bonne réponse
        </button>
      )}
    </StepShell>
  )
}

// ============================================================================
// Page principale — parcours guidé, une étape à la fois, réorganisé du plus
// concret (jouer) au plus abstrait (comparer 12 architectures).
// ============================================================================
export function Encyclopedia() {
  const [step, setStep] = useState(0)
  const [xp, setXp] = useState(0)
  const [passedQuizzes, setPassedQuizzes] = useState<Set<number>>(new Set())
  const topRef = useRef<HTMLDivElement | null>(null)

  const goTo = (i: number) => {
    setStep(i)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const next = () => goTo(step + 1)

  const passQuiz = (stepIndex: number) => {
    setPassedQuizzes((prev) => {
      if (prev.has(stepIndex)) return prev
      const nextSet = new Set(prev)
      nextSet.add(stepIndex)
      setXp((x) => x + XP_PER_QUIZ)
      return nextSet
    })
    next()
  }

  const TOTAL_STEPS = STEP_LABELS.length

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <AmbientBackground />
      <div ref={topRef} />

      <ProgressRail total={TOTAL_STEPS} current={step} xp={xp} onJump={goTo} />

      <AnimatePresence mode="wait">
        {/* 0 — Accroche + feuille de route complète */}
        {step === 0 && (
          <motion.div key="s0" exit={{ opacity: 0 }}>
            <StepShell
              accent="jepa"
              kicker="Bienvenue — aucun prérequis nécessaire"
              title="Une IA peut-elle imaginer ce qui va se passer ensuite ?"
              lede="Pas juste deviner le mot suivant dans une phrase — mais imaginer la suite d'une scène, d'une vidéo, d'un mouvement. C'est ce que font les « world models ». On va y aller petit à petit : d'abord un jeu, puis une image mentale, puis les détails. Voici le chemin :"
              onContinue={() => goTo(1)}
              continueLabel="Commencer l'aventure"
            >
              <JourneyMap onJump={goTo} />
            </StepShell>
          </motion.div>
        )}

        {/* 1 — Chapitre 1 : jeu de masquage, avant tout jargon */}
        {step === 1 && (
          <motion.div key="s1" exit={{ opacity: 0 }}>
            <StepShell
              accent="jepa"
              chapterNumber={1}
              kicker="Chapitre 1 — le jeu du cache-cache"
              title="Comment apprendre à une IA sans lui donner d'étiquettes ?"
              lede="On ne lui dit jamais « ceci est un chat ». À la place, on cache un morceau d'une image et on lui demande de deviner ce qui manque. Répète des millions de fois, et une compréhension émerge — sans aucune étiquette humaine. Essaie toi-même :"
              onContinue={next}
            >
              <PatchMaskingDemo />
            </StepShell>
          </motion.div>
        )}

        {/* 2 — Quiz 1 : ce que devine le modèle */}
        {step === 2 && (
          <motion.div key="s2" exit={{ opacity: 0 }}>
            <QuizCheckpoint
              accent="jepa"
              question="Quand une zone est masquée, que doit deviner l'IA de type JEPA ?"
              options={[
                'Les pixels exacts de la zone masquée',
                'Un résumé abstrait (une représentation) de la zone masquée',
                "Le nom de l'objet caché",
                'Rien — la zone masquée est ignorée',
              ]}
              correctIndex={1}
              explanation="C'est le cœur de l'idée JEPA : elle ne reconstruit jamais de pixels, elle prédit un résumé abstrait — plus rapide, et plus robuste au bruit visuel inutile."
              onPassed={() => passQuiz(2)}
            />
          </motion.div>
        )}

        {/* 3 — Chapitre 2 : espace latent, maintenant que le geste est vécu */}
        {step === 3 && (
          <motion.div key="s3" exit={{ opacity: 0 }}>
            <StepShell
              accent="semantic"
              chapterNumber={2}
              kicker="Chapitre 2 — où vivent les idées de l'IA"
              title="C'est quoi, un « espace latent » ?"
              lede="Tu viens de voir l'IA deviner un résumé plutôt que des pixels. Ce résumé est un point dans un espace invisible, où les images qui se ressemblent (deux chats, deux voitures) finissent proches les unes des autres — sans qu'on ait jamais dit « ça, c'est un chat »."
              onContinue={next}
            >
              <LatentSpaceExplorer />
            </StepShell>
          </motion.div>
        )}

        {/* 4 — Quiz 2 : espace latent vs variable latente */}
        {step === 4 && (
          <motion.div key="s4" exit={{ opacity: 0 }}>
            <QuizCheckpoint
              accent="semantic"
              question="Le losange orange (z) dans l'explorateur représente quoi ?"
              options={[
                "Tout l'espace latent en entier",
                'Une seule variable, tirée pour une prédiction précise',
                'Un neurone du réseau',
                'Une erreur de calcul'
              ]}
              correctIndex={1}
              explanation="L'espace latent est le nuage entier de points possibles. La variable latente z est un seul point, choisi pour représenter ce qu'on ne peut pas deviner à partir du contexte seul."
              onPassed={() => passQuiz(4)}
            />
          </motion.div>
        )}

        {/* 5 — Badge de transition : les fondations sont posées */}
        {step === 5 && (
          <motion.div key="s5" exit={{ opacity: 0 }}>
            <StepShell
              accent="generative"
              kicker="Étape franchie"
              title="Tu as les fondations !"
              lede="À partir d'ici, on va comparer ces idées à ce que tu connais déjà (ChatGPT), remonter le temps jusqu'à leurs origines, puis détailler les 12 modèles de la plateforme un par un. Tu peux toujours revenir en arrière via la barre en haut de la page."
              onContinue={next}
              continueLabel="Continuer"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-rose-400/30 bg-rose-400/5 p-6">
                <Trophy className="h-10 w-10 shrink-0 text-rose-300" />
                <div>
                  <p className="font-semibold text-slate-100">Tu sais maintenant :</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300 sm:text-base">
                    <li>• comment le masquage force une IA à apprendre sans étiquette humaine</li>
                    <li>• ce qu'est un espace latent — et en quoi ce n'est pas pareil qu'une variable latente z</li>
                  </ul>
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {/* 6 — Chapitre 3 : LLM vs world model */}
        {step === 6 && (
          <motion.div key="s6" exit={{ opacity: 0 }}>
            <StepShell
              accent="jepa"
              chapterNumber={3}
              kicker="Chapitre 3 — le déclic"
              title="ChatGPT prédit un mot. Un world model prédit un monde."
              lede="Les deux « devinent la suite ». Mais pas la même suite. Maintenant que tu connais le masquage et l'espace latent, regarde la différence, axe par axe :"
              onContinue={next}
            >
              <ComparisonGrid />
            </StepShell>
          </motion.div>
        )}

        {/* 7 — Quiz 3 : ce que prédit un LLM */}
        {step === 7 && (
          <motion.div key="s7" exit={{ opacity: 0 }}>
            <QuizCheckpoint
              accent="jepa"
              question="Un LLM classique (type ChatGPT) prédit principalement quoi ?"
              options={[
                'Le prochain mot dans une phrase',
                "L'état physique futur d'un environnement",
                'Une image générée pixel par pixel',
                'Une action de robot',
              ]}
              correctIndex={0}
              explanation="Un LLM manipule des patterns de texte, pas une simulation du monde — c'est pour ça qu'il peut halluciner des faits physiques sans s'en rendre compte."
              onPassed={() => passQuiz(7)}
            />
          </motion.div>
        )}

        {/* 8 — Chapitre 4 : chronologie */}
        {step === 8 && (
          <motion.div key="s8" exit={{ opacity: 0 }}>
            <StepShell
              accent="neutral"
              chapterNumber={4}
              kicker="Chapitre 4 — contexte historique"
              title="Une idée vieille de 35 ans, redevenue centrale"
              lede="Les world models ne datent pas d'hier — ils viennent de la recherche en RL des années 90, et sont revenus au premier plan avec JEPA et les produits commerciaux récents."
              onContinue={next}
            >
              <Timeline />
            </StepShell>
          </motion.div>
        )}

        {/* 9 — Chapitre 5 : ordres de grandeur */}
        {step === 9 && (
          <motion.div key="s9" exit={{ opacity: 0 }}>
            <StepShell
              accent="rl"
              chapterNumber={5}
              kicker="Chapitre 5 — prendre la mesure"
              title="De 1 000 paramètres à 20 milliards"
              lede="Tous les world models ne sont pas des géants — certains tiennent en quelques kilo-octets. La taille ne dit rien de la qualité, seulement du coût de calcul."
              onContinue={next}
            >
              <ParamScaleBand />
            </StepShell>
          </motion.div>
        )}

        {/* 10 — Chapitre 6 : paradigmes & usages */}
        {step === 10 && (
          <motion.div key="s10" exit={{ opacity: 0 }}>
            <StepShell
              accent="semantic"
              chapterNumber={6}
              kicker="Chapitre 6 — vue d'ensemble"
              title="Deux façons de prédire, trois grands usages"
              lede="Avant de plonger modèle par modèle, une carte mentale simple pour situer chaque famille."
              onContinue={next}
            >
              <div className="space-y-8">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">Comment ils prédisent</p>
                  <ParadigmBand />
                </div>
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">Leur rôle sur la plateforme</p>
                  <UsageBand />
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {/* 11 — Chapitre 7 : comparaison des masquages */}
        {step === 11 && (
          <motion.div key="s11" exit={{ opacity: 0 }}>
            <StepShell
              accent="jepa"
              chapterNumber={7}
              kicker="Chapitre 7 — approfondissement"
              title="Toutes les stratégies de masquage, côte à côte"
              lede="JEPA masque des blocs contigus et prévisibles. MAE masque au hasard, patch par patch. La différence change fondamentalement ce que le modèle apprend."
              onContinue={next}
            >
              <MaskingComparison />
            </StepShell>
          </motion.div>
        )}

        {/* 12 — Quiz 4 : pourquoi MAE masque 75% */}
        {step === 12 && (
          <motion.div key="s12" exit={{ opacity: 0 }}>
            <QuizCheckpoint
              accent="mae"
              question="Pourquoi ViT-MAE masque-t-il un ratio aussi élevé (~75%) de l'image ?"
              options={[
                'Pour économiser de la mémoire GPU',
                'Pour rendre la tâche difficile malgré un masquage sans structure',
                'Parce que le modèle ne sait traiter que 25% des pixels',
                "C'est une contrainte du format d'image",
              ]}
              correctIndex={1}
              explanation="Un masquage aléatoire est facile à deviner si peu de patches manquent (les voisins suffisent). Un ratio élevé force le modèle à vraiment comprendre le contenu, pas juste interpoler localement."
              onPassed={() => passQuiz(12)}
            />
          </motion.div>
        )}

        {/* 13 — Badge de transition avant le cabinet */}
        {step === 13 && (
          <motion.div key="s13" exit={{ opacity: 0 }}>
            <StepShell
              accent="generative"
              kicker="Étape franchie"
              title="Tu es prêt·e pour le cabinet des 12 modèles"
              lede="Tu as maintenant tout le vocabulaire nécessaire : masquage, espace latent, variable latente, LLM vs world model, familles et usages. Il ne reste plus qu'à rencontrer chaque modèle en détail, puis à voir où creuser davantage."
              onContinue={next}
              continueLabel="Voir les 12 modèles"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-rose-400/30 bg-rose-400/5 p-6">
                <Trophy className="h-10 w-10 shrink-0 text-rose-300" />
                <p className="text-sm text-slate-300 sm:text-base">
                  {xp} XP au compteur — tu as passé les 4 petits contrôles. Le cabinet t'attend.
                </p>
              </div>
            </StepShell>
          </motion.div>
        )}

        {/* 14 — Chapitre 8 : Le Cabinet, 12 modèles */}
        {step === 14 && (
          <motion.div key="s14" exit={{ opacity: 0 }}>
            <StepShell
              accent="generative"
              chapterNumber={8}
              kicker="Chapitre 8 — le cabinet"
              title="Les 12 modèles, un par un"
              lede="Pour chaque modèle : ce qu'il reçoit en entrée, ce qu'il produit, à quoi ça sert, et comment l'entraînement fonctionne réellement. Les grilles de masquage utilisent les ratios vérifiés dans les notebooks de test."
              onContinue={next}
              continueLabel="Pour aller plus loin"
            >
              <ModelExplorer />
            </StepShell>
          </motion.div>
        )}

        {/* 15 — Chapitre 9 : pour aller plus loin, les sources originales */}
        {step === 15 && (
          <motion.div key="s15" exit={{ opacity: 0 }}>
            <StepShell
              accent="rl"
              chapterNumber={9}
              kicker="Chapitre 9 — pour aller plus loin"
              title="Les sources, pour chaque modèle"
              lede="Chaque carte ci-dessous renvoie vers le papier de recherche original (ou l'annonce officielle) et le code source du modèle correspondant, pour approfondir au-delà de ce résumé."
              showContinue={false}
            >
              <ResourceLinksSection />
            </StepShell>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}