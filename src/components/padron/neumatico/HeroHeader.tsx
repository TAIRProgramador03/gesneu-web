import { NeumaticoBuscado } from '@/api/Neumaticos'
import { Spec } from '@/components/ui/Spec'
import { TextoRecuperadoBadge } from '@/components/ui/TextoRecuperadoBadge'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import React from 'react'

export const HeroHeader = ({ neu }: { neu: NeumaticoBuscado }) => {
  return (
    <div className="rounded-2xl bg-white shadow-sm border p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {neu.CODIGO_NEUMATICO}
            </h1>
            <TipoMovimientoBadge tipoMovimiento={neu.SITUACION_NEUMATICO ?? ""} />
            <span className="text-gray-500 text-sm">
              {<TextoRecuperadoBadge esRecuperado={neu.RECUPERADO_NEUMATICO} />}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {neu.MARCA_NEUMATICO} &middot; {neu.MEDIDA_NEUMATICO} &middot; {neu.DISENO_NEUMATICO}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
          <Spec label="Placa" value={neu.PLACA_ACTUAL || "—"} />
          <Spec label="Remanente" value={`${neu.REMANENTE_ACTUAL} mm`} />
          <Spec label="Taller" value={neu.TALLER_ACTUAL || "—"} />
          <Spec label="Costo" value={`$${neu.COSTO_NEUMATICO.toLocaleString("es-PE")}`} />
          <Spec label="Proveedor" value={neu.PROVEEDOR_NEUMATICO || "—"} />
          <Spec label="Vida útil" value={`${neu.PORCENTAJE_VIDA}%`} />
        </div>
      </div>
    </div>
  )
}
