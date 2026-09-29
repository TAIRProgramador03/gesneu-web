import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { useState, useContext, useEffect } from 'react';
import ModalInspeccionAver from '../../core/modal-inspeccion-aver';
import { consultarInspeccionHoy, listarNeumaticosAsignados, guardarInspeccion, Neumaticos, obtenerUltimosMovimientosPorCodigo, getUltimaFechaInspeccionPorPlaca, obtenerUltimosMovimientosPorPosicion, getFechasInspeccionVehicularPorPlaca } from '../../../api/Neumaticos';
import { UserContext } from '../../../contexts/user-context';
import ModalAsignacionNeu from './modal-asignacion-neu';
import { toast } from 'sonner';
import { cn, convertToDateHuman } from '@/lib/utils';
import { ArrowLeft, BadgeAlert, Car, CircleCheckBig, ClipboardList, ListChecks, X } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { Chip, DialogTitle, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { Textarea } from '@/components/ui/textarea';
import { ModalInformacionInspeccion } from './modal-informacion-inspeccion';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { obtenerConfiguracionNeumaticos, obtenerRangosMedicion } from '@/utils/configuraciones-neumaticos';

// --- Declaraciones de tipos fuera del componente ---
interface FormValues {
  kilometro: string;
  marca: string;
  modelo: string;
  codigo: string;
  posicion: string;
  medida: string;
  diseño: string;
  remanente: string | number;
  tipo_movimiento: string;
  estado: string;
  observacion: string;
  presion_aire: string;
  torque: number;
  fecha_inspeccion: string;
}

interface Neumatico {
  POSICION: string;
  CODIGO: string;
  FECHA_MOVIMIENTO?: string;
  TIPO_MOVIMIENTO?: string;
  FECHA_ASIGNACION?: string;
  FECHA_REGISTRO?: string;

}

interface Movimiento {
  TIPO_MOVIMIENTO: string;
  FECHA_REGISTRO: string;
  CODIGO: string;
  ID_MOVIMIENTO?: number;
  KILOMETRO?: number;
  POSICION_NEU?: string;
  REMANENTE?: number;
  PRESION_AIRE?: number;
  TORQUE_APLICADO?: number;
}

interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color?: string;
  proyecto?: string;
  operacion?: string;
  kilometro?: number;
  presion_aire?: number;
  torque?: number;
  cod_supervisor?: string,
  id_operacion?: number,
  tipo_terreno: string
  reten: string
  cantidad_neumaticos?: number
}

interface ModalInpeccionNeuProps {
  open: boolean;
  onClose: () => void;
  placa: string;
  neumaticosAsignados: Neumatico[];
  vehiculo?: Vehiculo;
  onSeleccionarNeumatico?: (neumatico: any) => void; // NUEVO
  onUpdateAsignados?: () => void; // NUEVO: callback para refrescar asignados
  onAbrirAsignacion?: () => void; // <-- AGREGADO para permitir la prop desde page.tsx
  kilometroRealActual: number
  enTransito: boolean,
  taller?: string;
}

