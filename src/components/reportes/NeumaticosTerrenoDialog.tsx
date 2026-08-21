import React from 'react'
import { DataTableNeumaticos } from '../ui/data-table/data-table'
import { relacionNeumaticosDeBajaTerreno } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'
import { columnsRelacionNeumaticosPorTerreno } from '@/app/(app)/analisis-rendimiento/columns'

interface PropsNeumaticosTerreno {
  data: {
    TIPO_TERRENO: string,
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

export const NeumaticosTerrenoDialog = ({ data: dataDonnut, talleresSeleccionados, disenos, marcas, fechaFin, fechaInicio }: PropsNeumaticosTerreno) => {

  const { data: neumaticosEnTerreno = [], isLoading: isLoadingNeumaticosEnTerreno } = useQuery({
    queryKey: [
      'relacion-neumaticos-en-terreno',
      {
        terreno: dataDonnut.TIPO_TERRENO,
        talleresSeleccionados,
        disenos,
        marcas,
        fechaInicio,
        fechaFin
      }
    ],
    queryFn: () => relacionNeumaticosDeBajaTerreno(dataDonnut.TIPO_TERRENO, talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
  })

  return (
    <div>
      <DataTableNeumaticos
        columns={columnsRelacionNeumaticosPorTerreno}
        data={neumaticosEnTerreno}
        type='pagination'
        filters={true}
        withExport={true}
        isLoading={isLoadingNeumaticosEnTerreno}
        exportConfig={{
          title: `GESNEU: NEUMÁTICOS DE BAJA EN TERRENO ${dataDonnut.TIPO_TERRENO}`,
          fileName: `GESNEU_NEUMATICOS_DE_BAJA_EN_${dataDonnut.TIPO_TERRENO}`
        }}
      />
    </div >
  )
}
