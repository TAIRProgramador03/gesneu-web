export interface Neumatico {
  ID_ASIGNADO: string;
  CODIGO: string; // Código del neumático
  CODIGO_NEU?: string; // Código alternativo del neumático (opcional)
  MARCA: string; // Marca del neumático
  DISEÑO?: string; // Diseño del neumático (opcional)
  REMANENTE: string | number; // Porcentaje de vida útil restante (puede ser string o number)
  MEDIDA: string; // Medida del neumático
  FECHA_FABRICACION_COD?: string; // Fecha de asignación (opcional)
  ESTADO: string; // Estado del neumático
  POSICION_NEU?: string; // Posición del neumático en el vehículo (opcional)
  POSICION?: string; // Posición actual del neumático en el vehículo (opcional)
  PROYECTO?: string; // Agregar esta propiedad
  TIPO_MOVIMIENTO?: string;
  FECHA_ASIGNACION?: string; // Fecha de asignación del neumático
  FECHA_REGISTRO?: string;
  PRESION_AIRE?: number; // Presión de aire del neumático (opcional)
  TORQUE_APLICADO?: number; // Torque aplicado al neumático (opcional)
  ODOMETRO?: number; // Kilometraje del neumático (opcional)
  ID_MOVIMIENTO?: number | string; // ID del movimiento asociado al neumático (opcional, puede ser string o number)
  FECHA_MOVIMIENTO?: string; // Fecha del movimiento asociado al neumático (opcional)
  USUARIO_SUPER?: string; // Usuario que realizó la acción (opcional)
  FECHA_INSPECCION?: string; // Fecha de la última inspección (opcional)
  PR?: string; // Presión recomendada (opcional)
  CARGA?: string; // Capacidad de carga (opcional)
  VELOCIDAD?: string; // Velocidad máxima (opcional)
  FECHA_FABRICACION?: string; // Fecha de fabricación (opcional)
  RQ?: string; // RQ (opcional)
  OC?: string; // Orden de compra (opcional)
  COSTO?: string | number; // Costo del neumático (opcional)
  PROVEEDOR?: string; // Proveedor (opcional)
  FECHA_COMPRA?: string; // Fecha de compra (opcional)
  KILOMETRO?: string | number; // Kilometraje (opcional)
}

export interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color?: string;
  proyecto?: string;
  operacion?: string;
  kilometro?: number;
}

export interface User {
  usuario?: string;
  email?: string;
  nombre?: string;
}