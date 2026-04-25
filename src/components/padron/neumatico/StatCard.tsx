import { cn } from '@/lib/utils'
import React from 'react'

export const StatCard = ({
  icon,
  label,
  value,
  color = "text-sky-800",
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) => {
  return (
    <div className="rounded-2xl bg-white shadow-sm border p-5 flex items-center gap-4">
      <div className={cn("rounded-xl bg-gray-50 p-3", color)}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
