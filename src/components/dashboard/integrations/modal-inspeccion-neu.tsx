import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { useState, useContext, useEffect } from 'react';
import ModalInspeccionAver from '../../core/modal-inspeccion-aver';
import { consultarInspeccionHoy, listarNeumaticosAsignados, guardarInspeccion, Neumaticos, obtenerUltimosMovimientosPorCodigo, getUltimaFechaInspeccionPorPlaca, obtenerUltimosMovimientosPorPosicion } from '../../../api/Neumaticos';
import { UserContext } from '../../../contexts/user-context';
import ModalAsignacionNeu from './modal-asignacion-neu';
import { toast } from 'sonner';
import Image from 'next/image';
import { convertToDateHuman } from '@/lib/utils';
import { CheckCircle, CircleCheckBig, ClipboardList, ListChecks } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { Chip, DialogTitle } from '@mui/material';
import { Textarea } from '@/components/ui/textarea';

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
  torque: string;
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
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = React.memo(({ open, onClose, placa, neumaticosAsignados, vehiculo, onSeleccionarNeumatico, onUpdateAsignados, onAbrirAsignacion, kilometroRealActual }) => {
  // Mostrar el array de neumáticos asignados cada vez que se abre el modal

  const { user } = useContext(UserContext) || {};
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
    torque: '',
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

  // Estado para la fecha mínima de inspección (no puede ser menor a la última registrada)
  const [fechaMinimaInspeccion, setFechaMinimaInspeccion] = useState<string | null>(null);
  const [fechaInspeccionError, setFechaInspeccionError] = useState<string | null>(null);
  const [ultimaFechaInspeccion, setUltimaFechaInspeccion] = useState<string | null>(null); // NUEVO

  // Estado para la fecha de asignación original (mínimo de inspección)
  const [fechaAsignacionOriginal, setFechaAsignacionOriginal] = useState<string | null>(null);

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
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: '', tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        })
        .catch(() => {
          setNeuAsignados([]);
          setNeumaticoSeleccionado(null);
          setFormValues({
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: '', tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        });
    }
  }, [open, placa]);

  // Cargar todos los po_neumaticos al abrir el modal (solo una vez)
  useEffect(() => {
    if (open) {
      Neumaticos().then(setPoNeumaticos).catch(() => setPoNeumaticos([]));
    }
  }, [open]);

  // Verificar si ya existe inspección hoy al abrir el modal usando el endpoint correcto
  useEffect(() => {
    if (open && placa) {
      const hoyx = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const verificarInspeccionPorBackend = async () => {
        try {

          // Usar el endpoint correcto para obtener la última fecha de inspección
          const ultimaFechaInspeccionX = await getUltimaFechaInspeccionPorPlaca(placa);


          setFechaAsignacionOriginal(ultimaFechaInspeccionX.fecha_asignacion)

          if (ultimaFechaInspeccionX.fecha_registro) {
            if (ultimaFechaInspeccionX.fecha_registro === hoyx) {
              // Hay inspección de hoy - bloquear completamente
              setAlertaInspeccionHoy(true);
              setBloquearFormulario(true);
              setInspeccionHoyRealizada(true);
              setUltimaFechaInspeccion(ultimaFechaInspeccionX.fecha_registro);
            } else {
              // Hay inspección anterior - mostrar advertencia pero permitir continuar
              setAlertaInspeccionHoy(true);
              setBloquearFormulario(false);
              setInspeccionHoyRealizada(false);
              setUltimaFechaInspeccion(ultimaFechaInspeccionX.fecha_registro);
            }
          } else {
            // No hay inspecciones previas
            setAlertaInspeccionHoy(false);
            setBloquearFormulario(false);
            setInspeccionHoyRealizada(false);
            setUltimaFechaInspeccion(null);
          }
        } catch (error) {
          //console.error('[ModalInspeccionNeu] Error verificando inspección:', error); // <-- Comentado
          // En caso de error, permitir continuar
          setAlertaInspeccionHoy(false);
          setBloquearFormulario(false);
          setInspeccionHoyRealizada(false);
          setUltimaFechaInspeccion(null);
        }
      };

      verificarInspeccionPorBackend();
      // verificarInspeccionPorBackend();
    } else {
      // Resetear estados cuando el modal se cierre o no haya placa
      setAlertaInspeccionHoy(false);
      setBloquearFormulario(false);
      setInspeccionHoyRealizada(false);
      setUltimaFechaInspeccion(null);
      // CLEANUP CRÍTICO: Limpiar cache de inspecciones pendientes al cerrar
      if (!open) {
        setInspeccionesPendientes([]);
        setFormValues({
          kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: '', tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
        });
        setFormValuesInicial(null);
        setNeumaticoSeleccionado(null);
      }
    }
  }, [open, placa]);

  // 1. Agrega un estado fijo para el kilometraje mínimo permitido
  // const [minKilometro, setMinKilometro] = useState(0);

  // Cuando se selecciona un neumático, llenar el formulario con datos completos de neu_asignado
  const handleSeleccionarNeumatico = async (neumatico: any) => {
    // Buscar si ya existe inspección local para esta posición
    const inspeccionLocal = inspeccionesPendientes.find(i => i.posicion === (neumatico.POSICION || neumatico.POSICION_NEU));


    if (inspeccionLocal) {
      // Si existe, cargar los datos guardados localmente
      setNeumaticoSeleccionado(neumatico);
      setFormValues({ ...inspeccionLocal });
      setOdometro(Number(inspeccionLocal.kilometro));
      // setMinKilometro(Number(inspeccionLocal.kilometro));
      setRemanenteAsignacionReal(inspeccionLocal.remanente_referencia ?? null);
      setKmError(false);
      setRemanenteError(false);
      setFormValuesInicial({ ...inspeccionLocal });
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
    let torqueUltimoMovimiento = '';
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
      torqueUltimoMovimiento = finalData.TORQUE_APLICADO ? finalData.TORQUE_APLICADO.toString() : ''; // Cargar torque
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
    // Eliminada la restricción de RES01: ahora se guarda igual, pero los campos ya están bloqueados en el formulario
    if (!hayCambiosFormulario && neumaticoSeleccionado.POSICION !== 'RES01') {
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
      toast.error(`El valor de la presión no puede ser menor a 25 o mayor que 50.`)
      return;
    }

    if (torqueError) {
      toast.error(`El valor de la torque no puede ser menor a 110 o mayor que 150.`)
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

    // --- NAVEGACIÓN AUTOMÁTICA ACTUALIZADA ---
    const posicionesPrincipales = ['POS01', 'POS02', 'POS03', 'POS04'];
    const posicionRespaldo = 'RES01';

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
      // Si todas las principales están hechas, ir a RES01 si falta
      if (!posicionesInspeccionadas.includes(posicionRespaldo)) {
        siguientePendiente = neumaticosAsignados.find(n => n.POSICION === posicionRespaldo);
      }
    }

    if (siguientePendiente) {
      handleSeleccionarNeumatico(siguientePendiente);
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

    // validaciones
    // Consultar al backend si ya existe inspección para la fecha seleccionada y este vehículo
    try {
      // Consultar para todos los códigos asignados y la fecha seleccionada

      // const results = await Promise.all(
      //   neumaticosAsignados.map(n => consultarInspeccionHoy({ codigo: n.CODIGO, placa, fecha: fechaSeleccionada }))
      // );

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

    // Ahora requerimos 5 inspecciones (incluyendo RES01)
    if (inspeccionesPendientes.length !== 5) {
      toast.error('Debe inspeccionar los 5 neumáticos (incluyendo el de repuesto) antes de enviar.')
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
        TORQUE_APLICADO: ins.torque ? parseFloat(ins.torque) : null,
        USUARIO_SUPER: user?.usuario || 'SISTEMA',
        VELOCIDAD: poNeu?.VELOCIDAD ?? null,
        COD_SUPERVISOR: vehiculo?.cod_supervisor,
        ID_OPERACION: vehiculo?.id_operacion,
        FECHA_INSPECCION: formatDate(fechaInspeccionGlobal) || null,
        TIPO_TERRENO: vehiculo?.tipo_terreno,
        RETEN: vehiculo?.reten
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
  // Para RES01, los campos no son editables, pero permitimos guardar la inspección (camposRequeridosLlenos siempre true para RES01)
  const camposRequeridosLlenos = esRES01 ? true : !!(
    formValues.remanente &&
    formValues.presion_aire &&
    formValues.torque &&
    formValues.observacion
  );

  // Estado para advertencia de cantidad de neumáticos
  const [advertenciaPosiciones, setAdvertenciaPosiciones] = useState<{ open: boolean; faltan: number }>({ open: false, faltan: 0 });
  const [cantidadPosicionesValidas, setCantidadPosicionesValidas] = useState(0);

  // Al abrir el modal o cambiar la placa, verificar si hay 4 posiciones ocupadas
  React.useEffect(() => {
    if (open && placa) {
      obtenerUltimosMovimientosPorPosicion(placa)
        .then((data: any[]) => {
          const posiciones = Array.isArray(data)
            ? Array.from(new Set(data.map(n => n.POSICION_NEU || n.POSICION)))
            : [];

          setCantidadPosicionesValidas(posiciones.length);
          if (posiciones.length < 4) {
            setAdvertenciaPosiciones({ open: true, faltan: 4 - posiciones.length });
            // Bloquear cualquier validación de inspección si faltan posiciones
            setAlertaInspeccionHoy(false);
            setBloquearFormulario(true);
            setInspeccionHoyRealizada(false);
            setUltimaFechaInspeccion(null);
            return; // IMPORTANTE: no continuar con más validaciones
          } else {
            setAdvertenciaPosiciones({ open: false, faltan: 0 });
            setBloquearFormulario(false);
          }
        })
        .catch((err) => {
          setAdvertenciaPosiciones({ open: false, faltan: 0 });
          setCantidadPosicionesValidas(0);
        });
    } else {
      setAdvertenciaPosiciones({ open: false, faltan: 0 });
      setCantidadPosicionesValidas(0);
    }
  }, [open, placa]);

  // Solo ejecutar la validación de inspección si hay 4 posiciones válidas y no hay advertencia de cantidad
  useEffect(() => {
    if (open && placa && cantidadPosicionesValidas === 4 && !advertenciaPosiciones.open) {
      const hoyF = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const verificarInspeccionPorBackend = async () => {
        try {
          const ultimaFechaInspeccionY = await getUltimaFechaInspeccionPorPlaca(placa);
          if (ultimaFechaInspeccionY?.fecha_asignacion) {
            if (ultimaFechaInspeccionY?.fecha_asignacion === hoyF) {
              setAlertaInspeccionHoy(true);
              setBloquearFormulario(true);
              setInspeccionHoyRealizada(true);
              setUltimaFechaInspeccion(ultimaFechaInspeccionY?.fecha_asignacion);
            } else {
              setAlertaInspeccionHoy(true);
              setBloquearFormulario(false);
              setInspeccionHoyRealizada(false);
              setUltimaFechaInspeccion(ultimaFechaInspeccionY?.fecha_asignacion);
            }
          } else {
            setAlertaInspeccionHoy(false);
            setBloquearFormulario(false);
            setInspeccionHoyRealizada(false);
            setUltimaFechaInspeccion(null);
          }
        } catch (error) {
          setAlertaInspeccionHoy(false);
          setBloquearFormulario(false);
          setInspeccionHoyRealizada(false);
          setUltimaFechaInspeccion(null);
        }
      };
      verificarInspeccionPorBackend();
    } else if (cantidadPosicionesValidas < 4) {
      // Si se reduce la cantidad de posiciones válidas, bloquear todo
      setAlertaInspeccionHoy(false);
      setBloquearFormulario(true);
      setInspeccionHoyRealizada(false);
      setUltimaFechaInspeccion(null);
    }
  }, [open, placa, cantidadPosicionesValidas, advertenciaPosiciones.open]);

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
        onAssignedUpdate={() => {
          listarNeumaticosAsignados(placa).then(setNeuAsignados);
          setAdvertenciaPosiciones({ open: false, faltan: 0 });
        }}
      />
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {/* <DialogTitle sx={{ fontWeight: 'bold', color: '#388e3c' }}>Inspección de Neumáticos</DialogTitle> */}

        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

        <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 2,
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            flexShrink: 0,
          }}>
            <ClipboardList size={20} className="text-blue-600" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Registrar Inspección de Neumáticos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
              <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
              <Chip
                label={placa}
                size="small"
                sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
              />
            </Box>
            <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
              <span className='font-bold'>Nota: </span>
              Para guardar temporalmente la inspección de cada neumático, debes darle click al boton <b>siguiente posición</b>.
            </Typography>
          </Box>
        </DialogTitle>


        <DialogContent>
          <Stack direction="row" spacing={2}>
            <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px', marginTop: '10px' }}>
              <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Datos del vehículo</Typography>

                  {/* <h1>Kilometraje q me importa:{kilometroRealActual}</h1> */}

                  {vehiculo ? (
                    <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Marca</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.marca}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Modelo</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.modelo}</Typography>
                      </Box>
                      {vehiculo?.proyecto && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Proyecto</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.proyecto}</Typography>
                        </Box>
                      )}
                      {vehiculo?.operacion && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Operación</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.operacion}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="text.secondary">Año</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.anio}</Typography>
                      </Box>
                      {vehiculo?.color && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Color</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.color}</Typography>
                        </Box>
                      )}

                      {vehiculo?.kilometro !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Kilometraje</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.kilometro.toLocaleString()} km</Typography>
                        </Box>
                      )}

                      {vehiculo?.tipo_terreno !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Tipo de terreno</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.tipo_terreno}</Typography>
                        </Box>
                      )}

                      {vehiculo?.reten !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Condición</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.reten}</Typography>
                        </Box>
                      )}

                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No hay datos del vehículo.</Typography>
                  )}
                </Box>
              </Card>
              <Card sx={{ p: 2 }}>
                <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
                  <TextField label="Posición" name="posicion" size="small" value={formValues.posicion} inputProps={{ readOnly: true, style: { minWidth: `${formValues.posicion.length + 3}ch` } }} disabled />
                  <TextField label="Código" name="codigo" size="small" value={formValues.codigo} inputProps={{ readOnly: true, style: { minWidth: `${formValues.codigo.length + 3}ch` } }} disabled />
                  <TextField label="Marca" name="marca" size="small" value={formValues.marca} inputProps={{ readOnly: true, style: { minWidth: `${formValues.marca.length + 3}ch` } }} disabled />
                  <TextField label="Medida" name="medida" size="small" value={formValues.medida} inputProps={{ readOnly: true, style: { minWidth: `${formValues.medida.length + 3}ch` } }} disabled />
                  <TextField label="Diseño" name="diseño" size="small" value={formValues.diseño} inputProps={{ readOnly: true, style: { minWidth: `${formValues.diseño.length + 3}ch` } }} disabled />
                  <TextField
                    label="Remanente"
                    name="remanente"
                    size="small"
                    value={formValues.remanente}
                    onChange={e => {
                      if (esRES01) return;
                      const value = e.target.value.replace(/,/g, '.'); // Permitir punto decimal
                      // Permitir solo números y hasta 2 decimales
                      if (!/^\d*(\.?\d{0,2})?$/.test(value)) return;
                      setFormValues(prev => ({ ...prev, remanente: value }));
                    }}
                    error={remanenteError}
                    helperText={
                      remanenteError
                        ? (formValues.posicion === 'RES01' || neumaticoSeleccionado?.POSICION === 'RES01')
                          ? `El remanente no puede ser mayor al anterior (${valorReferenciaRemanente})`
                          : `El remanente debe ser MENOR al anterior (${valorReferenciaRemanente})`
                        : `Anterior: ${valorReferenciaRemanente ?? '-'}`
                    }
                    inputProps={{
                      style: { minWidth: `${String(formValues.remanente).length + 3}ch` },
                      inputMode: 'decimal',
                      pattern: "^\\d*(\\.\\d{0,2})?$"
                    }}
                    disabled={bloquearFormulario || esRES01}
                  />
                  <TextField
                    label="Presión de Aire (psi)"
                    name="presion_aire"
                    type="number"
                    size="small"
                    value={formValues.presion_aire ?? ''}
                    onChange={(e) => {
                      if (esRES01) return;
                      const value = Number(e.target.value);
                      setFormValues(prev => ({ ...prev, presion_aire: e.target.value }));
                      if (value < 25 || value > 50) {
                        setPresionError(true);
                      } else {
                        setPresionError(false);
                      }
                    }}
                    error={presionError}
                    helperText={presionError ? 'Debe estar entre 25 y 50 psi' : 'Rango permitido: 25-50 psi'}
                    inputProps={{
                      min: 25,
                      max: 50,
                      style: { minWidth: `${(formValues.presion_aire ?? '').toString().length + 3}ch` }
                    }}
                    disabled={bloquearFormulario || esRES01}
                  />
                  <TextField
                    label="Torque (Nm)"
                    name="torque"
                    type="number"
                    size="small"
                    value={formValues.torque ?? ''}
                    onChange={(e) => {
                      if (esRES01) return;
                      const value = Number(e.target.value);
                      setFormValues(prev => ({ ...prev, torque: e.target.value }));
                      if (value < 110 || value > 150) {
                        setTorqueError(true);
                      } else {
                        setTorqueError(false);
                      }
                    }}
                    error={torqueError}
                    helperText={torqueError ? 'Debe estar entre 110 y 150 Nm' : 'Recomendado: 110-150 Nm'}
                    inputProps={{
                      min: 110,
                      max: 150,
                      style: { minWidth: `${(formValues.torque ?? '').toString().length + 3}ch` }
                    }}
                    disabled={bloquearFormulario || esRES01}
                  />
                  {/* <TextField
                    label="Tipo Movimiento"
                    name="tipo_movimiento"
                    size="small"
                    value="INSPECCION"
                    InputProps={{ readOnly: true, style: { minWidth: `${'INSPECCION'.length + 3}ch` } }}
                    disabled
                  /> */}
                  <TextField label="Observación" name="observacion" size="small" multiline minRows={2} value={formValues.observacion} onChange={esRES01 ? undefined : handleInputChange} sx={{ gridColumn: 'span 2' }} disabled={bloquearFormulario || esRES01} />
                </Box>
              </Card>
            </Stack>
            {/* Columna derecha: Imagen o visualización */}
            <Card sx={{
              flex: 0.5,
              p: 2,
              position: 'relative',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              maxWidth: 400,
              minWidth: 320,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              marginTop: '10px'
            }}>
              {/* Contenedor horizontal: barra de botones a la izquierda y diagrama a la derecha */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
                {/* Barra de posiciones en columna */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mr: 3, mt: 2 }}>
                  {/* Mostrar posiciones en orden fijo: POS01, POS02, POS03, POS04, RES01 */}
                  {['POS01', 'POS02', 'POS03', 'POS04', 'RES01'].map((pos, idx) => {
                    // Buscar el neumático "activo" de esa posición, igual que el dropzone
                    // Prioridad: INSPECCION > ASIGNADO > el más reciente por FECHA_MOVIMIENTO

                    const neumaticosPos = neumaticosAsignados.filter(n => n.POSICION === pos);

                    if (neumaticosPos.length === 0) return null;

                    let n = neumaticosPos.find(n => n.TIPO_MOVIMIENTO === 'INSPECCION')
                      || neumaticosPos.find(n => n.TIPO_MOVIMIENTO === 'ASIGNADO' || n.TIPO_MOVIMIENTO === 'ASIGNACION')
                      || neumaticosPos.slice().sort((a, b) => {
                        const fa = new Date(a.FECHA_MOVIMIENTO || a.FECHA_ASIGNACION || a.FECHA_REGISTRO || 0).getTime();
                        const fb = new Date(b.FECHA_MOVIMIENTO || b.FECHA_ASIGNACION || b.FECHA_REGISTRO || 0).getTime();
                        return fb - fa;
                      })[0];

                    if (!n) n = neumaticosPos[0];

                    const inspeccionada = inspeccionesPendientes.some(i => i.posicion === n.POSICION);

                    return (
                      <Button
                        key={`${n.POSICION}-${n.CODIGO}-${n.FECHA_MOVIMIENTO || idx}`}
                        variant={formValues.posicion === n.POSICION ? 'contained' : 'outlined'}
                        color={inspeccionada ? 'success' : (n.POSICION === 'RES01' ? 'warning' : 'secondary')}
                        size="medium"
                        sx={{
                          minWidth: 90,
                          maxWidth: 180,
                          px: 2,
                          py: 1.2,
                          fontWeight: 'bold',
                          borderRadius: '16px',
                          fontSize: 16,
                          textTransform: 'none',
                          boxShadow: formValues.posicion === n.POSICION ? 2 : 0,
                          borderColor: '#fff',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          backgroundColor: formValues.posicion === n.POSICION ? (n.POSICION === 'RES01' ? '#D4D422' : '#17C278') : undefined,
                          color: `${formValues.posicion === n.POSICION ? '#fff' : '#222'}`,
                        }}
                        onClick={() => {
                          if (formValues.posicion === n.POSICION) return;
                          handleSeleccionarNeumatico(n);
                        }}
                      >
                        {n.POSICION === 'RES01' ? 'RES' : n.POSICION}
                        {inspeccionada && (
                          <span style={{ marginLeft: 6, fontSize: 18, color: '#000' }}>
                            <CheckCircle />
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </Box>
                {/* Diagrama y placa */}
                <Box sx={{ position: 'relative', width: '234px', height: '430px' }}>
                  <DiagramaVehiculo
                    neumaticosAsignados={neumaticosAsignados}
                    layout="modal"
                    tipoModal="inspeccion"
                    onPosicionClick={n => {
                      handleSeleccionarNeumatico(n);
                    }}
                    onMantenimientoClick={() => {
                      // Mantenimiento functionality removed
                    }}
                  />
                  <Image src='/assets/placa.png' alt='Placa' width={120} height={60} style={{
                    objectFit: 'contain',
                    position: 'absolute',
                    top: '10px',
                    right: '68px',
                    zIndex: 2,
                  }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '24px',
                      right: '74px',
                      zIndex: 3,
                      color: 'black',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      fontFamily: 'Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {placa}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', paddingX: '30px', paddingY: '10px' }}>

            <TextField
              label="Fecha de inspección"
              name="fecha_inspeccion"
              size="small"
              type="date"
              value={formValues.fecha_inspeccion}
              onChange={e => {
                const value = e.target.value;
                setFormValues(prev => ({ ...prev, fecha_inspeccion: value }));
                setFechaInspeccionError(validarFechaInspeccion(value));
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: fechaMinEfectiva,
                max: fechaLimiteMax,
              }}
              sx={{ minWidth: 180, mr: 2 }}
              disabled={
                bloquearFormulario ||
                !inspeccionesPendientes.some(i => i.posicion === 'RES01')
              }
              error={!!fechaInspeccionError}
              helperText={fechaInspeccionError || (fechaMinEfectiva > fechaLimiteMax
                ? `Fecha de asignación a partir de ${convertToDateHuman(fechaMinEfectiva)}`
                : `Rango válido: ${convertToDateHuman(fechaMinEfectiva)} a ${convertToDateHuman(fechaLimiteMax)}`)}
            />
            <TextField
              label="Kilometraje"
              type="number"
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
              sx={{ minWidth: 180, mr: 2 }}
              disabled={
                bloquearFormulario ||
                !inspeccionesPendientes.some(i => i.posicion === 'RES01')
              }
            />
            <div className='flex flex-col gap-2'>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  minWidth: 140,
                  whiteSpace: 'nowrap',
                  fontWeight: 'normal',
                  display: 'block',
                  mr: 2
                }}
              >
                {`Kilometro actual: ${initialOdometro.toLocaleString()} km`}
              </Typography>
              {kmError && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'error.main',
                    minWidth: 180,
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    display: 'block',
                    mr: 2
                  }}
                >
                  <span>{`El kilometraje debe ser mayor que ${initialOdometro.toLocaleString()} km`}</span>
                  <br />
                  <span>{`y menor que ${(initialOdometro + 25000).toLocaleString()} km`}</span>
                </Typography>
              )}
            </div>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>

              <ButtonCustom
                variant={'teal'}
                onClick={handleGuardarInspeccionLocal}
                disabled={
                  !hayCambiosFormulario || bloquearFormulario || kmError || !camposRequeridosLlenos || inspeccionesPendientes.length >= 5
                }

              >
                <CircleCheckBig />
                Siguiente posición
              </ButtonCustom>

              <LoadingButton2
                variant="primary"
                onClick={handleEnviarYGuardar}
                disabled={inspeccionesPendientes.length !== 5 || bloquearFormulario || kmError}
                icon={<ListChecks />}
              >
                Registrar Inspección
              </LoadingButton2>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
      {/* Modal de asignación de neumáticos (debes reemplazarlo por tu modal real) */}
      {/* <ModalAsignacionNeumatico open={openAsignacion} onClose={() => setOpenAsignacion(false)} placa={placa} /> */}
    </>
  );
});

export default ModalInpeccionNeu;
