import { cn } from '@/lib/utils';
import React from 'react'

export const FichaItem = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => {
  return (
    <div className="group relative rounded-xl border border-gray-100 dark:border-slate-800 bg-linear-to-br from-white dark:from-card to-gray-50/50 dark:to-superficie-1/50 p-3 hover:border-sky-200 dark:hover:border-sky-500/30 hover:shadow-sm transition-all">
      <span className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </span>
      <span
        className={cn(
          "block text-sm font-medium leading-snug wrap-break-word",
          accent ? "text-sky-700 dark:text-sky-300" : "text-gray-800 dark:text-slate-100"
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
