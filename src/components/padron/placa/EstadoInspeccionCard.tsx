import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { cn, convertToDateHuman } from '@/lib/utils'
import { DIAS_VIGENCIA_INSPECCION, type EstadisticasPlaca } from '@/utils/estadisticas-placa'
import { Search } from 'lucide-react'
import React from 'react'

/** Cuánto falta para que la última inspección deje de servir (regla de 4 días). */
export const EstadoInspeccionCard = ({ stats }: { stats: EstadisticasPlaca }) => {
  const insp = stats.ultimaInspeccion
  const dias = insp?.dias ?? null
  const vigente = insp?.vigente ?? false

  return (
    <CollapsibleSection
      title="Estado de inspección"
      icon={<Search className="size-4" />}
      border={insp === null ? 'border-amber-500' : vigente ? 'border-green-500' : 'border-red-500'}
    >
      {!insp || dias === null ? (
        <div className="flex flex-col items-center gap-1 py-6 text-center text-texto-apagado">
          <Search className="size-9 opacity-25" />
          <p className="text-sm font-medium">Sin inspecciones registradas</p>
          <p className="text-xs">Se exige una inspección al menos cada {DIAS_VIGENCIA_INSPECCION} días.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className={cn('text-3xl font-extrabold leading-none tabular-nums', vigente ? 'text-vida-ok' : 'text-vida-critico')}>
              {dias} <small className="text-sm font-semibold text-texto-apagado">{dias === 1 ? 'día desde la última' : 'días desde la última'}</small>
            </p>
            <p className="mt-2 text-xs text-texto-apagado">
              Una inspección sirve hoy y los {DIAS_VIGENCIA_INSPECCION - 1} días anteriores; desde el día {DIAS_VIGENCIA_INSPECCION} se exige una nueva.
            </p>
          </div>

          <div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-superficie-2"
              role="img"
              aria-label={`${Math.min(dias, DIAS_VIGENCIA_INSPECCION)} de ${DIAS_VIGENCIA_INSPECCION} días`}
            >
              <div
                className={cn('h-full rounded-full transition-all duration-1000', vigente ? 'bg-vida-ok' : 'bg-vida-critico')}
                style={{ width: `${Math.min(100, (dias / DIAS_VIGENCIA_INSPECCION) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
              {Array.from({ length: DIAS_VIGENCIA_INSPECCION + 1 }, (_, d) => (
                <span key={d} className={cn(d === Math.min(dias, DIAS_VIGENCIA_INSPECCION) && 'font-bold text-foreground')}>
                  {d === 0 ? 'Hoy' : d === DIAS_VIGENCIA_INSPECCION ? `${d} d · nueva` : `${d} d`}
                </span>
              ))}
            </div>
          </div>

          <dl>
            {[
              ['Última inspección', convertToDateHuman(insp.fecha)],
              ...(insp.usuario ? [['Registrada por', insp.usuario]] : []),
              ['Neumáticos medidos', `${insp.neumaticosMedidos}${stats.montados > 0 ? ` de ${stats.montados} montados` : ''}`],
            ].map(([k, v], i, arr) => (
              <div key={k} className={cn('flex items-baseline justify-between gap-4 py-1.5 text-sm', i < arr.length - 1 && 'border-b border-dashed')}>
                <dt className="text-texto-apagado">{k}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </CollapsibleSection>
  )
}
