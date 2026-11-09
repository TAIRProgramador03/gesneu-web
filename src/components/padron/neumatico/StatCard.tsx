import { cn } from '@/lib/utils'
import React from 'react'

export const StatCard = ({
  icon,
  label,
  value,
  color = "text-sky-800 dark:text-sky-200",
  border = 'border-gray-100 dark:border-slate-800'
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  border?: string
}) => {
  return (
    <div className={cn("rounded-2xl bg-white dark:bg-card shadow-sm border-t-4 p-5 flex items-center gap-4", border)}>
      <div className={cn("rounded-xl bg-gray-50 dark:bg-superficie-1 p-3", color)}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}