/** Par etiqueta/valor de solo lectura — resumen del vehículo y datos de referencia de la posición. */
const CampoVehiculo: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 leading-tight">{label}</p>
    <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = React.memo(({ open, onClose, placa, neumaticosAsignados, vehiculo, onSeleccionarNeumatico, onUpdateAsignados, onAbrirAsignacion, kilometroRealActual, enTransito, taller }) => {
  // Mostrar el array de neumáticos asignados cada vez que se abre el modal

  const { user } = useContext(UserContext) || {};
  // En pantallas chicas el modal va a pantalla completa y el paso 1 invierte el orden:
  // primero el diagrama (para elegir la rueda) y debajo el formulario de esa posición.
  const theme = useTheme();
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('lg'));

  // Posiciones que corresponden al vehículo según su cantidad de neumáticos (moto 2,
  // auto 5, camión 7). Sin este dato se asume la configuración de auto/camioneta.
  const configuracionVehiculo = React.useMemo(
    () => obtenerConfiguracionNeumaticos(vehiculo?.cantidad_neumaticos) ?? obtenerConfiguracionNeumaticos(5),
    [vehiculo?.cantidad_neumaticos]
  );
  const posicionesVehiculo = React.useMemo(
    () => configuracionVehiculo?.posiciones ?? [],
    [configuracionVehiculo]
  );
  const totalPosiciones = posicionesVehiculo.length;
  // Rangos de medición del mismo catálogo: la moto admite menos torque y menos remanente.
  const rangos = React.useMemo(
    () => obtenerRangosMedicion(vehiculo?.cantidad_neumaticos),
    [vehiculo?.cantidad_neumaticos]
  );
  const [openDialog, setOpenDialog] = useState(false)
  // Pestaña activa del modal: 0 = inspeccionar neumáticos, 1 = fecha y kilometraje (paso final)
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const [neumaticoSeleccionado, setNeumaticoSeleccionado] = useState<any | null>(null);
  const [formValues, setFormValues] = React.useState<FormValues>({
    kilometro: '',
    marca: '',
    modelo: '',
    codigo: '',
    posicion: '',
    medida: '',
    diseño: '',
    remanente: '',
    tipo_movimiento: '',
    estado: '',
    observacion: '',
    presion_aire: '',
    torque: 0,
    fecha_inspeccion: '', // <-- Agregado para evitar el error
  });
  const [openAsignacion, setOpenAsignacion] = React.useState(false);
  // Estado para la lista de neumáticos asignados (siempre actualizada)
  const [neuAsignados, setNeuAsignados] = React.useState<any[]>([]);
  const [kmError, setKmError] = React.useState(false);
  const [Odometro, setOdometro] = React.useState(0);
  const [remanenteError, setRemanenteError] = React.useState(false);
  const [presionError, setPresionError] = React.useState(false); // Validación de presión
  const [torqueError, setTorqueError] = React.useState(false); // Validación de torque
  const [remanenteAsignacion, setRemanenteAsignacion] = useState<number | null>(null);
  const [remanenteUltimoMovimiento, setRemanenteUltimoMovimiento] = useState<number | null>(null);
  const [remanenteAsignacionReal, setRemanenteAsignacionReal] = useState<number | null>(null);

  const initialOdometro = kilometroRealActual ?? 0

  // Estado local para inspecciones pendientes
  const [inspeccionesPendientes, setInspeccionesPendientes] = useState<any[]>([]);
  // Estado para el formulario inicial (para comparar cambios)
  const [formValuesInicial, setFormValuesInicial] = React.useState<FormValues | null>(null);

  // Estado para todos los po_neumaticos (debe estar definido)
  const [poNeumaticos, setPoNeumaticos] = useState<any[]>([]);

  // Estado para mostrar modal de inspección ya realizada
  const [bloquearFormulario, setBloquearFormulario] = useState(false);
  const [alertaInspeccionHoy, setAlertaInspeccionHoy] = useState(false);

  // Estado para controlar si ya se inspeccionó hoy
  const [inspeccionHoyRealizada, setInspeccionHoyRealizada] = useState(false);

  // Estado para advertencia de cantidad de neumáticos
  const [advertenciaPosiciones, setAdvertenciaPosiciones] = useState<{ open: boolean; faltan: number }>({ open: false, faltan: 0 });
  const [cantidadPosicionesValidas, setCantidadPosicionesValidas] = useState(0);

  // Si la placa NO tiene inspecciones previas => es la primera inspección.
  // Solo en la primera inspección el RES01 es editable; luego se bloquea (flujo normal).
  const [esPrimeraInspeccion, setEsPrimeraInspeccion] = useState(false);

  // Estado para la fecha mínima de inspección (no puede ser menor a la última registrada)
  const [fechaMinimaInspeccion, setFechaMinimaInspeccion] = useState<string | null>(null);
  const [fechaInspeccionError, setFechaInspeccionError] = useState<string | null>(null);
  const [ultimaFechaInspeccion, setUltimaFechaInspeccion] = useState<string | null>(null); // NUEVO

  // Estado para la fecha de asignación original (mínimo de inspección)
  const [fechaAsignacionOriginal, setFechaAsignacionOriginal] = useState<string | null>(null);

  // Convierte un Date (seleccionado en el DatePicker) a 'yyyy-mm-dd' en horario local
  const dateToISOLocal = (date: Date): string => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
  };

  // Obtener la fecha de hoy en formato yyyy-mm-dd
  const hoy = React.useMemo(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
    return localISO;
  }, []);

  // Rango válido para fecha de inspección: hoy-3 a hoy (inclusive, 4 días contando hoy)
  const fechaLimiteMin = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
  }, []);

  const fechaLimiteMax = React.useMemo(() => {
    return hoy;
  }, [hoy]);

  // Fecha mínima efectiva: max(hoy-4, fecha_montaje+1, ultima_inspeccion+1)
  const fechaMinEfectiva = React.useMemo(() => {
    let min = fechaLimiteMin;
    if (fechaAsignacionOriginal && fechaAsignacionOriginal >= min) {
      // fecha_para_inspección debe ser > fecha_de_montaje, así que el min es montaje + 1 día
      const d = new Date(fechaAsignacionOriginal + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const next = d.toISOString().slice(0, 10);
      if (next > min) min = next;
    }
    if (ultimaFechaInspeccion && ultimaFechaInspeccion >= min) {

      // fecha_para_inspección debe ser > ultima_inspección, así que min es última + 1 día
      const d = new Date(ultimaFechaInspeccion + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const next = d.toISOString().slice(0, 10);
      if (next > min) min = next;
    }
    return min;
  }, [fechaLimiteMin, fechaAsignacionOriginal, ultimaFechaInspeccion]);

  // Validar fecha de inspección según las reglas de negocio
  const validarFechaInspeccion = React.useCallback((value: string): string | null => {
    if (!value) return null;

    // Regla base: debe estar en rango hoy-3 a hoy (4 días contando hoy)
    if (value < fechaLimiteMin) {
      return `La fecha no puede ser anterior a ${convertToDateHuman(fechaLimiteMin)} (máximo 3 días atrás)`;
    }
    if (value > fechaLimiteMax) {
      return `La fecha no puede ser posterior a hoy (${convertToDateHuman(fechaLimiteMax)})`;
    }

    // Determinar fecha de referencia: MAX(fecha_montaje, ultima_inspeccion) o solo fecha_montaje
    const fechaReferencia = ultimaFechaInspeccion
      ? (fechaAsignacionOriginal && fechaAsignacionOriginal > ultimaFechaInspeccion ? fechaAsignacionOriginal : ultimaFechaInspeccion)
      : fechaAsignacionOriginal;

    if (fechaReferencia && value <= fechaReferencia) {
      if (ultimaFechaInspeccion && fechaReferencia === ultimaFechaInspeccion) {
        return `Debe ser posterior a la última inspección: ${convertToDateHuman(ultimaFechaInspeccion)}`;
      }
      return `Debe ser posterior a la fecha de la asignación: ${convertToDateHuman(fechaAsignacionOriginal ?? '')}`;
    }

    return null;
  }, [hoy, fechaLimiteMin, fechaLimiteMax, fechaAsignacionOriginal, ultimaFechaInspeccion]);

  // Cargar datos de neu_asignado al abrir el modal o cuando cambie la placa
  React.useEffect(() => {
    if (open && placa) {
      setActiveTab(0);
      listarNeumaticosAsignados(placa)
        .then((data) => {
          setNeuAsignados(data || []);
          // --- LOG SOLICITADO: Mostrar si hay neumáticos con BAJA DEFINITIVA o RECUPERADO ---
          if (Array.isArray(data)) {
            const bajas = data.filter(n => n.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || n.TIPO_MOVIMIENTO === 'RECUPERADO');
          }
          // Limpiar selección y formulario si los asignados cambian
          setNeumaticoSeleccionado(null);
          setFormValues({
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: 0, tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        })
        .catch(() => {
          setNeuAsignados([]);
          setNeumaticoSeleccionado(null);
          setFormValues({
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: 0, tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        });
    }
  }, [open, placa]);

  // Cargar todos los po_neumaticos al abrir el modal (solo una vez)
  useEffect(() => {
    if (open) {
      Neumaticos([], [], [], [], [], 'all').then(setPoNeumaticos).catch(() => setPoNeumaticos([]));
    }
  }, [open]);

  // Determinar si es la primera inspección de la placa (sin inspecciones previas).
  // Default seguro: false => RES01 bloqueado mientras no se confirme que es la primera.
  useEffect(() => {
    if (open && placa) {
      getFechasInspeccionVehicularPorPlaca(placa)
        .then((data) => {
          setEsPrimeraInspeccion(Array.isArray(data) && data.length === 0);
        })
        .catch(() => setEsPrimeraInspeccion(false));
    } else {
      setEsPrimeraInspeccion(false);
    }
  }, [open, placa]);

  /**
   * Verificación única al abrir el modal: cuántas posiciones están montadas y cuál fue
   * la última inspección. Antes esto vivía en tres efectos distintos que se pisaban entre
   * sí el bloqueo del formulario; aquí se consulta una sola vez y se decide todo junto.
   */
  useEffect(() => {
    if (!open || !placa) {
      // Resetear estados cuando el modal se cierre o no haya placa
      setAlertaInspeccionHoy(false);
      setBloquearFormulario(false);
      setInspeccionHoyRealizada(false);
      setUltimaFechaInspeccion(null);
      setAdvertenciaPosiciones({ open: false, faltan: 0 });
      setCantidadPosicionesValidas(0);
      // CLEANUP CRÍTICO: Limpiar cache de inspecciones pendientes al cerrar
      if (!open) {
        setInspeccionesPendientes([]);
        setFormValues({
          kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: 0, tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
        });
        setFormValuesInicial(null);
        setNeumaticoSeleccionado(null);
      }
      return;
    }

    let cancelado = false;
    const hoyx = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const verificar = async () => {
      // a) Posiciones realmente montadas en el vehículo
      let posicionesMontadas = 0;
      try {
        const movimientos = await obtenerUltimosMovimientosPorPosicion(placa);
        posicionesMontadas = Array.isArray(movimientos)
          ? new Set(movimientos.map((n: any) => n.POSICION_NEU || n.POSICION)).size
          : 0;
      } catch {
        posicionesMontadas = 0;
      }
      if (cancelado) return;

      const faltan = Math.max(0, totalPosiciones - posicionesMontadas);
      setCantidadPosicionesValidas(posicionesMontadas);
      setAdvertenciaPosiciones(faltan > 0 ? { open: true, faltan } : { open: false, faltan: 0 });

      // b) Última inspección registrada. OJO: la advertencia se basa en fecha_registro
      // (cuándo se inspeccionó). fecha_asignacion es cuándo se montaron los neumáticos y
      // existe aunque nunca se haya inspeccionado: usarla mostraba una advertencia falsa.
      try {
        const ultima = await getUltimaFechaInspeccionPorPlaca(placa);
        if (cancelado) return;

        setFechaAsignacionOriginal(ultima?.fecha_asignacion ?? null);

        const fechaRegistro = ultima?.fecha_registro ?? null;
        const esInspeccionDeHoy = fechaRegistro === hoyx;

        setUltimaFechaInspeccion(fechaRegistro);
        setInspeccionHoyRealizada(esInspeccionDeHoy);
        // El aviso de inspección sólo aplica si no falta ninguna posición: cuando faltan,
        // el que se muestra es el de "Faltan N neumáticos".
        setAlertaInspeccionHoy(Boolean(fechaRegistro) && faltan === 0);
        setBloquearFormulario(faltan > 0 || esInspeccionDeHoy);
      } catch {
        if (cancelado) return;
        // Ante un fallo de la consulta de inspección, sólo manda el estado de las posiciones
        setAlertaInspeccionHoy(false);
        setInspeccionHoyRealizada(false);
        setUltimaFechaInspeccion(null);
        setBloquearFormulario(faltan > 0);
      }
    };

    verificar();
    return () => { cancelado = true; };
  }, [open, placa, totalPosiciones]);

  // 1. Agrega un estado fijo para el kilometraje mínimo permitido
  // const [minKilometro, setMinKilometro] = useState(0);

  // Cuando se selecciona un neumático, llenar el formulario con datos completos de neu_asignado
  const handleSeleccionarNeumatico = async (neumatico: any) => {
    // Buscar si ya existe inspección local para esta posición
    const inspeccionLocal = inspeccionesPendientes.find(i => i.posicion === (neumatico.POSICION || neumatico.POSICION_NEU));


    if (inspeccionLocal) {
      // Si existe, cargar los datos guardados localmente.
      // OJO: fecha_inspeccion y el kilometraje (Odometro) son datos GLOBALES de la
      // inspección (se definen una sola vez en el paso "Fecha y kilometraje"), no por
      // neumático — no deben pisarse con el snapshot que quedó guardado en esa posición
      // cuando se guardó por primera vez, o se perdería lo que el usuario ya eligió.
      setNeumaticoSeleccionado(neumatico);
      setFormValues(prev => ({ ...inspeccionLocal, fecha_inspeccion: prev.fecha_inspeccion }));
      setRemanenteAsignacionReal(inspeccionLocal.remanente_referencia ?? null);
      setRemanenteError(false);
      setFormValuesInicial(prev => ({ ...inspeccionLocal, fecha_inspeccion: prev?.fecha_inspeccion ?? '' }));
      return;
    }
    // Buscar el neumático asignado a esta posición (Relaxed: solo coincidir posición)
    const neuActual = neuAsignados.find(
      n => (n.POSICION === neumatico.POSICION || n.POSICION_NEU === neumatico.POSICION)
    );
    const neuFull = neuActual || neumatico; // Usar el asignado, o el recibido si no hay
    setNeumaticoSeleccionado(neuFull);
    // Buscar datos completos en po_neumaticos por código
    const codigoBuscar = neuFull?.CODIGO_NEU ?? neuFull?.CODIGO ?? '';
    const poNeu = poNeumaticos.find(n => String(n.CODIGO) === String(codigoBuscar));
    // Obtener el último movimiento real desde el backend
    let remanenteUltimoMovimientoX = '';
    let presionUltimoMovimiento = '';
    let torqueUltimoMovimiento = 0;
    let kilometroUltimoMovimiento = '';
    try {
      // DEBUG: Log Inputs

      const movimientos = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);

      let dataFromBackend = null;
      if (Array.isArray(movimientos) && movimientos.length > 0) {
        dataFromBackend = movimientos[0];
      }

      // MERGE STRATEGY: Backend Data > Button List Data > Default
      const finalData = { ...neuFull, ...dataFromBackend };

      // 3. Direct Mapping from Final Data
      const odoInicial = finalData.KILOMETRO ? Number(finalData.KILOMETRO) : finalData.ODOMETRO_INICIAL ? Number(finalData.ODOMETRO_INICIAL) : (finalData.ODOMETRO_AL_MONTAR ? Number(finalData.ODOMETRO_AL_MONTAR) : 0);

      remanenteUltimoMovimientoX = finalData.REMANENTE ? finalData.REMANENTE.toString() : '';
      presionUltimoMovimiento = finalData.PRESION_AIRE ? finalData.PRESION_AIRE.toString() : '';
      torqueUltimoMovimiento = finalData.TORQUE_APLICADO ? finalData.TORQUE_APLICADO : 0; // Cargar torque
      kilometroUltimoMovimiento = finalData.KILOMETRO ? finalData.KILOMETRO.toString() : '';

      const fechaRef = finalData.FECHA_MOVIMIENTO || finalData.FECHA_REGISTRO || finalData.FECHA_ASIGNACION;
      if (fechaRef) {
        setFechaMinimaInspeccion(new Date(fechaRef).toISOString().slice(0, 10));
      } else {
        setFechaMinimaInspeccion(null);
      }

      setRemanenteAsignacionReal(remanenteUltimoMovimientoX ? Number(remanenteUltimoMovimientoX) : null);

      setFormValues({
        kilometro: '',
        marca: finalData.MARCA ?? '',
        modelo: finalData.MODELO ?? '',
        codigo: codigoBuscar,
        posicion: finalData.POSICION_NEU ?? finalData.POSICION ?? '',
        medida: finalData.MEDIDA ?? '',
        diseño: finalData.DISEÑO ?? '',
        remanente: remanenteUltimoMovimientoX ? Number(remanenteUltimoMovimientoX) : 0,
        tipo_movimiento: 'INSPECCION',
        estado: 'ASIGNADO',
        observacion: '',
        presion_aire: presionUltimoMovimiento,
        torque: torqueUltimoMovimiento, // Cargar torque desde último movimiento
        fecha_inspeccion: '',
      });

      // 4. PRE-FILL ODOMETER & VALIDATION

      // if (Odometro === 0) setOdometro(odoInicial);
      // setMinKilometro(odoInicial);

      setKmError(false);
      setRemanenteError(false);
      setPresionError(false); // Resetear error de presión
      setTorqueError(false); // Resetear error de torque
    } catch (e) {
      console.error('Error fetching details, using fallback:', e);
      // Fallback: Use neuFull properties strictly
      const fallbackData = neuFull;

      remanenteUltimoMovimientoX = fallbackData?.REMANENTE?.toString() ?? '';
      presionUltimoMovimiento = fallbackData?.PRESION_AIRE?.toString() ?? '';
      torqueUltimoMovimiento = fallbackData?.TORQUE_APLICADO?.toString() ?? ''; // Cargar torque en fallback
      kilometroUltimoMovimiento = fallbackData?.KILOMETRO?.toString() ?? '';

      setFormValues({
        kilometro: kilometroUltimoMovimiento,
        marca: fallbackData?.MARCA ?? '',
        modelo: fallbackData?.MODELO ?? '',
        codigo: codigoBuscar,
        posicion: fallbackData?.POSICION ?? fallbackData?.POSICION_NEU ?? '',
        medida: fallbackData?.MEDIDA ?? '',
        diseño: fallbackData?.DISEÑO ?? '',
        remanente: remanenteUltimoMovimientoX ? Number(remanenteUltimoMovimientoX) : 0,
        tipo_movimiento: 'INSPECCION',
        estado: fallbackData?.ESTADO ?? '',
        observacion: fallbackData?.OBSERVACION ?? '',
        presion_aire: presionUltimoMovimiento,
        torque: torqueUltimoMovimiento, // Cargar torque en fallback
        fecha_inspeccion: '',
      });

      const odoFallback = fallbackData.KILOMETRO ? Number(fallbackData.KILOMETRO) : fallbackData?.ODOMETRO_INICIAL ? Number(fallbackData.ODOMETRO_INICIAL) : (fallbackData?.ODOMETRO_AL_MONTAR ? Number(fallbackData.ODOMETRO_AL_MONTAR) : 0);
      setOdometro(odoFallback);
      // setMinKilometro(odoFallback);
    }
    // Cleaned up legacy logic (Handled inside try block)
    if (onSeleccionarNeumatico) onSeleccionarNeumatico(neuFull);
  };

  // Auto-seleccionar POS01 al abrir si no hay selección
  useEffect(() => {
    // Retraso leve para asegurar que neuAsignados esté listo y evitar conflicto de renders
    const timer = setTimeout(() => {
      if (open && neuAsignados.length > 0 && !neumaticoSeleccionado && !bloquearFormulario) {
        const pos01 = neuAsignados.find(n => (n.POSICION === 'POS01' || n.POSICION_NEU === 'POS01') && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
        if (pos01) {
          handleSeleccionarNeumatico(pos01);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [open, neuAsignados, bloquearFormulario]);

  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // ERROR DE PORQUERIA
  // Sincronizar Odometro con el valor inicial al abrir modal o cambiar neumático
  React.useEffect(() => {
    setOdometro(initialOdometro);
    setKmError(false);
  }, [initialOdometro]);

  // VALIDACIÓN DE REMANENTE EN TIEMPO REAL
  useEffect(() => {
    const val = parseFloat(String(formValues.remanente));
    const limit = remanenteAsignacionReal !== null ? remanenteAsignacionReal : (remanenteAsignacion ?? Number(neumaticoSeleccionado?.REMANENTE));

    if (!isNaN(val) && limit > 0) {
      const isSpare = neumaticoSeleccionado?.POSICION === 'RES01' || formValues.posicion === 'RES01';
      if (isSpare) {
        // REPUESTO: No puede aumentar (val <= limit)
        if (val > limit) {
          setRemanenteError(true);
        } else {
          setRemanenteError(false);
        }
      } else {
        // RODANDO: Debe disminuir (val < limit)
        // Según regla estricta del backend: no puede ser igual o mayor.
        if (val >= limit) {
          setRemanenteError(true);
        } else {
          setRemanenteError(false);
        }
      }
    } else {
      setRemanenteError(false);
    }
  }, [formValues.remanente, neumaticoSeleccionado, remanenteAsignacionReal, remanenteAsignacion]);

  // Calcular el porcentaje de remanente respecto a la última ASIGNACIÓN REAL
  const valorReferenciaRemanente = remanenteAsignacionReal !== null ? remanenteAsignacionReal : (remanenteAsignacion ?? Number(neumaticoSeleccionado?.REMANENTE));

  // Cuando se selecciona un neumático, guardar el estado inicial del formulario
  useEffect(() => {
    if (neumaticoSeleccionado) {
      setFormValuesInicial(formValues);
    }

  }, [neumaticoSeleccionado]);

  // Función para comparar si hay cambios en el formulario respecto al inicial
  const hayCambiosFormulario = React.useMemo(() => {
    if (!formValuesInicial) return false;
    // Compara solo los campos relevantes
    const campos: (keyof FormValues)[] = [
      'kilometro', 'remanente', 'presion_aire', 'torque', 'observacion', 'fecha_inspeccion'
    ];
    return campos.some(c => String(formValues[c] ?? '') !== String(formValuesInicial[c] ?? ''));
  }, [formValues, formValuesInicial]);

  const handleGuardarInspeccionLocal = () => {
    if (kmError) {
      toast.error(`El kilometro no puede ser menor a ${initialOdometro.toLocaleString()} km`)
      return;
    }
    if (!neumaticoSeleccionado) {
      toast.error('Debe seleccionar un neumático.')
      return;
    }
    // RES01 (repuesto) puede guardarse sin cambios: bloqueado mantiene el último valor y editable
    // puede conservar el mismo remanente/torque. En cualquier otra posición se exigen cambios.
    const esRES01Local = neumaticoSeleccionado.POSICION === 'RES01' || formValues.posicion === 'RES01';
    if (!hayCambiosFormulario && !esRES01Local) {
      toast.info('No hay cambios para guardar.')
      return;
    }
    // Validaciones mínimas
    if (Odometro < Number(formValues.kilometro)) {
      toast.error(`El número de kilometro no puede ser menor al actual (${formValues.kilometro} km).`)
      return;
    }

    if (formValues.posicion !== 'RES01') {
      if (Number(formValues.remanente) >= valorReferenciaRemanente) {
        toast.error(`El valor de remanente no puede ser igual o mayor a ${valorReferenciaRemanente}`)
        return;
      }
    }

    if (remanenteError) {
      toast.error(`El valor de remanente no puede ser igual o mayor a ${valorReferenciaRemanente}`)
      return;
    }

    if (presionError) {
      toast.error(`El valor de la presión no puede ser menor a ${rangos.presion.min} o mayor que ${rangos.presion.max}.`)
      return;
    }

    if (torqueError) {
      toast.error(`El valor de la torque no puede ser menor a ${rangos.torque.min} o mayor que ${rangos.torque.max}.`)
      return;
    }

    // Buscar la fecha de asignación original para este neumático
    let fechaAsignacion = null;
    if (neumaticoSeleccionado?.FECHA_ASIGNACION) {
      fechaAsignacion = neumaticoSeleccionado.FECHA_ASIGNACION;
    } else if (neumaticoSeleccionado?.MOVIMIENTOS && Array.isArray(neumaticoSeleccionado.MOVIMIENTOS)) {
      const movAsign = neumaticoSeleccionado.MOVIMIENTOS.filter((m: any) => m.TIPO_MOVIMIENTO === 'ASIGNADO' || m.TIPO_MOVIMIENTO === 'ASIGNACION')
        .sort((a: any, b: any) => new Date(b.FECHA_MOVIMIENTO).getTime() - new Date(a.FECHA_MOVIMIENTO).getTime())[0];
      fechaAsignacion = movAsign?.FECHA_ASIGNACION || movAsign?.FECHA_REGISTRO || null;
    }
    // Guardar/actualizar inspección localmente por posición, incluyendo la fecha de asignación
    const nuevaInspeccion = { ...formValues, kilometro: Odometro.toString(), fecha_asignacion: fechaAsignacion ? new Date(fechaAsignacion).toISOString().slice(0, 10) : null, remanente_referencia: remanenteAsignacionReal };
    setInspeccionesPendientes(prev => {
      const idx = prev.findIndex(i => i.posicion === nuevaInspeccion.posicion);
      let nuevoArray;
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = nuevaInspeccion;
        nuevoArray = copia;
      } else {
        nuevoArray = [...prev, nuevaInspeccion];
      }
      return nuevoArray;
    });
    setFormValuesInicial({ ...formValues, kilometro: Odometro.toString() });

    toast.success('Inspección guardada localmente.', {
      position: 'top-center'
    })

    // --- NAVEGACIÓN AUTOMÁTICA: se recorren las posiciones propias del vehículo ---
    const posicionesPrincipales = posicionesVehiculo.filter(p => !p.repuesto).map(p => p.codigo);
    const posicionesRepuesto = posicionesVehiculo.filter(p => p.repuesto).map(p => p.codigo);

    const inspeccionesActualizadas = (() => {
      const idx = inspeccionesPendientes.findIndex(i => i.posicion === nuevaInspeccion.posicion);
      if (idx >= 0) {
        const copia = [...inspeccionesPendientes];
        copia[idx] = nuevaInspeccion;
        return copia;
      } else {
        return [...inspeccionesPendientes, nuevaInspeccion];
      }
    })();

    const posicionesInspeccionadas = inspeccionesActualizadas.map(i => i.posicion);
    const posicionActual = nuevaInspeccion.posicion;

    let siguientePendiente = null;

    // Si todavía faltan principales
    if (posicionesPrincipales.some(pos => !posicionesInspeccionadas.includes(pos))) {
      const idxActual = posicionesPrincipales.indexOf(posicionActual);
      for (let i = 1; i <= posicionesPrincipales.length; i++) {
        const idxSiguiente = (idxActual + i) % posicionesPrincipales.length;
        const posSiguiente = posicionesPrincipales[idxSiguiente];
        const existeNeumatico = neumaticosAsignados.find(n => n.POSICION === posSiguiente);
        if (existeNeumatico && !posicionesInspeccionadas.includes(posSiguiente)) {
          siguientePendiente = existeNeumatico;
          break;
        }
      }
    } else {
      // Si todas las principales están hechas, ir al repuesto pendiente (si el vehículo tiene)
      const repuestoPendiente = posicionesRepuesto.find(pos => !posicionesInspeccionadas.includes(pos));
      if (repuestoPendiente) {
        siguientePendiente = neumaticosAsignados.find(n => n.POSICION === repuestoPendiente);
      }
    }

    if (siguientePendiente) {
      handleSeleccionarNeumatico(siguientePendiente);
    } else if (inspeccionesActualizadas.length >= totalPosiciones) {
      // Todas las posiciones del vehículo están guardadas: avanzar al paso final.
      setActiveTab(1);
    }
  };


  // TODO: Registrar la inspección 
  const handleEnviarYGuardar = async () => {

    const fechaSeleccionada = formValues.fecha_inspeccion.trim();

    if (!fechaSeleccionada || fechaSeleccionada.length === 0) {
      toast.error('Debe seleccionar una fecha de inspección.')
      return;
    }

    // Safety-net: validar reglas de fecha antes de enviar
    const errorFecha = validarFechaInspeccion(fechaSeleccionada);
    if (errorFecha) {
      setFechaInspeccionError(errorFecha);
      toast.error(errorFecha)
      return;
    }

    try {

      let placaTrim = placa.trim()
      const responseInspeccion = await consultarInspeccionHoy({ placa: placaTrim, fecha: fechaSeleccionada })

      if (responseInspeccion.existe) {
        toast.error(`Ya se registró una inspección para este vehículo en la fecha ${fechaSeleccionada}. No puede realizar otra.`)
        return;
      }

    } catch (e) {
      // Si hay error, permitir continuar (o puedes bloquear si prefieres)
    }

    if (kmError) {
      toast.error(`El kilometro no puede ser menor a ${initialOdometro.toLocaleString()} km`)
      return;
    }

    if (Odometro <= initialOdometro) {
      toast.error(`El kilometro debe ser mayor al actual (${initialOdometro.toLocaleString()} km).`)
      return;
    }

    // Se exigen todas las posiciones del vehículo (incluido el repuesto si lo tiene)
    if (inspeccionesPendientes.length !== totalPosiciones) {
      toast.error(`Debe inspeccionar los ${totalPosiciones} neumáticos del vehículo antes de enviar.`)
      return;
    }



    // Usar SIEMPRE el valor de formValues.fecha_inspeccion para todos los objetos
    const fechaInspeccionGlobal = formValues.fecha_inspeccion;
    let fechaAsignacionGlobal = null;
    let kilometroGlobal = Odometro;
    if (inspeccionesPendientes.length > 0) {
      fechaAsignacionGlobal = inspeccionesPendientes[0].fecha_asignacion;
    }
    const now = new Date();
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };
    const getLocalDateTimeString = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    // Incluir todas las inspecciones, incluyendo RES01
    const payloads = inspeccionesPendientes.map(ins => {
      const poNeu = poNeumaticos.find(n => String(n.CODIGO) === String(ins.codigo));
      const remanente = ins.remanente ? parseFloat(ins.remanente) : 0;
      const referencia = poNeu?.REMANENTE ? parseFloat(poNeu.REMANENTE) : 0;
      const estadoDecimal = referencia > 0 ? Math.round((remanente * 100) / referencia) : null;
      let fechaAsignacion = fechaAsignacionGlobal;
      if (!fechaAsignacion && poNeu?.FECHA_ASIGNACION) fechaAsignacion = poNeu.FECHA_ASIGNACION;
      // Usar SIEMPRE la fecha seleccionada por el usuario
      const obj = {
        CARGA: poNeu?.CARGA ?? null,
        CODIGO: ins.codigo ?? null,
        COSTO: poNeu?.COSTO ? parseFloat(poNeu.COSTO) : null,
        DISEÑO: ins.diseño ?? null,
        ESTADO: estadoDecimal,
        FECHA_ASIGNACION: fechaAsignacion || null,
        FECHA_COMPRA: formatDate(poNeu?.FECHA_COMPRA) || null,
        FECHA_FABRICACION: poNeu?.FECHA_FABRICACION_COD ?? null,
        FECHA_MOVIMIENTO: getLocalDateTimeString(),
        FECHA_REGISTRO: formatDate(fechaInspeccionGlobal) || null,
        KILOMETRO: kilometroGlobal ? parseInt(kilometroGlobal.toString()) : null,
        MARCA: ins.marca ?? null,
        MEDIDA: ins.medida ?? null,
        OBSERVACION: ins.observacion ?? null,
        OC: poNeu?.OC ?? null,
        PLACA: placa ?? null,
        POSICION_NEU: ins.posicion ?? null,
        PR: poNeu?.PR ?? null,
        PRESION_AIRE: ins.presion_aire ? parseFloat(ins.presion_aire) : null,
        PROVEEDOR: poNeu?.PROVEEDOR ?? null,
        PROYECTO: vehiculo?.proyecto ?? null,
        REMANENTE: ins.remanente ? parseFloat(ins.remanente) : null,
        RQ: poNeu?.RQ ?? null,
        TIPO_MOVIMIENTO: ins.tipo_movimiento ?? null,
        TORQUE_APLICADO: isNaN(ins.torque) ? 0 : Number(ins.torque),
        USUARIO_SUPER: user?.usuario || 'SISTEMA',
        VELOCIDAD: poNeu?.VELOCIDAD ?? null,
        COD_SUPERVISOR: vehiculo?.cod_supervisor,
        ID_OPERACION: vehiculo?.id_operacion,
        FECHA_INSPECCION: formatDate(fechaInspeccionGlobal) || null,
        TIPO_TERRENO: vehiculo?.tipo_terreno,
        RETEN: vehiculo?.reten,
        TRANSITO: enTransito,
        TALLER: taller
      };
      return obj;
    });
    try {
      await guardarInspeccion(payloads); // El backend acepta array
      toast.success('Inspecciones guardadas correctamente.', {
        duration: 6000,
        position: 'top-right'
      })
      setInspeccionesPendientes([]);
      if (onUpdateAsignados) {
        await onUpdateAsignados(); // <--- Forzar refresh de tabla
      } else if (typeof window !== 'undefined') {
        // Fallback: emitir evento global para forzar actualización
        window.dispatchEvent(new CustomEvent('actualizar-diagrama-vehiculo'));
      }
      marcarInspeccionHoy(); // Marcar inspección realizada hoy
      setOpenDialog(false)
      onClose();
    } catch (error: any) {

      const messageErrorCatch = error?.message || 'Error al enviar inspecciones.'
      toast.error(messageErrorCatch)
      // Intentar actualizar el diagrama aunque haya error en el guardado
      if (onUpdateAsignados) {
        await onUpdateAsignados();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('actualizar-diagrama-vehiculo'));
      }
    }
  };

  // Guardar en localStorage la fecha de la última inspección exitosa
  const marcarInspeccionHoy = () => {
    const hoyXh = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`inspeccion_${placa}`, hoyXh);
    setInspeccionHoyRealizada(true);
  };

  // Escuchar el evento global para abrir el modal desde DiagramaVehiculo
  React.useEffect(() => {
    const handler = () => {
      if (!open) {
        // Si el modal no está abierto, lo abre
        if (typeof onClose === 'function') onClose(); // Cierra si está abierto (por seguridad)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const evt = new CustomEvent('abrir-modal-inspeccion-interno');
            window.dispatchEvent(evt);
          }
        }, 100);
      }
    };
    window.addEventListener('abrir-modal-inspeccion', handler);
    return () => window.removeEventListener('abrir-modal-inspeccion', handler);
  }, [open, onClose]);

  // Constante para habilitar el botón solo si los campos requeridos están llenos
  const esRES01 = formValues.posicion === 'RES01';
  // RES01 solo es editable en la PRIMERA inspección de la placa. En las siguientes se bloquea.
  const res01Bloqueado = esRES01 && !esPrimeraInspeccion;
  const esRES01Editable = esRES01 && esPrimeraInspeccion;
  // - RES01 bloqueado: no exigimos campos (se guarda con el último valor).
  // - RES01 editable (1ra inspección): el torque puede ser 0, así que NO se exige lleno.
  // - Rueda normal: se exigen todos los campos llenos.
  const camposRequeridosLlenos = res01Bloqueado
    ? true
    : esRES01Editable
      ? !!(formValues.remanente && formValues.presion_aire && formValues.observacion)
      : !!(
        formValues.remanente &&
        formValues.presion_aire &&
        formValues.torque &&
        formValues.observacion
      );

  return (
    <>
      {/* Modal de advertencia de cantidad de neumáticos */}
      <ModalInspeccionAver
        open={advertenciaPosiciones.open}
        advertenciaCantidadNeumaticos={advertenciaPosiciones.open ? advertenciaPosiciones.faltan : undefined}
        onClose={() => {
          setAdvertenciaPosiciones({ open: false, faltan: 0 });
          onClose(); // Cierra también el modal principal
        }}
        onContinue={() => setAdvertenciaPosiciones({ open: false, faltan: 0 })}
        onAbrirAsignacion={onAbrirAsignacion}
        onCloseMain={onClose}
      />
      {/* Modal de advertencia de inspección previa, solo si no hay advertencia de cantidad */}
      <ModalInspeccionAver
        open={alertaInspeccionHoy && !advertenciaPosiciones.open}
        ultimaInspeccionFecha={ultimaFechaInspeccion || undefined}
        esInspeccionHoy={inspeccionHoyRealizada}
        onClose={() => setAlertaInspeccionHoy(false)}
        onContinue={() => {
          setAlertaInspeccionHoy(false);
          setBloquearFormulario(false);
        }}
        onCloseMain={onClose}
      />
      {/* Modal de asignación de neumáticos */}
      <ModalAsignacionNeu
        open={openAsignacion}
        onClose={() => setOpenAsignacion(false)}
        data={poNeumaticos}
        assignedNeumaticos={neuAsignados}
        placa={placa}
        kilometro={vehiculo?.kilometro ?? 0}
        cantidadNeumaticos={vehiculo?.cantidad_neumaticos}
        onAssignedUpdate={() => {
          listarNeumaticosAsignados(placa).then(setNeuAsignados);
          setAdvertenciaPosiciones({ open: false, faltan: 0 });
        }}
        enTransito={enTransito}
        taller={taller}
      />
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
        fullScreen={esPantallaChica}
        PaperProps={{
          sx: { borderRadius: { xs: 0, lg: 3 }, overflow: 'hidden' }
        }}
      >
        {/* <DialogTitle sx={{ fontWeight: 'bold', color: '#388e3c' }}>Inspección de Neumáticos</DialogTitle> */}

        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

        <DialogTitle sx={{ pb: 1.5, pt: 2, px: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, borderRadius: 2,
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            flexShrink: 0,
          }}>
            <ClipboardList size={20} className="text-blue-600" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Registrar Inspección de Neumáticos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
              <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
              <Chip
                label={placa}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
              />
            </Box>
            <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic', fontSize: { xs: '0.75rem', md: '0.875rem' }, lineHeight: 1.35 }}>
              <span className='font-bold'>Nota: </span>
              Para guardar temporalmente la inspección de cada neumático, debes darle click al boton <b>siguiente posición</b>.
            </Typography>
          </Box>

          <ButtonCustom
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
            className="shrink-0 self-start text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </ButtonCustom>
        </DialogTitle>

        <Box sx={{ px: { xs: 1.5, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant={esPantallaChica ? 'fullWidth' : 'standard'}
            sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', md: '0.875rem' } } }}
          >
            <Tab value={0} label={esPantallaChica ? `1. Neumáticos (${inspeccionesPendientes.length}/${totalPosiciones})` : `1. Inspeccionar neumáticos (${inspeccionesPendientes.length}/${totalPosiciones})`} />
            <Tab value={1} label={esPantallaChica ? '2. Fecha y km' : '2. Fecha y kilometraje'} disabled={inspeccionesPendientes.length < totalPosiciones} />
          </Tabs>
        </Box>

        <DialogContent sx={{ px: { xs: 1.5, md: 3 } }}>
          {activeTab === 0 && (
            <Stack direction={{ xs: 'column-reverse', lg: 'row' }} spacing={2}>
              <Stack direction="column" spacing={2} sx={{ flex: 1, width: { xs: '100%', lg: '1px' }, minWidth: 0, marginTop: '10px' }}>
                {/* Resumen del vehículo */}
                {vehiculo ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        {[vehiculo.color, vehiculo.proyecto, vehiculo.operacion, vehiculo.tipo_terreno, vehiculo.reten]
                          .filter(Boolean)
                          .map((dato, i) => <span key={i}>{dato}</span>)}
                      </div>
                    </div>
                    {vehiculo?.kilometro !== undefined && (
                      <div className="ml-auto shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-right shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Kilometraje</p>
                        <p className="text-sm font-bold text-blue-900">{initialOdometro.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No hay datos del vehículo.</p>
                )}

                {/* Datos de la posición seleccionada */}
                <div className="rounded-xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-white p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-200">
                      <ListChecks className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {formValues.posicion ? `Datos de ${formValues.posicion}` : 'Selecciona una posición'}
                      </h3>
                      <p className="text-xs text-slate-500">Haz clic en una rueda del diagrama para cargar sus datos</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                        inspeccionesPendientes.length >= totalPosiciones ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {inspeccionesPendientes.length}/{totalPosiciones} guardadas
                    </span>
                  </div>

                  {/* Referencia de solo lectura */}
                  <div className="mb-4 grid grid-cols-2 items-start gap-x-4 gap-y-3 border-b border-dashed border-violet-200 pb-4 sm:grid-cols-5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 leading-tight">Posición</p>
                      <span className="mt-0.5 inline-block rounded-md bg-violet-100 px-2 py-0.5 text-sm font-bold text-violet-700">
                        {formValues.posicion || '—'}
                      </span>
                    </div>
                    <CampoVehiculo label="Código" value={formValues.codigo || '—'} />
                    <CampoVehiculo label="Marca" value={formValues.marca || '—'} />
                    <CampoVehiculo label="Medida" value={formValues.medida || '—'} />
                    <CampoVehiculo label="Diseño" value={formValues.diseño || '—'} />
                  </div>

                  {/* Datos a registrar */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field data-invalid={remanenteError}>
                      <FieldLabel htmlFor="remanente">Remanente</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="remanente"
                          inputMode="decimal"
                          pattern="^\d*(\.\d{0,2})?$"
                          value={formValues.remanente}
                          onChange={e => {
                            if (res01Bloqueado) return;
                            const value = e.target.value.replace(/,/g, '.'); // Permitir punto decimal
                            // Permitir solo números y hasta 2 decimales
                            if (!/^\d*(\.?\d{0,2})?$/.test(value)) return;
                            setFormValues(prev => ({ ...prev, remanente: value }));
                          }}
                          aria-invalid={remanenteError}
                          disabled={bloquearFormulario || res01Bloqueado}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>mm</InputGroupText></InputGroupAddon>
                      </InputGroup>
                      <FieldDescription className={remanenteError ? 'text-destructive font-medium' : undefined}>
                        {remanenteError
                          ? (formValues.posicion === 'RES01' || neumaticoSeleccionado?.POSICION === 'RES01')
                            ? `No puede ser mayor al anterior (${valorReferenciaRemanente})`
                            : `Debe ser MENOR al anterior (${valorReferenciaRemanente})`
                          : `Anterior: ${valorReferenciaRemanente ?? '-'}`}
                      </FieldDescription>
                    </Field>

                    <Field data-invalid={presionError}>
                      <FieldLabel htmlFor="presion_aire">Presión de aire</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="presion_aire"
                          type="number"
                          min={25}
                          max={50}
                          value={formValues.presion_aire ?? ''}
                          onChange={(e) => {
                            if (res01Bloqueado) return;
                            const value = Number(e.target.value);
                            setFormValues(prev => ({ ...prev, presion_aire: e.target.value }));
                            setPresionError(value < rangos.presion.min || value > rangos.presion.max);
                          }}
                          aria-invalid={presionError}
                          disabled={bloquearFormulario || res01Bloqueado}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>psi</InputGroupText></InputGroupAddon>
                      </InputGroup>
                      <FieldDescription className={presionError ? 'text-destructive font-medium' : undefined}>
                        {presionError
                          ? `Debe estar entre ${rangos.presion.min} y ${rangos.presion.max} psi`
                          : `Rango permitido: ${rangos.presion.min}-${rangos.presion.max} psi`}
                      </FieldDescription>
                    </Field>

                    <Field data-invalid={torqueError}>
                      <FieldLabel htmlFor="torque">Torque</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="torque"
                          type="number"
                          min={esRES01Editable ? 0 : rangos.torque.min}
                          max={rangos.torque.max}
                          value={formValues.torque}
                          onChange={(e) => {
                            if (res01Bloqueado) return;
                            const value = Number(e.target.value);
                            setFormValues(prev => ({ ...prev, torque: Number(e.target.value) }));
                            // RES01 editable: el torque puede ser 0 (repuesto sin torque aplicado) o estar en rango.
                            const torqueValido = esRES01Editable
                              ? (value === 0 || (value >= rangos.torque.min && value <= rangos.torque.max))
                              : (value >= rangos.torque.min && value <= rangos.torque.max);
                            setTorqueError(!torqueValido);
                          }}
                          aria-invalid={torqueError}
                          disabled={bloquearFormulario || res01Bloqueado}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>N·m</InputGroupText></InputGroupAddon>
                      </InputGroup>
                      <FieldDescription className={torqueError ? 'text-destructive font-medium' : undefined}>
                        {torqueError
                          ? (esRES01Editable ? `Debe ser 0 o estar entre ${rangos.torque.min} y ${rangos.torque.max} Nm` : `Debe estar entre ${rangos.torque.min} y ${rangos.torque.max} Nm`)
                          : (esRES01Editable ? `Permitido: 0 o ${rangos.torque.min}-${rangos.torque.max} Nm` : `Recomendado: ${rangos.torque.min}-${rangos.torque.max} Nm`)}
                      </FieldDescription>
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field>
                      <FieldLabel htmlFor="observacion">Observación</FieldLabel>
                      <Textarea
                        id="observacion"
                        name="observacion"
                        rows={2}
                        value={formValues.observacion}
                        onChange={res01Bloqueado ? undefined : handleInputChange}
                        disabled={bloquearFormulario || res01Bloqueado}
                      />
                    </Field>
                  </div>
                </div>

                <Stack direction="row" justifyContent="flex-end" sx={{ '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
                  <ButtonCustom
                    variant={'teal'}
                    onClick={handleGuardarInspeccionLocal}
                    disabled={
                      (!hayCambiosFormulario && !esRES01) || bloquearFormulario || kmError || !camposRequeridosLlenos
                    }
                  >
                    <CircleCheckBig />
                    {inspeccionesPendientes.some(i => i.posicion === formValues.posicion) ? 'Actualizar posición' : 'Siguiente posición'}
                  </ButtonCustom>
                </Stack>
              </Stack>
              {/* Columna derecha: diagrama de posiciones */}
              <Card sx={{
                flex: { lg: 0.5 },
                p: 2,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                minWidth: { xs: 0, lg: 290 },
                maxWidth: { xs: '100%', sm: 440, lg: 320 },
                mx: { xs: 'auto', lg: 0 },
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                marginTop: '10px'
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', alignSelf: 'flex-start' }}>
                  Diagrama de posiciones
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 0.5 }}>
                  Haz clic sobre una rueda para inspeccionarla. El check verde indica una posición ya guardada.
                </Typography>

                <Stack direction="row" spacing={2} sx={{ alignSelf: 'flex-start' }}>
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

                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <DiagramaVehiculo
                    etiquetaDatos="remanente"
                    neumaticosAsignados={neumaticosAsignados}
                    layout="modal"
                    tipoModal="inspeccion"
                    cantidadNeumaticos={vehiculo?.cantidad_neumaticos}
                    posicionResaltada={formValues.posicion}
                    posicionesCompletadas={inspeccionesPendientes.map(i => i.posicion)}
                    onPosicionClick={n => {
                      handleSeleccionarNeumatico(n);
                    }}
                    onMantenimientoClick={() => {
                      // Mantenimiento functionality removed
                    }}
                  />
                </Box>
              </Card>
            </Stack>
          )}

          {activeTab === 1 && (
            <Box sx={{ maxWidth: 640, mx: 'auto', py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 2,
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  flexShrink: 0,
                }}>
                  <CircleCheckBig size={20} className="text-green-700" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{`Los ${totalPosiciones} neumáticos fueron inspeccionados`}</Typography>
                  <Typography variant="body2" color="text.secondary">Registra la fecha y el kilometraje para confirmar la inspección.</Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-start">
                <Box sx={{ minWidth: { xs: '100%', sm: 190 }, flex: { sm: 1 } }}>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                    Fecha de inspección
                  </Typography>
                  <DatePicker
                    value={formValues.fecha_inspeccion ? new Date(`${formValues.fecha_inspeccion}T00:00:00`) : undefined}
                    onChange={(date) => {
                      const value = date ? dateToISOLocal(date) : '';
                      setFormValues(prev => ({ ...prev, fecha_inspeccion: value }));
                      setFechaInspeccionError(validarFechaInspeccion(value));
                    }}
                    minDate={new Date(`${fechaMinEfectiva}T00:00:00`)}
                    maxDate={new Date(`${fechaLimiteMax}T00:00:00`)}
                    disabled={bloquearFormulario}
                    className="w-full"
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.5, color: fechaInspeccionError ? 'error.main' : 'text.secondary', fontWeight: fechaInspeccionError ? 700 : 400 }}
                  >
                    {fechaInspeccionError || (fechaMinEfectiva > fechaLimiteMax
                      ? `Fecha de asignación a partir de ${convertToDateHuman(fechaMinEfectiva)}`
                      : `Rango válido: ${convertToDateHuman(fechaMinEfectiva)} a ${convertToDateHuman(fechaLimiteMax)}`)}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: 190 }, flex: { sm: 1 } }}>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                    Kilometraje
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={Odometro}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw.includes('.') || raw.includes(',')) return;
                      const value = Number(raw);
                      setOdometro(value);
                      if (value > initialOdometro && ((initialOdometro + 25000) > value)) {
                        setKmError(false);
                      } else {
                        setKmError(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',') e.preventDefault();
                    }}
                    error={kmError}
                    helperText={kmError
                      ? `Debe ser mayor que ${initialOdometro.toLocaleString()} km y menor que ${(initialOdometro + 25000).toLocaleString()} km`
                      : `Actual: ${initialOdometro.toLocaleString()} km`}
                    InputProps={{
                      inputProps: { min: initialOdometro + 1, step: 1, max: initialOdometro + 25000 },
                      sx: {
                        'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        'input[type=number]': {
                          MozAppearance: 'textfield',
                        },
                      },
                    }}
                    sx={{ minWidth: 190, width: { xs: '100%', sm: 'auto' } }}
                    disabled={bloquearFormulario}
                  />
                </Box>
              </Stack>

              <Stack
                direction={{ xs: 'column-reverse', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={{ xs: 1.5, sm: 0 }}
                sx={{ mt: 4, '& > button': { width: { xs: '100%', sm: 'auto' } } }}
              >
                <ButtonCustom
                  variant="outline"
                  className="border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800"
                  onClick={() => setActiveTab(0)}
                >
                  <ArrowLeft />
                  Volver a inspeccionar
                </ButtonCustom>

                <LoadingButton2
                  variant="primary"
                  icon={<BadgeAlert />}
                  disabled={inspeccionesPendientes.length !== totalPosiciones || bloquearFormulario || kmError}
                  onClick={() => {
                    setOpenDialog(true)
                  }}
                >
                  Confirmar Inspección
                </LoadingButton2>
              </Stack>

              {
                openDialog && (
                  <ModalInformacionInspeccion
                    placa={placa}
                    kilometraje={Odometro.toString()}
                    fechaInspeccion={formValues.fecha_inspeccion}
                    neumaticos={
                      inspeccionesPendientes.map((neu) => {
                        const codigo = neu!.codigo;
                        const posicion = neu!.posicion;
                        const remanente = parseFloat(neu!.remanente ?? 0);
                        const remanenteReferencia = parseFloat(neu!.remanente_referencia ?? 0);
                        const presionAire = parseFloat(neu!.presion_aire ?? 0);
                        const torqueAplicado = parseFloat(neu!.torque ?? 0);
                        const medida = neu!.medida ?? '-'
                        return {
                          Posicion: posicion,
                          CodigoNeumatico: codigo,
                          Marca: neu!.marca ?? '-',
                          Medida: medida,
                          FechaAsignacion: 'dwdw',
                          Remanente: remanente,
                          RemanenteReferencia: remanenteReferencia,
                          PresionAire: presionAire,
                          TorqueAplicado: torqueAplicado
                        };
                      })
                    }
                    open={openDialog}
                    onSuccessInspeccion={handleEnviarYGuardar}
                    onClose={() => setOpenDialog(false)} />
                )
              }
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de asignación de neumáticos (debes reemplazarlo por tu modal real) */}
      {/* <ModalAsignacionNeumatico open={openAsignacion} onClose={() => setOpenAsignacion(false)} placa={placa} /> */}
    </>
  );
});

export default ModalInpeccionNeu;
