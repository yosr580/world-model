import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { api } from '../api/client'
import { ModelCardContainer, type ModelItem } from '../components/ModelCard'
import { TaxonomyFilters } from '../components/TaxonomyFilters'

// ============================================================================
// Backend calls — inchangés, ne pas toucher
// ============================================================================
const fetchModels = async (): Promise<ModelItem[]> => {
  const response = await api.get('/models/')
  return response.data.items
}

// ============================================================================
// Design tokens
//   cyan    -> JEPA (prédiction en espace latent)
//   fuchsia -> MAE (reconstruction pixel)
//   violet  -> Baselines sémantiques (CLIP, DINOv2)
//   amber   -> World models RL / dynamique latente (Dreamer, TD-MPC2, Ha&Schmidhuber)
//   rose    -> World models génératifs / interactifs (Cosmos, SANA-WM, Genie)
// ============================================================================
type FamilyKey = 'jepa' | 'mae' | 'semantic' | 'rl' | 'generative'

const FAMILY_STYLES: Record<
  FamilyKey,
  { badge: string; ring: string; dot: string; glow: string; label: string; text: string; hex: string }
> = {
  jepa: {
    badge: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    ring: 'hover:border-cyan-400/60 hover:shadow-[0_0_50px_-15px_rgba(34,211,238,0.55)]',
    dot: 'bg-cyan-400',
    glow: 'from-cyan-500/10',
    label: 'JEPA — prédiction latente',
    text: 'text-cyan-300',
    hex: '#22d3ee',
  },
  mae: {
    badge: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200',
    ring: 'hover:border-fuchsia-400/60 hover:shadow-[0_0_50px_-15px_rgba(232,121,249,0.5)]',
    dot: 'bg-fuchsia-400',
    glow: 'from-fuchsia-500/10',
    label: 'MAE — reconstruction pixel',
    text: 'text-fuchsia-300',
    hex: '#e879f9',
  },
  semantic: {
    badge: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
    ring: 'hover:border-violet-400/60 hover:shadow-[0_0_50px_-15px_rgba(167,139,250,0.5)]',
    dot: 'bg-violet-400',
    glow: 'from-violet-500/10',
    label: 'Baseline sémantique',
    text: 'text-violet-300',
    hex: '#a78bfa',
  },
  rl: {
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    ring: 'hover:border-amber-400/60 hover:shadow-[0_0_50px_-15px_rgba(251,191,36,0.5)]',
    dot: 'bg-amber-400',
    glow: 'from-amber-500/10',
    label: 'World model RL — dynamique latente',
    text: 'text-amber-300',
    hex: '#fbbf24',
  },
  generative: {
    badge: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
    ring: 'hover:border-rose-400/60 hover:shadow-[0_0_50px_-15px_rgba(251,113,133,0.5)]',
    dot: 'bg-rose-400',
    glow: 'from-rose-500/10',
    label: 'World model génératif / interactif',
    text: 'text-rose-300',
    hex: '#fb7185',
  },
}

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
// 1. Simulateur de masking JEPA — élément interactif signature (inchangé)
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
    <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Terrain de jeu</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">
            Simulateur de masking — comment JEPA construit l'espace latent
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Clique sur des patches pour changer quels fragments de l'image sont donnés à l'encodeur de
            contexte (visibles) et lesquels sont réservés à l'encodeur cible (masqués). Le prédicteur ne
            voit jamais les pixels masqués — il doit deviner leur <em>représentation latente</em>, pas leur
            apparence.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMasked(randomBlockMask())}
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
          >
            Masque aléatoire
          </button>
          <button
            onClick={() => setMasked(new Set(DEFAULT_MASK))}
            className="rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
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
                  className={`h-10 w-10 rounded-md border text-[9px] font-mono transition-all duration-150 ${
                    isMasked
                      ? 'border-fuchsia-400/70 bg-fuchsia-500/25 text-fuchsia-200 hover:bg-fuchsia-500/40'
                      : 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/25'
                  }`}
                >
                  {row},{col}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-cyan-400/60 bg-cyan-400/20" />
              visible ({visibleCount}) → encodeur de contexte
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-fuchsia-400/60 bg-fuchsia-500/25" />
              masqué ({maskedCount}) → encodeur cible
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <FlowStep
            color="cyan"
            title="Encodeur de contexte fθ"
            subtitle={`${visibleCount} patches visibles → Sx = {sx1 … sxn} ∈ ℝᴰ`}
          />
          <FlowArrow label="prédit à partir du contexte" />
          <FlowStep
            color="amber"
            title="Prédicteur gφ"
            subtitle="reçoit Sx + position des patches masqués → produit Ŝy (jamais les pixels)"
          />
          <FlowArrow label="comparé en espace latent (MSE), pas en pixels" dashed />
          <FlowStep
            color="fuchsia"
            title="Encodeur cible f θ̄ (mise à jour par EMA)"
            subtitle={`${maskedCount} patches masqués → Sy = vraie représentation latente`}
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
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
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
// 2. Explorateur d'espace latent vs variable latente (inchangé)
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
    <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Espace vs variable</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">
            « Espace latent » et « variable latente » — ce n'est pas la même chose
          </h2>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
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
            <div className="space-y-3 text-sm leading-6 text-slate-300">
              <p>
                L'<strong className="text-cyan-300">espace latent</strong> ℝᴰ, c'est tout le nuage de points
                ci-contre : l'ensemble des vecteurs que l'encodeur peut produire. Chaque point représenté est
                l'embedding d'un patch — les objets similaires (chat/chien, voiture/route) se regroupent
                naturellement pendant l'entraînement, sans étiquette.
              </p>
              <p className="text-slate-400">
                On parle d'« espace latent » quand on décrit la <em>structure globale</em> : sa dimension D,
                sa géométrie, le fait que des concepts proches y soient proches.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm leading-6 text-slate-300">
              <p>
                La <strong className="text-amber-300">variable latente z</strong> (le losange orange) est un
                seul point, tiré pour une prédiction précise — pas tout l'espace. Elle encode « la partie de
                la réponse qu'on ne peut pas deviner à partir de x seul » (ex. la voiture tourne-t-elle à
                gauche ou à droite ?).
              </p>
              <p className="text-slate-400">
                On parle de « variable latente » quand on décrit un <em>choix ponctuel</em> fait pour une
                prédiction donnée — d'où le nom : c'est une variable, pas un espace entier. Dans JEPA, z est
                volontairement affamé en information (discret, de faible dimension) pour l'empêcher de
                « tricher » en copiant directement la réponse.
              </p>
            </div>
          )}
          <button
            onClick={() => setZPoint(randomZ())}
            className="mt-4 self-start rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
          >
            ↺ Ré-échantillonner z
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 3. Frise chronologique (inchangée)
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
  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Chronologie</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">Des RNN de 1990 aux world models commerciaux</h2>
      <div className="mt-8 space-y-0">
        {TIMELINE.map((item, i) => (
          <div key={item.year} className="flex gap-5">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 font-mono text-[11px] text-cyan-200">
                {String(i + 1).padStart(2, '0')}
              </span>
              {i < TIMELINE.length - 1 && <span className="w-px flex-1 bg-slate-700" />}
            </div>
            <div className="pb-8">
              <p className="font-mono text-xs text-amber-300/90">{item.year}</p>
              <p className="mt-1 text-base font-semibold text-slate-100">{item.title}</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 4. LLM vs World Model — comparaison (inchangée)
// ============================================================================
const COMPARISON = [
  { axis: 'Ce qui est prédit', llm: 'Le token suivant (mot)', wm: "L'état futur de l'environnement" },
  { axis: 'Nature de la prédiction', llm: 'Statistique (corrélation)', wm: 'Causale / simulée (intervention)' },
  { axis: 'Mémoire', llm: 'Statique — poids figés après entraînement', wm: 'Dynamique — état latent mis à jour en continu' },
  { axis: 'Résultat sur planification (Flux)', llm: '~11% de victoires', wm: '~79% de victoires (accès à l\'espace latent)' },
]

function ComparisonGrid() {
  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300/80">Le diagnostic</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">Pourquoi un LLM n'est pas un world model</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
        « Terrain commun » = sous-ensemble d'un world model. Un LLM n'a que des patterns de mots, pas de
        faits ancrés dans une simulation du monde — d'où une hallucination structurelle, pas accidentelle.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700">
        <div className="grid grid-cols-3 bg-slate-800/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div className="p-3">Axe</div>
          <div className="p-3 text-cyan-300">LLM classique</div>
          <div className="p-3 text-amber-300">World model</div>
        </div>
        {COMPARISON.map((row, i) => (
          <div key={row.axis} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'}`}>
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
// 5. NOUVEAU — Le Cabinet : les 12 modèles, mécaniques d'entraînement
// détaillées (masquage réel vérifié pour I-JEPA / V-JEPA2 / MAE, boucles
// reconstituées schématiquement pour les modèles RL & génératifs).
// ============================================================================

// --- 5a. Grille de masquage générique (8 x 5), réutilisée pour tous les
//         modèles à base de patches -----------------------------------------
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

// --- 5b. Diagrammes de mécanique pour les modèles sans masquage -------------
function DreamLoopDiagram({ style }: { style: (typeof FAMILY_STYLES)[FamilyKey] }) {
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

function RssmDiagram({ style }: { style: (typeof FAMILY_STYLES)[FamilyKey] }) {
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

function MpcDiagram({ style }: { style: (typeof FAMILY_STYLES)[FamilyKey] }) {
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

// --- 5c. Sparkline illustrative animée (courbe de perte non mesurée, juste
//         pour donner une intuition de forme de convergence) ---------------
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

// --- 5d. Catalogue des 12 modèles -------------------------------------------
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
  input: string
  output: string
  utility: string
  mechanics: Mechanics
}

const MODEL_SPECS: ModelSpec[] = [
  {
    id: 'ijepa_vitb16_1k',
    displayName: 'JEPA',
    fullName: 'I-JEPA (ViT-B/16, ImageNet-1K)',
    family: 'jepa',
    input:
      "Image statique découpée en patches (14×14 ou 16×16 px). Un grand bloc de contexte (échelle 0.85–1.0 de l'image) et 4 blocs cibles plus petits (échelle 0.15–0.2 chacun) sont échantillonnés, sans chevauchement.",
    output:
      "Embeddings latents prédits (Ŝy) pour les 4 blocs cibles — comparés en espace latent (MSE) aux vraies embeddings produites par l'encodeur cible EMA. Jamais de pixels reconstruits.",
    utility:
      "Backbone visuel auto-supervisé réutilisable : classification, détection, segmentation en aval, sans étiquettes pendant le pré-entraînement.",
    mechanics: { kind: 'mask', cfg: { kind: 'jepa-image', targetBlocks: 4, targetScale: 0.17 } },
  },
  {
    id: 'vjepa2_vitl_fpc64_256',
    displayName: 'JEPA',
    fullName: 'V-JEPA2 (ViT-L, 64 frames, 256px)',
    family: 'jepa',
    input:
      'Clip vidéo (64 frames), grille spatio-temporelle 32×16×16. Masquage "multiblock3d" vérifié : union de 8 blocs courts (~15% de la frame) et 2 blocs longs (~70%), la même empreinte spatiale étant répétée en tube sur toute la durée du clip.',
    output:
      "Embeddings latents futurs prédits pour les tubes masqués (jusqu'à ~80% des tokens). Dans un test réel sur un clip, similarité cosinus prédite/vraie ≈0.54 contre ≈0.37 pour un contrôle mélangé — preuve d'une prédiction spécifique à la position, pas générique.",
    utility:
      "Compréhension d'action vidéo (Something-Something v2), et base pour un prédicteur conditionné par l'action en robotique (rollouts latents).",
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
    input: "Image découpée en patches, masquage aléatoire indépendant patch par patch (~75% des patches retirés).",
    output: "Pixels reconstruits pour les patches masqués, via un décodeur léger recevant tokens visibles + tokens de masque.",
    utility: "Baseline de reconstruction pixel ; sert de point de comparaison direct avec I-JEPA (latent vs pixel) sur la même famille de tâches.",
    mechanics: { kind: 'mask', cfg: { kind: 'mae-random', ratio: 0.75 } },
  },
  {
    id: 'videomae_base',
    displayName: 'MAE',
    fullName: 'VideoMAE (base)',
    family: 'mae',
    input: "Clip vidéo, masquage aléatoire très agressif de tubes spatio-temporels (~90% masqué).",
    output: "Pixels reconstruits des tubes masqués, comparés aux pixels réels (perte L2 en espace pixel).",
    utility: "Représentations vidéo pour la reconnaissance d'action ; contraste direct avec V-JEPA2 (pixel vs latent, même modalité vidéo).",
    mechanics: { kind: 'mask', cfg: { kind: 'mae-random-tube', ratio: 0.9 } },
  },
  {
    id: 'clip_vit_base_patch16',
    displayName: 'CLIP',
    fullName: 'CLIP (ViT-B/16)',
    family: 'semantic',
    input: "Paires (image, légende texte) — pas de masquage, tout le contenu est visible des deux côtés.",
    output: "Deux embeddings alignés dans un espace multimodal partagé, entraînés par contrastif (InfoNCE) pour que les paires vraies aient une similarité cosinus élevée.",
    utility: "Classification zero-shot, retrieval image-texte ; référence d'alignement sémantique pour l'évaluation des autres modèles.",
    mechanics: { kind: 'contrastive' },
  },
  {
    id: 'dinov2_base',
    displayName: 'DINOv2',
    fullName: 'DINOv2 (base)',
    family: 'semantic',
    input: "Image, découpée en vues multiples (multi-crop) : 2 vues globales + plusieurs vues locales, sans label.",
    output: "Embeddings denses ; le student prédit la distribution produite par le teacher (EMA du student) — pas de reconstruction pixel.",
    utility: "Features visuelles générales exploitables sans fine-tuning ; benchmark de structuration sémantique pour les autres modèles de la plateforme.",
    mechanics: { kind: 'teacher-student' },
  },
  {
    id: 'world_models_ha_schmidhuber',
    displayName: 'World Models (VAE-RNN-Controller)',
    fullName: 'World Models — Ha & Schmidhuber (2018)',
    family: 'rl',
    input: "Frames pixel de l'environnement (ex. VizDoom TakeCover).",
    output: "Vecteur latent (V, VAE) → état latent prédit (M, MDN-RNN) → action choisie par un petit contrôleur C (~1000 paramètres).",
    utility: "Le contrôleur s'entraîne entièrement « dans le rêve » de M, sans jamais interagir avec l'environnement réel pendant cette phase — un des tout premiers world models modernes.",
    mechanics: { kind: 'dream-loop' },
  },
  {
    id: 'dreamerv3',
    displayName: 'Dreamer',
    fullName: 'DreamerV3',
    family: 'rl',
    input: "Observations pixel + récompense de l'environnement.",
    output: "États latents imaginés (rollouts multi-pas dans un RSSM à variables catégorielles discrètes) et politique acteur-critique entraînée entièrement sur ces rollouts.",
    utility: "RL efficace en échantillons pour contrôle continu, robotique, jeux — la politique n'interagit avec le monde réel que pour exécuter l'action, jamais pendant son entraînement.",
    mechanics: { kind: 'rssm' },
  },
  {
    id: 'tdmpc2',
    displayName: 'TD-MPC',
    fullName: 'TD-MPC2',
    family: 'rl',
    input: "Observation (état ou pixels) + banque d'actions candidates à évaluer.",
    output: "État latent suivant prédit + valeur/récompense estimée pour chaque trajectoire candidate, utilisés pour sélectionner la meilleure séquence d'actions en ligne.",
    utility: "Contrôle continu multi-tâches (locomotion, manipulation) via optimisation de trajectoires en espace latent — équivalent pratique du Mode-2/MPC de l'architecture LeCun.",
    mechanics: { kind: 'mpc' },
  },
  {
    id: 'nvidia_cosmos3_edge',
    displayName: 'Cosmos',
    fullName: 'Cosmos 3 (Edge/Nano, NVIDIA)',
    family: 'generative',
    input: "Vidéo/flux capteurs + conditionnement (texte ou action). Nano : 16B paramètres, pensé pour l'inférence temps réel embarquée.",
    output: "Vidéo générée qui prédit l'évolution physique de la scène, avec tokens d'action optionnels en sortie.",
    utility: "Raisonnement physique temps réel embarqué pour la robotique et la conduite autonome ; génération de données synthétiques annotées.",
    mechanics: { kind: 'diffusion', note: "Cosmos 3 combine génération de monde par diffusion et conscience physique — la variante Super (64B) sert plutôt à la génération de données synthétiques à grande échelle, hors ligne." },
  },
  {
    id: 'nvidia_sana_wm',
    displayName: 'Cosmos',
    fullName: 'SANA-WM (famille Cosmos, NVIDIA)',
    family: 'generative',
    input: "Frames passées + conditionnement texte/action.",
    output: "Frames futures générées par un processus de diffusion (débruitage itératif de dizaines d'étapes).",
    utility: "Simulation vidéo du monde à haute résolution, alternative moins coûteuse que les variantes Cosmos les plus lourdes pour certains cas d'usage.",
    mechanics: { kind: 'diffusion', note: "Comme Sora et Cosmos, SANA-WM génère image par image via débruitage — le coût d'inférence scale avec le nombre d'étapes de diffusion et l'horizon de planification, contrairement à un LLM (coût linéaire en longueur de séquence)." },
  },
  {
    id: 'genie3',
    displayName: 'Genie',
    fullName: 'Genie 3 (Google DeepMind)',
    family: 'generative',
    input: "Description textuelle ou image de départ, décrivant un monde à générer.",
    output: "Environnement 3D interactif généré image par image en temps réel (~24 img/s, ~720p, plusieurs minutes de navigation cohérente).",
    utility: "Mondes navigables jouables en temps réel — entraînement d'agents incarnés, prototypage rapide d'environnements sans les construire à la main.",
    mechanics: { kind: 'autoregressive' },
  },
]

// ============================================================================
// 5f. Aperçu visuel Input/Output — icônes abstraites déduites de la mécanique
// ============================================================================
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
  // latent
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

// --- 5e. Carte détaillée d'un modèle ---------------------------------------
function ModelSpecCard({ spec }: { spec: ModelSpec }) {
  const style = FAMILY_STYLES[spec.family]
  const seed = hashString(spec.id)

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${style.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${style.glow} to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100`}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <div>
            <h3 className="text-lg font-semibold text-slate-50">{spec.displayName}</h3>
            <p className="text-[11px] text-slate-500">{spec.fullName}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wide ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Input</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{spec.input}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
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
          {spec.mechanics.kind === 'dream-loop' && <DreamLoopDiagram style={style} />}
          {spec.mechanics.kind === 'rssm' && <RssmDiagram style={style} />}
          {spec.mechanics.kind === 'mpc' && <MpcDiagram style={style} />}
          {spec.mechanics.kind === 'contrastive' && <ContrastiveDiagram />}
          {spec.mechanics.kind === 'teacher-student' && <TeacherStudentDiagram />}
          {spec.mechanics.kind === 'diffusion' && <DiffusionDiagram label={spec.mechanics.note} />}
          {spec.mechanics.kind === 'autoregressive' && <AutoregressiveDiagram />}
        </div>
      </div>

      <IOPreviewRow spec={spec} hex={style.hex} />

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
  const families: (FamilyKey | 'all')[] = ['all', 'jepa', 'mae', 'semantic', 'rl', 'generative']
  const visible = activeFamily === 'all' ? MODEL_SPECS : MODEL_SPECS.filter((m) => m.family === activeFamily)

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Le cabinet</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Les 12 modèles, mécanique par mécanique</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Pour chaque modèle : ce qu'il reçoit en entrée, ce qu'il produit, à quoi ça sert, et comment
            l'entraînement fonctionne réellement. Les grilles de masquage d'I-JEPA, V-JEPA2, ViT-MAE et
            VideoMAE utilisent les ratios et stratégies vérifiés dans les notebooks de test (blocs contigus
            pour JEPA, patches/tubes aléatoires pour MAE) ; les schémas des modèles RL et génératifs sont
            des reconstitutions pédagogiques basées sur la documentation publique — pas des logs
            d'entraînement réels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {families.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFamily(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {visible.map((spec) => (
          <ModelSpecCard key={spec.id} spec={spec} />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// 6. Comparaison des stratégies de masquage — vue synthétique (inchangée)
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
        <div key={i} className={`aspect-square rounded-[3px] ${masked.has(i) ? colorClass : 'bg-slate-800/70'}`} />
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
    <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Comparaison</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">
            Comment chaque famille masque — et pourquoi ça change ce qu'elle apprend
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            JEPA masque des <em>blocs contigus</em> (structure prévisible à deviner en latent) ; MAE masque
            au <em>hasard, patch par patch</em> (le modèle reconstruit des pixels, pas une structure). Le
            ratio masqué est aussi révélateur : plus il est élevé, moins le modèle peut « tricher » en
            copiant les voisins.
          </p>
        </div>
        <button
          onClick={() => setSeed((s) => s + 10)}
          className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20"
        >
          ↺ Nouveau tirage
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
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
// 8. Bandes illustrées — section "À propos des world models"
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
// 7. Éléments flottants d'ambiance — décoratifs, respectent
//    prefers-reduced-motion, sans effet sur le layout
// ============================================================================
function AmbientBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const rng = mulberry32(1000 + i)
        return {
          id: i,
          left: `${(rng() * 100).toFixed(1)}%`,
          top: `${(rng() * 100).toFixed(1)}%`,
          size: 2 + rng() * 3,
          duration: 14 + rng() * 16,
          delay: -rng() * 20,
          color: [FAMILY_STYLES.jepa.hex, FAMILY_STYLES.mae.hex, FAMILY_STYLES.rl.hex, FAMILY_STYLES.generative.hex, FAMILY_STYLES.semantic.hex][i % 5],
        }
      }),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[110px] motion-safe:animate-[float-a_18s_ease-in-out_infinite]" />
      <div className="absolute right-0 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-[120px] motion-safe:animate-[float-b_22s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px] motion-safe:animate-[float-a_25s_ease-in-out_infinite_reverse]" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px] motion-safe:animate-[float-b_20s_ease-in-out_infinite_reverse]" />
      <div className="absolute right-1/4 top-2/3 h-64 w-64 rounded-full bg-rose-500/10 blur-[90px] motion-safe:animate-[float-a_21s_ease-in-out_infinite]" />

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-40 motion-safe:animate-[drift_linear_infinite]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
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
      `}</style>
    </div>
  )
}

// ============================================================================
// Page principale
// Ordre : général → spécifique.
//   1) Hero (accroche)
//   2) Fondement — pourquoi un world model diffère d'un LLM
//   3) Contexte historique — la frise chronologique
//   4) À propos + bandes illustrées — vue d'ensemble des paradigmes/usages
//   5) Concepts fondamentaux interactifs — espace latent, masquage
//   6) Tests & faisabilité — transition vers le concret
//   7) Le cabinet — les 12 modèles en détail (le plus spécifique)
//   8) Modèles enregistrés côté backend — données live
// ============================================================================
export function Encyclopedia() {
  const { data, isLoading, error } = useQuery<ModelItem[], Error>({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  const [filteredModels, setFilteredModels] = useState<ModelItem[]>([])

  useEffect(() => {
    setFilteredModels(data ?? [])
  }, [data])

  const testBadges = useMemo(
    () => [
      { id: 'T1', label: 'Structure gap réel vs bruit', tier: '🟢 Live' },
      { id: 'T3', label: "Robustesse à l'occlusion spatiale", tier: '🟢 Live' },
      { id: 'T4', label: 'Robustesse au frame-dropout', tier: '🟡 Job async' },
      { id: 'T6', label: 'Séparation sémantique', tier: '🟢 Live' },
      { id: 'T11', label: 'Alignement texte-image', tier: '🟢 Live' },
    ],
    [],
  )

  const familyGroups: FamilyKey[] = ['jepa', 'mae', 'semantic', 'rl', 'generative']

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <AmbientBackground />

      {/* 1. Hero */}
      <div className="mb-10 overflow-hidden rounded-[2rem] border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-9 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Encyclopédie</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-50">
          World Models — de l'espace latent aux tests techniques
        </h1>
        <p className="mt-4 max-w-3xl leading-8 text-slate-300">
          Un LLM prédit le mot suivant. Un world model simule l'état futur d'un environnement — en espace
          latent (JEPA), en pixels (MAE, Cosmos, Genie), ou par dynamique apprise (Dreamer, TD-MPC2). Cette
          page explore les 12 modèles de la plateforme : leur paradigme, ce qu'ils reçoivent, ce qu'ils
          produisent, comment ils sont entraînés — et comment lire « espace latent » vs « variable latente ».
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {familyGroups.map((f) => (
            <span key={f} className={`rounded-full border px-3 py-1 text-[11px] font-medium ${FAMILY_STYLES[f].badge}`}>
              {FAMILY_STYLES[f].label}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Fondement : en quoi un world model diffère d'un LLM */}
      <section className="mt-10">
        <ComparisonGrid />
      </section>

      {/* 3. Contexte historique */}
      <section className="mt-10">
        <Timeline />
      </section>

      {/* 4. À propos, avec les 2 bandes illustrées (paradigme, puis usage) */}
      <section className="mt-10 rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
        <h2 className="text-2xl font-semibold text-slate-50">À propos des world models</h2>
        <p className="mt-4 leading-7 text-slate-300">
          Les world models permettent de représenter un environnement sans supervision explicite, ce qui rend
          possible la prédiction, la planification, et la comparaison de dynamiques visuelles. Ils sont utilisés
          ici pour évaluer la robustesse, la reconstruction, et la qualité des sorties dans un cadre unifié.
        </p>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-slate-500">Comment ils prédisent</p>
        <div className="mt-3">
          <ParadigmBand />
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-slate-500">Leur rôle sur la plateforme</p>
        <div className="mt-3">
          <UsageBand />
        </div>
      </section>

      {/* 5. Concepts fondamentaux interactifs */}
      <section className="mt-10 space-y-8">
        <LatentSpaceExplorer />
        <PatchMaskingDemo />
        <MaskingComparison />
      </section>

      {/* 6. Tests & faisabilité — transition vers le concret */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold text-slate-50">Tests proposés</h2>
          <ul className="mt-4 space-y-3 text-slate-300">
            {testBadges.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span><span className="font-mono text-cyan-300">{t.id}</span> · {t.label}</span>
                <span className="whitespace-nowrap text-xs text-slate-400">{t.tier}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold text-slate-50">Faisabilité</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Les tests légers peuvent tourner en live pour les petits modèles. Les évaluations longues et les checkpoints
            volumineux sont gérés comme jobs asynchrones ou archives Kaggle.
          </p>
        </div>
      </section>

      {/* 7. Le cabinet — 12 modèles en détail, le plus spécifique */}
      <ModelExplorer />

      {/* 8. Modèles — appels backend inchangés */}
      <section className="mt-10">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Plateforme</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Modèles enregistrés côté backend</h2>
        </div>
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