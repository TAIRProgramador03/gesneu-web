import { NeumaticoBuscado } from '@/api/Neumaticos'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FileText } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'

interface Fila { label: string; value: string; accent?: boolean }

/** Ficha en listas compactas (etiqueta ··· valor): ocupa menos alto que una cuadrícula de tarjetas. */
export const FichaTecnica = ({ neu }: { neu: NeumaticoBuscado }) => {
  const mm = (v: number | null | undefined) => (v !== null && v !== undefined ? `${v} mm` : '—')

  const secciones: { title: string; filas: Fila[] }[] = [
    {
      title: 'Identificación',
      filas: [
        { label: 'Código', value: neu.CODIGO_NEUMATICO || '—', accent: true },
        { label: 'Marca', value: neu.MARCA_NEUMATICO || '—' },
        { label: 'Medida', value: neu.MEDIDA_NEUMATICO || '—' },
        { label: 'Diseño', value: neu.DISENO_NEUMATICO || '—' },
        { label: 'PR', value: neu.PR_NEUMATICO || '—' },
      ],
    },
    {
      title: 'Compra y logística',
      filas: [
        { label: 'Proveedor', value: neu.PROVEEDOR_NEUMATICO || '—' },
        { label: 'RUC proveedor', value: neu.RUC_PROVEEDOR_NEUMATICO || '—' },
        { label: 'Costo', value: neu.COSTO_NEUMATICO !== null ? `$${neu.COSTO_NEUMATICO.toLocaleString('es-PE')}` : '—', accent: true },
        { label: 'Fecha fabricación', value: neu.FECHA_FABRIACACION || '—' },
        { label: 'RQ', value: neu.RQ_NEUMATICO || '—' },
        { label: 'OC', value: neu.OC_NEUMATICO || '—' },
        { label: 'Leasing', value: neu.LEASING_NEUMATICO || '—' },
      ],
    },
    {
      title: 'Estado',
      filas: [
        { label: 'Taller inicial', value: neu.TALLER_INICIAL || '—' },
        { label: 'Taller actual', value: neu.TALLER_ACTUAL || '—' },
        { label: 'Placa actual', value: neu.PLACA_ACTUAL || '—', accent: true },
        { label: 'Situación', value: neu.SITUACION_NEUMATICO || '—' },
        { label: 'Recuperado', value: neu.RECUPERADO_NEUMATICO ? 'Sí' : 'No' },
      ],
    },
    {
      title: 'Mediciones',
      filas: [
        { label: 'Remanente original', value: mm(neu.REMANENTE_ORIGINAL) },
        { label: 'Remanente montado', value: mm(neu.REMANENTE_MONTADO) },
        { label: 'Remanente actual', value: mm(neu.REMANENTE_ACTUAL), accent: true },
        { label: 'Presión actual', value: `${neu.PRESION_ACTUAL ?? '—'}` },
        { label: 'Torque actual', value: `${neu.TORQUE_ACTUAL ?? '—'}` },
      ],
    },
  ]

  return (
    <CollapsibleSection title="Ficha técnica" icon={<FileText className="size-4" />} border="border-sky-500">
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
