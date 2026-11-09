import React from 'react'

export const TipoMovimientoBadge = ({ tipoMovimiento = '' }: { tipoMovimiento: string }) => {
  return (
    <span className={`px-6 py-0.5 rounded-md  font-medium text-xs ${tipoMovimiento === 'BAJA' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' :
      tipoMovimiento === 'ASIGNADO' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300' :
        tipoMovimiento === 'DISPONIBLE' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' :
          tipoMovimiento === 'VENDIDO' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300' :
            tipoMovimiento === 'TEMPORAL' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' :
              tipoMovimiento === 'REQUERIDO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300'
      }`}>
      {tipoMovimiento
        ? tipoMovimiento.charAt(0).toUpperCase() + tipoMovimiento.slice(1).toLowerCase()
        : ''}
    </span>
  )
}
