import React from 'react'
import { DataTableNeumaticos } from '../ui/data-table/data-table'
import { relacionNeumaticosDeBajaPor, relacionNeumaticosDespachados } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'
import { columnsRelacionNeumaticoDespachados } from '@/app/(app)/analisis-rendimiento/columns'

interface PropsNeumaticosTerreno {
  data: {
    TALLER: string,
    QTY_NEUMATICOS_DESPACHADOS: number,
  }
  talleresSeleccionados: string[]
  disenos: string[]
  marcas: string[]
  fechaInicio: string
  fechaFin: string
}

export const NeumaticosDespachadosDialog = ({ data: dataDonnut, talleresSeleccionados, disenos, marcas, fechaFin, fechaInicio }: PropsNeumaticosTerreno) => {

  const { data: neumaticosDespachados = [], isLoading: isLoadingNeumaticosDespachados } = useQuery({
    queryKey: [
      'relacion-neumaticos-despachados',
      {
        talleresSeleccionados: [dataDonnut.TALLER],
        disenos,
        marcas,
        fechaInicio,
        fechaFin
      }
    ],
    queryFn: () => relacionNeumaticosDespachados([dataDonnut.TALLER], disenos, marcas, fechaInicio, fechaFin)
  })

  return (
    <div>
      <DataTableNeumaticos
        columns={columnsRelacionNeumaticoDespachados}
        data={neumaticosDespachados}
        type='pagination'
        filters={true}
        withExport={true}
        isLoading={isLoadingNeumaticosDespachados}
        exportConfig={{
          title: `GESNEU: NEUMÁTICOS DESPACHADO PARA EL TALLER: ${dataDonnut.TALLER}`,
          fileName: `GESNEU_NEUMATICOS_DESPACHADOS_PARA_${dataDonnut.TALLER}`
        }}
      />
    </div >
  )
}
