import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Filter, RotateCcw } from 'lucide-react'
import { ModelItem, ModalityType, LicenseType } from './ModelCard'

type ParadigmType = 'generative' | 'non-generative'

const PARADIGM_LABELS: Record<ParadigmType, string> = {
  generative: 'Génératif',
  'non-generative': 'Non-génératif',
}

const MODALITY_LABELS: Record<ModalityType, string> = {
  image: 'Image',
  video: 'Vidéo',
  state: 'State',
  pixel: 'Pixel',
  rl: 'RL',
}

const LICENSE_LABELS: Record<LicenseType, string> = {
  'open-weight': 'Open-weight',
  'closed-api': 'Closed-API',
  'research-only': 'Research-only',
}

const FAMILY_TO_PARADIGM: Record<string, ParadigmType> = {
  JEPA: 'non-generative',
  DINOv2: 'non-generative',
  CLIP: 'non-generative',
  Dreamer: 'non-generative',
  'TD-MPC': 'non-generative',
  'World Models': 'non-generative',
  MAE: 'generative',
  Cosmos: 'generative',
  Genie: 'generative',
}

const PARADIGM_COLORS: Record<ParadigmType, string> = {
  generative: 'bg-violet-600',
  'non-generative': 'bg-emerald-600',
}

const MODALITY_COLORS: Record<ModalityType, string> = {
  image: 'bg-blue-600',
  video: 'bg-purple-600',
  state: 'bg-amber-600',
  pixel: 'bg-pink-600',
  rl: 'bg-cyan-600',
}

const LICENSE_COLORS: Record<LicenseType, string> = {
  'open-weight': 'bg-emerald-600',
  'closed-api': 'bg-rose-600',
  'research-only': 'bg-amber-600',
}

const PARADIGM_SHADOWS: Record<ParadigmType, string> = {
  generative: 'shadow-[0_0_0_1px_theme(colors.violet.600)]',
  'non-generative': 'shadow-[0_0_0_1px_theme(colors.emerald.600)]',
}

const MODALITY_SHADOWS: Record<ModalityType, string> = {
  image: 'shadow-[0_0_0_1px_theme(colors.blue.600)]',
  video: 'shadow-[0_0_0_1px_theme(colors.purple.600)]',
  state: 'shadow-[0_0_0_1px_theme(colors.amber.600)]',
  pixel: 'shadow-[0_0_0_1px_theme(colors.pink.600)]',
  rl: 'shadow-[0_0_0_1px_theme(colors.cyan.600)]',
}

const LICENSE_SHADOWS: Record<LicenseType, string> = {
  'open-weight': 'shadow-[0_0_0_1px_theme(colors.emerald.600)]',
  'closed-api': 'shadow-[0_0_0_1px_theme(colors.rose.600)]',
  'research-only': 'shadow-[0_0_0_1px_theme(colors.amber.600)]',
}

interface TaxonomyFiltersProps {
  models: ModelItem[]
  onFilterChange: (filteredModels: ModelItem[]) => void
}

export function TaxonomyFilters({ models, onFilterChange }: TaxonomyFiltersProps) {
  const [selectedParadigm, setSelectedParadigm] = useState<ParadigmType | null>(null)
  const [selectedModality, setSelectedModality] = useState<ModalityType | null>(null)
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null)

  const hasActiveFilters = selectedParadigm !== null || selectedModality !== null || selectedLicense !== null

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const modelParadigm = FAMILY_TO_PARADIGM[model.family] ?? 'non-generative'
      const paradigmMatch = selectedParadigm === null || modelParadigm === selectedParadigm
      const modalityMatch = selectedModality === null || model.modality === selectedModality
      const licenseMatch = selectedLicense === null || model.license === selectedLicense
      return paradigmMatch && modalityMatch && licenseMatch
    })
  }, [models, selectedParadigm, selectedModality, selectedLicense])

  useEffect(() => {
    onFilterChange(filteredModels)
  }, [filteredModels, onFilterChange])

  const getParadigmCount = (paradigm: ParadigmType) => {
    return models.filter((m) => (FAMILY_TO_PARADIGM[m.family] ?? 'non-generative') === paradigm).length
  }

  const getModalityCount = (modality: ModalityType) => {
    return models.filter((m) => m.modality === modality).length
  }

  const getLicenseCount = (license: LicenseType) => {
    return models.filter((m) => m.license === license).length
  }

  const handleReset = () => {
    setSelectedParadigm(null)
    setSelectedModality(null)
    setSelectedLicense(null)
  }

  const Pill = ({
    label,
    count,
    isActive,
    color,
    shadow,
    onClick,
  }: {
    label: string
    count: number
    isActive: boolean
    color: string
    shadow: string
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200
        ${isActive
          ? `${color} text-white ${shadow}`
          : 'border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-100'
        }
      `}
    >
      {label}
      <span className={`
        px-1.5 py-0.5 text-xs rounded-full
        ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}
      `}>
        {count}
      </span>
    </button>
  )

  const FilterGroup = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[1.5rem] border border-slate-700 bg-slate-900/60 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
        <FilterGroup title="Paradigme">
          {(Object.keys(PARADIGM_LABELS) as ParadigmType[]).map((paradigm) => (
            <Pill
              key={paradigm}
              label={PARADIGM_LABELS[paradigm]}
              count={getParadigmCount(paradigm)}
              isActive={selectedParadigm === paradigm}
              color={PARADIGM_COLORS[paradigm]}
              shadow={PARADIGM_SHADOWS[paradigm]}
              onClick={() => setSelectedParadigm(selectedParadigm === paradigm ? null : paradigm)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Modalité">
          {(Object.keys(MODALITY_LABELS) as ModalityType[]).map((modality) => (
            <Pill
              key={modality}
              label={MODALITY_LABELS[modality]}
              count={getModalityCount(modality)}
              isActive={selectedModality === modality}
              color={MODALITY_COLORS[modality]}
              shadow={MODALITY_SHADOWS[modality]}
              onClick={() => setSelectedModality(selectedModality === modality ? null : modality)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Licence">
          {(Object.keys(LICENSE_LABELS) as LicenseType[]).map((license) => (
            <Pill
              key={license}
              label={LICENSE_LABELS[license]}
              count={getLicenseCount(license)}
              isActive={selectedLicense === license}
              color={LICENSE_COLORS[license]}
              shadow={LICENSE_SHADOWS[license]}
              onClick={() => setSelectedLicense(selectedLicense === license ? null : license)}
            />
          ))}
        </FilterGroup>
      </div>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}