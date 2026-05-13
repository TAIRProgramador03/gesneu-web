import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FichaItem } from '@/components/padron/neumatico/FichaItem'
import { Vehiculo } from '@/types/types'
import { FileText } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { VehiculoMain } from '@/hooks/use-placa-detail'

export const PlacaFichaTecnica = ({ vehiculo }: { vehiculo: VehiculoMain }) => {
  const sections: { title: string; cols?: string; items: { label: string; value: string; accent?: boolean }[] }[] = [
    {
      title: 'Identificación',
      items: [
        { label: 'Placa', value: vehiculo.PLACA || '—', accent: true },
        { label: 'Marca', value: vehiculo.MARCA || '—' },
        { label: 'Tipo', value: vehiculo.TIPO || '—' },
        { label: 'Modelo', value: vehiculo.MODELO || '—' },
        { label: 'Año', value: vehiculo.ANO.toLocaleString('es-PE') || '—' },
        { label: 'Color', value: vehiculo.COLOR || '—' },
        { label: 'N° serie', value: vehiculo.NROSERIE || '—' },
        { label: 'N° motor', value: vehiculo.NROMOTOR || '—' },
      ],
    },
    {
      title: 'Operación',
      cols: 'grid-cols-2 sm:grid-cols-3',
      items: [
        { label: 'Operación', value: vehiculo.OPERACION || '—', accent: true },
        { label: 'Kilometraje', value: vehiculo.KILOMETRAJE_GESNEU !== null ? `${vehiculo.KILOMETRAJE_GESNEU.toLocaleString('es-PE')} km` : `${vehiculo.KILOMETRAJE.toLocaleString('es-PE')} km` },
        { label: 'Terreno', value: vehiculo.TIPO_TERRENO || '—' },
        { label: 'Condición', value: vehiculo.RETEN || '—' },
      ],
    },
  ]

  return (
    <CollapsibleSection title="Ficha del Vehículo" icon={<FileText className="size-4" />} border="border-sky-500">
      <div className="space-y-6 bg-linear-to-br from-sky-100 to-gray-100 p-4 rounded-2xl">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2">
                {section.title}
              </h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className={cn('grid gap-2.5', section.cols || 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')}>
              {section.items.map((item) => (
                <FichaItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}
