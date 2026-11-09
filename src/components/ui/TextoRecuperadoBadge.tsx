import React from 'react'

export const TextoRecuperadoBadge = ({ esRecuperado = false }: { esRecuperado: boolean }) => {
  return (
    <span className={`px-4 py-0.5 rounded-md font-medium text-xs ${esRecuperado ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300'}`}>
      {esRecuperado ? 'Recuperado' : 'Nuevo'}
    </span>
  )
}
