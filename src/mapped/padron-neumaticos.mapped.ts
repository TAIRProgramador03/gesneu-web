import { Customer } from "@/components/dashboard/customer/customers-table"
import { ListPadronMapped } from "@/types/padron"

interface MappedPadronNeumaticosParams {
  filteredCustomers: Customer[]
}

export const mappedPadronNeumaticos = ({ filteredCustomers }: MappedPadronNeumaticosParams): ListPadronMapped => {

  return filteredCustomers.map((c: Customer) => ({
    'Código': c.CODIGO,
    'Marca': c.MARCA,
    'Medida': c.MEDIDA,
    'Diseño': c.DISEÑO,
    'Remanente': c.REMANENTE,
    'PR': c.PR,
    'Carga': c.CARGA,
    'Velocidad': c.VELOCIDAD,
    'RQ': c.RQ,
    'OC': c.OC,
    'Proyecto': c.PROYECTO,
    'Costo': c.COSTO,
    'Proveedor': c.PROVEEDOR,
    'Fecha Fabricación': c.FECHA_FABRICACION_COD,
    'Estado': c.TIPO_MOVIMIENTO,
    'Recuperado': c.RECUPERADO ? 'SI' : 'NO',
    'Placa': c.PLACA ?? '',
    'Porcentaje de Vida (%)': Number(c.ESTADO)
  }))


}
