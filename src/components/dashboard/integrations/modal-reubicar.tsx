import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Dialog, DialogContent, Typography, Stack, Box, Card,
  DialogTitle,
  Chip, useMediaQuery, useTheme
} from '@mui/material';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { Neumatico, Vehiculo, User } from '../../../types/types';
import {
  registrarReubicacionNeumatico,
  getUltimaFechaInspeccionPorPlaca
} from '../../../api/Neumaticos';
import { toast } from 'sonner';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { ArrowLeftRight, BadgeAlert, Car, ClipboardList, MapPinned, Repeat2, X } from 'lucide-react';
import { obtenerConfiguracionNeumaticos } from '@/utils/configuraciones-neumaticos';
import { ModalInformacionReubicacion } from './modal-informacion-reubicacion';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

interface ModalReubicarProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback solo cuando la acción se completa exitosamente
  neumaticosAsignados: Neumatico[];
  placa: string;
  vehiculo?: Vehiculo;
  user?: User;
  onAbrirInspeccion?: () => void;
  enTransito: boolean,
  taller?: string;
}

export const ModalReubicar: React.FC<ModalReubicarProps> = memo(({
  open,
  onClose,
  onSuccess,
  neumaticosAsignados,
  placa,
  vehiculo,
  user,
  onAbrirInspeccion,
  enTransito,
  taller
}) => {

  const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<Neumatico[]>([]);
  const [initialAssignedMap, setInitialAssignedMap] = useState<Record<string, Neumatico>>({});
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<string>('');
  const [reubicacionBloqueada, setReubicacionBloqueada] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false)

  // Estados para control de arrastrar y soltar
  const [posicionOriginal, setPosicionOriginal] = useState<string | null>(null);
  const [codigoOriginal, setCodigoOriginal] = useState<string | null>(null);
  const [swapInfo, setSwapInfo] = useState<{ from: string; to: string } | null>(null);

  // Estados para formulario
  const [observacion, setObservacion] = useState<string>('');


  // Estado para forzar re-renderización visual
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado directo para DiagramaVehiculo (sincronización inmediata)
  const [diagramaData, setDiagramaData] = useState<Neumatico[]>([]);

  // Estado para mapa de posiciones ocupadas
  const [posicionesOcupadas, setPosicionesOcupadas] = useState<Map<string, Neumatico>>(new Map());

  // En pantallas chicas arrastrar es poco práctico: se usa un panel de posiciones con botones
  // (sacar / colocar / mover) que ejecuta exactamente las mismas operaciones que el drag&drop.
  const theme = useTheme();
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('lg'));
  // Reubicación por selección: se elige la posición de origen y luego la de destino.
  const [posicionSeleccionada, setPosicionSeleccionada] = useState<string | null>(null);

  // Inicializar state cuando se abre el modal
  useEffect(() => {
    if (open && neumaticosAsignados && neumaticosAsignados.length > 0) {

      // Limpiar duplicados - usar Map para mejor control
      const neumaticosMap = new Map<string, Neumatico>();

      // Procesar todos los neumáticos y mantener solo el de mayor ID_MOVIMIENTO por código
      neumaticosAsignados.forEach(neu => {
        const codigo = neu.CODIGO_NEU || neu.CODIGO;
        if (!codigo) return;

        const existente = neumaticosMap.get(codigo);
        if (!existente || (neu.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
          neumaticosMap.set(codigo, { ...neu });
        }
      });

      const neumaticosLimpios = Array.from(neumaticosMap.values());

      // Verificar y limpiar duplicados por posición (mantener solo el más reciente)
      const posicionesMap = new Map<string, Neumatico>();
      const neumaticosFinales: Neumatico[] = [];

      neumaticosLimpios.forEach(neu => {
        if (neu.POSICION && neu.POSICION.startsWith('POS')) {
          const existenteEnPosicion = posicionesMap.get(neu.POSICION);
          if (!existenteEnPosicion || (neu.ID_MOVIMIENTO || 0) > (existenteEnPosicion.ID_MOVIMIENTO || 0)) {
            posicionesMap.set(neu.POSICION, neu);
          }
        } else {
          neumaticosFinales.push(neu);
        }
      });

      // Agregar neumáticos de posiciones limpias
      posicionesMap.forEach(neu => neumaticosFinales.push(neu));


      // Usar setNeumaticosAsignadosState directamente aquí porque es la inicialización
      setNeumaticosAsignadosState(neumaticosFinales);

      // Crear mapa inicial de posiciones -> neumáticos (incluir POS y RES)
      const mapa: Record<string, Neumatico> = {};
      neumaticosFinales.forEach(neu => {
        if (neu.POSICION && (neu.POSICION.startsWith('POS') || neu.POSICION.startsWith('RES')) && neu.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && neu.TIPO_MOVIMIENTO !== 'RECUPERADO') {
          mapa[neu.POSICION] = { ...neu };
        }
      });
      setInitialAssignedMap(mapa);

      // Inicializar posicionesOcupadas con Map (incluye POS y RES)
      const mapaOcupadas = new Map<string, Neumatico>();
      Object.entries(mapa).forEach(([pos, neu]) => {
        mapaOcupadas.set(pos, neu);
      });
      setPosicionesOcupadas(mapaOcupadas);

      // Inicializar diagramaData con datos del mapa
      const initialDiagramaData = Array.from(Object.entries(mapa)).map(([pos, neu]) => ({
        ...neu,
        POSICION: pos,
        POSICION_NEU: pos,
      }));
      setDiagramaData(initialDiagramaData);

      // Limpiar selección y observación cuando se abre el modal
      setPosicionSeleccionada(null);
      setObservacion('');
    }
  }, [open]);

  // Obtener fecha de última inspección
  useEffect(() => {
    if (open && placa) {
      obtenerYSetearUltimaInspeccionPorPlaca(placa).then(fecha => {
        if (fecha) {
          setFechaUltimaInspeccion(fecha);
        }
      });
    }
  }, [open, placa]);

  // Efecto para sincronizar DiagramaVehiculo inmediatamente
  useEffect(() => {
    // Convertir mapa a array para DiagramaVehiculo
    const arrayFromMap = Array.from(posicionesOcupadas.entries()).map(([pos, neu]) => ({
      ...neu,
      POSICION: pos,
      POSICION_NEU: pos,
      _syncTime: Date.now() // Forzar nueva referencia
    }));

    setDiagramaData(arrayFromMap);
    setRefreshKey(prev => prev + 1);
  }, [posicionesOcupadas]);

  // Verificar bloqueo de reubicación
  const verificarBloqueoReubicacion = async (fechaInspeccion: string) => {
    // placa,
    if (!fechaInspeccion) {
      setReubicacionBloqueada(true);
      return;
    }

    const hoy = getLocalDateString();
    const dias = daysBetween(fechaInspeccion, hoy);

    if (dias > 4) {
      setReubicacionBloqueada(true);
    } else {
      setReubicacionBloqueada(false);
    }
  };

  // Verificar bloqueo cuando cambie la fecha de inspección
  useEffect(() => {
    if (fechaUltimaInspeccion && placa) {
      verificarBloqueoReubicacion(fechaUltimaInspeccion);
      // placa,
    }
  }, [fechaUltimaInspeccion, placa]);

  // Función helper para actualizar estados sincronizados
  const actualizarEstados = (nuevosNeumaticos: Neumatico[]) => {
    setNeumaticosAsignadosState(nuevosNeumaticos);

    // Sincronizar posicionesOcupadas inmediatamente (incluir POS y RES)
    const nuevoPosicionesMap = new Map<string, Neumatico>();
    nuevosNeumaticos.forEach(neu => {
      if (neu.POSICION && (neu.POSICION.startsWith('POS') || neu.POSICION.startsWith('RES'))) {
        nuevoPosicionesMap.set(neu.POSICION, neu);
      }
    });
    setPosicionesOcupadas(nuevoPosicionesMap);

  };

  /**
   * Mueve el neumático de `origen` a `destino`. Si el destino está ocupado, ambos
   * intercambian posición. El payload se arma comparando el estado inicial con el
   * final, así que un intercambio genera los dos movimientos correspondientes.
   */
  const intercambiarPosiciones = (origen: string, destino: string) => {
    if (!origen || !destino || origen === destino) return;

    const neuOrigen = neumaticosAsignadosState.find(n => n.POSICION === origen);
    if (!neuOrigen) return;

    const neuDestino = neumaticosAsignadosState.find(n => n.POSICION === destino);
    const codigoOrigen = neuOrigen.CODIGO_NEU || neuOrigen.CODIGO;
    const codigoDestino = neuDestino ? (neuDestino.CODIGO_NEU || neuDestino.CODIGO) : null;

    const nuevosNeumaticos = neumaticosAsignadosState.map(n => {
      const codigo = n.CODIGO_NEU || n.CODIGO;
      if (codigo === codigoOrigen) return { ...n, POSICION: destino };
      if (codigoDestino && codigo === codigoDestino) return { ...n, POSICION: origen };
      return n;
    });

    actualizarEstados(nuevosNeumaticos);
  };

  /** Primer clic elige el neumático a mover; el segundo, su destino. */
  const handleClickPosicion = (posicion: string) => {
    if (!posicion) return;

    if (!posicionSeleccionada) {
      const ocupada = neumaticosAsignadosState.find(n => n.POSICION === posicion);
      if (!ocupada) {
        toast.info('Selecciona primero el neumático que quieres mover.');
        return;
      }
      setPosicionSeleccionada(posicion);
      return;
    }

    if (posicionSeleccionada === posicion) {
      setPosicionSeleccionada(null);
      return;
    }

    intercambiarPosiciones(posicionSeleccionada, posicion);
    setPosicionSeleccionada(null);
  };

  const handleReturnNormalizedPayload = (dateUltimaInspeccion: string) => {

    // Validar que hay cambios
    const movimientos: any[] = [];
    const movimientosPorCodigo = new Map<string, any>();

    const posiciones = Object.keys(initialAssignedMap);
    for (const pos of posiciones) {
      const neuInicial = initialAssignedMap[pos];
      if (neuInicial && (neuInicial.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neuInicial.TIPO_MOVIMIENTO === 'RECUPERADO')) {
        continue;
      }

      const neuFinal = neumaticosAsignadosState.find(n =>
        n.POSICION === pos && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO'
      );

      if (neuFinal && (!neuInicial || (neuFinal.CODIGO_NEU || neuFinal.CODIGO) !== (neuInicial.CODIGO_NEU || neuInicial.CODIGO))) {
        const codigoNeu = neuFinal.CODIGO_NEU || neuFinal.CODIGO;
        const fullNeu = neumaticosAsignadosState.find(n =>
          (n.CODIGO_NEU || n.CODIGO) === codigoNeu
        );

        if (!fullNeu || movimientosPorCodigo.has(codigoNeu)) continue;

        const posAnterior = Object.keys(initialAssignedMap).find(
          key => (initialAssignedMap[key]?.CODIGO_NEU || initialAssignedMap[key]?.CODIGO) === codigoNeu
        ) || '';

        let fechaAsignacionOriginal = '';

        for (const key of Object.keys(initialAssignedMap)) {
          const n = initialAssignedMap[key];
          if (n && (n.CODIGO_NEU || n.CODIGO) === codigoNeu) {
            fechaAsignacionOriginal = n.FECHA_ASIGNACION || n.FECHA_REGISTRO || '';
            break;
          }
        }

        const movimiento = {
          CODIGO: fullNeu.CODIGO_NEU || fullNeu.CODIGO,
          MARCA: fullNeu.MARCA,
          MEDIDA: fullNeu.MEDIDA,
          DISEÑO: fullNeu.DISEÑO,
          REMANENTE: fullNeu.REMANENTE,
          PR: fullNeu.PR,
          CARGA: fullNeu.CARGA,
          VELOCIDAD: fullNeu.VELOCIDAD,
          FECHA_FABRICACION: fullNeu.FECHA_FABRICACION,
          RQ: fullNeu.RQ,
          OC: fullNeu.OC,
          PROYECTO: vehiculo?.proyecto || '',
          COSTO: fullNeu.COSTO,
          PROVEEDOR: fullNeu.PROVEEDOR,
          FECHA_REGISTRO: dateUltimaInspeccion ? dateUltimaInspeccion.slice(0, 10) : new Date().toISOString().slice(0, 10),
          FECHA_COMPRA: fullNeu.FECHA_COMPRA,
          USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
          PRESION_AIRE: fullNeu.PRESION_AIRE,
          TORQUE_APLICADO: fullNeu.TORQUE_APLICADO,
          ESTADO: fullNeu.ESTADO,
          PLACA: placa,
          POSICION_NEU: posAnterior,
          POSICION_INICIAL: posAnterior,
          POSICION_FIN: pos,
          DESTINO: vehiculo?.proyecto || '',
          FECHA_ASIGNACION: fechaAsignacionOriginal,
          KILOMETRO: fullNeu.KILOMETRO,
          FECHA_MOVIMIENTO: getPeruLocalISOString(),
          OBSERVACION: observacion,
          ID_OPERACION: vehiculo?.id_operacion,
          COD_SUPERVISOR: vehiculo?.cod_supervisor,
          TRANSITO: enTransito,
          TALLER: taller
        };

        movimientosPorCodigo.set(codigoNeu, movimiento);
        movimientos.push(movimiento);
      }
    }
    const normalizedPayloadArray = movimientos.map(normalizePayload);
    return normalizedPayloadArray
  }

  const verifyClickToConfirm = (): boolean => {
    if (!fechaUltimaInspeccion) return false
    const normalizedPayloadArray = handleReturnNormalizedPayload(fechaUltimaInspeccion);
    if (!normalizedPayloadArray) return false
    if (normalizedPayloadArray.length === 0) return false
    return true
  }

  // Handler para guardar reubicación
  const handleGuardarReubicacion = async () => {

    if (!fechaUltimaInspeccion) {
      toast.error('No se puede reubicar: primero debe existir una inspección válida.');
      return;
    }

    try {
      const normalizedPayloadArray = handleReturnNormalizedPayload(fechaUltimaInspeccion);

      if (!normalizedPayloadArray) return;
      if (normalizedPayloadArray.length === 0) {
        toast.info('No hay cambios de posición para registrar.');
        return;
      }

      await registrarReubicacionNeumatico(normalizedPayloadArray);

      toast.success('Reubicación registrada correctamente', {
        duration: 6000,
        position: 'top-right'
      })

      setOpenDialog(false);
      setPosicionOriginal(null);
      setCodigoOriginal(null);
      setSwapInfo(null);

      // Refrescar inspección y bloqueo
      if (placa) {
        const nuevaFecha = await obtenerYSetearUltimaInspeccionPorPlaca(placa);
        if (nuevaFecha) {
          await verificarBloqueoReubicacion(nuevaFecha);
        }
      }
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(String(error));
      }
    }
  };

  // Filtro para neumáticos sin posición
  const neumaticosSinPosicionFiltrados = useMemo(() => {
    const sinPos = neumaticosAsignadosState.filter(n =>
      (!n.POSICION || n.POSICION === '') &&
      n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' &&
      n.TIPO_MOVIMIENTO !== 'RECUPERADO'
    );

    const porCodigo = Object.values(
      sinPos.reduce((acc: Record<string, Neumatico>, curr) => {
        const cod = curr.CODIGO_NEU || curr.CODIGO;
        if (!cod) return acc;
        if (!acc[cod] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[cod].ID_MOVIMIENTO ?? 0))) {
          acc[cod] = curr;
        }
        return acc;
      }, {})
    );

    return porCodigo.filter(n =>
      n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' &&
      n.TIPO_MOVIMIENTO !== 'RECUPERADO'
    );
  }, [neumaticosAsignadosState]);

  // Utilidades de fecha
  function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function daysBetween(date1: string, date2: string) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getPeruLocalISOString() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const get = (type: string) => parts.find(p => p.type === type)?.value.padStart(2, '0');
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }



  // Función para manejar cierre del modal
  const handleClose = () => {
    setPosicionSeleccionada(null);
    onClose();
  };

  // Posiciones del vehículo (catálogo por cantidad de neumáticos; si no llega, las que ya existían).
  const posicionesVehiculo = useMemo(() => {
    const config = obtenerConfiguracionNeumaticos(vehiculo?.cantidad_neumaticos);
    if (config) return config.posiciones.map(p => p.codigo);
    return Object.keys(initialAssignedMap).sort();
  }, [vehiculo?.cantidad_neumaticos, initialAssignedMap]);

  const neumaticoSeleccionado = posicionSeleccionada
    ? neumaticosAsignadosState.find(n => n.POSICION === posicionSeleccionada)
    : undefined;

  /** Lista de posiciones: elegir origen y luego destino (mueve o intercambia). */
  const panelPosiciones = (
    <div className="w-full">
      {neumaticoSeleccionado ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border-2 border-violet-300 bg-linear-to-br from-violet-50 via-white to-violet-50 p-3">
          <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-xs font-bold text-white">{posicionSeleccionada}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">
              {neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO}
              <span className="ml-2 text-xs font-normal text-slate-500">{neumaticoSeleccionado.MARCA}</span>
            </p>
            <p className="text-xs text-slate-500">Elige la posición de destino. Si está ocupada, se intercambian.</p>
          </div>
          <ButtonCustom variant="ghost" size="sm" onClick={() => setPosicionSeleccionada(null)} title="Cancelar">
            <X className="h-3.5 w-3.5" />
          </ButtonCustom>
        </div>
      ) : (
        <p className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Elige el neumático que quieres mover —desde el diagrama o esta lista— y luego su posición de destino.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {posicionesVehiculo.map((pos) => {
          const neu = neumaticosAsignadosState.find(n => n.POSICION === pos);
          const ocupada = Boolean(neu);
          const esOrigen = posicionSeleccionada === pos;

          return (
            <div
              key={pos}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${esOrigen ? 'border-violet-300 bg-violet-50' : ocupada ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'
                }`}
            >
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${ocupada ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {pos}
              </span>

              <div className="min-w-0 flex-1">
                {ocupada ? (
                  <>
                    <p className="truncate text-sm font-semibold text-slate-800">{neu!.CODIGO_NEU || neu!.CODIGO}</p>
                    <p className="truncate text-xs text-slate-500">{neu!.MARCA || '—'}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Libre</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {esOrigen ? (
                  <ButtonCustom variant="ghost" size="sm" onClick={() => setPosicionSeleccionada(null)}>
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </ButtonCustom>
                ) : posicionSeleccionada ? (
                  <ButtonCustom variant="indigo" size="sm" onClick={() => handleClickPosicion(pos)}>
                    {ocupada ? <Repeat2 className="h-3.5 w-3.5" /> : null}
                    {ocupada ? 'Intercambiar' : 'Mover aquí'}
                  </ButtonCustom>
                ) : ocupada ? (
                  <ButtonCustom variant="outline" size="sm" onClick={() => setPosicionSeleccionada(pos)}>
                    Mover
                  </ButtonCustom>
                ) : (
                  <span className="px-2 text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      fullScreen={esPantallaChica}
      PaperProps={{
        sx: { borderRadius: { xs: 0, lg: 3 }, overflow: 'hidden' }
      }}
    >

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
            Registrar Reubicación de Neumáticos
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
            Elige un neumático y luego su posición de destino: si esa posición está ocupada, ambos <b>se intercambian</b>.
          </Typography>
        </Box>

        <ButtonCustom
          variant="ghost"
          size="icon"
          onClick={handleClose}
          title="Cerrar"
          aria-label="Cerrar"
          className="shrink-0 self-start text-slate-400 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </ButtonCustom>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1.5, md: 3 } }}>
          <Stack direction={{ xs: 'column-reverse', lg: 'row' }} spacing={2}>
            <Stack direction="column" spacing={2} sx={{
              flex: 1, width: { xs: '100%', lg: '350px' },
              maxWidth: { xs: '100%', lg: 400 }, minWidth: { xs: 0, lg: 320 },
              marginTop: '10px'
            }}>
              {/* Card de información del vehículo */}
              <Card sx={{
                p: { xs: 1.5, md: 2 }, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                maxWidth: { xs: '100%', lg: 400 }, minWidth: { xs: 0, lg: 320 }, width: '100%'
              }}>
                {vehiculo ? (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        {[vehiculo.color, vehiculo.proyecto, vehiculo.operacion]
                          .filter(Boolean)
                          .map((dato, i) => <span key={i}>{dato}</span>)}
                      </div>
                    </div>
                    {vehiculo?.kilometro !== undefined && (
                      <div className="shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-right shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Kilometraje</p>
                        <p className="text-sm font-bold text-blue-900">{vehiculo.kilometro.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No hay datos del vehículo.</p>
                )}
              </Card>
              {/* Error al registrar la reubicación: Error al registrar la reubicación: No se puede guardar: las posiciones RES01 quedarían vacías. Asigna neumáticos a estas posiciones antes de guardar. */}
              {/* Card para REUBICAR */}
              <Card sx={{
                p: { xs: 1.5, md: 2 }, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                maxWidth: { xs: '100%', lg: 400 }, minWidth: { xs: 0, lg: 320 }, width: '100%'
              }}>
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2">
                  <MapPinned className="h-4 w-4 shrink-0 text-violet-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-400 leading-tight">Fecha última inspección</p>
                    <p className="truncate text-sm font-semibold text-violet-900">
                      {convertToDateHuman(fechaUltimaInspeccion) || 'Sin registro'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <Field className="w-full">
                    <FieldLabel htmlFor="motivo-reubicacion">Motivo de la reubicación</FieldLabel>
                    <Textarea
                      id="motivo-reubicacion"
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      placeholder="Ej. Rotación programada, desgaste irregular..."
                      className="min-h-18 resize-none"
                    />
                  </Field>

                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-center gap-1.5">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-violet-500" />
                      <p className="text-sm font-semibold text-slate-700">Posiciones del vehículo</p>
                    </div>

                    {panelPosiciones}
                  </div>
                </div>

                <div className='mt-4 flex flex-col-reverse gap-2 sm:flex-row [&>button]:w-full sm:[&>button]:w-auto'>
                  <ButtonCustom
                    onClick={handleClose}
                  >
                    Cerrar
                  </ButtonCustom>

                  <LoadingButton2
                    variant="primary"
                    icon={<BadgeAlert />}
                    disabled={!verifyClickToConfirm()}
                    onClick={() => {
                      setOpenDialog(true)
                    }}
                  >
                    Confirmar Reubicación
                  </LoadingButton2>

                  {
                    openDialog && (
                      <ModalInformacionReubicacion
                        placa={placa}
                        fechaReubicacion={convertToDateHuman(fechaUltimaInspeccion) || 'Sin registro'}
                        neumaticos={
                          handleReturnNormalizedPayload(fechaUltimaInspeccion).map((neu) => {
                            return {
                              CodigoNeumatico: neu.CODIGO,
                              PosicionOrigen: neu.POSICION_INICIAL,
                              PosicionDestino: neu.POSICION_FIN,
                              Marca: neu.MARCA,
                              Medida: neu.MEDIDA,
                              Remanente: neu.REMANENTE,
                              TorqueAplicado: neu.TORQUE_APLICADO,
                              PresionAire: neu.PRESION_AIRE
                            }
                          })
                        }
                        onSuccessInspeccion={handleGuardarReubicacion}
                        open={openDialog}
                        onClose={() => setOpenDialog(false)}
                      />
                    )
                  }

                  {/* Nota */}
                  {/* <LoadingButton2
                    variant="primary"
                    onClick={handleGuardarReubicacion}
                  >
                    Guardar Reubicación
                  </LoadingButton2> */}
                  {/* Nota */}
                </div>

              </Card>
            </Stack>

            {/* Columna derecha: Diagrama del vehículo */}
            <Card sx={{
              flex: { lg: 0.5 }, p: 2,
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              maxWidth: { xs: '100%', sm: 420, lg: 320 }, minWidth: { xs: 0, lg: 290 },
              mx: { xs: 'auto', lg: 0 }, width: '100%',
              marginTop: '10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1
            }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MapPinned className="h-3.5 w-3.5" />
                Posiciones
              </div>
              <DiagramaVehiculo
                    etiquetaDatos="remanente"
                key={`diagrama-live-${refreshKey}-${Date.now()}`}
                neumaticosAsignados={(() => {
                  // USAR DATOS SINCRONIZADOS DIRECTOS
                  const dataWithForce = diagramaData.map((n, idx) => ({
                    ...n,
                    _forceRender: Date.now() + idx // Garantizar nueva referencia
                  }));
                  return dataWithForce;
                })() as any}
                layout="modal"
                tipoModal="mantenimiento"
                anchoMax={150}
                posicionResaltada={posicionSeleccionada ?? undefined}
                onPosicionClick={(_neu: any, codigoPosicion: string) => handleClickPosicion(codigoPosicion)}
                fromMantenimientoModal={true}
                placa={placa}
                cantidadNeumaticos={vehiculo?.cantidad_neumaticos}
              />
            </Card>
          </Stack>
      </DialogContent>
    </Dialog>
  );
});

// Función auxiliar para normalizar payload
function normalizePayload(mov: any) {
  return {
    CODIGO: mov.CODIGO || '',
    MARCA: mov.MARCA || '',
    MEDIDA: mov.MEDIDA || '',
    DISEÑO: mov.DISEÑO || '',
    REMANENTE: mov.REMANENTE || '',
    PR: mov.PR || '',
    CARGA: mov.CARGA || '',
    VELOCIDAD: mov.VELOCIDAD || '',
    FECHA_FABRICACION: mov.FECHA_FABRICACION || '',
    RQ: mov.RQ || '',
    OC: mov.OC || '',
    PROYECTO: mov.PROYECTO || '',
    COSTO: mov.COSTO || '',
    PROVEEDOR: mov.PROVEEDOR || '',
    FECHA_REGISTRO: mov.FECHA_REGISTRO ? new Date(mov.FECHA_REGISTRO).toISOString() : new Date().toISOString(),
    FECHA_COMPRA: mov.FECHA_COMPRA || '',
    USUARIO_SUPER: mov.USUARIO_SUPER || '',
    PRESION_AIRE: mov.PRESION_AIRE || '',
    TORQUE_APLICADO: mov.TORQUE_APLICADO,
    ESTADO: mov.ESTADO || '',
    PLACA: mov.PLACA || '',
    POSICION_NEU: mov.POSICION_NEU || '',
    POSICION_INICIAL: mov.POSICION_INICIAL || '',
    POSICION_FIN: mov.POSICION_FIN || '',
    DESTINO: mov.DESTINO || '',
    FECHA_ASIGNACION: mov.FECHA_ASIGNACION || '',
    KILOMETRO: mov.KILOMETRO || '',
    FECHA_MOVIMIENTO: mov.FECHA_MOVIMIENTO || '',
    OBSERVACION: mov.OBSERVACION || mov.OBS || mov.observacion || '',
    ID_OPERACION: mov.ID_OPERACION,
    COD_SUPERVISOR: mov.COD_SUPERVISOR,
    TALLER: mov.TALLER,
    TRANSITO: mov.TRANSITO
  };
}

// Función auxiliar para obtener última inspección
async function obtenerYSetearUltimaInspeccionPorPlaca(placa: string): Promise<string | null> {
  if (!placa) return null;
  try {
    const fecha = await getUltimaFechaInspeccionPorPlaca(placa);
    return fecha?.fecha_registro || null;
  } catch (error) {
    console.error('Error obteniendo la última inspección por placa:', error);
    return null;
  }
}

export default ModalReubicar;