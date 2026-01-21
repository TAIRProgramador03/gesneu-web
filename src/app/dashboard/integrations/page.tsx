'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Neumaticos, obtenerNeumaticosAsignadosPorPlaca, buscarVehiculoPorPlaca, obtenerCantidadAutosDisponibles, obtenerUltimosMovimientosPorPlaca, obtenerUltimosMovimientosPorCodigo, getUltimaFechaInspeccionPorPlaca } from '@/api/Neumaticos';
import Alert from '@mui/material/Alert';
import ModalAdvertenciaReubicacion from '@/components/core/theme-provider/modal-reubicar/modal-advertencia-reubicacion';
import ModalAdvertenciaDesasignacion from '@/components/core/theme-provider/modal-desasignar/modal-advertencia-desasignar';
import ModalInspDesasignacionObligatoria from '@/components/core/theme-provider/modal-desasignar/modal-inspDesasignacion-obligatoria';
import ModalInspeccionObligatoria from '@/components/core/theme-provider/modal-reubicar/modal-inspeccion-obligatoria';
import ModalConfirmarInspeccion from '@/components/core/theme-provider/modal-reubicar/modal-confirmar-inspeccion';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { Wrench } from '@phosphor-icons/react/dist/ssr/Wrench';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import ModalAsignacionNeu from '@/components/dashboard/integrations/modal-asignacionNeu';
import ModalAsignacionNeuDesdeDesasignacion from '@/components/dashboard/integrations/modal-asignacionNeuDesdeDesasignacion';
import ModalDeleteNeu from '@/components/dashboard/integrations/modal-deleteNeu';
import ModalInpeccionNeu from '@/components/dashboard/integrations/modal-inspeccionNeu';
import ModalReubicar from '@/components/dashboard/integrations/modal-reubicar';
import ModalDesasignar from '@/components/dashboard/integrations/modal-desasignar';
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo';
import { Neumatico } from '@/types/types';
import { useUser } from '@/hooks/use-user';
import ModalConfirmarInspDesasignar from '@/components/core/theme-provider/modal-desasignar/modal-confirmar-inspDesasignar';
import { obtenerInfoDesgaste, calcularPorcentajeDesgaste } from '@/utils/tireUtils';

