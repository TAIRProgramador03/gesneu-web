import React from 'react'

export const TipoMovimientoBadge = ({ tipoMovimiento = '' }: { tipoMovimiento: string }) => {
  return (
    <span className={`px-6 py-0.5 rounded-md  font-medium text-xs ${tipoMovimiento === 'BAJA' ? 'bg-red-100 text-red-700' :
      tipoMovimiento === 'ASIGNADO' ? 'bg-yellow-100 text-yellow-700' :
        tipoMovimiento === 'DISPONIBLE' ? 'bg-green-100 text-green-700' :
          tipoMovimiento === 'TEMPORAL' ? 'bg-cyan-100 text-cyan-700' :
            tipoMovimiento === 'REQUERIDO' ? 'bg-rose-100 text-rose-700' :
              'bg-gray-100 text-gray-700'
      }`}>
      {tipoMovimiento
        ? tipoMovimiento.charAt(0).toUpperCase() + tipoMovimiento.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
