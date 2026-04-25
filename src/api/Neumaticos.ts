import { Customer } from "@/components/dashboard/customer/customers-table";
import { NeumaticoFetch } from "@/components/dashboard/padron/modal-reubicar-neumatico";
import { InspeccionTable } from "@/types/inspecciones";
import { Neumatico } from "@/types/types";
import axios, { AxiosError } from "axios";

export const obtenerHistorialMovimientosPorCodigo = async (codigo: string) => {
  try {
    const response = await axios.get(`/api/po-movimiento/historial-codigo`, {
      params: {
        codigo
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error en obtenerHistorialMovimientosPorCodigo:', error);
    throw error;
  }
};


export const Neumaticos = async () => {
  const response = await axios.get<Customer[]>(`/api/po-neumaticos`, { withCredentials: true });
  return response.data;
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
export const buscarVehiculoPorPlaca = async (placa: string) => {
  try {
    const response = await axios.get(`/api/vehiculo/${placa}`, { withCredentials: true });
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
    const response = await axios.get(`/api/po-asignados/${placa}`);
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

