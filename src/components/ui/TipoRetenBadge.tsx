import React from 'react'

export const TipoRetenBadge = ({ tipo = '' }: { tipo: string }) => {
  return (
    <span className={`px-3 py-0.5 rounded-md  text-xs font-medium 
      ${tipo === 'TITULAR' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' :
        tipo === 'RETÉN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' :
          tipo === 'LOGISTICA' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300'
      }`}>
      {tipo
        ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
