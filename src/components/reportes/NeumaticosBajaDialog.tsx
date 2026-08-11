import React from 'react'
import { DataTableNeumaticos } from '../ui/data-table/data-table'
import { relacionNeumaticosDeBajaPor } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'
import { columnsRelacionNeumaticosPorBaja } from '@/app/(app)/reportes/columns'

interface PropsNeumaticosTerreno {
  data: {
    TIPO_BAJA: string,
    QTY_NEUMATICOS_BAJA: number,
    KM_PROMEDIO: number,
    KM_TOTAL: number
  }
  talleresSeleccionados: string[]
  disenos: string[]
  marcas: string[]
  fechaInicio: string
  fechaFin: string
}

export const NeumaticosBajaDialog = ({ data: dataDonnut, talleresSeleccionados, disenos, marcas, fechaFin, fechaInicio }: PropsNeumaticosTerreno) => {

  const { data: neumaticosEnBaja = [], isLoading: isLoadingNeumaticosEnBaja } = useQuery({
    queryKey: [
      'relacion-neumaticos-en-baja',
      {
        baja: dataDonnut.TIPO_BAJA,
        talleresSeleccionados,
        disenos,
        marcas,
        fechaInicio,
        fechaFin
      }
    ],
    queryFn: () => relacionNeumaticosDeBajaPor(dataDonnut.TIPO_BAJA, talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
  })

  return (
    <div>
      <DataTableNeumaticos
        columns={columnsRelacionNeumaticosPorBaja}
        data={neumaticosEnBaja}
        type='pagination'
        filters={true}
        withExport={true}
        isLoading={isLoadingNeumaticosEnBaja}
        exportConfig={{
          title: `GESNEU: NEUMÁTICOS EN BAJA POR ${dataDonnut.TIPO_BAJA}`,
          fileName: `GESNEU_NEUMATICOS_EN_BAJA_POR_${dataDonnut.TIPO_BAJA}`
        }}
      />
    </div >
  )
}
