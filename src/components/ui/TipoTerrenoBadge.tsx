import React from 'react'

export const TipoTerrenoBadge = ({ tipo = '' }: { tipo: string }) => {
  return (
    <span className={`px-3 py-0.5 rounded-md  text-xs font-medium 
      ${tipo === 'PENDIENTE' ? 'bg-orange-100 text-orange-700' :
        tipo === 'SUPERFICIE' ? 'bg-blue-100 text-blue-700' :
          tipo === 'SOCAVÓN' ? 'bg-red-100 text-red-800' :
            tipo === 'CIUDAD' ? 'bg-violet-100 text-violet-700' :
              tipo === 'SEVERO' ? 'bg-rose-200 text-rose-800' :
                'bg-gray-100 text-gray-700'
      }`}>
      {tipo
        ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
