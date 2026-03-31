'use client';

import * as React from 'react';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { columnsNeuAsignado, columnsNeuDisponible } from './columns';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import { Customer } from '@/components/dashboard/customer/customers-table';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { Neumatico } from '@/types/types';
import { Neumaticos, obtenerNeumaticosAsignadosPorPlaca, buscarVehiculoPorPlaca, obtenerCantidadAutosDisponibles, obtenerUltimosMovimientosPorPlaca, obtenerUltimosMovimientosPorCodigo, getUltimaFechaInspeccionPorPlaca, obtenerNeumaticosDisponibles, getFechasInspeccionVehicularPorPlaca } from '@/api/Neumaticos';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Wrench } from '@phosphor-icons/react/dist/ssr/Wrench';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ModalAdvertenciaDesasignacion from '@/components/core/theme-provider/modal-desasignar/modal-advertencia-desasignar';
import ModalAdvertenciaReubicacion from '@/components/core/theme-provider/modal-reubicar/modal-advertencia-reubicacion';
import ModalAsignacionNeu from '@/components/dashboard/integrations/modal-asignacion-neu';
import ModalAsignacionNeuDesdeDesasignacion from '@/components/dashboard/integrations/modal-asignacion-neu-desde-desasignacion';
import ModalConfirmarInspDesasignar from '@/components/core/theme-provider/modal-desasignar/modal-confirmar-insp-desasignar';
import ModalConfirmarInspeccion from '@/components/core/theme-provider/modal-reubicar/modal-confirmar-inspeccion';
import ModalDesasignar from '@/components/dashboard/integrations/modal-desasignar';
import ModalInpeccionNeu from '@/components/dashboard/integrations/modal-inspeccion-neu';
import ModalInspDesasignacionObligatoria from '@/components/core/theme-provider/modal-desasignar/modal-insp-desasignacion-obligatoria';
import ModalInspeccionAnterior from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-anterior';
import ModalInspeccionAntigua from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-antigua';
import ModalInspeccionObligatoria from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-obligatoria';
import ModalReubicar from '@/components/dashboard/integrations/modal-reubicar';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@/components/ui/loading-button';
import { ArchiveIcon, ArrowLeftIcon, ArrowLeftRightIcon, BookMarked, CalendarPlusIcon, ClockIcon, Eye, EyeClosed, EyeIcon, ListFilterIcon, MailCheckIcon, MoreHorizontalIcon, Replace, TagIcon, Trash2Icon } from 'lucide-react';
import { ModalVerInspecciones } from '@/components/dashboard/integrations/modal-ver-inspecciones';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ButtonGroup } from '@/components/ui/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button as ButtonCustom } from '@/components/ui/button';
import { Button } from '@mui/material';
import { LoadingButton2 } from '@/components/ui/loading-button2';


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

  const [animatedKilometraje, setAnimatedKilometraje] = useState(0);
  const [animatedTotalNeumaticos, setAnimatedTotalNeumaticos] = useState(0);
  const [openModalDesasignar, setOpenModalDesasignar] = useState(false);
  const [neumaticos, setNeumaticos] = React.useState<Customer[]>([]);
  const [neumaticosFiltrados, setNeumaticosFiltrados] = React.useState<Customer[]>([]);
  const [neumaticosAsignados, setNeumaticosAsignados] = React.useState<any[]>([]);
  // Estados para los modales
  const [openModal, setOpenModal] = React.useState(false);
  // Modal de inspección - ahora integrado con modal de advertencia centralizado
  const [openInspeccionModal, setOpenInspeccionModal] = React.useState(false);
  // Modal de asignación desde desasignación
  const [openModalAsignacionDesdeDesasignacion, setOpenModalAsignacionDesdeDesasignacion] = React.useState(false);
  const [datosAsignacionDesdeDesasignacion, setDatosAsignacionDesdeDesasignacion] = React.useState<{
    cachedNeumaticosAsignados: Neumatico[];
    posicionesVacias: string[];
  } | null>(null);
  const [asignacionesTemporales, setAsignacionesTemporales] = React.useState<any[]>([]); // Asignaciones temporales desde modal asignación
  const [openMantenimientoModal, setOpenMantenimientoModal] = React.useState(false);
  const [modoMantenimiento, setModoMantenimiento] = React.useState<'REUBICAR' | 'DESASIGNAR' | null>(null);
  // const [loading, setLoading] = React.useState(false);
  const [autosDisponiblesCount, setAutosDisponiblesCount] = useState<number>(0);

  const { data: neumaticosDisponiblesUseQuery = [], refetch: neumaticosDispobilesRefetch } = useQuery({
    queryKey: ['neumaticos-disponibles'],
    queryFn: () => obtenerNeumaticosDisponibles()
  })

  interface Vehiculo {
    PLACA: string;
    MARCA: string;
    MODELO: string;
    TIPO: string;
    COLOR: string;
    ANO: number;
    PROYECTO: string;
    OPERACION?: string;
    KILOMETRO: number;
    KILOMETRAJE: number;
    ID_OPERACION: number;
    ID_SUPERVISOR: string;
    TIPO_TERRENO: string
    RETEN: string
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
        const vehiculoData = await buscarVehiculoPorPlaca(placa);

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

        // Filtrar solo los activos (excluir BAJA DEFINITIVA y RECUPERADO)
        const neumaticosActivos = asignados.filter((n: any) =>
          n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
        );

        // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
        const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
        neumaticosActivos.forEach((n: any) => {
          const pos = n.POSICION_NEU || n.POSICION;
          if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
            const existente = porPosicion.get(pos);
            if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
              porPosicion.set(pos, n);
            }
          }
        });

        // Normalizar campos para consistencia
        const movimientos = Array.from(porPosicion.values()).map((n: any) => ({
          ...n,
          CODIGO: n.CODIGO || n.CODIGO_NEU,
          CODIGO_NEU: n.CODIGO_NEU || n.CODIGO,
          POSICION_NEU: n.POSICION_NEU || n.POSICION,
          POSICION: n.POSICION || n.POSICION_NEU
        }));

        setNeumaticosAsignados(movimientos);
        // Calcular el mayor kilometraje de los movimientos (tipado explícito)
        const odometros = (movimientos as any[])
          .map((n: any) => Number(n.Odometro ?? n.ODOMETRO ?? n.KILOMETRO ?? n.KILOMETRAJE))
          .filter((v: number) => !isNaN(v) && v > 0);

        const ultimoKmReal = odometros.length > 0 ? Math.max(...odometros) : Number(vehiculoData.KILOMETRO ?? vehiculoData.KILOMETRAJE ?? 0);

        animateKilometraje(0, ultimoKmReal);

        const listaNeumaticos = await Neumaticos();

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


  const animateKilometraje = (start: number, end: number) => {
    setAnimatedKilometraje(end);
  };

  const animateTotalNeumaticos = (start: number, end: number) => {
    setAnimatedTotalNeumaticos(end);
  };

  const handleOpenModal = async () => {
    try {
      if (vehiculo) {
        // VALIDACIÓN: Si ya hay 5 neumáticos asignados, no permitir abrir el modal
        // El modal de asignación original solo es para vehículos sin neumáticos
        const asignadosValidos = neumaticosAsignadosUnicos.filter(
          n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
        );
        if (asignadosValidos.length >= 5) {
          toast.warning('Este vehículo ya tiene todos sus neumáticos asignados. El modal de asignación solo es para vehículos nuevos sin neumáticos.');
          return;
        }

        const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);

        // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
        const neumaticosPorPosicion = new Map<string, typeof data[0]>();
        data.forEach((n: any) => {
          const pos = n.POSICION_NEU;
          if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
            const existente = neumaticosPorPosicion.get(pos);
            if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
              neumaticosPorPosicion.set(pos, n);
            }
          }
        });


        // Pasar los neumáticos agrupados (solo el más reciente por posición)
        // setAssignedNeumaticos(Array.from(neumaticosPorPosicion.values()));
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

  // Handler para abrir modal de asignación desde desasignación
  const handleAbrirAsignacionDesdeDesasignacion = (data: { cachedNeumaticosAsignados: Neumatico[]; posicionesVacias: string[] }) => {
    setDatosAsignacionDesdeDesasignacion(data);
    setOpenModalAsignacionDesdeDesasignacion(true);
  };

  const handleCloseModalAsignacionDesdeDesasignacion = async () => {
    setOpenModalAsignacionDesdeDesasignacion(false);
    setDatosAsignacionDesdeDesasignacion(null);
    // Limpiar asignaciones temporales al cerrar modal
    setAsignacionesTemporales([]);
    // NO refrescar datos aquí porque las asignaciones son temporales
    // Solo se refrescarán cuando se guarde la desasignación
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

      // Filtrar solo los activos (excluir BAJA DEFINITIVA y RECUPERADO)
      const neumaticosActivos = asignados.filter((n: any) =>
        n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
      );

      // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
      const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
      neumaticosActivos.forEach((n: any) => {
        const pos = n.POSICION_NEU || n.POSICION;
        if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
          const existente = porPosicion.get(pos);
          if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
            porPosicion.set(pos, n);
          }
        }
      });

      // Normalizar campos para consistencia
      const movimientos = Array.from(porPosicion.values()).map((n: any) => ({
        ...n,
        CODIGO: n.CODIGO || n.CODIGO_NEU,
        CODIGO_NEU: n.CODIGO_NEU || n.CODIGO,
        POSICION_NEU: n.POSICION_NEU || n.POSICION,
        POSICION: n.POSICION || n.POSICION_NEU
      }));

      setNeumaticosAsignados(movimientos);

      // Calcular kilometraje
      const odometros = (movimientos as any[])
        .map((n: any) => Number(n.Odometro ?? n.ODOMETRO ?? n.KILOMETRO ?? n.KILOMETRAJE))
        .filter((v: number) => !isNaN(v) && v > 0);
      const ultimoKmReal = odometros.length > 0 ? Math.max(...odometros) : Number(vehiculoSeleccionado.KILOMETRO ?? vehiculoSeleccionado.KILOMETRAJE ?? 0);
      animateKilometraje(0, ultimoKmReal);

      const listaNeumaticos = await Neumaticos();

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
        // Filtrar solo los activos (excluir BAJA DEFINITIVA y RECUPERADO)
        const neumaticosActivos = asignados.filter((n: any) =>
          n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
        );

        // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
        const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
        neumaticosActivos.forEach((n: any) => {
          const pos = n.POSICION_NEU || n.POSICION;
          if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
            const existente = porPosicion.get(pos);
            if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
              porPosicion.set(pos, n);
            }
          }
        });

        // Normalizar campos para consistencia
        // IMPORTANTE: Preservar todos los campos, especialmente ESTADO y REMANENTE
        const neumaticosActuales = Array.from(porPosicion.values()).map((n: any) => ({
          ...n, // Preservar todos los campos originales
          CODIGO: n.CODIGO || n.CODIGO_NEU,
          CODIGO_NEU: n.CODIGO_NEU || n.CODIGO,
          POSICION_NEU: n.POSICION_NEU || n.POSICION,
          POSICION: n.POSICION || n.POSICION_NEU,
          ESTADO: n.ESTADO, // Preservar ESTADO (porcentaje de vida útil)
          REMANENTE: n.REMANENTE, // Preservar REMANENTE (profundidad en mm o porcentaje)
          REMANENTE_ORIGINAL: n.REMANENTE_ORIGINAL // Preservar REMANENTE_ORIGINAL del backend
        }));

        setNeumaticosAsignados(neumaticosActuales);
      })
      .catch((err) => {
        console.error("Error trayendo neumáticos asignados:", err);
        setNeumaticosAsignados([]);
      });
  }, [vehiculo]);

  useEffect(() => {
    obtenerCantidadAutosDisponibles()
      .then(setAutosDisponiblesCount)
      .catch(console.error);
  }, []);


  // 1. Función simple para refrescar asignados
  // La API ya devuelve los datos necesarios, solo necesitamos filtrar y agrupar por posición
  const refreshAsignados = async () => {

    if (vehiculo?.PLACA) {

      const movimientos = await obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA);
      setMovimientosHistoricos(Array.isArray(movimientos) ? movimientos : []);

      // Obtener neumáticos asignados desde la API
      const asignados = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);

      // Filtrar solo los activos (excluir BAJA DEFINITIVA y RECUPERADO)
      const neumaticosActivos = asignados.filter((n: any) =>
        n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
      );

      // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
      const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
      neumaticosActivos.forEach((n: any) => {
        const pos = n.POSICION_NEU || n.POSICION;
        if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
          const existente = porPosicion.get(pos);
          if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
            porPosicion.set(pos, n);
          }
        }
      });

      // Normalizar campos para consistencia
      const neumaticosFinales = Array.from(porPosicion.values()).map((n: any) => ({
        ...n,
        CODIGO: n.CODIGO || n.CODIGO_NEU,
        CODIGO_NEU: n.CODIGO_NEU || n.CODIGO,
        POSICION_NEU: n.POSICION_NEU || n.POSICION,
        POSICION: n.POSICION || n.POSICION_NEU,
        ESTADO: n.ESTADO,
        REMANENTE: n.REMANENTE,
        REMANENTE_ORIGINAL: n.REMANENTE_ORIGINAL,
        FECHA_ULTIMO_SUCESO: n.FECHA_ULTIMO_SUCESO // Ensure this is mapped
      }));

      // Log para debugging - ver qué valores de ESTADO están llegando
      // ... (keep logs if needed, or reduce verbosity)
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
        const vehiculoData = await buscarVehiculoPorPlaca(vehiculo.PLACA);
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
    return Number(vehiculo?.KILOMETRO ?? vehiculo?.KILOMETRAJE ?? 0);
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

  // --- Función para recibir asignaciones temporales ---
  const handleTemporaryAssign = (asignaciones: any[]) => {
    setAsignacionesTemporales(asignaciones);
    setOpenModalAsignacionDesdeDesasignacion(false);
  };
  // ------------------------------------------------

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
    // Si ya hay 5 neumáticos asignados (excluyendo solo baja definitiva), mostrar advertencia y no abrir modal
    const asignadosValidos = neumaticosAsignadosUnicos.filter(
      n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
    if (asignadosValidos.length === 5) {
      toast.warning('Ya hay 5 neumáticos asignados a este vehículo. Si desea reasignar, primero debe desasignar alguno.', {
        duration: 7000,
        position: 'top-center'
      })
      return;
    }
    await Promise.all([refreshAsignados(), refreshVehiculo()]);
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

        // Calcular diferencia de días
        const [fYear, fMonth, fDay] = (fechasVehiculo?.FECHA_REGISTRO ?? '').split('-').map(Number);
        const fechaObj = new Date(fYear, fMonth - 1, fDay); // local time, evita desfase de timezone
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);




        const diffDias = Math.floor((hoy.getTime() - fechaObj.getTime()) / (1000 * 60 * 60 * 24));

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

          if (fechaObj.getTime() !== hoy.getTime()) {
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

        let diasDiferencia = null;
        if (ultimaInspeccionFecha?.fecha_registro) {
          const d1 = new Date(ultimaInspeccionFecha?.fecha_registro);
          const d2 = new Date();
          d1.setHours(0, 0, 0, 0);
          d2.setHours(0, 0, 0, 0);
          diasDiferencia = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        }

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
        operationName={vehiculo?.OPERACION?.trim() || '—'}
        autosDisponiblesCount={autosDisponiblesCount}
        onVehiculoSeleccionado={handleVehiculoSeleccionado}
      />
      <Stack direction="row" spacing={2}>
        <Card sx={{
          flex: 0.8,
          p: 2,
          position: 'relative',
          maxHeight: '700px',
          overflow: 'auto'
        }}>
          {/* <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          </Stack> */}

          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'nowrap' }}>
            {vehiculo && (
              <div className='flex gap-2 flex-wrap items-center'>
                {/* Kilometraje */}
                <Box
                  sx={{
                    backgroundColor: '#e0f7fa',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 'bold',
                    color: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap',
                    marginRight: '8px',
                  }}
                >
                  {`${animatedKilometraje.toLocaleString()} km`}
                </Box>
                {/* Opciones */}
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
              </div>
            )}
          </Stack>
          <Box sx={{ mt: 2 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Marca</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Modelo</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Tipo</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Color</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Año</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiculo ? (
                    <TableRow>
                      <TableCell>{vehiculo.MARCA}</TableCell>
                      <TableCell>{vehiculo.MODELO}</TableCell>
                      <TableCell>{vehiculo.TIPO}</TableCell>
                      <TableCell>{vehiculo.COLOR}</TableCell>
                      <TableCell>{vehiculo.ANO}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {error || 'Ingrese una placa para buscar.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Button para ver inspecciones */}
          {/* {
            vehiculo && (
              <div className='flex justify-end'>
                <LoadingButton
                  variant="contained"
                  color='info'
                  onClick={() => setOpenVerInspecciones(true)}
                  sx={{
                    color: '#fff',
                    textTransform: 'none',
                    padding: '10px 16px',
                    fontWeight: 500,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: 'auto',
                    marginTop: '10px'
                  }}
                >
                  <Eye size={20} />
                </LoadingButton>
              </div>
            )
          } */}

          <Box sx={{ mt: 4, textAlign: 'left', position: 'relative', width: '262px', height: '365px' }}>
            <DiagramaVehiculo
              layout="dashboard"
              neumaticosAsignados={
                // neumaticosAsignadosUnicos
                // .filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0 && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA')
                // .map(n => ({
                //   ...n,
                //   POSICION: n.POSICION_NEU ?? '' // Garantiza que POSICION siempre sea string
                // }))
                neumaticosAsignados
              }
            />
          </Box>

        </Card>



        <Card sx={{
          flex: 1.3,
          p: 2,
          position: 'relative',
          maxHeight: '700px', // Ajusta este valor según lo que necesites
          overflow: 'auto'
        }}>


          <div className='flex'>
            <Typography sx={{ mb: 2 }} className='border border-amber-400 bg-amber-50 text-amber-600 inline p-2 mt-2 mb-2 rounded-lg'>
              Neumáticos instalados en esta unidad:
            </Typography>
          </div>

          <DataTableNeumaticos columns={columnsNeuAsignado} data={neumaticosAsignadosUnicos} />

          {/* Neúmaticos Disponibles */}
          <div className='flex'>
            <Typography sx={{ mt: 2 }} className='border border-green-400 bg-green-50 text-green-600 inline p-2 mt-2 mb-2 rounded-lg'>
              <span className='font-bold'>
                Disponibles:
              </span>
              <span className='font-normal'> &nbsp;
                {`${neumaticosDisponiblesUseQuery.length.toLocaleString()} Neumáticos`}
              </span>
            </Typography>
          </div>

          <DataTableNeumaticos columns={columnsNeuDisponible} data={neumaticosDisponiblesUseQuery} type='pagination' filters={true} />

        </Card>

      </Stack>
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
              proyecto: vehiculo.PROYECTO,
              operacion: vehiculo.OPERACION,
              id_operacion: vehiculo.ID_OPERACION,
              kilometro: vehiculo.KILOMETRO,
              cod_supervisor: vehiculo.ID_SUPERVISOR,
              tipo_terreno: vehiculo.TIPO_TERRENO,
              reten: vehiculo.RETEN
            } : undefined}
            kilometroRealActual={ultimoKilometroReal}
            onSeleccionarNeumatico={() => { }}
            onUpdateAsignados={refreshAsignados}
            onAbrirAsignacion={handleOpenModalConRefresh}
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
          proyecto: vehiculo.PROYECTO,
          operacion: vehiculo.OPERACION,
          id_operacion: vehiculo.ID_OPERACION,
          kilometro: vehiculo.KILOMETRO,
          cod_supervisor: vehiculo.ID_SUPERVISOR
        } : undefined}
        user={user || undefined}
        onAbrirInspeccion={handleAbrirInspeccionDesdeMantenimiento}
      />

      {/* Modal para DESASIGNAR */}
      {
        openMantenimientoModal && modoMantenimiento === 'DESASIGNAR' && (
          <ModalDesasignar
            open={openMantenimientoModal && modoMantenimiento === 'DESASIGNAR'}
            onClose={() => {
              // Limpiar asignaciones temporales al cerrar modal
              setAsignacionesTemporales([]);
              // Solo cerrar el modal, sin recargar datos
              setOpenMantenimientoModal(false);
              setModoMantenimiento(null);
            }}
            onSuccess={async () => {
              // Limpiar asignaciones temporales después de guardar exitosamente
              setAsignacionesTemporales([]);
              // Recargar datos solo cuando la acción se completa exitosamente
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
              proyecto: vehiculo.PROYECTO,
              operacion: vehiculo.OPERACION,
              kilometro: vehiculo.KILOMETRO,
              id_operacion: vehiculo.ID_OPERACION,
              cod_supervisor: vehiculo.ID_SUPERVISOR
            } : undefined}
            kilometraje={ultimoKilometroReal}
            user={user || undefined}
            onAbrirInspeccion={handleAbrirInspeccionDesdeMantenimiento}
            onAbrirAsignacion={handleAbrirAsignacionDesdeDesasignacion}
            asignacionesTemporalesExternas={asignacionesTemporales}
          />
        )
      }

      {/* Modal de Asignación desde Desasignación */}
      {datosAsignacionDesdeDesasignacion && (
        <ModalAsignacionNeuDesdeDesasignacion
          open={openModalAsignacionDesdeDesasignacion}
          onClose={handleCloseModalAsignacionDesdeDesasignacion}
          data={
            neumaticosDisponiblesUseQuery
              ?.map((neumatico: any) => ({
                ...neumatico,
                CODIGO: neumatico.CODIGO,
                DISEÑO: neumatico.DISEÑO ?? '',
                FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD ?? '',
                COD_SUPERVISOR: vehiculo?.ID_SUPERVISOR,
                ID_OPERACION: vehiculo?.ID_OPERACION
              }))
          }
          cachedNeumaticosAsignados={datosAsignacionDesdeDesasignacion.cachedNeumaticosAsignados}
          posicionesVacias={datosAsignacionDesdeDesasignacion.posicionesVacias}
          placa={vehiculo?.PLACA ?? ''}
          kilometro={ultimoKilometroReal}
          onTemporaryAssign={handleTemporaryAssign}
          onAssignedUpdate={async () => {
            await refreshAsignados();
            // Recargar movimientos históricos para actualizar el kilometraje
            if (vehiculo?.PLACA) {
              const movimientos = await obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA);
              setMovimientosHistoricos(Array.isArray(movimientos) ? movimientos : []);
            }
            setTimeout(async () => {
              await refreshVehiculo();
            }, 2500);
          }}
        />
      )}
    </Stack>
  );
}
