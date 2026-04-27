import { cn } from '@/lib/utils'
import React from 'react'

export const MiniKpi = ({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-linear-to-br from-white to-gray-50/50 p-3 flex items-start gap-3 hover:border-sky-200 hover:shadow-sm transition-all">
      <div className={cn("rounded-lg p-2 shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
          {label}
        </p>
        <p className="text-base font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
