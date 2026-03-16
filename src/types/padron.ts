interface PadronMapped {
  'Código': number
  'Marca': string
  'Medida': string
  'Diseño': string
  'Remanente': number
  'PR': number
  'Carga': number
  'Velocidad': string
  'RQ': number
  'OC': number
  'Proyecto': string
  'Costo': number
  'Proveedor': string
  'Fecha Fabricación': string
  'Estado': string
  'Recuperado': string
  'Placa': string
  'Porcentaje de Vida (%)': number
}

export interface PadronExcel {
  CODIGO: number,
  MARCA: string
  MEDIDA: string
  DISEÑO: string
  REMANENTE: number
  PR: number
  CARGA: number
  RQ: number
  OC: number
  VELOCIDAD: string
  PROYECTO: string
  COSTO: number
  PROVEEDOR: string
  FECHA_FABRICACION_COD: string
  TIPO_MOVIMIENTO: string
  RECUPERADO?: boolean | undefined
  ESTADO: number
  PLACA?: string
}

export type ListPadronMapped = PadronMapped[]