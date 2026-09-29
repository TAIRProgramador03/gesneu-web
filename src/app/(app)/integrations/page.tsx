'use client';

import * as React from 'react';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { columnsNeuDisponible } from './columns';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import { Customer } from '@/components/dashboard/customer/customers-table';
import { NeumaticosAsignadosCards } from '@/components/dashboard/integrations/NeumaticosAsignadosCards';
import { obtenerConfiguracionNeumaticos } from '@/utils/configuraciones-neumaticos';
import { Neumatico } from '@/types/types';
import { Neumaticos, obtenerNeumaticosAsignadosPorPlaca, buscarVehiculoPorPlaca, obtenerCantidadAutosDisponibles, obtenerUltimosMovimientosPorPlaca, obtenerUltimosMovimientosPorCodigo, getUltimaFechaInspeccionPorPlaca, obtenerNeumaticosDisponibles, getFechasInspeccionVehicularPorPlaca } from '@/api/Neumaticos';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo';
import ModalAdvertenciaDesasignacion from '@/components/core/theme-provider/modal-desasignar/modal-advertencia-desasignar';
import ModalAdvertenciaReubicacion from '@/components/core/theme-provider/modal-reubicar/modal-advertencia-reubicacion';
import ModalAsignacionNeu from '@/components/dashboard/integrations/modal-asignacion-neu';
import ModalConfirmarInspDesasignar from '@/components/core/theme-provider/modal-desasignar/modal-confirmar-insp-desasignar';
import ModalConfirmarInspeccion from '@/components/core/theme-provider/modal-reubicar/modal-confirmar-inspeccion';
import ModalDesasignar from '@/components/dashboard/integrations/modal-desasignar';
import ModalInpeccionNeu from '@/components/dashboard/integrations/modal-inspeccion-neu';
import ModalInspDesasignacionObligatoria from '@/components/core/theme-provider/modal-desasignar/modal-insp-desasignacion-obligatoria';
import ModalInspeccionAnterior from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-anterior';
import ModalInspeccionAntigua from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-antigua';
import ModalInspeccionObligatoria from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-obligatoria';
import ModalReubicar from '@/components/dashboard/integrations/modal-reubicar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowLeftRightIcon, BookMarked, EyeIcon, ListRestart, MapPinCheckInside, Replace } from 'lucide-react';
import { ModalVerInspecciones } from '@/components/dashboard/integrations/modal-ver-inspecciones';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { ModalActualizarKilometraje } from '@/components/dashboard/integrations/modal-actualizar-kilometraje';
import Link from 'next/link';
import Chip from '@mui/material/Chip';
import { EmptyStatePlaca } from '@/components/dashboard/integrations/empty-state-placa';
import { diasDesdeFecha, parsearFechaLocal } from '@/lib/utils';

/**
 * Deja un solo movimiento por posición (el más reciente) y normaliza los campos que la API
 * devuelve duplicados (CODIGO/CODIGO_NEU, POSICION/POSICION_NEU).
 *
 * Las posiciones válidas SIEMPRE salen de la configuración del vehículo: escribirlas a mano
 * descarta en silencio las que no estén en la lista (una moto tiene 2 y un camión 7, no 5).
 * Si el vehículo no trae una cantidad reconocida no se filtra nada: preferimos mostrar de más
 * antes que esconder neumáticos que sí están asignados en base de datos.
 */
function normalizarAsignadosPorPosicion(
  asignados: any[],
  cantidadNeumaticos: number | string | null | undefined
): any[] {
  const configuracion = obtenerConfiguracionNeumaticos(cantidadNeumaticos);
  const posicionesValidas = configuracion ? new Set(configuracion.posiciones.map(p => p.codigo)) : null;

  const activos = (Array.isArray(asignados) ? asignados : []).filter(
    (n: any) => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
  );

  const porPosicion = new Map<string, any>();
  activos.forEach((n: any) => {
    const pos = n.POSICION_NEU || n.POSICION;
    if (!pos || (posicionesValidas && !posicionesValidas.has(pos))) return;
    const existente = porPosicion.get(pos);
    if (!existente || (n.ID || 0) > (existente.ID || 0)) {
      porPosicion.set(pos, n);
    }
  });

  return Array.from(porPosicion.values()).map((n: any) => ({
    ...n,
    CODIGO: n.CODIGO || n.CODIGO_NEU,
    CODIGO_NEU: n.CODIGO_NEU || n.CODIGO,
    POSICION_NEU: n.POSICION_NEU || n.POSICION,
    POSICION: n.POSICION || n.POSICION_NEU,
  }));
}