export default function Page(): React.JSX.Element {
  const [bloqueoReubicacion, setBloqueoReubicacion] = useState(false);
  const [openModalConfirmarInspeccion, setOpenModalConfirmarInspeccion] = useState(false);
  const [openModalInspDesasignacionObligatoria, setOpenModalInspDesasignacionObligatoria] = useState(false);
  const [openModalConfirmarInspDesasignar, setOpenModalConfirmarInspDesasignar] = useState(false);
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState('');
  const [diasDiferenciaInspeccion, setDiasDiferenciaInspeccion] = useState(0);
  const { user } = useUser();
  const [filterCol1, setFilterCol1] = React.useState('');
  const [filterCol2, setFilterCol2] = React.useState('');
  const [vehiculo, setVehiculo] = React.useState<Vehiculo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [animatedKilometraje, setAnimatedKilometraje] = useState(0);
  const [animatedTotalNeumaticos, setAnimatedTotalNeumaticos] = useState(0);
  const [openModalDesasignar, setOpenModalDesasignar] = useState(false);
  const [neumaticos, setNeumaticos] = React.useState<Neumatico[]>([]);
  const [neumaticosFiltrados, setNeumaticosFiltrados] = React.useState<Neumatico[]>([]);
  const [neumaticosAsignados, setNeumaticosAsignados] = React.useState<Neumatico[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  // Estados para los modales
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [openModal, setOpenModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);
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
  const [anchorMenuMantenimiento, setAnchorMenuMantenimiento] = React.useState<null | HTMLElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [assignedNeumaticos, setAssignedNeumaticos] = React.useState<{ [key: string]: Neumatico | null }>({});
  const [assignedFromAPI, setAssignedFromAPI] = useState<Neumatico[]>([]);
  const [autosDisponiblesCount, setAutosDisponiblesCount] = useState<number>(0);

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
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleFilterChangeCol1 = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilterCol1(value);
    if (value === 'opcionB') {
      handleOpenModalConRefresh(); // Usar el handler con validación
    }
  };

  const handleFilterChangeCol2 = (event: SelectChangeEvent<string>) => {
    setFilterCol2(event.target.value);
  };


  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const placa = event.target.value.trim();
    if (placa) {
      // Limpiar datos anteriores antes de buscar un nuevo vehículo
      setVehiculo(null);
      setNeumaticosAsignados([]);
      setNeumaticosFiltrados([]);
      setNeumaticos([]);

      setLoading(true); // Mostrar indicador de carga
      try {
        const vehiculoData = await buscarVehiculoPorPlaca(placa);
        if (!vehiculoData) {
          setSnackbarMessage('Vehículo no encontrado.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setVehiculo(null);
          setNeumaticosFiltrados([]);
          setNeumaticosAsignados([]);
          setLoading(false);
          return;
        }
        setVehiculo(vehiculoData);
        setSnackbarMessage('Vehículo encontrado exitosamente.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

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

        // Determinar si es vehículo de tránsito (proyecto diferente al del usuario)
        const esVehiculoTransito = user?.proyecto && vehiculoData.PROYECTO !== user.proyecto;

        // Filtrar neumáticos:
        // - Si es vehículo de tránsito: cargar DISPONIBLES del usuario (sin filtrar por proyecto del vehículo)
        // - Si es vehículo de la flota: filtrar por proyecto del vehículo
        const filtrados: Neumatico[] = listaNeumaticos
          .filter((neumatico: any) => {
            // Filtro de supervisor: neumáticos del usuario o globales sin supervisor
            const perteneceAlUsuario = !user?.usuario ||
              neumatico.USUARIO_SUPER?.trim() === user.usuario?.trim() ||
              (neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE' && !neumatico.USUARIO_SUPER);

            if (!perteneceAlUsuario) return false;

            // Si es vehículo de tránsito, solo mostrar DISPONIBLES (sin filtrar por proyecto)
            if (esVehiculoTransito) {
              return neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE';
            }

            // Si es vehículo de la flota, filtrar por proyecto
            return neumatico.PROYECTO === vehiculoData.PROYECTO;
          })
          .map((neumatico: Neumatico) => ({
            ...neumatico,
            CODIGO: neumatico.CODIGO_NEU || neumatico.CODIGO,
            DISEÑO: neumatico.DISEÑO || '',
            FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD || '',
          }));

        setNeumaticos(listaNeumaticos);
        setNeumaticosFiltrados(filtrados);
        animateTotalNeumaticos(0, filtrados.length);
      } catch (err) {
        console.error('Error al buscar el vehículo:', err);
        setVehiculo(null);
        setSnackbarMessage('Error al conectar con el servidor.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setNeumaticosFiltrados([]);
        setNeumaticosAsignados([]);
      } finally {
        setLoading(false); // Ocultar indicador de carga
      }
    } else {
      setVehiculo(null);
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
    }
  };

  const handleBusquedaNeumatico = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valor = event.target.value.toLowerCase();
    setBusqueda(valor);
    const filtrados = neumaticos.filter(
      (neumatico) =>
        (typeof neumatico.CODIGO === 'string' && neumatico.CODIGO.toLowerCase().includes(valor)) ||
        (typeof neumatico.MARCA === 'string' && neumatico.MARCA.toLowerCase().includes(valor))
    );

    setNeumaticosFiltrados(filtrados);
  };

  const animateKilometraje = (start: number, end: number) => {
    const duration = 1000;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentKilometraje = Math.floor(start + (end - start) * progress);
      setAnimatedKilometraje(currentKilometraje);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const animateTotalNeumaticos = (start: number, end: number) => {
    const duration = 1000;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentTotal = Math.floor(start + (end - start) * progress);
      setAnimatedTotalNeumaticos(currentTotal);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
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
          setSnackbarMessage('Este vehículo ya tiene todos sus neumáticos asignados. El modal de asignación solo es para vehículos nuevos sin neumáticos.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          return;
        }

        const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);

        // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
        const neumaticosPorPosicion = new Map<string, typeof data[0]>();
        data.forEach(n => {
          const pos = n.POSICION_NEU;
          if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
            const existente = neumaticosPorPosicion.get(pos);
            if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
              neumaticosPorPosicion.set(pos, n);
            }
          }
        });

        // Pasar los neumáticos agrupados (solo el más reciente por posición)
        setAssignedNeumaticos(Array.from(neumaticosPorPosicion.values()));
        setOpenModal(true);
      } else {
        console.error('No hay un vehículo seleccionado.');
      }
    } catch (error) {
      console.error('Error al obtener los neumáticos:', error);
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
    setLoading(true);

    try {
      // Usar directamente el vehículo seleccionado (ya viene completo del modal)
      setVehiculo(vehiculoSeleccionado);
      setSnackbarMessage('Vehículo de tránsito seleccionado.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

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

      // Cargar neumáticos disponibles
      const listaNeumaticos = await Neumaticos();

      // IMPORTANTE: Si viene de ModalTodasPlacas (tránsito), siempre mostrar DISPONIBLES del usuario
      // sin filtrar por proyecto del vehículo
      const esVehiculoTransito = true; // Siempre true porque viene del modal de tránsito

      // Filtrar neumáticos:
      // Para vehículos de tránsito: cargar SOLO DISPONIBLES del usuario (sin filtrar por proyecto)
      const filtrados: Neumatico[] = listaNeumaticos
        .filter((neumatico: any) => {
          // Filtro de supervisor: neumáticos del usuario o globales sin supervisor
          const perteneceAlUsuario = !user?.usuario ||
            neumatico.USUARIO_SUPER?.trim() === user.usuario?.trim() ||
            (neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE' && !neumatico.USUARIO_SUPER);

          if (!perteneceAlUsuario) return false;

          // Solo mostrar DISPONIBLES (sin filtrar por proyecto del vehículo)
          return neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE';
        })
        .map((neumatico: Neumatico) => ({
          ...neumatico,
          CODIGO: neumatico.CODIGO_NEU || neumatico.CODIGO,
          DISEÑO: neumatico.DISEÑO || '',
          FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD || '',
        }));

      setNeumaticos(listaNeumaticos);
      setNeumaticosFiltrados(filtrados);
      animateTotalNeumaticos(0, filtrados.length);
    } catch (err) {
      console.error('Error al cargar vehículo de tránsito:', err);
      setVehiculo(null);
      setSnackbarMessage('Error al cargar el vehículo.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
    } finally {
      setLoading(false);
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

        // Log para debugging - ver qué valores de ESTADO están llegando desde la API
        console.log(`\n[page.tsx] useEffect vehiculo - Neumáticos recibidos de API: ${asignados.length}`);
        console.log(`[page.tsx] Neumáticos activos después de filtrar: ${neumaticosActivos.length}`);
        console.log(`[page.tsx] Neumáticos finales después de agrupar: ${neumaticosActuales.length}`);
        neumaticosActuales.forEach((n, idx) => {
          console.log(`  [${idx}] CODIGO: ${n.CODIGO}, POSICION: ${n.POSICION || n.POSICION_NEU}`);
          console.log(`         ESTADO (desde backend): ${n.ESTADO} (tipo: ${typeof n.ESTADO})`);
          console.log(`         REMANENTE: ${n.REMANENTE}, REMANENTE_ORIGINAL: ${n.REMANENTE_ORIGINAL || 'NULL'}`);
          console.log(`         ---`);
        });

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 1. Función simple para refrescar asignados
  // La API ya devuelve los datos necesarios, solo necesitamos filtrar y agrupar por posición
  const refreshAsignados = async () => {
    if (vehiculo?.PLACA) {
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

  const unicosPorPosicion = React.useMemo(() => {
    const filtrados = neumaticosAsignados.filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0);
    const porPosicion = Object.values(
      filtrados.reduce((acc: Record<string, typeof neumaticosAsignados[0]>, curr) => {
        const pos = curr.POSICION_NEU as string;
        if (!acc[pos] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[pos].ID_MOVIMIENTO ?? 0))) {
          acc[pos] = curr;
        }
        return acc;
      }, {})
    );
    const porCodigo = Object.values(
      porPosicion.reduce((acc: Record<string, typeof porPosicion[0]>, curr) => {
        const cod = curr.CODIGO as string;
        if (!acc[cod] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[cod].ID_MOVIMIENTO ?? 0))) {
          acc[cod] = curr;
        }
        return acc;
      }, {})
    );
    return porCodigo;
  }, [neumaticosAsignados]);

  const unicosPorPosicionYCodigo = React.useMemo(() => {
    const filtrados = neumaticosAsignados.filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0);
    const porPosicion = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of filtrados) {
      const pos = n.POSICION_NEU as string;
      if (!porPosicion.has(pos) || ((n.ID_MOVIMIENTO ?? 0) > (porPosicion.get(pos)?.ID_MOVIMIENTO ?? 0))) {
        porPosicion.set(pos, n);
      }
    }
    const porCodigo = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of porPosicion.values()) {
      const cod = n.CODIGO as string;
      if (!porCodigo.has(cod) || ((n.ID_MOVIMIENTO ?? 0) > (porCodigo.get(cod)?.ID_MOVIMIENTO ?? 0))) {
        porCodigo.set(cod, n);
      }
    }
    return Array.from(porCodigo.values());
  }, [neumaticosAsignados]);

  // REFACTOR: Carga de fechas segura para evitar bucle infinito
  const [fechasRegistro, setFechasRegistro] = useState<{ [codigo: string]: string }>({});

  useEffect(() => {
    // Escuchar cambios en neumaticosAsignados y cargar fechas faltantes
    const cargarFechas = async () => {
      const codigosPendientes = neumaticosAsignados
        .map(n => n.CODIGO as string)
        .filter(cod => cod && !fechasRegistro[cod]); // Solo los que no tienen fecha en cache

      if (codigosPendientes.length === 0) return;

      console.log('[page.tsx] Cargando fechas para:', codigosPendientes.length, 'neumáticos');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neumaticosAsignados]); // Dependencia clave: solo cuando cambia la lista

  const getUltimaFechaRegistro = (neumatico: string | any) => {
    // Si viene el objeto completo y tiene FECHA_ULTIMO_SUCESO explícita
    if (typeof neumatico === 'object' && neumatico.FECHA_ULTIMO_SUCESO) {
      return new Date(neumatico.FECHA_ULTIMO_SUCESO).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    // Fallback por compatibilidad: si viene solo el código
    const codigo = typeof neumatico === 'string' ? neumatico : neumatico.CODIGO;
    return fechasRegistro[codigo] || '—';
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    console.log('[page.tsx] Asignaciones temporales recibidas:', asignaciones);
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
  const [showAsignadosWarning, setShowAsignadosWarning] = useState(false);

  const handleOpenModalConRefresh = async () => {
    // Si ya hay 5 neumáticos asignados (excluyendo solo baja definitiva), mostrar advertencia y no abrir modal
    const asignadosValidos = neumaticosAsignadosUnicos.filter(
      n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
    if (asignadosValidos.length === 5) {
      setShowAsignadosWarning(true);
      return;
    }
    await Promise.all([refreshAsignados(), refreshVehiculo()]);
    // Espera un ciclo de event loop para asegurar que los estados estén actualizados
    setTimeout(() => {
      handleOpenModal();
    }, 0);
  };

  // Handler para abrir el menú al hacer click en la imagen
  const handleMenuMantenimientoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorMenuMantenimiento(event.currentTarget);
  };
  const handleMenuMantenimientoClose = () => {
    setAnchorMenuMantenimiento(null);
  };

  const [mensajeBloqueo, setMensajeBloqueo] = useState<string | undefined>(undefined);
  // Acciones de cada opción
  // Estado para mostrar advertencia de reubicación
  const [showReubicacionWarning, setShowReubicacionWarning] = useState(false);
  // Modal de advertencia para reubicación
  const [openModalAdvertenciaReubicacion, setOpenModalAdvertenciaReubicacion] = useState(false);
  // Modal de inspección obligatoria
  const [openModalInspeccionObligatoria, setOpenModalInspeccionObligatoria] = useState(false);

  const handleReubicacion = () => {
    // Cerrar el menú antes de abrir cualquier modal
    setAnchorMenuMantenimiento(null);

    // Quitar foco manualmente para evitar problemas de accesibilidad
    if (document && document.activeElement) {
      try {
        (document.activeElement as HTMLElement).blur();
      } catch (e) { }
    }

    setTimeout(() => {
      console.log('[DEBUG] neumaticosAsignados RAW:', neumaticosAsignados);

      const asignadosValidos = neumaticosAsignados.filter(
        n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
      );
      console.log('[DEBUG] asignadosValidos:', asignadosValidos);

      // Si no hay neumáticos válidos
      if (asignadosValidos.length === 0) {
        setBloqueoReubicacion(false);
        setMensajeBloqueo(undefined);
        setOpenModalAdvertenciaReubicacion(true);
        return;
      }

      // Buscar inspecciones
      console.log('[Reubicacion] neumaticosAsignados:', neumaticosAsignados);
      const inspecciones = neumaticosAsignados.filter((n: any) => n.TIPO_MOVIMIENTO === 'INSPECCION');
      console.log('[Reubicacion] inspecciones:', inspecciones);

      let bloqueo = false;
      let ultimaFechaInspeccion = '';

      if (inspecciones.length > 0) {
        // Tomar FECHA_REGISTRO más reciente
        ultimaFechaInspeccion = inspecciones.reduce<string>((max, curr) => {
          const fecha = curr.FECHA_REGISTRO || curr.FECHA_MOVIMIENTO || curr.FECHA_INSPECCION;
          if (!fecha) return max;
          if (!max) return fecha;
          return new Date(fecha) > new Date(max) ? fecha : max;
        }, '');
        console.log('[Reubicacion] ultimaFechaInspeccion:', ultimaFechaInspeccion);

        // Validar si hubo reubicación el mismo día
        const reubicados = neumaticosAsignados.filter(
          (n: any) =>
            n.TIPO_MOVIMIENTO === 'REUBICADO' &&
            (n.FECHA_MOVIMIENTO === ultimaFechaInspeccion || n.FECHA_REGISTRO === ultimaFechaInspeccion)
        );
        console.log('[Reubicacion] reubicados:', reubicados);

        bloqueo = reubicados.length > 0;
      }

      if (bloqueo) {
        setMensajeBloqueo(
          `Ya realizaste una reubicación con fecha ${ultimaFechaInspeccion}. Debes realizar una nueva inspección para poder reubicar nuevamente.`
        );
        setBloqueoReubicacion(true);
        setOpenModalAdvertenciaReubicacion(true);
        return;
      }

      if (inspecciones.length === 0) {
        console.log('[Reubicacion] Abriendo modal inspeccion obligatoria');
        setOpenModalInspeccionObligatoria(true);
        return;
      }

      // Calcular diferencia de días
      const fechaObj = ultimaFechaInspeccion ? new Date(ultimaFechaInspeccion) : new Date();
      const hoy = new Date();
      const diffDias = Math.floor((hoy.getTime() - fechaObj.getTime()) / (1000 * 60 * 60 * 24));
      setFechaUltimaInspeccion(ultimaFechaInspeccion);
      setDiasDiferenciaInspeccion(diffDias);

      console.log('[Reubicacion] Abriendo modal confirmar inspeccion', {
        ultimaFechaInspeccion,
        diffDias,
      });
      setOpenModalConfirmarInspeccion(true);
    }, 200);
  };

  // Función para REUBICAR - Ejecuta TODAS las validaciones ANTES de abrir modal
  const handleAbrirMantenimientoReubicar = async () => {
    setAnchorMenuMantenimiento(null);

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
        console.log('[Reubicacion] Consultando última inspección para placa:', vehiculo.PLACA);
        const ultimaFechaInspeccion = await getUltimaFechaInspeccionPorPlaca(vehiculo.PLACA);
        console.log('[Reubicacion] ultimaFechaInspeccion API:', ultimaFechaInspeccion);

        if (!ultimaFechaInspeccion) {
          console.log('[Reubicacion] No hay inspección previa, abriendo modal inspeccion obligatoria');
          setOpenModalInspeccionObligatoria(true);
          return;
        }

        // Calcular diferencia de días
        const fechaObj = new Date(ultimaFechaInspeccion);
        const hoy = new Date();
        // Reset hours for accurate day calc
        fechaObj.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);

        const diffDias = Math.floor((hoy.getTime() - fechaObj.getTime()) / (1000 * 60 * 60 * 24));
        setFechaUltimaInspeccion(ultimaFechaInspeccion);
        setDiasDiferenciaInspeccion(diffDias);

        // Validar si es > 4 días
        if (diffDias > 4) {
          console.log('[Reubicacion] Inspección antigua (>4 días), abriendo modal inspeccion obligatoria');
          // Si quieres mostrar mensaje específico de >4 días de antigüedad,
          // el modal obligatorio suele ser "No existe", pero aquí aplica igual.
          // O usar el de advertencia:
          setOpenModalInspeccionObligatoria(true);
          return;
        }

        // SI PASA TODAS LAS VALIDACIONES, ABRIR MODAL DIRECTAMENTE
        console.log('[Reubicacion] Validaciones pasadas, abriendo modal de mantenimiento');
        setModoMantenimiento('REUBICAR');
        setOpenMantenimientoModal(true);
      } catch (error) {
        console.error('Error verificando inspección:', error);
        setSnackbarMessage('Error verificando inspección.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleDesasignar = async () => {
    setAnchorMenuMantenimiento(null);

    const asignadosValidos = neumaticosAsignados.filter(
      n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA'
    );

    // Si no hay neumáticos, abre el modal de advertencia para asignar.
    if (asignadosValidos.length === 0) {
      setOpenModalDesasignar(true);
      return;
    }

    // Busca la última inspección
    const ultimaInspeccion = asignadosValidos.find(n => n.TIPO_MOVIMIENTO === 'INSPECCION');
    const ultimaInspeccionFecha = ultimaInspeccion?.FECHA_MOVIMIENTO;
    const diasDiferencia = ultimaInspeccionFecha ? Math.floor((new Date().getTime() - new Date(ultimaInspeccionFecha).getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (ultimaInspeccionFecha && diasDiferencia !== null) {
      // Si hay una inspección, abre el modal de confirmación
      setFechaUltimaInspeccion(ultimaInspeccionFecha); // Asume que tienes este estado
      setDiasDiferenciaInspeccion(diasDiferencia); // Asume que tienes este estado
      setOpenModalConfirmarInspDesasignar(true);
      return;
    } else {
      // Si no hay inspección, abre el modal de inspección obligatoria.
      setOpenModalInspDesasignacionObligatoria(true);
      return;
    }

    // Si todo está bien, abre el modal de desasignación
    handleOpenModalDesasignar();
  };

  // Función para DESASIGNAR - Ejecuta TODAS las validaciones ANTES de abrir modal
  const handleAbrirMantenimientoDesasignar = async () => {
    setAnchorMenuMantenimiento(null);

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
        if (ultimaInspeccionFecha) {
          const d1 = new Date(ultimaInspeccionFecha);
          const d2 = new Date();
          d1.setHours(0, 0, 0, 0);
          d2.setHours(0, 0, 0, 0);
          diasDiferencia = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (ultimaInspeccionFecha && diasDiferencia !== null) {
          // IMPORTANTE: Mantener la restricción original - abrir modal de confirmación primero
          setFechaUltimaInspeccion(ultimaInspeccionFecha);
          setDiasDiferenciaInspeccion(diasDiferencia);
          setOpenModalConfirmarInspDesasignar(true); // RESTRICCIÓN ORIGINAL MANTENIDA
          return;
        } else {
          // Si no hay inspección, abre el modal de inspección obligatoria.
          setOpenModalInspDesasignacionObligatoria(true);
          return;
        }
      } catch (error) {
        console.error('Error verificando inspección para desasignar:', error);
        setSnackbarMessage('Error verificando inspección.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  return (
    <Stack spacing={3}>
      {/* <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Asignación de Neumáticos</Typography>
        </Stack>
      </Stack> */}
      <CompaniesFilters
        onSearchChange={handleSearchChange}
        projectName={vehiculo?.PROYECTO || '—'}
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'nowrap' }}>
            {vehiculo && (
              <>
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
                {/* Botón Asignar Neumático */}
                <Button
                  variant="outlined"
                  startIcon={<Plus size={20} />}
                  onClick={handleOpenModalConRefresh}
                  disabled={false} // Siempre habilitado
                  sx={{
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'text.primary',
                    textTransform: 'none',
                    padding: '10px 16px',
                    fontWeight: 500,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: 'auto',
                    '&:hover': { // Restore hover style for enabled state
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  Asignar Neumático
                </Button>
                {/* Botón Inspección */}
                <Button
                  variant="outlined"
                  startIcon={<ClipboardText size={20} />}
                  onClick={async () => {
                    await refreshAsignados();
                    setOpenInspeccionModal(true);
                  }}
                  disabled={neumaticosAsignadosUnicos.length === 0} // Solo habilitado si hay neumáticos
                  sx={{
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'text.primary',
                    textTransform: 'none',
                    padding: '10px 16px',
                    fontWeight: 500,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: 'auto',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  Inspección
                </Button>
                {/* Botón Mantenimiento */}
                <Button
                  variant="outlined"
                  startIcon={<Wrench size={20} />}
                  onClick={handleMenuMantenimientoClick}
                  disabled={neumaticosAsignadosUnicos.length === 0} // Solo habilitado si hay neumáticos
                  sx={{
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'text.primary',
                    textTransform: 'none',
                    padding: '10px 16px',
                    fontWeight: 500,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: 'auto',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  Mantenimiento
                </Button>
              </>
            )}
          </Stack>
          {/* Menú desplegable para mantenimiento */}
          <Menu
            anchorEl={anchorMenuMantenimiento}
            open={Boolean(anchorMenuMantenimiento)}
            onClose={handleMenuMantenimientoClose}
          >
            <MenuItem onClick={handleAbrirMantenimientoReubicar}>REUBICAR</MenuItem>
            <MenuItem onClick={handleAbrirMantenimientoDesasignar}>DESASIGNAR</MenuItem>
          </Menu>
          <Box sx={{ mt: 6 }}>
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
          <Box sx={{ mt: 4, textAlign: 'left', position: 'relative', width: '262px', height: '365px' }}>
            <DiagramaVehiculo
              layout="dashboard"
              neumaticosAsignados={neumaticosAsignadosUnicos
                .filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0 && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA')
                .map(n => ({
                  ...n,
                  POSICION: n.POSICION_NEU ?? '' // Garantiza que POSICION siempre sea string
                }))
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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Neumáticos instalados en esta unidad :
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Posición</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Codi Neu</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Marca</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Medida</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Remanente</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Fecha Ultimo Registro</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Fecha Movimiento</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neumaticosAsignadosUnicos.filter((n: any) => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA').length > 0 ? (
                  neumaticosAsignadosUnicos
                    .filter((n: any) => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA')
                    .sort((a: any, b: any) => {
                      // Si alguno es RES01, lo ponemos al final
                      const isResA = (a.POSICION_NEU || '').toUpperCase() === 'RES01';
                      const isResB = (b.POSICION_NEU || '').toUpperCase() === 'RES01';
                      if (isResA && !isResB) return 1;
                      if (!isResA && isResB) return -1;
                      // Si ambos son RES01 o ninguno, ordenar por número
                      const posA = (a.POSICION_NEU || '').replace(/[^\d]/g, '');
                      const posB = (b.POSICION_NEU || '').replace(/[^\d]/g, '');
                      return Number(posA) - Number(posB);
                    })
                    .map((neumatico: any, index: number) => (
                      <TableRow key={neumatico.ID_MOVIMIENTO || `${neumatico.CODIGO}-${neumatico.POSICION_NEU}`}>
                        <TableCell align="center">{neumatico.POSICION_NEU}</TableCell>
                        <TableCell align="center">{neumatico.CODIGO}</TableCell>
                        <TableCell align="center">{neumatico.MARCA}</TableCell>
                        <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                        <TableCell align="center">{neumatico.REMANENTE ?? 0}</TableCell>
                        <TableCell align='center'>{getUltimaFechaRegistro(neumatico)}</TableCell>
                        <TableCell align="center">{
                          neumatico.FECHA_MOVIMIENTO
                            ? new Date(neumatico.FECHA_MOVIMIENTO).toLocaleString('es-PE', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                            : ''
                        }</TableCell>
                        <TableCell align="center">
                          {typeof neumatico.ESTADO === 'number' || (typeof neumatico.ESTADO === 'string' && neumatico.ESTADO !== '') ? (
                            <Box sx={{ position: 'relative', width: '120px' }}>
                              <LinearProgress
                                variant="determinate"
                                value={typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO}
                                sx={{
                                  height: 20,
                                  borderRadius: 5,
                                  backgroundColor: '#eee',
                                  boxShadow: '0 0 0 1.5px #222',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor:
                                      (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 39
                                        ? '#d32f2f'
                                        : (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 79
                                          ? '#FFEB3B'
                                          : '#2e7d32',
                                    borderRadius: 5,
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#000',
                                  fontWeight: 'bold',
                                  fontSize: 13,
                                  letterSpacing: 0.5,
                                  textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                                }}
                              >
                                {typeof neumatico.ESTADO === 'string' ? neumatico.ESTADO.replace('%', '') : neumatico.ESTADO}%
                              </Typography>
                            </Box>
                          ) : ''}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay neumáticos asignados para esta placa.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6"> </Typography>
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
                }}
              >
                {`Disponibles: ${neumaticosFiltrados.filter(n => n.TIPO_MOVIMIENTO === 'DISPONIBLE').length.toLocaleString()} Neumáticos`}
              </Box>
            </Stack>
            <OutlinedInput
              fullWidth
              placeholder="Buscar neumáticos"
              value={busqueda}
              onChange={handleBusquedaNeumatico}
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyingGlass fontSize="var(--icon-fontSize-md)" />
                </InputAdornment>
              }
              sx={{ maxWidth: '250px' }}
              disabled={!vehiculo}
            />
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Código</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Marca</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Diseño</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Remanente</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Medida</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Fecha</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold', fontSize: '0.78rem' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neumaticosFiltrados
                  .filter(n => n.TIPO_MOVIMIENTO === 'DISPONIBLE')
                  .slice(page * 5, page * 5 + 5)
                  .map((neumatico) => (
                    <TableRow key={neumatico.CODIGO}>
                      <TableCell align="center">{neumatico.CODIGO}</TableCell>
                      <TableCell align="center">{neumatico.MARCA}</TableCell>
                      <TableCell align="center">{neumatico.DISEÑO}</TableCell>
                      <TableCell align="center">{neumatico.REMANENTE}</TableCell>
                      <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                      <TableCell align="center">{neumatico.FECHA_FABRICACION_COD}</TableCell>
                      <TableCell align="center">
                        {typeof neumatico.ESTADO === 'number' || (typeof neumatico.ESTADO === 'string' && neumatico.ESTADO !== '') ? (
                          <Box sx={{ position: 'relative', width: '180px' }}>
                            <LinearProgress
                              variant="determinate"
                              value={typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO}
                              sx={{
                                height: 16,
                                borderRadius: 5,
                                backgroundColor: '#eee',
                                boxShadow: '0 0 0 1.5px #222',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 39
                                      ? '#d32f2f'
                                      : (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 79
                                        ? '#FFEB3B'
                                        : '#2e7d32',
                                  borderRadius: 5,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000', // negro puro
                                fontWeight: 'bold',
                                fontSize: 13,
                                letterSpacing: 0.5,
                                textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                              }}
                            >
                              {typeof neumatico.ESTADO === 'string' ? neumatico.ESTADO.replace('%', '') : neumatico.ESTADO}%
                            </Typography>
                          </Box>
                        ) : ''}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[]}
            component="div"
            count={neumaticosFiltrados.length}
            rowsPerPage={5}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={undefined}
          />
        </Card>
      </Stack>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
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
      //onDesasignarNeumatico={handleDesasignarConfirmado}
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
      {/* Snackbar para advertencia de 4 neumáticos asignados  */}
      <Snackbar
        open={showAsignadosWarning}
        autoHideDuration={4000}
        onClose={() => setShowAsignadosWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowAsignadosWarning(false)} severity="info" sx={{ width: '100%' }}>
          Ya hay 5 neumáticos asignados a este vehículo. Si desea reasignar, primero debe desasignar alguno.
        </Alert>
      </Snackbar>
      {/* ...existing code... */}
      <ModalAsignacionNeu
        open={openModal}
        onClose={handleCloseModal}
        data={neumaticosFiltrados.map((neumatico) => ({
          ...neumatico,
          CODIGO: neumatico.CODIGO,
          DISEÑO: neumatico.DISEÑO ?? '',
          FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD ?? '',
        }))}
        assignedNeumaticos={(() => {
          // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO) por posición
          const neumaticosPorPosicion = new Map<string, typeof neumaticosAsignados[0]>();
          neumaticosAsignados.forEach(n => {
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
          setTimeout(async () => {
            await refreshVehiculo();
          }, 2500);
        }}
      />
      {/* Modal de Inspección de Neumáticos - Integrado con modal de advertencia centralizado */}
      <ModalInpeccionNeu
        open={openInspeccionModal}
        onClose={() => {
          // Solo cerrar el modal, sin recargar datos
          setOpenInspeccionModal(false);
        }}
        onUpdateAsignados={async () => {
          // Recargar datos solo cuando la inspección se completa exitosamente
          if (vehiculo?.PLACA) {
            await Promise.all([refreshAsignados(), refreshVehiculo()]);
            // Recargar también los neumáticos asignados
            const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);
            const neumaticosActivos = data.filter((n: any) =>
              n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
            );
            const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
            neumaticosActivos.forEach((n: any) => {
              const pos = n.POSICION_NEU;
              if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
                const existente = porPosicion.get(pos);
                if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                  porPosicion.set(pos, n);
                }
              }
            });
            setNeumaticosAsignados(Array.from(porPosicion.values()));
          }
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
          }))}
        vehiculo={vehiculo ? {
          placa: vehiculo.PLACA,
          marca: vehiculo.MARCA,
          modelo: vehiculo.MODELO,
          anio: String(vehiculo.ANO),
          color: vehiculo.COLOR,
          proyecto: vehiculo.PROYECTO,
          operacion: vehiculo.OPERACION,
          kilometro: vehiculo.KILOMETRO
        } : undefined}
        onSeleccionarNeumatico={() => { }}
        onUpdateAsignados={refreshAsignados}
        onAbrirAsignacion={handleOpenModalConRefresh}
      />
      {/* Modal para REUBICAR */}
      <ModalReubicar
        open={openMantenimientoModal && modoMantenimiento === 'REUBICAR'}
        onClose={() => {
          // Solo cerrar el modal, sin recargar datos
          setOpenMantenimientoModal(false);
          setModoMantenimiento(null);
        }}
        onSuccess={async () => {
          // Recargar datos solo cuando la acción se completa exitosamente
          if (vehiculo?.PLACA) {
            await Promise.all([refreshAsignados(), refreshVehiculo()]);
            // Recargar también los neumáticos asignados
            const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);
            const neumaticosActivos = data.filter((n: any) =>
              n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
            );
            const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
            neumaticosActivos.forEach((n: any) => {
              const pos = n.POSICION_NEU;
              if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
                const existente = porPosicion.get(pos);
                if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                  porPosicion.set(pos, n);
                }
              }
            });
            setNeumaticosAsignados(Array.from(porPosicion.values()));
          }
        }}
        placa={vehiculo?.PLACA ?? ''}
        neumaticosAsignados={neumaticosAsignados.map(n => ({
          ...n,
          POSICION: n.POSICION_NEU ?? n.POSICION ?? '',
          POSICION_NEU: n.POSICION_NEU ?? n.POSICION ?? '',
          REMANENTE: n.REMANENTE,
          PRESION_AIRE: n.PRESION_AIRE,
          TORQUE_APLICADO: n.TORQUE_APLICADO,
          ESTADO: n.ESTADO,
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
        } : undefined}
        user={user || undefined}
        onAbrirInspeccion={handleAbrirInspeccionDesdeMantenimiento}
      />

      {/* Modal para DESASIGNAR */}
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
            // Recargar también los neumáticos asignados
            const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);
            const neumaticosActivos = data.filter((n: any) =>
              n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
            );
            const porPosicion = new Map<string, typeof neumaticosActivos[0]>();
            neumaticosActivos.forEach((n: any) => {
              const pos = n.POSICION_NEU;
              if (pos && ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].includes(pos)) {
                const existente = porPosicion.get(pos);
                if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                  porPosicion.set(pos, n);
                }
              }
            });
            setNeumaticosAsignados(Array.from(porPosicion.values()));
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
        } : undefined}
        user={user || undefined}
        onAbrirInspeccion={handleAbrirInspeccionDesdeMantenimiento}
        onAbrirAsignacion={handleAbrirAsignacionDesdeDesasignacion}
        asignacionesTemporalesExternas={asignacionesTemporales}
      />

      {/* Modal de Asignación desde Desasignación */}
      {datosAsignacionDesdeDesasignacion && (
        <ModalAsignacionNeuDesdeDesasignacion
          open={openModalAsignacionDesdeDesasignacion}
          onClose={handleCloseModalAsignacionDesdeDesasignacion}
          data={neumaticosFiltrados.map((neumatico) => ({
            ...neumatico,
            CODIGO: neumatico.CODIGO,
            DISEÑO: neumatico.DISEÑO ?? '',
            FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD ?? '',
          }))}
          cachedNeumaticosAsignados={datosAsignacionDesdeDesasignacion.cachedNeumaticosAsignados}
          posicionesVacias={datosAsignacionDesdeDesasignacion.posicionesVacias}
          placa={vehiculo?.PLACA ?? ''}
          kilometro={ultimoKilometroReal}
          onTemporaryAssign={handleTemporaryAssign}
          onAssignedUpdate={async () => {
            await refreshAsignados();
            setTimeout(async () => {
              await refreshVehiculo();
            }, 2500);
          }}
        />
      )}
    </Stack>
  );
}
