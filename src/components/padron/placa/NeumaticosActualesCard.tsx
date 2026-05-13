import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { NeumaticoActual, NeumaticoInstalado } from '@/hooks/use-placa-detail'
import { cn } from '@/lib/utils'
import { vidaColor, borderColor } from '@/utils/helpers'
import { CircleDot } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function VidaBar({ pct }: { pct: number }) {
  const color =
    pct < 39 ? 'bg-red-400' :
      pct < 79 ? 'bg-yellow-400' :
        'bg-green-400'

  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 mt-1.5">
      <div className={cn('h-1.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function NeumaticoCard({ neu }: { neu: NeumaticoInstalado }) {
  const pct = neu.ESTADO
  const border =
    pct < 39 ? 'border-red-200' :
      pct < 79 ? 'border-yellow-200' :
        'border-green-200'

  return (
    <Link
      href={`/padron/neumatico/${neu.CODIGO_NEU}`}
      target='_BLANK'
      className={cn(
        'group block rounded-xl border-2 bg-white p-3.5 hover:shadow-md transition-all',
        border
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[13px] font-bold uppercase tracking-widest text-cyan-700 leading-tight">
          {neu.POSICION_NEU}
        </span>
        <span className={cn('text-xs font-bold', vidaColor(pct))}>
          {pct}%
        </span>
      </div>
      <p className="text-sm font-bold text-gray-800 group-hover:text-sky-700 transition-colors">
        {neu.CODIGO_NEU}
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5">
        {neu.MARCA} · {neu.MEDIDA} · {neu.DISENO}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-gray-500">
          Rem. <span className="font-semibold text-gray-700">{neu.REMANENTE} mm</span>
        </span>
      </div>
      <VidaBar pct={pct} />
    </Link>
  )
}

export const NeumaticosActualesCard = ({ neumaticos }: { neumaticos: NeumaticoInstalado[] }) => {
  return (
    <CollapsibleSection
      title="Neumáticos Actuales"
      icon={<CircleDot className="size-4" />}
      border="border-indigo-500"
      headerRight={
        <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
          {neumaticos.length} posiciones
        </span>
      }
    >
      {neumaticos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <CircleDot className="size-10 opacity-20 mb-3" />
          <p className="text-sm font-medium">Sin neumáticos asignados</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {neumaticos.map((neu) => (
            <NeumaticoCard key={neu.CODIGO_NEU} neu={neu} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}