export default function Page(): React.JSX.Element {
  const [bloqueoReubicacion, setBloqueoReubicacion] = useState(false);
  const [openModalConfirmarInspeccion, setOpenModalConfirmarInspeccion] = useState(false);
  const [openModalInspDesasignacionObligatoria, setOpenModalInspDesasignacionObligatoria] = useState(false);
  const [openModalConfirmarInspDesasignar, setOpenModalConfirmarInspDesasignar] = useState(false);
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState('');
  const [diasDiferenciaInspeccion, setDiasDiferenciaInspeccion] = useState(0);
  const { user } = useUser();
  const [vehiculo, setVehiculo] = React.useState<Vehiculo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [transitoActivo, setTransitoActivo] = React.useState(false);

  const [animatedKilometraje, setAnimatedKilometraje] = useState(0);
  const [animatedTotalNeumaticos, setAnimatedTotalNeumaticos] = useState(0);
  const [openModalDesasignar, setOpenModalDesasignar] = useState(false);
  const [openActualizarKilometrajeModal, setOpenActualizarKilometrajeModal] = useState(false);
  const [neumaticos, setNeumaticos] = React.useState<Customer[]>([]);
  const [neumaticosFiltrados, setNeumaticosFiltrados] = React.useState<Customer[]>([]);
  const [neumaticosAsignados, setNeumaticosAsignados] = React.useState<any[]>([]);
  // Estados para los modales
  const [openModal, setOpenModal] = React.useState(false);
  // Modal de inspección - ahora integrado con modal de advertencia centralizado
  const [openInspeccionModal, setOpenInspeccionModal] = React.useState(false);
  const [openMantenimientoModal, setOpenMantenimientoModal] = React.useState(false);
  const [modoMantenimiento, setModoMantenimiento] = React.useState<'REUBICAR' | 'DESASIGNAR' | null>(null);
  // const [loading, setLoading] = React.useState(false);
  // const [autosDisponiblesCount, setAutosDisponiblesCount] = useState<number>(0);

  const { data: neumaticosDisponiblesUseQuery = [], refetch: neumaticosDispobilesRefetch } = useQuery({
    queryKey: ['neumaticos-disponibles'],
    queryFn: () => obtenerNeumaticosDisponibles()
  })

  const { data: autosDisponiblesCount = 0 } = useQuery({
    queryKey: ['avaibleQtyAuto'],
    queryFn: obtenerCantidadAutosDisponibles
  })

  interface Vehiculo {
    PLACA: string;
    MARCA: string;
    MODELO: string;
    TIPO: string;
    COLOR: string;
    NROSERIE: string,
    NROMOTOR: string,
    ANO: number;
    KILOMETRAJE: number;
    KILOMETRAJE_GESNEU: number;
    ID_OPERACION: number;
    OPERACION: string;
    TALLER: string;
    ID_SUPERVISOR: string;
    TIPO_TERRENO: string;
    RETEN: string;
    CANTIDAD_NEUMATICOS?: number;
    mensaje?: null | string
  }

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const placa = event.target.value.trim();

    if (placa.trim().length === 0) {
      setVehiculo(null);
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
      return;
    }

    if (placa) {
      // Limpiar datos anteriores antes de buscar un nuevo vehículo
      setVehiculo(null);
      setNeumaticosAsignados([]);
      setNeumaticosFiltrados([]);
      setNeumaticos([]);

      // setLoading(true); // Mostrar indicador de carga

      try {
        const vehiculoData = await buscarVehiculoPorPlaca(placa, transitoActivo);

        if (!vehiculoData || vehiculoData?.mensaje === "Vehículo no encontrado") {
          toast.error('Vehículo no encontrado o la unidad no le pertenece.');
          setVehiculo(null);
          setNeumaticosFiltrados([]);
          setNeumaticosAsignados([]);
          // setLoading(false);
          return;
        }

        setVehiculo(vehiculoData);
        toast.success('Vehículo encontrado exitosamente.');

        // Obtener neumáticos asignados desde la API
        const asignados = await obtenerNeumaticosAsignadosPorPlaca(placa);
        const movimientos = normalizarAsignadosPorPosicion(asignados, vehiculoData.CANTIDAD_NEUMATICOS);

        setNeumaticosAsignados(movimientos);
        // Calcular el mayor kilometraje de los movimientos (tipado explícito)
        const odometros = (movimientos as any[])
          .map((n: any) => Number(n.Odometro ?? n.ODOMETRO ?? n.KILOMETRO ?? n.KILOMETRAJE))
          .filter((v: number) => !isNaN(v) && v > 0);

        const ultimoKmReal = odometros.length > 0 ? Math.max(...odometros) : Number(vehiculoData.KILOMETRAJE_GESNEU ?? vehiculoData.KILOMETRAJE ?? 0);

        animateKilometraje(0, ultimoKmReal);

        const listaNeumaticos = await Neumaticos([], [], [], [], [], 'all');

        setNeumaticos(listaNeumaticos);
        setNeumaticosFiltrados(listaNeumaticos);
        animateTotalNeumaticos(0, listaNeumaticos.length);
      } catch (err) {
        console.error('Error al buscar el vehículo:', err);
        setVehiculo(null);
        toast.error('Error al conectar con el servidor.');
        setNeumaticosFiltrados([]);
        setNeumaticosAsignados([]);
      } finally {
        // setLoading(false); // Ocultar indicador de carga
      }
    } else {
      setVehiculo(null);
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
    }
  };


  // --- Reset total del filtro: limpia placa, datos y tránsito ---
  const handleReset = () => {
    setVehiculo(null);
    setNeumaticos([]);
    setNeumaticosFiltrados([]);
    setNeumaticosAsignados([]);
    setTransitoActivo(false);
    setAnimatedKilometraje(0);
    setAnimatedTotalNeumaticos(0);
    setError(null);
  };

  // --- Re-buscar automáticamente al cambiar "tránsito" si hay una placa activa ---
  // Evita mostrar datos de un vehículo cargados con un modo de tránsito que ya no corresponde.
  const transitoInicializado = React.useRef(false);
  useEffect(() => {
    if (!transitoInicializado.current) {
      transitoInicializado.current = true;
      return;
    }
    if (vehiculo?.PLACA) {
      handleSearchChange({ target: { value: vehiculo.PLACA } } as any);
    }

  }, [transitoActivo]);

  const animateKilometraje = (start: number, end: number) => {
    setAnimatedKilometraje(end);
  };

  const animateTotalNeumaticos = (start: number, end: number) => {
    setAnimatedTotalNeumaticos(end);
  };

  const handleOpenModal = async () => {
    try {
      if (vehiculo) {
        // VALIDACIÓN: si el vehículo ya tiene todas sus posiciones ocupadas, no abrir el modal.
        // El modal de asignación original solo es para vehículos sin neumáticos.
        const asignadosValidos = neumaticosAsignadosUnicos.filter(
          n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
        );
        const totalPosiciones = obtenerConfiguracionNeumaticos(vehiculo.CANTIDAD_NEUMATICOS)?.posiciones.length ?? 5;
        if (asignadosValidos.length >= totalPosiciones) {
          toast.warning('Este vehículo ya tiene todos sus neumáticos asignados. El modal de asignación solo es para vehículos nuevos sin neumáticos.');
          return;
        }

        setOpenModal(true);
      } else {
        console.error('No hay un vehículo seleccionado.');
      }
    } catch (err) {
      console.error('Error al obtener los neumáticos:', err);
    }
  };


  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Nuevo: manejar selección de vehículo desde el modal de todas las placas
  const handleVehiculoSeleccionado = async (vehiculoSeleccionado: any) => {
    if (!vehiculoSeleccionado || !vehiculoSeleccionado.PLACA) return;

    // Limpiar datos anteriores
    setNeumaticosAsignados([]);
    setNeumaticosFiltrados([]);
    setNeumaticos([]);
    // setLoading(true);

    try {
      // Usar directamente el vehículo seleccionado (ya viene completo del modal)
      setVehiculo(vehiculoSeleccionado);
      toast.success('Vehículo de tránsito seleccionado.');

      // Obtener neumáticos asignados desde la API
      const asignados = await obtenerNeumaticosAsignadosPorPlaca(vehiculoSeleccionado.PLACA.trim());
      const movimientos = normalizarAsignadosPorPosicion(asignados, vehiculoSeleccionado.CANTIDAD_NEUMATICOS);

      setNeumaticosAsignados(movimientos);

      // Calcular kilometraje
      const odometros = (movimientos as any[])
        .map((n: any) => Number(n.Odometro ?? n.ODOMETRO ?? n.KILOMETRO ?? n.KILOMETRAJE))
        .filter((v: number) => !isNaN(v) && v > 0);
      const ultimoKmReal = odometros.length > 0 ? Math.max(...odometros) : Number(vehiculoSeleccionado.KILOMETRO ?? vehiculoSeleccionado.KILOMETRAJE ?? 0);
      animateKilometraje(0, ultimoKmReal);

      const listaNeumaticos = await Neumaticos([], [], [], [], [], 'all');

      setNeumaticos(listaNeumaticos);
      setNeumaticosFiltrados(listaNeumaticos);
      animateTotalNeumaticos(0, listaNeumaticos.length);


    } catch (err) {
      console.error('Error al cargar vehículo de tránsito:', err);
      setVehiculo(null);
      toast.error('Error al cargar el vehículo.');
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    // Sólo disparar cuando tengamos un objeto de vehículo válido
    if (!vehiculo || !vehiculo.PLACA) return;

    // Usar la misma API simple que las otras funciones
    obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA)
      .then((asignados) => {
        // El spread dentro del helper preserva todos los campos del backend (ESTADO, REMANENTE, etc.)
        const neumaticosActuales = normalizarAsignadosPorPosicion(asignados, vehiculo.CANTIDAD_NEUMATICOS);

        setNeumaticosAsignados(neumaticosActuales);
      })
      .catch((err) => {
        console.error("Error trayendo neumáticos asignados:", err);
        setNeumaticosAsignados([]);
      });
  }, [vehiculo]);




  // 1. Función simple para refrescar asignados
  // La API ya devuelve los datos necesarios, solo necesitamos filtrar y agrupar por posición
  const refreshAsignados = async () => {

    if (vehiculo?.PLACA) {

      const movimientos = await obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA);
      setMovimientosHistoricos(Array.isArray(movimientos) ? movimientos : []);

      // Obtener neumáticos asignados desde la API
      const asignados = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);
      const neumaticosFinales = normalizarAsignadosPorPosicion(asignados, vehiculo.CANTIDAD_NEUMATICOS);

      setNeumaticosAsignados(neumaticosFinales);
      // Limpiar cache de fechas de registro para forzar recarga (though now we use direct field)
      setFechasRegistro({});
    }
  };



  // ...



  // Refresca los datos del vehículo desde el backend
  const refreshVehiculo = async () => {
    if (vehiculo?.PLACA) {
      try {
        const vehiculoData = await buscarVehiculoPorPlaca(vehiculo.PLACA, transitoActivo);
        if (vehiculoData) {
          setVehiculo(vehiculoData);
          // NO volver a animar el kilometraje aquí, para evitar mostrar un valor antiguo
          // animateKilometraje(0, vehiculoData.KILOMETRAJE); // Eliminado
        }
      } catch (e) {
        // Opcional: mostrar error
      }
    }
  };

  // REFACTOR: Carga de fechas segura para evitar bucle infinito
  const [fechasRegistro, setFechasRegistro] = useState<{ [codigo: string]: string }>({});

  useEffect(() => {
    // Escuchar cambios en neumaticosAsignados y cargar fechas faltantes
    const cargarFechas = async () => {
      const codigosPendientes = neumaticosAsignados
        .map(n => n.CODIGO as string)
        .filter(cod => cod && !fechasRegistro[cod]); // Solo los que no tienen fecha en cache

      if (codigosPendientes.length === 0) return;

      // Para evitar spam, procesamos uno por uno o en paralelo controlado
      for (const codigo of codigosPendientes) {
        try {
          const movimientos = await obtenerUltimosMovimientosPorCodigo(codigo);
          let fecha = '';
          if (Array.isArray(movimientos) && movimientos.length > 0) {
            const maxFecha = movimientos.reduce((max: string, curr: any) => {
              if (!curr.FECHA_REGISTRO) return max;
              if (!max) return curr.FECHA_REGISTRO;
              return curr.FECHA_REGISTRO > max ? curr.FECHA_REGISTRO : max;
            }, '');
            if (maxFecha) {
              const [year, month, day] = maxFecha.split('-');
              fecha = `${day}/${month}/${year}`;
            }
          }
          // Actualizamos estado funcionalmente para no perder otros
          setFechasRegistro(prev => ({ ...prev, [codigo]: fecha || '-' }));
        } catch (err) {
          console.error('Error fecha:', codigo, err);
          setFechasRegistro(prev => ({ ...prev, [codigo]: '-' }));
        }
      }
    };

    cargarFechas();

  }, [neumaticosAsignados]); // Dependencia clave: solo cuando cambia la lista


  // Memo para filtrar por el último movimiento por código usando FECHA_MOVIMIENTO
  const neumaticosAsignadosUnicos = React.useMemo(() => {
    // Agrupar por código y quedarse con el de FECHA_MOVIMIENTO más reciente
    const porCodigo = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of neumaticosAsignados) {
      const cod = n.CODIGO as string;
      const fechaN = new Date(n.FECHA_MOVIMIENTO ?? '1970-01-01').getTime();
      const fechaPrev = new Date(porCodigo.get(cod)?.FECHA_MOVIMIENTO ?? '1970-01-01').getTime();
      if (!porCodigo.has(cod) || fechaN > fechaPrev) {
        porCodigo.set(cod, n);
      }
    }
    return Array.from(porCodigo.values());
  }, [neumaticosAsignados]);

  // Calcular el último kilometraje real desde TODOS los movimientos históricos de la placa (incluyendo inspecciones)
  const [movimientosHistoricos, setMovimientosHistoricos] = useState<any[]>([]);

  useEffect(() => {
    if (vehiculo?.PLACA) {
      obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA)
        .then((arr) => {
          setMovimientosHistoricos(Array.isArray(arr) ? arr : []);
        })
        .catch(() => setMovimientosHistoricos([]));
    } else {
      setMovimientosHistoricos([]);
    }
  }, [vehiculo?.PLACA]);

  const ultimoKilometroReal = React.useMemo(() => {
    const odometros = movimientosHistoricos
      .map(n => {
        const raw = (n as any)['Odometro'] ?? (n as any)['ODOMETRO'] ?? (n as any)['KILOMETRO'] ?? (n as any)['KILOMETRAJE'];
        if (typeof raw === 'string') {
          return Number(raw.replace(/,/g, ''));
        }
        return Number(raw);
      })
      .filter(v => !isNaN(v) && v > 0);
    if (odometros.length > 0) {
      return Math.max(...odometros);
    }
    // Fallback: usar el del vehículo
    const kilometrajeFinalJe = vehiculo?.KILOMETRAJE_GESNEU ? vehiculo?.KILOMETRAJE_GESNEU : vehiculo?.KILOMETRAJE
    return Number(kilometrajeFinalJe ?? 0);
  }, [movimientosHistoricos, vehiculo]);

  // Animar el kilometraje mostrado cuando cambie el valor real
  useEffect(() => {
    animateKilometraje(0, ultimoKilometroReal);
  }, [ultimoKilometroReal]);

  // Escuchar evento global para abrir el modal de inspección desde cualquier parte
  React.useEffect(() => {
    const handler = async () => {
      // Refrescar datos antes de abrir el modal
      await refreshAsignados();
      setOpenInspeccionModal(true);
    };
    window.addEventListener('abrir-modal-inspeccion-interno', handler);
    return () => window.removeEventListener('abrir-modal-inspeccion-interno', handler);
  }, []);

  // Handler para abrir inspección desde mantenimiento
  const handleAbrirInspeccionDesdeMantenimiento = async () => {
    setOpenMantenimientoModal(false);
    // Refrescar datos antes de abrir el modal de inspección
    await refreshAsignados();
    setOpenInspeccionModal(true);
  };

  // --- Funciones para el modal de desasignación ---
  const handleOpenModalDesasignar = () => {
    setOpenModalDesasignar(true);
  };
  const handleCloseModalDesasignar = () => {
    setOpenModalDesasignar(false);
  };

  // --- Escuchar evento global para refrescar toda la página (neumáticos, vehículo, diagrama, etc) ---
  useEffect(() => {
    const handler = async () => {
      // Forzar recarga de todo: buscar por la placa actual
      if (vehiculo?.PLACA) {
        // Simula el mismo flujo que buscar por placa
        await handleSearchChange({ target: { value: vehiculo.PLACA } } as any);
      }
    };
    window.addEventListener('actualizar-diagrama-vehiculo', handler);
    return () => window.removeEventListener('actualizar-diagrama-vehiculo', handler);
  }, [vehiculo]);

  // Handler centralizado para abrir el modal de asignación SIEMPRE refrescando datos
  // Estado para mostrar advertencia si ya hay 4 neumáticos asignados

  const handleOpenModalConRefresh = async () => {
    // Si el vehículo ya tiene todas sus posiciones ocupadas, avisar y no abrir el modal.
    // El tope depende de su configuración (moto 2, auto 5, camión 7), no de un valor fijo.
    const asignadosValidos = neumaticosAsignadosUnicos.filter(
      n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
    const totalPosicionesVehiculo = obtenerConfiguracionNeumaticos(vehiculo?.CANTIDAD_NEUMATICOS)?.posiciones.length ?? 5;
    if (asignadosValidos.length >= totalPosicionesVehiculo) {
      toast.warning(`Ya hay ${totalPosicionesVehiculo} neumáticos asignados a este vehículo. Si desea reasignar, primero debe desasignar alguno.`, {
        duration: 7000,
        position: 'top-center'
      })
      return;
    }
    await Promise.all([refreshAsignados()]);
    // refreshVehiculo()
    // Espera un ciclo de event loop para asegurar que los estados estén actualizados
    setTimeout(() => {
      handleOpenModal();
    }, 0);
  };


  const [mensajeBloqueo, setMensajeBloqueo] = useState<string | undefined>(undefined);
  // Acciones de cada opción
  // Estado para mostrar advertencia de reubicación
  const [showReubicacionWarning, setShowReubicacionWarning] = useState(false);
  // Modal de advertencia para reubicación
  const [openModalAdvertenciaReubicacion, setOpenModalAdvertenciaReubicacion] = useState(false);
  // Modal de inspección obligatoria
  const [openModalInspeccionObligatoria, setOpenModalInspeccionObligatoria] = useState(false);

  const [openModalInspeccionAntigua, setOpenModalInspeccionAntigua] = useState(false);

  const [openModalInspeccionAnterior, setOpenModalInspeccionAnterior] = useState(false);
  const [openVerInspecciones, setOpenVerInspecciones] = useState(false);

  // todo: ABRIR MODAL ANTES DE REUBICAR
  // Función para REUBICAR - Ejecuta TODAS las validaciones ANTES de abrir modal
  const handleAbrirMantenimientoReubicar = async () => {

    // Quitar foco manualmente para evitar problemas de accesibilidad
    if (document && document.activeElement) {
      try {
        (document.activeElement as HTMLElement).blur();
      } catch (e) { }
    }

    if (vehiculo?.PLACA) {
      const asignadosValidos = neumaticosAsignados.filter(
        n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
      );

      // Si no hay neumáticos válidos
      if (asignadosValidos.length === 0) {
        setBloqueoReubicacion(false);
        setMensajeBloqueo(undefined);
        setOpenModalAdvertenciaReubicacion(true);
        return;
      }

      // Buscar inspecciones usando la API correcta
      try {

        // const fechasVehiculo = await getUltimaFechaInspeccionPorPlaca(vehiculo.PLACA);
        const fechasInspeccion = await getFechasInspeccionVehicularPorPlaca(vehiculo.PLACA);
        const fechasVehiculo = fechasInspeccion[0];

        if (fechasInspeccion.length === 0) {
          setOpenModalInspeccionObligatoria(true);
          return;
        }

        // Calcular diferencia de días (siempre en hora local: ver parsearFechaLocal)
        const fechaObj = parsearFechaLocal(fechasVehiculo?.FECHA_REGISTRO);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const diffDias = diasDesdeFecha(fechasVehiculo?.FECHA_REGISTRO) ?? 0;

        setFechaUltimaInspeccion(fechasVehiculo?.FECHA_REGISTRO);
        setDiasDiferenciaInspeccion(diffDias);

        // Validar si es >= 4 días (fuera del rango: hoy + 3 días anteriores)
        if (diffDias >= 4) {
          // Si quieres mostrar mensaje específico de >4 días de antigüedad,
          // el modal obligatorio suele ser "No existe", pero aquí aplica igual.
          // O usar el de advertencia:
          setOpenModalInspeccionAntigua(true);
          return;
        } else {

          if (fechaObj?.getTime() !== hoy.getTime()) {
            setOpenModalInspeccionAnterior(true);
            return;
          }
        }

        // SI PASA TODAS LAS VALIDACIONES, ABRIR MODAL DIRECTAMENTE
        setModoMantenimiento('REUBICAR');
        setOpenMantenimientoModal(true);

      } catch (err) {
        console.error('Error verificando inspección:', err);
        toast.error('Error verificando inspección.');
      }
    }
  };

  // Función para DESASIGNAR - Ejecuta TODAS las validaciones ANTES de abrir modal
  const handleAbrirMantenimientoDesasignar = async () => {

    const asignadosValidos = neumaticosAsignados.filter(
      n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
    );

    // Si no hay neumáticos, abre el modal de advertencia para asignar.
    if (asignadosValidos.length === 0) {
      setOpenModalDesasignar(true);
      return;
    }

    if (vehiculo?.PLACA) {
      try {
        const ultimaInspeccionFecha = await getUltimaFechaInspeccionPorPlaca(vehiculo.PLACA);

        // Misma medición que en reubicar: días completos en hora local (ver parsearFechaLocal).
        const diasDiferencia = diasDesdeFecha(ultimaInspeccionFecha?.fecha_registro);

        if (ultimaInspeccionFecha?.fecha_registro && diasDiferencia !== null) {
          // IMPORTANTE: Mantener la restricción original - abrir modal de confirmación primero
          setFechaUltimaInspeccion(ultimaInspeccionFecha?.fecha_registro);
          setDiasDiferenciaInspeccion(diasDiferencia);
          setOpenModalConfirmarInspDesasignar(true); // RESTRICCIÓN ORIGINAL MANTENIDA
          return;
        } else {
          // Si no hay inspección, abre el modal de inspección obligatoria.
          setOpenModalInspDesasignacionObligatoria(true);
          return;
        }
      } catch (err) {
        console.error('Error verificando inspección para desasignar:', err);
        toast.error('Error verificando inspección.');
      }
    }
  };

  return (
    <Stack spacing={3}>
      <CompaniesFilters
        onSearchChange={handleSearchChange}
        // projectName={vehiculo?.PROYECTO || '—'}
        autosDisponiblesCount={autosDisponiblesCount}
        onVehiculoSeleccionado={handleVehiculoSeleccionado}
        transitoChecked={transitoActivo}
        onTransitoChange={setTransitoActivo}
        onReset={handleReset}
      />
      {!vehiculo ? (
        <EmptyStatePlaca error={error} />
      ) : (
        <Stack spacing={2}>
          {/* Encabezado: identidad del vehículo + acciones, en una sola fila dividida en dos
              secciones cuyo ancho coincide con las columnas de Diagrama/Neumáticos de abajo. */}
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
              border: '1px solid #eef2f6',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Stack spacing={0.5} sx={{ flex: 0.8, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Link href={`/padron/placa/${vehiculo.PLACA}`} target="_blank" style={{ textDecoration: 'underline' }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#167bd9' }}>
                      {vehiculo.PLACA}
                    </Typography>
                  </Link>
                  <div className='bg-linear-to-r from-cyan-200 to-teal-200 rounded-lg py-1.5 px-3 font-bold text-sm shadow-sm'>
                    {`${animatedKilometraje.toLocaleString()} km`}
                  </div>
                  {vehiculo.OPERACION?.trim() && (
                    <Chip
                      icon={<MapPinCheckInside size={14} />}
                      label={vehiculo.OPERACION.trim()}
                      size="small"
                      sx={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: '#64748b' },
                      }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {[vehiculo.MARCA, vehiculo.MODELO, vehiculo.TIPO, vehiculo.COLOR, vehiculo.ANO].filter(Boolean).join(' · ')}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1.25}
                flexWrap="wrap"
                useFlexGap
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                sx={{ flex: 1.3, width: '100%' }}
              >
                <LoadingButton2
                  variant="teal"
                  onClick={handleOpenModalConRefresh}
                  disabled={user?.usuario?.trim() === 'GESNEU'}
                  icon={<ClipboardText />}
                >
                  Asignar Neumático
                </LoadingButton2>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ButtonCustom variant="life"
                      disabled={neumaticosAsignadosUnicos.length === 0}
                    >
                      <ClipboardText />
                      Inspección
                    </ButtonCustom>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={async () => {
                          await refreshAsignados();
                          setOpenInspeccionModal(true);
                        }}
                      >
                        <BookMarked />
                        Registrar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setOpenVerInspecciones(true)}
                      >
                        <EyeIcon />
                        Historial
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ButtonCustom variant="warning"
                      disabled={neumaticosAsignadosUnicos.length === 0}
                    >
                      <ClipboardText />
                      Mantenimiento
                    </ButtonCustom>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={handleAbrirMantenimientoReubicar}
                      >
                        <ArrowLeftRightIcon />
                        Reubicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleAbrirMantenimientoDesasignar}
                      >
                        <Replace />
                        Desasignar
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Stack>
            </Stack>
          </Card>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {/* Diagrama de posiciones */}
            <Card
              sx={{
                flex: 0.8,
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
                border: '1px solid #eef2f6',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                Diagrama de posiciones
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 2 }}>
                {[
                  { color: '#2e7d32', label: 'Óptimo' },
                  { color: '#c9a227', label: 'Medio' },
                  { color: '#d32f2f', label: 'Crítico' },
                ].map((item) => (
                  <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: item.color }} />
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <DiagramaVehiculo
                  layout="dashboard"
                  /* Acá se muestran los tres datos (código, remanente y km) porque es la vista
                     de consulta. Para que las 7 etiquetas de un camión no se pisen, el diagrama
                     va más ancho que el resto: la tarjeta tiene sitio de sobra (401 px incluso
                     en pantallas de 1366) y 230 px de silueta separan lo suficiente las ruedas. */
                  etiquetaDatos="completo"
                  anchoMax={230}
                  cantidadNeumaticos={vehiculo?.CANTIDAD_NEUMATICOS}
                  neumaticosAsignados={neumaticosAsignados}
                />
              </Box>
            </Card>

            {/* Tablas de neumáticos */}
            <Card
              sx={{
                flex: 1.3,
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
                border: '1px solid #eef2f6',
                position: 'relative',
                maxHeight: '700px',
                overflow: 'auto',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                  Neumáticos instalados
                </Typography>
                <Chip
                  label={`${neumaticosAsignadosUnicos.length} ${neumaticosAsignadosUnicos.length === 1 ? 'unidad' : 'unidades'}`}
                  size="small"
                  sx={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem' }}
                />
              </Stack>

              <NeumaticosAsignadosCards data={neumaticosAsignadosUnicos} />

            </Card>
          </Stack>
        </Stack>
      )}
      <ModalAdvertenciaReubicacion
        open={openModalAdvertenciaReubicacion}
        onClose={() => setOpenModalAdvertenciaReubicacion(false)}
        onAsignarNeumatico={() => {
          setOpenModalAdvertenciaReubicacion(false);
          handleOpenModalConRefresh(); // Usar el handler con validación
        }}
        bloqueoReubicacion={bloqueoReubicacion}
        mensajeBloqueo={mensajeBloqueo}
      />
      <ModalAdvertenciaDesasignacion
        open={openModalDesasignar}
        onClose={handleCloseModalDesasignar}
        onDesasignarNeumatico={handleOpenModalConRefresh}
        bloqueoDesasignacion={bloqueoReubicacion}
        mensajeBloqueo={mensajeBloqueo}
      />
      <ModalInspDesasignacionObligatoria
        open={openModalInspDesasignacionObligatoria}
        onClose={() => setOpenModalInspDesasignacionObligatoria(false)}
        onRegistrarInspeccion={() => {
          setOpenModalInspDesasignacionObligatoria(false);
          setOpenInspeccionModal(true);
        }}
      />

      {/* Modal de inspección obligatoria */}
      <ModalInspeccionObligatoria
        open={openModalInspeccionObligatoria}
        onClose={() => setOpenModalInspeccionObligatoria(false)}
        onRegistrarInspeccion={() => {
          setOpenModalInspeccionObligatoria(false);
          setOpenInspeccionModal(true);
        }}
      />

      <ModalInspeccionAntigua
        open={openModalInspeccionAntigua}
        diffDias={diasDiferenciaInspeccion}
        fechaInspeccion={fechaUltimaInspeccion}
        onClose={() => setOpenModalInspeccionAntigua(false)}
        onRegistrarInspeccion={() => {
          setOpenModalInspeccionAntigua(false);
          setOpenInspeccionModal(true);
        }}
      />

      <ModalInspeccionAnterior
        open={openModalInspeccionAnterior}
        diffDias={diasDiferenciaInspeccion}
        fechaInspeccion={fechaUltimaInspeccion}
        onClose={() => setOpenModalInspeccionAnterior(false)}
        onRegistrarInspeccion={() => {
          setOpenModalInspeccionAnterior(false);
          setOpenInspeccionModal(true);
        }}
        onContinuarReubicar={() => {
          setOpenModalInspeccionAnterior(false);
          setModoMantenimiento('REUBICAR');
          setOpenMantenimientoModal(true);
        }}
      />


      <ModalConfirmarInspDesasignar
        open={openModalConfirmarInspDesasignar}
        fechaUltimaInspeccion={fechaUltimaInspeccion}
        diasDiferencia={diasDiferenciaInspeccion}
        onClose={() => setOpenModalConfirmarInspDesasignar(false)}
        onRegistrarInspeccion={() => {
          setOpenModalConfirmarInspDesasignar(false);
          setOpenInspeccionModal(true); // Abre el modal de inspección
        }}
        onContinuarDesasignacion={() => {
          setOpenModalConfirmarInspDesasignar(false);
          // Abrir modal de mantenimiento en modo DESASIGNAR después de confirmar
          setModoMantenimiento('DESASIGNAR');
          setOpenMantenimientoModal(true);
        }}
      />
      {/* Modal de confirmación de inspección */}
      <ModalConfirmarInspeccion
        open={openModalConfirmarInspeccion}
        fechaUltimaInspeccion={fechaUltimaInspeccion}
        diasDiferencia={diasDiferenciaInspeccion}
        onClose={() => setOpenModalConfirmarInspeccion(false)}
        onRegistrarInspeccion={() => {
          setOpenModalConfirmarInspeccion(false);
          setOpenInspeccionModal(true);
        }}
        onContinuarReubicacion={() => {
          setOpenModalConfirmarInspeccion(false);
          setModoMantenimiento('REUBICAR');
          setOpenMantenimientoModal(true);
        }}
      />
      {/* ...existing code... */}
      <ModalAsignacionNeu
        open={openModal}
        onClose={handleCloseModal}
        data={
          neumaticosDisponiblesUseQuery
            ?.map((neumatico: any) => ({
              ...neumatico,
              CODIGO: neumatico.CODIGO,
              DISEÑO: neumatico.DISEÑO ?? '',
              FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD ?? '',
              COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR,
              ID_OPERACION: vehiculo?.ID_OPERACION,
            }))
        }
        assignedNeumaticos={(() => {
          // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO) por posición
          const neumaticosWithOp = neumaticosAsignados.map((neu: any) => {
            return ({
              ...neu,
              COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR,
              ID_OPERACION: vehiculo?.ID_OPERACION
            })
          })

          const neumaticosPorPosicion = new Map<string, typeof neumaticosWithOp[0]>();
          neumaticosWithOp.forEach(n => {
            const pos = n.POSICION_NEU;
            if (pos) {
              const existente = neumaticosPorPosicion.get(pos);
              if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                neumaticosPorPosicion.set(pos, n);
              }
            }
          });
          return Array.from(neumaticosPorPosicion.values());
        })()}
        placa={vehiculo?.PLACA ?? ''}
        kilometro={ultimoKilometroReal}
        cantidadNeumaticos={vehiculo?.CANTIDAD_NEUMATICOS}
        onAssignedUpdate={async () => {
          await refreshAsignados();
          // Recargar movimientos históricos para actualizar el kilometraje
          if (vehiculo?.PLACA) {
            const movimientos = await obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA);
            setMovimientosHistoricos(Array.isArray(movimientos) ? movimientos : []);
            neumaticosDispobilesRefetch();
          }
          setTimeout(async () => {
            await refreshVehiculo();
          }, 2500);
        }}
        enTransito={transitoActivo}
        taller={vehiculo?.TALLER}
      />
      {/* Modal de Inspección de Neumáticos - Integrado con modal de advertencia centralizado */}

      {
        openInspeccionModal && (
          <ModalInpeccionNeu
            open={openInspeccionModal}
            onClose={() => {
              // Solo cerrar el modal, sin recargar datos
              setOpenInspeccionModal(false);
            }}
            placa={vehiculo?.PLACA ?? ''}
            neumaticosAsignados={neumaticosAsignadosUnicos
              .filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0 && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA')
              .map(n => ({
                ...n,
                POSICION: n.POSICION_NEU ?? '',
                POSICION_NEU: n.POSICION_NEU ?? '',
                REMANENTE: n.REMANENTE,
                PRESION_AIRE: n.PRESION_AIRE,
                TORQUE_APLICADO: n.TORQUE_APLICADO,
                ESTADO: n.ESTADO,
                COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR,
                ID_OPERACION: vehiculo?.ID_OPERACION
              }))}
            vehiculo={vehiculo ? {
              placa: vehiculo.PLACA,
              marca: vehiculo.MARCA,
              modelo: vehiculo.MODELO,
              anio: String(vehiculo.ANO),
              color: vehiculo.COLOR,
              // proyecto: vehiculo.PROYECTO,
              operacion: vehiculo.OPERACION,
              id_operacion: vehiculo.ID_OPERACION,
              kilometro: vehiculo.KILOMETRAJE_GESNEU ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE,
              cod_supervisor: vehiculo.ID_SUPERVISOR,
              tipo_terreno: vehiculo.TIPO_TERRENO,
              reten: vehiculo.RETEN,
              cantidad_neumaticos: vehiculo.CANTIDAD_NEUMATICOS
            } : undefined}
            kilometroRealActual={ultimoKilometroReal}
            onSeleccionarNeumatico={() => { }}
            onUpdateAsignados={refreshAsignados}
            onAbrirAsignacion={handleOpenModalConRefresh}
            enTransito={transitoActivo}
            taller={vehiculo?.TALLER}
          />
        )
      }

      {/* Modal para poder actualizar el Kilometraje de un vehiculo */}

      {
        openActualizarKilometrajeModal && (
          <ModalActualizarKilometraje
            open={openActualizarKilometrajeModal}
            onClose={() => setOpenActualizarKilometrajeModal(false)}
            placa={vehiculo?.PLACA ?? ''}
          />
        )
      }

      {/* Nuevo modal para ver inspecciones */}

      {
        openVerInspecciones && (
          <ModalVerInspecciones
            open={openVerInspecciones}
            onClose={() => setOpenVerInspecciones(false)}
            placa={vehiculo?.PLACA ?? ''}
          />
        )
      }


      {/* Modal para REUBICAR */}
      <ModalReubicar
        open={openMantenimientoModal && modoMantenimiento === 'REUBICAR'}
        onClose={() => {
          // Solo cerrar el modal, sin recargar datos
          setOpenMantenimientoModal(false);
          setModoMantenimiento(null);
        }}
        onSuccess={async () => {
          if (vehiculo?.PLACA) {
            await Promise.all([refreshAsignados(), refreshVehiculo()]);
          }
        }}
        placa={vehiculo?.PLACA ?? ''}
        neumaticosAsignados={neumaticosAsignados.map(n => ({
          ...n,
          POSICION: n.POSICION_NEU ?? n.POSICION ?? '',
          POSICION_NEU: n.POSICION_NEU ?? n.POSICION ?? '',
          REMANENTE: n.REMANENTE,
          KILOMETRO: n.ODOMETRO,
          PRESION_AIRE: n.PRESION_AIRE,
          TORQUE_APLICADO: n.TORQUE_APLICADO,
          ESTADO: n.ESTADO,
          ID_OPERACION: vehiculo?.ID_OPERACION,
          COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR
        }))}
        vehiculo={vehiculo ? {
          placa: vehiculo.PLACA,
          marca: vehiculo.MARCA,
          modelo: vehiculo.MODELO,
          anio: String(vehiculo.ANO),
          color: vehiculo.COLOR,
          // proyecto: vehiculo.PROYECTO,
          operacion: vehiculo.OPERACION,
          id_operacion: vehiculo.ID_OPERACION,
          kilometro: vehiculo.KILOMETRAJE_GESNEU ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE,
          cod_supervisor: vehiculo.ID_SUPERVISOR,
          cantidad_neumaticos: vehiculo.CANTIDAD_NEUMATICOS
        } : undefined}
        user={user || undefined}
        onAbrirInspeccion={handleAbrirInspeccionDesdeMantenimiento}
        enTransito={transitoActivo}
        taller={vehiculo?.TALLER}
      />

      {/* Modal para DESASIGNAR */}
      {
        openMantenimientoModal && modoMantenimiento === 'DESASIGNAR' && (
          <ModalDesasignar
            open={openMantenimientoModal && modoMantenimiento === 'DESASIGNAR'}
            onClose={() => {
              setOpenMantenimientoModal(false);
              setModoMantenimiento(null);
            }}
            onSuccess={async () => {
              if (vehiculo?.PLACA) {
                await Promise.all([refreshAsignados(), refreshVehiculo()]);
                neumaticosDispobilesRefetch();
              }
            }}
            placa={vehiculo?.PLACA ?? ''}
            neumaticosAsignados={neumaticosAsignadosUnicos.map(n => ({
              ...n,
              POSICION: n.POSICION_NEU ?? '',
              REMANENTE: n.REMANENTE,
              PRESION_AIRE: n.PRESION_AIRE,
              TORQUE_APLICADO: n.TORQUE_APLICADO,
              ESTADO: n.ESTADO,
              COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR,
              ID_OPERACION: vehiculo?.ID_OPERACION
            }))}
            vehiculo={vehiculo ? {
              placa: vehiculo.PLACA,
              marca: vehiculo.MARCA,
              modelo: vehiculo.MODELO,
              anio: String(vehiculo.ANO),
              color: vehiculo.COLOR,
              // proyecto: vehiculo.PROYECTO,
              operacion: vehiculo.OPERACION,
              kilometro: vehiculo.KILOMETRAJE_GESNEU ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE,
              id_operacion: vehiculo.ID_OPERACION,
              cod_supervisor: vehiculo.ID_SUPERVISOR,
              cantidad_neumaticos: vehiculo.CANTIDAD_NEUMATICOS
            } : undefined}
            kilometraje={ultimoKilometroReal}
            enTransito={transitoActivo}
            taller={vehiculo?.TALLER}
          />
        )
      }

    </Stack>
  );
}
