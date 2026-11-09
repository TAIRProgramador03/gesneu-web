import React from 'react'

export const TipoTerrenoBadge = ({ tipo = '' }: { tipo: string }) => {
  return (
    <span className={`px-3 py-0.5 rounded-md  text-xs font-medium 
      ${tipo === 'PENDIENTE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' :
        tipo === 'SUPERFICIE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' :
          tipo === 'SOCAVÓN' ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' :
            tipo === 'CIUDAD' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' :
              tipo === 'SEVERO' ? 'bg-rose-200 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200' :
                'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300'
      }`}>
      {tipo
        ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
