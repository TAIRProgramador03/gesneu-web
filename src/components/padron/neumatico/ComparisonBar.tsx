import { NeumaticoBuscado } from '@/api/Neumaticos'
import { cn } from '@/lib/utils'
import { vidaBgGradient } from '@/utils/helpers'
import React from 'react'

export const ComparisonBar = ({ neu }: { neu: NeumaticoBuscado }) => {
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const montado = neu.REMANENTE_MONTADO ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0
  const max = montado || 1

  const items = [
    { label: "Original", value: original, pct: 100, barClass: "bg-gray-400" },
    { label: "Montado", value: montado, pct: (montado / montado) * 100, barClass: "bg-gradient-to-r from-sky-400 to-sky-300" },
    { label: "Actual", value: actual, pct: (actual / max) * 100, barClass: cn("bg-gradient-to-r", vidaBgGradient(neu.PORCENTAJE_VIDA ?? 0)) },
  ]

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-16 shrink-0 text-right">
            {item.label}
          </span>
          <div className="flex-1 relative">
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", item.barClass)}
                style={{ width: `${Math.min(item.pct, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700 w-14 text-right tabular-nums">
            {item.value} mm
          </span>
        </div>
      ))}
    </div>
  )
}
