import React from 'react'

export const TipoRetenBadge = ({ tipo = '' }: { tipo: string }) => {
  return (
    <span className={`px-3 py-0.5 rounded-md  text-xs font-medium 
      ${tipo === 'TITULAR' ? 'bg-green-100 text-green-700' :
        tipo === 'RETÉN' ? 'bg-blue-100 text-blue-700' :
          tipo === 'LOGISTICA' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'
      }`}>
      {tipo
        ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
