// src/components/ComparisonPanel.tsx
import { ComparisonSet } from '../data/comparisonData'

export function ComparisonPanel({ set }: { set: ComparisonSet }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-50">{set.title}</h3>
        
          href={set.sourceNotebook.url}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/25"
        >
          Notebook complet ↗
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-slate-400">
              <th className="py-2 pr-4 font-medium">Métrique</th>
              {set.models.map((m) => (
                <th key={m} className="py-2 pr-4 font-medium text-slate-200">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row) => (
              <tr key={row.metric} className="border-b border-slate-800/60 align-top">
                <td className="py-2.5 pr-4 text-slate-300">{row.metric}</td>
                {set.models.map((m) => (
                  <td
                    key={m}
                    className={`py-2.5 pr-4 ${
                      row.winner === m ? 'rounded-lg bg-emerald-500/15 font-semibold text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    {row.values[m] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {set.rows.some((r) => r.note) && (
        <div className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
          {set.rows
            .filter((r) => r.note)
            .map((r) => (
              <p key={r.metric}>
                <span className="text-slate-400">{r.metric} :</span> {r.note}
              </p>
            ))}
        </div>
      )}
    </div>
  )
}