import React from 'react'

export const EsRecuperadoBadge = ({ esRecuperado = false }: { esRecuperado: boolean }) => {
  return (
    <span className={`px-4 py-0.5 rounded-md font-medium ${esRecuperado ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
      }`}>
      {esRecuperado ? 'SI' : 'NO'}
    </span>
  )
}
