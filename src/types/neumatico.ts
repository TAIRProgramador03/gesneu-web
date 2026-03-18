export interface NeuDisponibleTable {
  CODIGO: string
  MARCA: string
  DISEÑO: string
  REMANENTE: number
  MEDIDA: string
  FECHA_FABRICACION_COD: string
  RECUPERADO: boolean
  ESTADO: number
}

export interface NeuAsignadoTable {
  POSICION_NEU: string
  CODIGO: string
  MARCA: string
  DISEÑO: string
  REMANENTE: number
  FECHA_ASIGNACION: string
  FECHA_ULTIMO_SUCESO: string
  RECUPERADO: boolean
  ESTADO: number
}

export interface NeuAsignarTable extends NeuAsignadoTable {
  DRAWABLE?: any
  TIPO_MOVIMIENTO?: string
  ID_ASIGNADO: string
  MEDIDA: string
  ID_OPERACION: number
  COD_SUPERVISOR: string,
  FECHA_REGISTRO: string
}

export interface NeuTemporalTable {
  POSICION_NEU: string,
  CODIGO: string
  MARCA: string
  FECHA_ASIGNACION: string
  TIPO_MOVIMIENTO: string
}

export interface NeuInspeccionTable {
  ID_NEUMATICO: string,
  CODIGO: string
  PLACA: string
  POSICION: string
  REMANENTE: number
  KM_RECORRIDO: number
  OBS: string
  PORCENTAJE_VIDA: number
}