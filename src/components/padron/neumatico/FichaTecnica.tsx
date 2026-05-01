import { NeumaticoBuscado } from '@/api/Neumaticos';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { FileText } from 'lucide-react';
import React from 'react'
import { FichaItem } from './FichaItem';
import { cn } from '@/lib/utils';

export const FichaTecnica = ({ neu }: { neu: NeumaticoBuscado }) => {

  const sections: { title: string; cols?: string; items: { label: string; value: string; accent?: boolean }[] }[] = [
    {
      title: "Identificación",
      items: [
        { label: "Código", value: neu.CODIGO_NEUMATICO || "—", accent: true },
        { label: "Marca", value: neu.MARCA_NEUMATICO || "—" },
        { label: "Medida", value: neu.MEDIDA_NEUMATICO || "—" },
        { label: "Diseño", value: neu.DISENO_NEUMATICO || "—" },
        { label: "PR", value: neu.PR_NEUMATICO || "—" },
      ],
    },
    {
      title: "Compra / Logística",
      cols: "grid-cols-1 sm:grid-cols-2",
      items: [
        { label: "Proveedor", value: neu.PROVEEDOR_NEUMATICO || "—" },
        { label: "RUC Proveedor", value: neu.RUC_PROVEEDOR_NEUMATICO || "—" },
        { label: "Costo", value: neu.COSTO_NEUMATICO !== null ? `$${neu.COSTO_NEUMATICO.toLocaleString("es-PE")}` : "—", accent: true },
        { label: "Fecha fabricación", value: neu.FECHA_FABRIACACION ? neu.FECHA_FABRIACACION : "—" },
        { label: "RQ", value: neu.RQ_NEUMATICO || "—" },
        { label: "OC", value: neu.OC_NEUMATICO || "—" },
        { label: "Leasing", value: neu.LEASING_NEUMATICO || "—" },
      ],
    },
    {
      title: "Ubicación / Estado",
      items: [
        { label: "Taller inicial", value: neu.TALLER_INICIAL || "—" },
        { label: "Taller actual", value: neu.TALLER_ACTUAL || "—" },
        { label: "Placa actual", value: neu.PLACA_ACTUAL || "—", accent: true },
        { label: "Situación", value: neu.SITUACION_NEUMATICO || "—" },
        { label: "Recuperado", value: neu.RECUPERADO_NEUMATICO ? "Sí" : "No" },
      ],
    },
    {
      title: "Detalles",
      cols: "grid-cols-3",
      items: [
        { label: "Remantente Original", value: neu.REMANENTE_ORIGINAL !== null ? `${neu.REMANENTE_ORIGINAL} mm` : "—" },
        { label: "Remantente Montado", value: neu.REMANENTE_MONTADO !== null ? `${neu.REMANENTE_MONTADO} mm` : "—" },
        { label: "Remantente Actual", value: neu.REMANENTE_ACTUAL !== null ? `${neu.REMANENTE_ACTUAL} mm` : "—", accent: true },
        { label: "Presión Actual", value: `${neu.PRESION_ACTUAL}` },
        { label: "Torque Actual", value: `${neu.TORQUE_ACTUAL}` },
      ],
    },
  ]
  return (
    <CollapsibleSection title="Ficha Técnica" icon={<FileText className="size-4" />} border='border-sky-500'>
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
            <div className={cn("grid gap-2.5", section.cols || "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5")}>
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
