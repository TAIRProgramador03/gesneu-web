import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FileText } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { VehiculoMain } from '@/hooks/use-placa-detail'

interface Fila { label: string; value: string; accent?: boolean }

/** Ficha en listas compactas (etiqueta ··· valor), igual que la del neumático. */
export const PlacaFichaTecnica = ({ vehiculo }: { vehiculo: VehiculoMain }) => {
  const km = vehiculo.KILOMETRAJE_GESNEU !== null ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE

  const secciones: { title: string; filas: Fila[] }[] = [
    {
      title: 'Identificación',
      filas: [
        { label: 'Placa', value: vehiculo.PLACA || '—', accent: true },
        { label: 'Marca', value: vehiculo.MARCA || '—' },
        { label: 'Tipo', value: vehiculo.TIPO || '—' },
        { label: 'Modelo', value: vehiculo.MODELO || '—' },
        { label: 'Año', value: vehiculo.ANO ? String(vehiculo.ANO) : '—' },
        { label: 'Color', value: vehiculo.COLOR || '—' },
        { label: 'N° serie', value: vehiculo.NROSERIE || '—' },
        { label: 'N° motor', value: vehiculo.NROMOTOR || '—' },
      ],
    },
    {
      title: 'Operación',
      filas: [
        { label: 'Operación', value: vehiculo.OPERACION || '—', accent: true },
        { label: 'Kilometraje', value: `${km.toLocaleString('es-PE')} km` },
        { label: 'Terreno', value: vehiculo.TIPO_TERRENO || '—' },
        { label: 'Condición', value: vehiculo.RETEN || '—' },
        { label: 'Taller', value: vehiculo.TALLER || '—' },
      ],
    },
  ]

  return (
    <CollapsibleSection title="Ficha del Vehículo" icon={<FileText className="size-4" />} border="border-sky-500">
      <div className="space-y-5">
        {secciones.map((seccion) => (
          <section key={seccion.title}>
            <h3 className="mb-1 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-texto-apagado">
              {seccion.title}
              <span className="h-px flex-1 bg-border" />
            </h3>
            <dl>
              {seccion.filas.map((fila, i) => (
                <div
                  key={fila.label}
                  className={cn('flex items-baseline justify-between gap-4 py-1.5 text-sm', i < seccion.filas.length - 1 && 'border-b border-dashed')}
                >
                  <dt className="shrink-0 text-texto-apagado">{fila.label}</dt>
                  <dd
                    title={fila.value}
                    className={cn('min-w-0 text-right font-semibold wrap-break-word', fila.accent ? 'text-sky-700 dark:text-sky-300' : 'text-gray-800 dark:text-slate-100')}
                  >
                    {fila.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </CollapsibleSection>
  )
}
