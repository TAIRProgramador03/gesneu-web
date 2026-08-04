import { Customer } from "@/components/dashboard/customer/customers-table";
import { NeumaticoFetch } from "@/components/dashboard/padron/modal-reubicar-neumatico";
import { NeumaticoInstalado, VehiculoMain } from "@/hooks/use-placa-detail";
import { InspeccionTable } from "@/types/inspecciones";
import { Neumatico } from "@/types/types";
import axios, { AxiosError } from "axios";
import { MultiValue } from "react-select";

export const obtenerHistorialMovimientosPorCodigo = async (codigo: string) => {
  try {
    const response = await axios.get(`/api/po-movimiento/historial-codigo`, {
      params: { codigo },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerHistorialMovimientosPorCodigo:', error);
    throw error;
  }
};


export const Neumaticos = async (talleresSelected: string[], marcasSelected: string[], disenosSelected: string[], medidasSelected: string[], situacionesSelected: string[], recuperadoSelected: string) => {
  const response = await axios.get<Customer[]>(`/api/po-neumaticos`,
    {
      params: {
        talleresSelected, marcasSelected, disenosSelected, medidasSelected, situacionesSelected, recuperadoSelected
      },
      withCredentials: true
    }
  );
  return response.data;
};

export const heartbeat = async (timeoutMs = 5000) => {
  const response = await axios.get(`/api/health`, {
    withCredentials: true,
    timeout: timeoutMs,
  });
  return response.status;
};

export const cargarPadronNeumatico = async (archivoExcel: File) => {
  const formData = new FormData();
  formData.append("archivo", archivoExcel);

  try {
    const response = await axios.post(
      `/api/po-padron/cargar-padron`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<any>;
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(
        err.response.data.error +
        (err.response.data.detalle ? `: ${err.response.data.detalle}` : "")
      );
    }
    throw error;
  }
};

// Buscar vehículo por placa
export const buscarVehiculoPorPlaca = async (placa: string, transito = false) => {
  try {
    const response = await axios.get<VehiculoMain>(`/api/vehiculo/${placa}`, {
      withCredentials: true,
      params: { transito },
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<any>;

    if (err.response && err.response.data && err.response.data.error) {
      if (err.response && err.response.status === 404) {
        return null;
      }
    }
    console.error("Error al buscar el vehículo por placa:", error);
    throw error;
  }
};

export const buscarVehiculoPorPlacaEmpresa = async (placa: string) => {
  try {
    const response = await axios.get(`/api/vehiculo/buscar-todas/${placa}`, { withCredentials: true });
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // Vehículo no encontrado
    }
    console.error("Error al buscar el vehículo por placa (empresa):", error);
    throw error;
  }
};

// Obtener la lista de neumáticos asignados por placa
export const obtenerNeumaticosAsignadosPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get<NeumaticoInstalado[]>(`/api/po-asignados/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerNeumaticosAsignadosPorPlaca:', error);
    throw error;
  }
};

// Obtener la lista de neumáticos disponibles x usuario
export const obtenerNeumaticosDisponibles = async (type = 'asignacion') => {
  try {

    const response = await axios.get(`/api/po-neumaticos-disponibles/`, {
      params: { type }
    });

    return response.data;
  } catch (error) {
    console.error('Error en obtenerNeumaticosDisponibles:', error);
    throw error;
  }
};


// Asignar neumático a una posición de un vehículo (ahora acepta objeto o array)
export const asignarNeumatico = async (payload: any) => {
  try {
    const response = await axios.post(
      `/api/po-asignar-neumatico`,
      payload,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en asignarNeumatico:', error);
    throw error;
  }
};

// Guardar inspección de neumático
export const guardarInspeccion = async (data: any) => {
  try {
    const response = await axios.post(`/api/inspeccion`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      let msg = error.response.data.error;
      if (Array.isArray(error.response.data.detalles)) {
        const detalles = error.response.data.detalles.map((d: { codigo: string; error: string }) => `${d.codigo}: ${d.error}`).join(' | ');
        msg += ` -> ${detalles}`;
      }
      throw new Error(msg);
    }
    throw error;
  }
};

// Obtener la cantidad total de neumáticos
export const obtenerCantidadNeumaticos = async () => {
  const response = await axios.get(`/api/po-neumaticos/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos disponibles
export const obtenerCantidadNeumaticosDisponibles = async () => {
  const response = await axios.get(`/api/po-neumaticos/disponibles/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos asignados
export const obtenerCantidadNeumaticosAsignados = async () => {
  const response = await axios.get(`/api/po-neumaticos/asignados/cantidad `, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de autos (placas) disponibles para el usuario autenticado
export const obtenerCantidadAutosDisponibles = async () => {
  const response = await axios.get(`/api/vehiculo/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener el costo total de todos los neumaticos asignados
export const obtenerCostoNeumaticosAsignados = async () => {
  const response = await axios.get(`/api/po-neumaticos/asignados/costo`, { withCredentials: true });
  return response.data.costo_total;
};

// Obtener la lista de neumáticos asignados (tabla NEU_ASIGNADO) por placa (nuevo endpoint directo)
export const listarNeumaticosAsignados = async (placa: string) => {
  try {
    const response = await axios.get(`/api/po-asignados/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en listarNeumaticosAsignados:', error);
    throw error;
  }
};

// Obtener neumaticos para la reubicación
export const listarNeumaticosParaReubicar = async (proyectoOrigen: string, codigoNeu: string): Promise<NeumaticoFetch[]> => {
  try {

    const response = await axios.get(`/api/po-neumaticos/recuperados-para-asignar`, {
      params: {
        proyectoOrigen,
        codigoNeu
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en listarNeumaticosParaReubicar:', error);
    throw error;
  }
};

interface ProyectFetch {
  ID: string,
  DESCRIPCION: string
}

export const listarProyectos = async (): Promise<ProyectFetch[]> => {
  try {
    const response = await axios.get(`/api/po-neumaticos/listar-proyectos`);
    return response.data;
  } catch (error) {
    console.error('Error en listarProyectos:', error);
    throw error;
  }
};

interface NeumaticoFetchPost {
  id: string;
  codigo: string;
  proyecto: string;
  esRecuperado: boolean;
  tipoMovimiento: string;
  vida: number;
}

export const reubicarNeumaticosPorProyecto = async ({ neumaticosTrasladados, proyectoDestino }: { neumaticosTrasladados: NeumaticoFetchPost[], proyectoDestino: string }) => {
  try {

    const response = await axios.post(
      `/api/po-neumaticos/reubicar-neumaticos-por-proyecto`,
      {
        neumaticosTrasladados,
        proyectoDestino
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en asignarNeumatico:', error);
    throw error;
  }
};


// Obtener el último movimiento de cada neumático instalado en una placa
export const obtenerUltimosMovimientosPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get(`/api/po-movimiento/ultimos/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorPlaca:', error);
    throw error;
  }
};

// Obtener el último movimiento de cada posición de un neumático por su código
export const obtenerUltimosMovimientosPorCodigo = async (codigo: string) => {
  try {
    const response = await axios.get(`/api/po-movimiento/ultimos-codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorCodigo:', error);
    throw error;
  }
};

// Obtener el último movimiento por posición de neumático para una placa
export const obtenerUltimosMovimientosPorPosicion = async (placa: string) => {
  try {
    // Cambiado a la ruta correcta según backend
    const response = await axios.get(`/api/po-asignados/ultimo-movimiento/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorPosicion:', error);
    throw error;
  }
};

// Registrar reubicación de neumático (REUBICADO)
export const registrarReubicacionNeumatico = async (data: any) => {
  try {
    const response = await axios.post(
      `/api/registrorotacionneumatico`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Registrar desasignación de neumático (BAJA DEFINITIVA o RECUPERADO)
export const registrarDesasignacionNeumatico = async (data: any) => {
  try {
    const response = await axios.post(
      `/api/registrardesasignacionneumatico`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Consultar si existe inspección para hoy para un neumático y placa
export const consultarInspeccionHoy = async ({ placa, fecha }: { placa: string, fecha: string }) => {
  try {
    const response = await axios.get(`/api/inspeccion/existe`, {
      params: { placa, fecha },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Obtener la cantidad de neumáticos disponibles por mes (para el gráfico)
export const obtenerNeumaticosDisponiblesPorMes = async (usuario: any) => {
  const response = await axios.get(
    `/api/po-reportes/disponibles-por-mes`,
    { params: { usuario }, withCredentials: true }
  );
  return response.data;
};

// Obtener la cantidad de neumáticos asignados por mes (para el gráfico)
export const obtenerNeumaticosAsignadosPorMes = async (usuario: any) => {
  const response = await axios.get(
    `/api/po-reportes/asignados-por-mes`,
    { params: { usuario }, withCredentials: true }
  );
  return response.data;
};

// Obtener inspecciones de neumáticos por rango de fechas y usuario
export const obtenerInspeccionesNeumaticosPorFechas = async ({ usuario, fechaInicio, fechaFin }: { usuario: any, fechaInicio: any, fechaFin: any }) => {
  const response = await axios.get(
    `/api/po-reportes/neu-inspeccion-por-fechas`,
    { params: { usuario, fechaInicio, fechaFin }, withCredentials: true }
  );
  return response.data;
};

// Obtener la última fecha de inspección solo por placa
export const getUltimaFechaInspeccionPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get(`/api/ultima-fecha-inspeccion-por-placa`, {
      params: { placa },
      withCredentials: true,
    });
    // El backend retorna { ultima: 'YYYY-MM-DD' | null }
    return response.data;
  } catch (error) {
    console.error('Error en getUltimaFechaInspeccionPorPlaca:', error);
    throw error;
  }
};

export const getFechasInspeccionVehicularPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get(`/api/fechas-inspeccion-vehicular-por-placa`, {
      params: { placa },
      withCredentials: true,
    });
    // El backend retorna { ultima: 'YYYY-MM-DD' | null }
    return response.data;
  } catch (error) {
    console.error('Error en getUltimaFechaInspeccionPorPlaca:', error);
    throw error;
  }
};

export const getInspeccionesPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get<InspeccionTable[]>(`/api/inspecciones-por-placa`, {
      params: { placa },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en getInspeccionesPorPlaca:', error);
    throw error;
  }
};

export const getNeumaticosPorInspeccion = async (payload: { PLACA: string, FECHA_INSPECCION: string } | null) => {
  try {

    const response = await axios.get(`/api/neumaticos-por-inspeccion`, {
      params: payload,
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error('Error en getInspeccionesPorPlaca:', error);
    throw error;
  }
};

// Obtener la cantidad de neumáticos en baja definitiva
export const obtenerCantidadNeumaticosBajaDefinitiva = async () => {
  const response = await axios.get(`/api/po-neumaticos/baja-definitiva/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos recuperados
export const obtenerCantidadNeumaticosRecuperados = async () => {
  const response = await axios.get(`/api/po-neumaticos/recuperados/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Desasignar neumáticos CON asignación de reemplazos (Transacción)
export const desasignarConReemplazo = async (payload: any) => {
  try {
    const response = await axios.post(
      `/api/desasignar-con-reemplazo`,
      payload, // { desasignaciones: [...], asignaciones: [...] }
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en desasignarConReemplazo:', error);
    throw error;
  }
};

// New

export interface NeumaticoBuscado {
  ID_NEUMATICO: number
  CODIGO_NEUMATICO: string,
  MARCA_NEUMATICO: string,
  MEDIDA_NEUMATICO: string,
  DISENO_NEUMATICO: string,
  PR_NEUMATICO: string,
  RQ_NEUMATICO: string,
  OC_NEUMATICO: string,
  LEASING_NEUMATICO: string,
  TALLER_INICIAL: string,
  TALLER_ACTUAL: string,
  COSTO_NEUMATICO: number,
  PROVEEDOR_NEUMATICO: string,
  RUC_PROVEEDOR_NEUMATICO: string,
  FECHA_FABRIACACION: string,
  RECUPERADO_NEUMATICO: boolean,
  SITUACION_NEUMATICO: string,
  PLACA_ACTUAL: string,
  REMANENTE_ACTUAL: number,
  REMANENTE_MONTADO: number,
  REMANENTE_ORIGINAL: number,
  PRESION_ACTUAL: number,
  TORQUE_ACTUAL: number,
  PORCENTAJE_VIDA: number,
}

export type NeumaticosBuscados = NeumaticoBuscado[]

export interface VerificarNeumaticoResponse {
  status: boolean,
  data: NeumaticosBuscados
}

export const verificarNeumatico = async (codigo: string) => {
  try {

    const response = await axios.get<VerificarNeumaticoResponse>(`/api/po-neumaticos/verificar-existencia`, {
      params: { codigo },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error('Error en verificarNeumatico:', error);
    throw error;
  }
};

interface CantidadNeumaticosVidaUtil {
  NEUMATICOS_CRITICO: number;
  NEUMATICOS_REGULAR: number;
  NEUMATICOS_BUENO: number;
  NEUMATICOS_TOTALES: number;
}

export const obtenerCantidadNeumaticosVidaUtil = async (taller: string, filtro: FiltroEstadoNeumatico = 'todos') => {
  try {
    const response = await axios.get<CantidadNeumaticosVidaUtil>(`/api/po-neumaticos/cantidad-de-estados`, {
      withCredentials: true,
      params: { filtro, taller },
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCantidadNeumaticosVidaUtil:', error);
    throw error;
  }
}

export interface NeumaticoEnCritico {
  ID_NEUMATICO: number
  CODIGO_NEUMATICO: string
  MARCA_NEUMATICO: string
  MEDIDA_NEUMATICO: string
  DISENO_NEUMATICO: string
  PLACA_VEHICULO: string
  PRESION_NEUMATICO: number
  TORQUE_NEUMATICO: number
  REMANENTE_NEUMATICO: number
  PORCENTAJE_VIDA: number
  TALLER_ACTUAL: string
}

export const obtenerNeumaticosEnCritico = async (taller: string) => {
  try {
    const response = await axios.get<NeumaticoEnCritico[]>(`/api/po-neumaticos/estado-critico`, {
      withCredentials: true,
      params: { taller }
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerNeumaticosEnCritico:', error);
    throw error;
  }
}

export interface MarcaNeumaticoCantidad {
  MARCA_NEUMATICO: string
  CANTIDAD_NEUMATICOS: number
}

export const obtenerCantidadPorMarca = async (taller: string, filtro: FiltroEstadoNeumatico = 'todos') => {
  try {
    const response = await axios.get<MarcaNeumaticoCantidad[]>(`/api/po-neumaticos/cantidad-por-marca`, {
      withCredentials: true,
      params: { filtro, taller },
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCantidadPorMarca:', error);
    throw error;
  }
}

export interface DisenoNeumaticoCantidad {
  DISENO_NEUMATICO: string
  CANTIDAD_NEUMATICOS: number
}

export type FiltroEstadoNeumatico = 'todos' | 'asignados' | 'disponibles' | 'bajas' | 'recuperados';

export const obtenerCantidadPorDiseno = async (taller: string, filtro: FiltroEstadoNeumatico = 'todos') => {
  try {
    const response = await axios.get<DisenoNeumaticoCantidad[]>(`/api/po-neumaticos/cantidad-por-diseno`, {
      withCredentials: true,
      params: { filtro, taller },
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCantidadPorDiseno:', error);
    throw error;
  }
}

export interface MedidaNeumaticoCantidad {
  MEDIDA_NEUMATICO: string
  MEDIDA_DISPONIBLE: number
  MEDIDA_ASIGNADA: number
  MEDIDA_BAJA: number
  CANTIDAD_NEUMATICOS: number
}

export const obtenerCantidadPorMedida = async (taller: string, filtro: FiltroEstadoNeumatico = 'todos') => {
  try {
    const response = await axios.get<MedidaNeumaticoCantidad[]>(`/api/po-neumaticos/cantidad-por-medida`, {
      withCredentials: true,
      params: { filtro, taller },
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCantidadPorMedida:', error);
    throw error;
  }
}


export interface DesgasteNeumatico {
  ID_NEUMATICO: number
  CODIGO_NEUMATICO: string
  MARCA_NEUMATICO: string
  MEDIDA_NEUMATICO: string
  DISENO_NEUMATICO: string
  KM_TOTAL_VIDA_NEUMATICO: number
  REMANENTE_INCIAL: number
  REMANENTE_MONTADO: number
  REMANENTE_ACTUAL: number
  DESGASTE_POR_1000KM: number
  COSTO_POR_KM: number,
  KM_POR_REMAMENTE: number
  COSTO_NEUMATICO: number
  TIPO_BAJA: number
  TALLER_ACTUAL: string
}

export const obtenerDesgastePorMilKms = async (values: MultiValue<{
  value: number;
  label: string;
}>, taller: string) => {

  const valuesToSend = values.length >= 1 ? values.map((value) => value.value) : []

  try {
    const response = await axios.post<DesgasteNeumatico[]>(
      `/api/po-neumaticos/desgaste-por-mil-kms`,
      { valuesToSend, taller },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error en obtenerDesgastePorMilKms:', error);
    throw error;
  }
}

interface CodigoNeumatico {
  ID_NEUMATICO: number,
  CODIGO_NEUMATICO: string
  DESGASTE_POR_1000KM: number
}

export const obtenerCodigosNeumaticosDesgastadosPorMilKms = async (taller: string): Promise<CodigoNeumatico[]> => {
  try {
    const response = await axios.get<CodigoNeumatico[]>(`/api/po-neumaticos/codigo-neumaticos-desgaste-por-mil-kms`, {
      withCredentials: true,
      params: { taller }
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCodigosNeumaticosDesgastadosPorMilKms:', error);
    throw error;
  }
}

interface SelectOptions {
  value: string,
  label: string
}

export const obtenerTodosLosDisenos = async () => {
  try {
    const response = await axios.get<SelectOptions[]>(`/api/po-neumaticos/todos-los-disenos`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTodosLosDisenos:', error);
    throw error;
  }
}

export const obtenerTodasLasMedidas = async () => {
  try {
    const response = await axios.get<SelectOptions[]>(`/api/po-neumaticos/todas-las-medidas`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTodasLasMedidas:', error);
    throw error;
  }
}

export const obtenerTodasLasMarcas = async () => {
  try {
    const response = await axios.get<SelectOptions[]>(`/api/po-neumaticos/todas-las-marcas`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTodasLasMarcas:', error);
    throw error;
  }
}

export const obtenerTodosLosEstados = async () => {
  try {
    const response = await axios.get<SelectOptions[]>(`/api/po-neumaticos/todos-los-estados`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTodosLosEstados:', error);
    throw error;
  }
}

export interface PlacasConNeumaticos {
  PLACA: string,
  MODELO: string,
  MARCA: string,
  CANTIDAD_NEUMATICOS_INSTALADOS: number
}

export const obtenerPlacasConNeumaticos = async () => {
  try {
    const response = await axios.get<PlacasConNeumaticos[]>(`/api/po-neumaticos/neumaticos-por-vehiculo`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerPlacasConNeumaticos:', error);
    throw error;
  }
}


export interface TallerConNeumaticos {
  ID: number;
  TALLER: string;
  CH_SERI_TALLER: string;
  NEUMATICOS_DISPONIBLES: number;
  NEUMATICOS_ASIGNADOS: number;
  NEUMATICOS_BAJAS: number;
  CANTIDAD_NEUMATICOS: number;
}

export const obtenerTalleresConNeumaticos = async () => {
  try {
    const response = await axios.get<TallerConNeumaticos[]>(`/api/mapa/cantidad-flota-por-taller`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTalleresConNeumaticos:', error);
    throw error;
  }
}

export interface NeumaticoDelHistorial {
  ID_MOVIMIENTO: number;
  CODIGO_NEUMATICO: string;
  PLACA_VEHICULO: string;
  TALLER_ASIGNADO: string;
  ID_ACCION_REALIZADA: number;
  ACCION_REALIZADA: string;
  POSICION_ANTERIOR_EN_VEHICULO: string | null;
  POSICION_NUEVA_EN_VEHICULO: string | null;
  REMANENTE_MEDIDO_MM: number;
  PRESION_AIRE_PSI: number;
  TORQUE_APLICADO_NM: number;
  KM_RECORRIDOS_EN_ETAPA: number;
  PORCENTAJE_VIDA_UTIL: number;
  OBSERVACION: string;
  USUARIO_REGISTRADOR: string;
  FECHA_MOVIMIENTO: Date;
  FECHA_REGISTRO_MOVIMIENTO: Date;
  CAMBIO_KILOMETRAJE: null | number
  TIPO_TERRENO: null | string
  CONDICION: null | string
}

export const obtenerHistorialPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get<NeumaticoDelHistorial[]>(`/api/po-movimiento/historial-placa`, {
      params: { placa },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerHistorialPorPlaca:', error);
    throw error;
  }
}

export interface MovimientoEnBaja {
  ID_MOVIMIENTO: number;
  ID_NEUMATICO: number;
  CODIGO_NEUMATICO: string;
  MARCA_NEUMATICO: string;
  MEDIDA_NEUMATICO: string;
  DISENO_NEUMATICO: string;
  COSTO_NEUMATICO: number;
  PLACA_MOVIMIENTO: string;
  PROYECTO_MOVIMIENTO: string;
  KM_RECORRIDOS_MOVIMIENTO: number;
  TERRENO: string;
  CONDICION: string;
  TIPO_BAJA: string;
  FECHA_BAJA: Date | string;
}

export const obtenerMovimientosDeNeumaticosEnBaja = async () => {
  try {
    const response = await axios.get<MovimientoEnBaja[]>(`/api/po-reportes/bajas`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerMovimientosDeNeumaticosEnBaja:', error);
    throw error;
  }
}

export interface ValuesLabel {
  value: string
  label: string
}

export const obtenerLosTalleresDelUsuario = async () => {
  try {
    const response = await axios.get<ValuesLabel[]>(`/api/mapa/todos-los-talleres`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerLosTalleresDelUsuario:', error);
    throw error;
  }
}

export interface OrdenDeTrabajo {
  ALMACEN: string;
  CLASE: string;
  TIPO: string;
  VALE: number;
  CORRELATIVO: number;
  FECHA_MOVIMIENTO: number;
  PLACA: string;
  OT: string;
  CODNUEVO: string;
  CODBAJA: string;
}

export const obtenerOrdenDeTrabajo = async (ordenDeTrabajo: string, placa: string) => {
  try {
    const response = await axios.get<OrdenDeTrabajo[]>(`/api/po-neumaticos/verificar-orden-de-trabajo`, {
      withCredentials: true,
      params: { ordenDeTrabajo, placa }
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerOrdenDeTrabajo:', error);
  }
}

export const obtenerTalleresConNeumaticosEnBaja = async () => {
  try {
    const response = await axios.get<ValuesLabel[]>(`/api/po-reportes/talleres`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTalleresConNeumaticosEnBaja:', error);
    throw error;
  }
}


export const obtenerCondicionesConNeumaticosEnBaja = async () => {
  try {
    const response = await axios.get<ValuesLabel[]>(`/api/po-reportes/condiciones`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCondicionesConNeumaticosEnBaja:', error);
    throw error;
  }
}


export const obtenerDisenosConNeumaticosEnBaja = async () => {
  try {
    const response = await axios.get<ValuesLabel[]>(`/api/po-reportes/disenos`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerDisenosConNeumaticosEnBaja:', error);
    throw error;
  }
}

export const obtenerMarcasConNeumaticosEnBaja = async () => {
  try {
    const response = await axios.get<ValuesLabel[]>(`/api/po-reportes/marcas`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerMarcasConNeumaticosEnBaja:', error);
    throw error;
  }
}

export interface TiposDeTerrenoEnBaja {
  TIPO_TERRENO: string
  QTY_NEUMATICOS_BAJA: number
  KM_TOTAL: number
  KM_PROMEDIO: number
}

export const obtenerDistribucionPorTerrenoBajas = async (talleresSeleccionados: string[], disenos: string[], marcas: string[], fechaInicio = '', fechaFin = '') => {
  try {
    const response = await axios.post<TiposDeTerrenoEnBaja[]>(
      `/api/po-reportes/distribucion-por-terreno`,
      { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en obtenerDistribucionPorTerrenoBajas:', error);
    throw error;
  }
}

export interface MotivosDeBajaEnBaja {
  TIPO_BAJA: string
  QTY_NEUMATICOS_BAJA: number
  KM_TOTAL: number
  KM_PROMEDIO: number
}

export const obtenerDistribucionMotivoDeBaja = async (talleresSeleccionados: string[], disenos: string[], marcas: string[], fechaInicio = '', fechaFin = '') => {
  try {
    const response = await axios.post<MotivosDeBajaEnBaja[]>(`/api/po-reportes/distribucion-por-motivos-de-baja`,
      { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en obtenerDistribucionMotivoDeBaja:', error);
    throw error;
  }
}

export interface VehiculosPorTerreno {
  name: string,
  value: number
}

export const obtenerVehiculosPorTerreno = async (talleresSeleccionados: string[], disenos: string[], marcas: string[], fechaInicio = '', fechaFin = '') => {
  try {
    const response = await axios.post<VehiculosPorTerreno[]>(`/api/po-reportes/distribucion-vehicular-por-terreno`,
      { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en obtenerVehiculosPorTerreno:', error);
    throw error;
  }
}

export type RelacionesNeumaticoTerreno = RelacionNeumaticoTerreno[]

export interface RelacionNeumaticoTerreno {
  ID_NEUMATICO: number
  CODIGO_NEUMATICO: string
  MARCA_NEUMATICO: string
  MEDIDA_NEUMATICO: string
  DISENO_NEUMATICO: string
  PROYECTO_NEUMATICO: string
  COSTO_NEUMATICO: number
  ES_RECUPERADO: boolean
  PLACA_BAJA: string
  KM_TOTAL_VIDA: number
  TIPO_TERRENO: string
  TIPO_BAJA: string
  FECHA_BAJA: string
  REMANENTE_ACTUAL: number
  PORCENTAJE_VIDA: number
}

export const relacionNeumaticosDeBajaTerreno = async (terreno: string, talleresSeleccionados: string[], disenos: string[], marcas: string[], fechaInicio = '', fechaFin = '') => {
  try {
    const response = await axios.post<RelacionesNeumaticoTerreno>(`/api/po-reportes/relacion-neumaticos-por-terreno`,
      { terreno, talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en relacionNeumaticosDeBajaTerreno:', error);
    throw error;
  }
}

export const relacionNeumaticosDeBajaPor = async (baja: string, talleresSeleccionados: string[], disenos: string[], marcas: string[], fechaInicio = '', fechaFin = '') => {
  try {
    const response = await axios.post<RelacionesNeumaticoTerreno>(`/api/po-reportes/relacion-neumaticos-por-baja`,
      { baja, talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en relacionNeumaticosDeBajaPor:', error);
    throw error;
  }
}