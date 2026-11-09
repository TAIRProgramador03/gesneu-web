import { Spec } from '@/components/ui/Spec'
import { VehiculoMain } from '@/hooks/use-placa-detail'
import { Car } from 'lucide-react'
import React from 'react'

export const PlacaHeroHeader = ({ vehiculo }: { vehiculo: VehiculoMain }) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-card shadow-sm border p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 p-2">
                <Car className="size-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-wide">
                {vehiculo.PLACA}
              </h1>
            </div>
            {vehiculo.OPERACION && (
              <span className="rounded-full bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-semibold px-3 py-0.5">
                {vehiculo.OPERACION}
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {vehiculo.MARCA} {vehiculo.TIPO} {vehiculo.MODELO} &middot; {vehiculo.ANO}
            {vehiculo.COLOR ? ` · ${vehiculo.COLOR}` : ''}
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
          <Spec label="Marca" value={vehiculo.MARCA || '—'} />
          <Spec label="Modelo" value={vehiculo.MODELO || '—'} />
          <Spec label="Año" value={vehiculo.ANO.toLocaleString('es-PE') || '—'} />
          <Spec label="Kilometraje" value={vehiculo.KILOMETRAJE_GESNEU !== null ? `${vehiculo.KILOMETRAJE_GESNEU.toLocaleString('es-PE')} km` : `${vehiculo.KILOMETRAJE.toLocaleString('es-PE')} km`} />
          <Spec label="Operación" value={vehiculo.OPERACION || '—'} />
          <Spec label="Terreno" value={vehiculo.TIPO_TERRENO || '—'} />
          <Spec label="Condición" value={vehiculo.RETEN || '—'} />
        </div>
      </div>
    </div>
  )
}
