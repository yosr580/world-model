import { motion, HTMLMotionProps } from 'framer-motion'
import { useState } from 'react'
import {
  CheckCircle,
  FileText,
  Unlock,
  Lock,
  FlaskConical,
  Image,
  Video,
  Cpu,
  Circle,
} from 'lucide-react'

export type ExecutionTier = 'live' | 'job_async' | 'archived_kaggle'
export type LicenseType = 'open-weight' | 'closed-api' | 'research-only'
export type ModalityType = 'image' | 'video' | 'state' | 'pixel' | 'rl'

export type ModelItem = {
  id: string
  name: string
  family: string
  modality: ModalityType
  license: LicenseType
  verified_reproducible: boolean
  manifest: {
    execution_tier?: ExecutionTier
    access_notes?: string
    compatible_tests?: string[]
    [key: string]: unknown
  }
  created_at: string
}

const familyColors: Record<string, { border: string; badge: string; dot: string }> = {
  JEPA: { border: 'border-indigo-500', badge: 'bg-indigo-500/15 text-indigo-300', dot: 'bg-indigo-500' },
  DINOv2: { border: 'border-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-500' },
  CLIP: { border: 'border-amber-500', badge: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-500' },
  MAE: { border: 'border-pink-500', badge: 'bg-pink-500/15 text-pink-300', dot: 'bg-pink-500' },
  Dreamer: { border: 'border-violet-500', badge: 'bg-violet-500/15 text-violet-300', dot: 'bg-violet-500' },
  'TD-MPC': { border: 'border-cyan-500', badge: 'bg-cyan-500/15 text-cyan-300', dot: 'bg-cyan-500' },
  Cosmos: { border: 'border-orange-500', badge: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-500' },
  Genie: { border: 'border-slate-500', badge: 'bg-slate-500/15 text-slate-300', dot: 'bg-slate-500' },
  'World Models': { border: 'border-teal-500', badge: 'bg-teal-500/15 text-teal-300', dot: 'bg-teal-500' },
}

const tierConfig: Record<ExecutionTier, { label: string; dot: string; text: string }> = {
  live: { label: 'Live', dot: 'bg-emerald-500', text: 'text-emerald-300' },
  job_async: { label: 'Job asynchrone', dot: 'bg-amber-500', text: 'text-amber-300' },
  archived_kaggle: { label: 'Archivé Kaggle', dot: 'bg-blue-500', text: 'text-blue-300' },
}

const tierFallback = { label: 'Inconnu', dot: 'bg-slate-500', text: 'text-slate-300' }

const licenseConfig: Record<LicenseType, { icon: React.ReactNode; color: string; label: string }> = {
  'open-weight': { icon: <Unlock className="w-4 h-4" />, color: 'text-emerald-400', label: 'Open-weight' },
  'closed-api': { icon: <Lock className="w-4 h-4" />, color: 'text-red-400', label: 'Closed API' },
  'research-only': { icon: <FlaskConical className="w-4 h-4" />, color: 'text-amber-400', label: 'Research only' },
}

const modalityConfig: Record<ModalityType, { icon: React.ReactNode; label: string }> = {
  image: { icon: <Image className="w-4 h-4" />, label: 'Image' },
  video: { icon: <Video className="w-4 h-4" />, label: 'Vidéo' },
  state: { icon: <Cpu className="w-4 h-4" />, label: 'State' },
  pixel: { icon: <Cpu className="w-4 h-4" />, label: 'Pixel' },
  rl: { icon: <Cpu className="w-4 h-4" />, label: 'RL' },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const hoverVariants = {
  initial: { y: 0, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)' },
  hover: {
    y: -4,
    boxShadow: '0 20px 60px -15px rgba(0,0,0,0.5)',
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
}

const notesVariants = {
  closed: { opacity: 0, height: 0, overflow: 'hidden' },
  open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' as const } },
}

export function ModelCard({ model, index }: { model: ModelItem; index: number }) {
  const colors = familyColors[model.family] || familyColors['World Models']
  const executionTier = model.manifest.execution_tier
  const tier = executionTier ? tierConfig[executionTier] : tierFallback
  const license = licenseConfig[model.license] || licenseConfig['research-only']
  const modality = modalityConfig[model.modality] || modalityConfig.state
  const [showNotes, setShowNotes] = useState(false)

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`relative rounded-3xl border-l-4 ${colors.border} border-slate-700 bg-slate-900/85 p-6 shadow-xl shadow-slate-950/20 overflow-hidden`}
      style={{ '--card-index': index } as React.CSSProperties}
      onMouseEnter={() => setShowNotes(true)}
      onMouseLeave={() => setShowNotes(false)}
    >
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {model.family}
            </span>
            <h3 className="mt-3 text-2xl font-semibold text-slate-50">{model.name}</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              model.verified_reproducible
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-700/70 text-slate-300'
            }`}
          >
            {model.verified_reproducible ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Vérifié reproductible
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Rapporté
              </>
            )}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              {modality.icon}
              <span>Modalité</span>
            </div>
            <span className="mt-2 block text-slate-100">{modality.label}</span>
          </div>
          <div className="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className={license.color}>{license.icon}</span>
              <span>Licence</span>
            </div>
            <span className="mt-2 block text-slate-100">{license.label}</span>
          </div>
          <div className="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${tier.dot}`} />
              <span>Exécution</span>
            </div>
            <span className={`mt-2 block ${tier.text}`}>{tier.label}</span>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-400">
          Entré en base le {new Date(model.created_at).toLocaleDateString('fr-FR')}.
        </p>

        {model.manifest.access_notes && (
          <motion.div
            variants={notesVariants}
            initial="closed"
            animate={showNotes ? 'open' : 'closed'}
            className="absolute bottom-0 left-0 right-0 px-6 pb-4 bg-gradient-to-t from-slate-900/95 to-transparent"
          >
            <div className="rounded-xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300 line-clamp-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Notes d'accès</span>
              <span className="mt-1 block text-slate-200">
                {model.manifest.access_notes.length > 80
                  ? model.manifest.access_notes.slice(0, 80) + '…'
                  : model.manifest.access_notes}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        variants={hoverVariants}
        initial="initial"
        animate={showNotes ? 'hover' : 'initial'}
        className="absolute inset-0 pointer-events-none"
      />
    </motion.article>
  )
}

export function ModelCardContainer({ models }: { models: ModelItem[] }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
      initial="hidden"
      animate="visible"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {models.map((model, index) => (
        <ModelCard key={model.id} model={model} index={index} />
      ))}
    </motion.div>
  )
}
