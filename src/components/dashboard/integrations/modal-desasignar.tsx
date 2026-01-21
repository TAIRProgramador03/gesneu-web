import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog, DialogContent, Typography, Button, Stack, Box, Card, TextField, MenuItem,
  Snackbar, Alert as MuiAlert, AlertTitle, Divider
} from '@mui/material';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { Neumatico, Vehiculo, User } from '../../../types/types';

// Extender la interfaz para incluir la nueva propiedad
interface NeumaticoExtendido extends Neumatico {
  enAreaDesasignacion?: boolean;
}
import {
  registrarDesasignacionNeumatico,
  getUltimaFechaInspeccionPorPlaca,
  desasignarConReemplazo
} from '../../../api/Neumaticos';

interface ModalDesasignarProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback solo cuando la acción se completa exitosamente
  neumaticosAsignados: Neumatico[];
  placa: string;
  vehiculo?: Vehiculo;
  user?: User;
  onAbrirInspeccion?: () => void;
  onAbrirAsignacion?: (data: { cachedNeumaticosAsignados: Neumatico[]; posicionesVacias: string[] }) => void; // Callback para abrir modal de asignación con datos cacheados
  onReceiveTemporaryAssignments?: (callback: (asignaciones: any[]) => void) => void; // Callback para registrar receptor de asignaciones temporales
  asignacionesTemporalesExternas?: any[]; // Asignaciones temporales desde modal de asignación
}

export const ModalDesasignar: React.FC<ModalDesasignarProps> = ({
  open,
  onClose,
  onSuccess,
  neumaticosAsignados,
  placa,
  vehiculo,
  user,
  onAbrirInspeccion,
  onAbrirAsignacion,
  onReceiveTemporaryAssignments,
  asignacionesTemporalesExternas = [],
}) => {
  // Solo log cuando se abre realmente
  if (open) {
    console.log('[ModalDesasignar] Abriendo modal con props:', { placa, neumaticosAsignados: neumaticosAsignados.length });
  }

  const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<NeumaticoExtendido[]>([]);
  const [initialAssignedMap, setInitialAssignedMap] = useState<Record<string, Neumatico>>({});
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<string>('');

  // Estados para neumáticos seleccionados y formulario
  const [neumaticosSeleccionados, setNeumaticoSeleccionados] = useState<Neumatico[]>([]);
  const [ultimaPosicionDesasignada, setUltimaPosicionDesasignada] = useState<string>('');
  const [posicionResaltada, setPosicionResaltada] = useState<string>('');
  const [accion, setAccion] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

  // Estado para asignaciones temporales (NO guardadas en BD)
  const [asignacionesTemporales, setAsignacionesTemporales] = useState<any[]>([]);

  // Estados para notificaciones
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Ref para rastrear si ya se inicializó y evitar loops
  const prevOpenRef = React.useRef(false);
  const prevNeumaticosAsignadosRef = React.useRef<Neumatico[]>([]);

  // Inicializar state cuando se abre el modal o cuando cambian los neumáticos asignados
  useEffect(() => {
    // Solo ejecutar si el modal se abrió o si los neumáticos asignados realmente cambiaron
    const neumaticosCambiaron = JSON.stringify(prevNeumaticosAsignadosRef.current) !== JSON.stringify(neumaticosAsignados);
    const modalSeAbrio = open && !prevOpenRef.current;

    if (open && neumaticosAsignados && (modalSeAbrio || neumaticosCambiaron)) {
      console.log('[ModalDesasignar] Inicializando con:', {
        placa,
        totalNeumaticos: neumaticosAsignados.length,
        neumaticos: neumaticosAsignados.map(n => ({
          codigo: n.CODIGO_NEU || n.CODIGO,
          posicion: n.POSICION || n.POSICION_NEU,
          idMovimiento: n.ID_MOVIMIENTO
        }))
      });

      // Obtener los códigos de los neumáticos que están actualmente en el área de desasignación
      const codigosEnAreaDesasignacion = new Set<string>();
      neumaticosSeleccionados.forEach(n => {
        const codigo = n.CODIGO_NEU || n.CODIGO;
        if (codigo) {
          codigosEnAreaDesasignacion.add(codigo);
        }
      });

      // IMPORTANTE: Usar los datos tal cual vienen, sin procesamiento adicional
      // Los datos ya vienen filtrados y agrupados correctamente desde page.tsx
      setNeumaticosAsignadosState(prev => {
        const neumaticosConEstado = neumaticosAsignados.map(n => {
          const codigo = n.CODIGO_NEU || n.CODIGO;
          const yaEstabaEnArea = codigosEnAreaDesasignacion.has(codigo || '');
          // Si el neumático ya estaba en el área de desasignación, mantenerlo ahí
          // Si no, verificar si está en el estado anterior
          const estadoAnterior = prev.find(est =>
            (est.CODIGO_NEU || est.CODIGO) === codigo
          );
          return {
            ...n,
            enAreaDesasignacion: yaEstabaEnArea || (estadoAnterior?.enAreaDesasignacion ?? false)
          };
        });
        console.log('[ModalDesasignar] Neumáticos con estado:', neumaticosConEstado.map(n => ({
          codigo: n.CODIGO_NEU || n.CODIGO,
          posicion: n.POSICION || n.POSICION_NEU,
          enArea: n.enAreaDesasignacion
        })));
        return neumaticosConEstado;
      });

      // Crear mapa inicial - incluir TODAS las posiciones (POS01-POS04 y RES01)
      // Agrupar por posición y quedarse con el más reciente si hay duplicados
      const mapa: Record<string, Neumatico> = {};
      const porPosicion = new Map<string, Neumatico>();

      neumaticosAsignados.forEach(neu => {
        const posicion = neu.POSICION || neu.POSICION_NEU;
        if (posicion && (posicion.startsWith('POS') || posicion === 'RES01')) {
          const existente = porPosicion.get(posicion);
          // Si no existe o este es más reciente, actualizar
          if (!existente || (neu.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
            porPosicion.set(posicion, { ...neu });
          }
        }
      });

      // Llenar el mapa con los neumáticos más recientes por posición
      porPosicion.forEach((neu, pos) => {
        mapa[pos] = neu;
      });

      console.log('[ModalDesasignar] Mapa inicial creado:', Object.keys(mapa).map(pos => ({
        posicion: pos,
        codigo: mapa[pos].CODIGO_NEU || mapa[pos].CODIGO,
        idMovimiento: mapa[pos].ID_MOVIMIENTO
      })));

      setInitialAssignedMap(mapa);
      console.log('[ModalDesasignar] Mapa de posiciones:', mapa);

      // Actualizar referencias
      prevNeumaticosAsignadosRef.current = neumaticosAsignados;
    } else if (!open && prevOpenRef.current) {
      // Resetear estado cuando se cierra el modal (solo si estaba abierto antes)
      setNeumaticoSeleccionados([]);
      setUltimaPosicionDesasignada('');
      setAccion('');
      setObservacion('');
      setPosicionResaltada('');
      setAsignacionesTemporales([]); // Limpiar asignaciones temporales

      // Limpiar también el estado de enAreaDesasignacion
      setNeumaticosAsignadosState(prev =>
        prev.map(n => ({ ...n, enAreaDesasignacion: false }))
      );

      // Resetear referencias
      prevNeumaticosAsignadosRef.current = [];
    }

    // Actualizar referencia del estado del modal
    prevOpenRef.current = open;
  }, [open, neumaticosAsignados]);

  // Sincronizar asignaciones temporales externas con estado interno
  useEffect(() => {
    if (asignacionesTemporalesExternas && asignacionesTemporalesExternas.length > 0) {
      console.log('[ModalDesasignar] Recibiendo asignaciones temporales externas:', asignacionesTemporalesExternas);
      setAsignacionesTemporales(asignacionesTemporalesExternas);

      // Actualizar diagrama para mostrar asignaciones temporales visualmente
      setNeumaticosAsignadosState(prev => {
        const nuevoEstado = [...prev];

        asignacionesTemporalesExternas.forEach((asig: any) => {
          // Buscar si ya existe un neumático en esa posición
          const index = nuevoEstado.findIndex(n =>
            (n.POSICION || n.POSICION_NEU) === asig.Posicion
          );

          // Crear objeto de neumático temporal para mostrar en diagrama
          const neumaticoTemporal = {
            CODIGO: asig.CodigoNeumatico?.toString(),
            CODIGO_NEU: asig.CodigoNeumatico?.toString(),
            POSICION: asig.Posicion,
            POSICION_NEU: asig.Posicion,
            REMANENTE: asig.Remanente,
            PRESION_AIRE: asig.PresionAire,
            TORQUE_APLICADO: asig.TorqueAplicado,
            TIPO_MOVIMIENTO: 'TEMPORAL', // Marcador para identificar asignaciones temporales
            enAreaDesasignacion: false
          };

          if (index >= 0) {
            // Reemplazar neumático existente
            nuevoEstado[index] = neumaticoTemporal;
          } else {
            // Agregar nuevo neumático
            nuevoEstado.push(neumaticoTemporal);
          }
        });

        console.log('[ModalDesasignar] Diagrama actualizado con asignaciones temporales');
        return nuevoEstado;
      });
    }
  }, [asignacionesTemporalesExternas]);

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

  // Handler para click en posición del diagrama
  const handlePosicionClick = (neumatico: Neumatico | undefined) => {
    if (neumatico && neumatico.POSICION) {
      // Verificar si ya está seleccionado o en área de desasignación
      const yaSeleccionado = neumaticosSeleccionados.find(n =>
        (n.CODIGO_NEU || n.CODIGO) === (neumatico.CODIGO_NEU || neumatico.CODIGO)
      );

      const neumaticoEnEstado = neumaticosAsignadosState.find(n =>
        (n.CODIGO_NEU || n.CODIGO) === (neumatico.CODIGO_NEU || neumatico.CODIGO)
      );

      if (!yaSeleccionado && !(neumaticoEnEstado?.enAreaDesasignacion)) {
        setNeumaticoSeleccionados(prev => [...prev, neumatico]);
        setUltimaPosicionDesasignada(neumatico.POSICION);

        // Actualizar estado para mostrar que está en área de desasignación
        setNeumaticosAsignadosState(prev =>
          prev.map((n: NeumaticoExtendido) =>
            (n.CODIGO_NEU || n.CODIGO) === (neumatico.CODIGO_NEU || neumatico.CODIGO)
              ? { ...n, enAreaDesasignacion: true }
              : n
          )
        );
      }
    }
  };

  // Handler para drop de neumático - simplificado ya que handleDragEnd maneja la lógica principal
  const handleDropNeumatico = (neumatico: Neumatico, posicion: string) => {
    console.log('[handleDropNeumatico] Neumatico:', neumatico.CODIGO_NEU || neumatico.CODIGO, 'Posicion:', posicion);
    // La lógica principal se maneja en handleDragEnd
  };

  // Handler para click en neumático del área de desasignación para resaltar su posición original
  const handleClickNeumaticoArea = (neumatico: Neumatico) => {
    const posicionOriginal = neumatico.POSICION || neumatico.POSICION_NEU || '';
    console.log('[handleClickNeumaticoArea] Resaltando posición:', posicionOriginal, 'para neumático:', neumatico.CODIGO_NEU || neumatico.CODIGO);

    // Resaltar la posición por 3 segundos
    setPosicionResaltada(posicionOriginal);
    setTimeout(() => {
      setPosicionResaltada('');
    }, 3000);
  };

  // Handler para fin de arrastre
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      console.log('[handleDragEnd] No hay destino válido');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeData = active.data.current as NeumaticoExtendido & { from?: string } | undefined;

    console.log('[handleDragEnd] Moviendo desde:', activeId, 'hacia:', overId);
    console.log('[handleDragEnd] Active data:', activeData);

    // Encontrar el neumático que se está moviendo
    // Primero intentar desde active.data.current (viene del diagrama)
    let neumatico: NeumaticoExtendido | undefined;
    if (activeData) {
      neumatico = activeData as NeumaticoExtendido;
      console.log('[handleDragEnd] Neumático obtenido desde active.data.current:', neumatico.CODIGO_NEU || neumatico.CODIGO);
    } else {
      // Fallback: buscar en el estado por código o posición
      neumatico = neumaticosAsignadosState.find(n =>
        (n.CODIGO_NEU || n.CODIGO) === activeId ||
        n.POSICION === activeId ||
        (n.CODIGO_NEU || n.CODIGO || n.POSICION) === activeId
      );
      console.log('[handleDragEnd] Neumático obtenido desde estado:', neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : 'no encontrado');
    }

    if (!neumatico) {
      console.log('[handleDragEnd] Neumático no encontrado');
      return;
    }

    if (overId === 'neumaticos-por-desasignar') {
      // Agregar neumático a la lista de seleccionados para desasignar
      const codigoNeumatico = neumatico.CODIGO_NEU || neumatico.CODIGO;

      const yaSeleccionado = neumaticosSeleccionados.find(n =>
        (n.CODIGO_NEU || n.CODIGO) === codigoNeumatico
      );

      const estadoActual = neumaticosAsignadosState.find(n =>
        (n.CODIGO_NEU || n.CODIGO) === codigoNeumatico
      );

      if (!yaSeleccionado && !estadoActual?.enAreaDesasignacion) {
        // Agregar a la lista de seleccionados
        setNeumaticoSeleccionados(prev => [...prev, neumatico]);
        setUltimaPosicionDesasignada(neumatico.POSICION || '');

        // Marcar como en área de desasignación
        setNeumaticosAsignadosState(prev =>
          prev.map((n: NeumaticoExtendido) => {
            const esEsteNeumatico = (n.CODIGO_NEU || n.CODIGO) === codigoNeumatico;
            const nuevoEstado = esEsteNeumatico ? { ...n, enAreaDesasignacion: true } : n;

            if (esEsteNeumatico && (n.POSICION === 'POS04' || n.POSICION_NEU === 'POS04')) {
              console.log(`[handleDragEnd] POS04 actualizado - antes: ${n.enAreaDesasignacion}, después: ${nuevoEstado.enAreaDesasignacion}`);
            }

            return nuevoEstado;
          })
        );

        console.log('[handleDragEnd] ✅ Neumático agregado al área:', codigoNeumatico);
      } else {
        const razon = yaSeleccionado ? 'ya está en lista' : 'ya está marcado en área';
        console.log('[handleDragEnd] ❌ Neumático NO agregado -', codigoNeumatico, ':', razon);
      }
    } else if (overId.startsWith('POS') || overId === 'RES01') {
      // Si se suelta en una posición del vehículo (POS01-POS04 o RES01), remover del área de desasignación
      const codigoNeumatico = neumatico.CODIGO_NEU || neumatico.CODIGO;
      const posicionOriginal = neumatico.POSICION || neumatico.POSICION_NEU || '';
      console.log('[handleDragEnd] 🔄 Devolviendo neumático:', codigoNeumatico, 'hacia:', overId, 'posición original:', posicionOriginal);

      // Verificar si la posición de destino está ocupada por OTRO neumático (no el mismo)
      // Solo considerar ocupada si hay un neumático que NO está en área de desasignación
      const neumaticoEnDestino = neumaticosAsignadosState.find(n =>
        (n.POSICION === overId || n.POSICION_NEU === overId) &&
        (n.CODIGO_NEU || n.CODIGO) !== codigoNeumatico &&
        !n.enAreaDesasignacion
      );

      // Si la posición destino es la posición original del neumático, permitir siempre
      const esPosicionOriginal = overId === posicionOriginal;

      // Si hay un neumático en destino que NO está en área de desasignación Y no es la posición original, bloquear
      if (neumaticoEnDestino && !esPosicionOriginal) {
        console.log(`[handleDragEnd] ⚠️ Posición ${overId} ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`);
        setSnackbarMsg(`La posición ${overId} ya está ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }

      if (esPosicionOriginal) {
        console.log(`[handleDragEnd] ✅ Devolviendo a posición original ${overId}`);
      } else {
        console.log(`[handleDragEnd] ✅ Devolviendo a posición ${overId} (nueva posición)`);
      }

      // Desmarcar como en área de desasignación y actualizar posición
      setNeumaticosAsignadosState(prev =>
        prev.map((n: NeumaticoExtendido) => {
          const esEsteNeumatico = (n.CODIGO_NEU || n.CODIGO) === codigoNeumatico;
          const nuevoEstado = esEsteNeumatico
            ? { ...n, enAreaDesasignacion: false, POSICION: overId, POSICION_NEU: overId }
            : n;

          if (esEsteNeumatico && (n.POSICION === 'POS04' || n.POSICION_NEU === 'POS04')) {
            console.log(`[handleDragEnd] POS04 devuelto - antes: ${n.enAreaDesasignacion}, después: ${nuevoEstado.enAreaDesasignacion}`);
          }

          return nuevoEstado;
        })
      );

      // Remover de la lista de seleccionados
      setNeumaticoSeleccionados(prev => {
        const nuevaLista = prev.filter(n => (n.CODIGO_NEU || n.CODIGO) !== codigoNeumatico);
        console.log('[handleDragEnd] Lista actualizada - antes:', prev.length, 'después:', nuevaLista.length);
        return nuevaLista;
      });
    }
  };

  // Función para detectar posiciones vacías después de desasignar
  const detectarPosicionesVacias = (): string[] => {
    // Posiciones que deben estar siempre ocupadas (POS01-POS04 y RES01)
    const posicionesRequeridas = ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'];

    // Obtener los códigos de los neumáticos que están en el área de desasignación
    const codigosEnAreaDesasignacion = new Set<string>();
    neumaticosSeleccionados.forEach(n => {
      const codigo = n.CODIGO_NEU || n.CODIGO;
      if (codigo) {
        codigosEnAreaDesasignacion.add(codigo);
      }
    });

    // Agrupar neumáticos por posición para verificar si TODOS los de una posición están desasignados
    // Usar neumaticosAsignadosState si tiene datos, si no usar el prop neumaticosAsignados
    const neumaticosParaProcesar = neumaticosAsignadosState.length > 0
      ? neumaticosAsignadosState
      : neumaticosAsignados;

    const neumaticosPorPosicion = new Map<string, Array<{ codigo: string; enArea: boolean }>>();

    neumaticosParaProcesar.forEach(n => {
      const pos = n.POSICION || n.POSICION_NEU;
      if (pos && (pos.startsWith('POS') || pos === 'RES01')) {
        const codigo = n.CODIGO_NEU || n.CODIGO || '';
        // Si estamos usando neumaticosAsignadosState, verificar enAreaDesasignacion
        // Si estamos usando el prop, verificar si el código está en el área de desasignación
        const estaEnArea = neumaticosAsignadosState.length > 0
          ? (n.enAreaDesasignacion || codigosEnAreaDesasignacion.has(codigo))
          : codigosEnAreaDesasignacion.has(codigo);

        if (!neumaticosPorPosicion.has(pos)) {
          neumaticosPorPosicion.set(pos, []);
        }
        neumaticosPorPosicion.get(pos)!.push({ codigo, enArea: estaEnArea });
      }
    });

    // Una posición está ocupada si tiene AL MENOS UN neumático que NO está en área de desasignación
    const posicionesOcupadas = new Set<string>();
    neumaticosPorPosicion.forEach((neumaticos, pos) => {
      const tieneNeumaticoActivo = neumaticos.some(n => !n.enArea);
      if (tieneNeumaticoActivo) {
        posicionesOcupadas.add(pos);
      }
    });

    // Encontrar las posiciones que quedarán vacías
    const posicionesVacias = posicionesRequeridas.filter(pos => !posicionesOcupadas.has(pos));

    console.log('[detectarPosicionesVacias] Posiciones requeridas:', posicionesRequeridas);
    console.log('[detectarPosicionesVacias] Códigos en área desasignación:', Array.from(codigosEnAreaDesasignacion));
    console.log('[detectarPosicionesVacias] Neumáticos por posición:', Array.from(neumaticosPorPosicion.entries()).map(([pos, neus]) => ({
      posicion: pos,
      neumaticos: neus.map(n => ({ codigo: n.codigo, enArea: n.enArea }))
    })));
    console.log('[detectarPosicionesVacias] Posiciones ocupadas:', Array.from(posicionesOcupadas));
    console.log('[detectarPosicionesVacias] Posiciones vacías:', posicionesVacias);
    console.log('[detectarPosicionesVacias] Usando:', neumaticosAsignadosState.length > 0 ? 'neumaticosAsignadosState' : 'neumaticosAsignados prop', 'Total:', neumaticosParaProcesar.length);

    return posicionesVacias;
  };

  // Handler para guardar desasignación
  const handleGuardarDesasignacion = async () => {
    // 1. Validar observación obligatoria
    if (!observacion || observacion.trim() === '') {
      setSnackbarMsg('La observación es obligatoria. Por favor, ingresa una observación.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // 2. Validar que haya neumáticos seleccionados
    if (neumaticosSeleccionados.length === 0) {
      setSnackbarMsg('Selecciona al menos un neumático para desasignar.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    // 3. Validar que haya acción seleccionada
    if (!accion) {
      setSnackbarMsg('Selecciona una acción para la desasignación.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    // 4. Validar inspección previa
    if (!fechaUltimaInspeccion || isNaN(new Date(fechaUltimaInspeccion).getTime())) {
      setSnackbarMsg('No se puede desasignar: primero debe existir una inspección válida para este neumático.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }


    // NOTA: La validación de posiciones vacías se hace en el BACKEND
    // El backend rechazará la operación si alguna posición queda vacía
    // y mostrará un mensaje claro al usuario
    // Esto evita duplicar lógica y mantiene el backend como fuente de verdad

    /* VALIDACIÓN COMENTADA - El backend ya valida esto
    const posicionesVacias = detectarPosicionesVacias();
    if (posicionesVacias.length > 0) {
      const posicionesStr = posicionesVacias.join(', ');
      setSnackbarMsg(
        `No se puede guardar la desasignación: las siguientes posiciones quedarán vacías: ${posicionesStr}. ` +
        `Debes asignar neumáticos a estas posiciones antes de guardar.`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);

      // Preparar datos cacheados y abrir modal de asignación
      const neumaticosNoDesasignados = neumaticosAsignadosState.filter(n => !n.enAreaDesasignacion);
      const neumaticosPorPosicion = new Map<string, typeof neumaticosNoDesasignados[0]>();
      neumaticosNoDesasignados.forEach(n => {
        const pos = (n.POSICION_NEU || n.POSICION);
        if (pos) {
          const existente = neumaticosPorPosicion.get(pos);
          if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
            neumaticosPorPosicion.set(pos, n);
          }
        }
      });

      const neumaticosActuales = Array.from(neumaticosPorPosicion.values()).map(n => {
        const pos = n.POSICION_NEU || n.POSICION;
        return {
          ...n,
          POSICION: pos,
          POSICION_NEU: pos
        };
      });

      if (onAbrirAsignacion) {
        setTimeout(() => {
          onAbrirAsignacion({
            cachedNeumaticosAsignados: neumaticosActuales,
            posicionesVacias: posicionesVacias
          });
        }, 2000);
      }
      return;
    }
    */


    try {
      console.log('[DEBUG] Enviando desasignaciones con:', {
        placa,
        neumaticosSeleccionados: neumaticosSeleccionados.length,
        accion,
        observacion,
        fechaUltimaInspeccion,
        asignacionesTemporales: asignacionesTemporales.length
      });

      // **NUEVO FLUJO**: Si hay asignaciones temporales, usar endpoint /api/desasignar-con-reemplazo
      if (asignacionesTemporales.length > 0) {
        console.log('[handleGuardarDesasignacion] Usando endpoint desasignar-con-reemplazo');

        // Preparar desasignaciones
        const desasignaciones = [];
        for (const neumaticoSeleccionado of neumaticosSeleccionados) {
          let posicionInicial = neumaticoSeleccionado.POSICION || neumaticoSeleccionado.POSICION_NEU || '';

          if (!posicionInicial) {
            const codigo = neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO;
            const posValida = Object.keys(initialAssignedMap).find(
              key => (initialAssignedMap[key]?.CODIGO_NEU || initialAssignedMap[key]?.CODIGO) === codigo
            );
            if (posValida) {
              posicionInicial = posValida;
            }
          }

          if (!posicionInicial || (!/^POS\d{2}$/.test(posicionInicial) && posicionInicial !== 'RES01')) {
            console.log('[DEBUG] Neumático sin posición válida:', neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO);
            continue;
          }

          desasignaciones.push({
            CODIGO: neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO,
            TIPO_MOVIMIENTO: accion,
            OBSERVACION: observacion,
            KILOMETRO: neumaticoSeleccionado.KILOMETRO,
            REMANENTE: neumaticoSeleccionado.REMANENTE
          });
        }

        // Enviar asignaciones + desasignaciones juntas
        const payload = {
          desasignaciones,
          asignaciones: asignacionesTemporales
        };

        console.log('[handleGuardarDesasignacion] Payload completo:', payload);
        await desasignarConReemplazo(payload);

        setSnackbarMsg(`${neumaticosSeleccionados.length} desasignación(es) y ${asignacionesTemporales.length} asignación(es) registradas correctamente.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Limpiar asignaciones temporales
        setAsignacionesTemporales([]);
      } else {
        // **FLUJO ORIGINAL**: Sin asignaciones temporales, usar endpoint normal
        console.log('[handleGuardarDesasignacion] Usando endpoint normal (sin asignaciones temporales)');

        for (const neumaticoSeleccionado of neumaticosSeleccionados) {
          let posicionInicial = neumaticoSeleccionado.POSICION || neumaticoSeleccionado.POSICION_NEU || '';

          if (!posicionInicial) {
            const codigo = neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO;
            const posValida = Object.keys(initialAssignedMap).find(
              key => (initialAssignedMap[key]?.CODIGO_NEU || initialAssignedMap[key]?.CODIGO) === codigo
            );
            if (posValida) {
              posicionInicial = posValida;
            }
          }

          if (!posicionInicial || (!/^POS\d{2}$/.test(posicionInicial) && posicionInicial !== 'RES01')) {
            console.log('[DEBUG] Neumático sin posición válida:', neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO, 'posición:', posicionInicial);
            continue;
          }

          const posicionFin = '';

          const payload = {
            CODIGO: neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO,
            MARCA: neumaticoSeleccionado.MARCA,
            MEDIDA: neumaticoSeleccionado.MEDIDA,
            DISEÑO: neumaticoSeleccionado.DISEÑO,
            REMANENTE: neumaticoSeleccionado.REMANENTE,
            PR: neumaticoSeleccionado.PR,
            CARGA: neumaticoSeleccionado.CARGA,
            VELOCIDAD: neumaticoSeleccionado.VELOCIDAD,
            FECHA_FABRICACION: neumaticoSeleccionado.FECHA_FABRICACION,
            RQ: neumaticoSeleccionado.RQ,
            OC: neumaticoSeleccionado.OC,
            PROYECTO: vehiculo?.proyecto || '',
            COSTO: neumaticoSeleccionado.COSTO,
            PROVEEDOR: neumaticoSeleccionado.PROVEEDOR,
            FECHA_REGISTRO: fechaUltimaInspeccion || new Date().toISOString().slice(0, 10),
            FECHA_COMPRA: neumaticoSeleccionado.FECHA_COMPRA,
            USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
            TIPO_MOVIMIENTO: accion,
            PRESION_AIRE: neumaticoSeleccionado.PRESION_AIRE,
            TORQUE_APLICADO: neumaticoSeleccionado.TORQUE_APLICADO,
            ESTADO: neumaticoSeleccionado.ESTADO,
            PLACA: placa,
            POSICION_NEU: posicionInicial,
            POSICION_INICIAL: posicionInicial,
            POSICION_FIN: posicionFin,
            DESTINO: vehiculo?.proyecto || '',
            FECHA_ASIGNACION: fechaUltimaInspeccion || new Date().toISOString().slice(0, 10),
            KILOMETRO: neumaticoSeleccionado.KILOMETRO,
            FECHA_MOVIMIENTO: getPeruLocalISOString(),
            OBSERVACION: observacion,
          };

          console.log('[handleGuardarDesasignacion] Payload para:', neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO, payload);
          await registrarDesasignacionNeumatico(payload);
        }

        setSnackbarMsg(`${neumaticosSeleccionados.length} desasignación(es) registrada(s) correctamente.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }

      // Actualizar estado local para todos los neumáticos procesados
      setNeumaticosAsignadosState(prev =>
        prev.map(n => {
          const esDesasignado = neumaticosSeleccionados.find(ns =>
            (ns.CODIGO_NEU || ns.CODIGO) === (n.CODIGO_NEU || n.CODIGO)
          );
          return esDesasignado
            ? { ...n, POSICION: '', TIPO_MOVIMIENTO: accion }
            : n;
        })
      );

      setNeumaticoSeleccionados([]);
      setAccion('');
      setObservacion('');

      // Solo llamar onSuccess cuando la acción se completa exitosamente
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      setSnackbarMsg('Error al registrar la desasignación: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Utilidades de fecha
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          setSnackbarOpen(false);
          // Verificar si el mensaje contiene "registrada(s) correctamente" para detectar éxito
          if (snackbarSeverity === 'success' && snackbarMsg.includes('registrada(s) correctamente')) {
            // onSuccess ya fue llamado en handleGuardarDesasignacion, solo cerrar
            onClose();
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          elevation={6}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarSeverity === 'success' && <AlertTitle>Éxito</AlertTitle>}
          {snackbarSeverity === 'error' && <AlertTitle>Error</AlertTitle>}
          {snackbarSeverity === 'info' && <AlertTitle>Información</AlertTitle>}
          {snackbarSeverity === 'warning' && <AlertTitle>Advertencia</AlertTitle>}
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>

      <DialogContent>
        <DndContext onDragEnd={handleDragEnd}>
          <Stack direction="row" spacing={2}>
            <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
              {/* Card de información del vehículo */}
              <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    DESASIGNAR Neumáticos
                  </Typography>
                  {vehiculo ? (
                    <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Marca</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {vehiculo.marca}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Modelo</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {vehiculo.modelo}
                        </Typography>
                      </Box>
                      {vehiculo.proyecto && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Proyecto</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {vehiculo.proyecto}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay datos del vehículo.
                    </Typography>
                  )}
                </Box>
              </Card>

              {/* Card para DESASIGNAR */}
              <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                  <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>DESASIGNAR</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha última inspección</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {fechaUltimaInspeccion || 'Sin registro'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 220, flex: 1, height: 150 }}>
                    <TextField
                      select
                      label="Acción"
                      size="small"
                      value={accion}
                      onChange={(e) => setAccion(e.target.value)}
                      sx={{ minWidth: 220, flex: 0.4 }}
                    >
                      <MenuItem value="RECUPERADO">RECUPERADO</MenuItem>
                      <MenuItem value="BAJA DEFINITIVA">BAJA DEFINITIVA</MenuItem>
                    </TextField>
                    <TextField
                      label="Observación"
                      size="small"
                      multiline
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      sx={{ minWidth: 220, width: '100%', flex: 0.6 }}
                      InputProps={{
                        sx: { height: '100%', alignItems: 'flex-start' }
                      }}
                    />

                  </Box>

                  <Box sx={{ position: 'relative' }}>
                    <DropNeumaticosPorDesasignar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                      <Box sx={{
                        mt: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                        height: 150, width: '320px', // Tamaño fijo para 4 neumáticos horizontales aumentado
                        mx: 0, p: 1, gap: 1, // Gap entre neumáticos
                        flexWrap: 'wrap', // Permite wrap si hay más de 4
                      }}>
                        {neumaticosSeleccionados.length > 0 ? (
                          neumaticosSeleccionados.map((neumatico, index) => (
                            <Box key={neumatico.CODIGO_NEU || neumatico.CODIGO || index}
                              sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                minWidth: 70, maxWidth: 70, // Ancho fijo para cada neumático
                              }}>
                              <DraggableNeumatico neumatico={neumatico} />
                              <NeumaticoInfo neumatico={neumatico} />
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{
                            width: '100%', textAlign: 'center', fontStyle: 'italic'
                          }}>
                            Arrastra neumáticos aquí para desasignar (hasta 4)
                          </Typography>
                        )}
                      </Box>
                    </DropNeumaticosPorDesasignar>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button onClick={onClose} color="primary" variant="contained">
                    Cerrar
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    sx={{ ml: 1 }}
                    onClick={handleGuardarDesasignacion}
                    disabled={neumaticosSeleccionados.length === 0 || !accion}
                  >
                    Guardar Desasignación
                  </Button>
                  {onAbrirAsignacion && (() => {
                    const posicionesVacias = detectarPosicionesVacias();
                    const tienePosicionesVacias = posicionesVacias.length > 0;
                    const tieneAccionYObservacion = accion.trim() !== '' && observacion.trim() !== '';

                    return (
                      <>
                        {/* Mensaje informativo si hay posiciones vacías */}
                        {tienePosicionesVacias && (
                          <Box
                            sx={{
                              ml: 1,
                              p: 1.5,
                              bgcolor: 'warning.lighter',
                              border: '1px solid',
                              borderColor: 'warning.main',
                              borderRadius: 1,
                              maxWidth: 350,
                              mb: 1
                            }}
                          >
                            <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 500 }}>
                              ⚠️ Posiciones vacías: {posicionesVacias.join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {/* Botón Asignar Neumáticos */}
                        <Button
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                          disabled={!tienePosicionesVacias || !tieneAccionYObservacion}
                          onClick={() => {
                            // Agrupar por posición y quedarse con el más reciente (mayor ID_MOVIMIENTO)
                            const neumaticosNoDesasignados = neumaticosAsignadosState.filter(n => !n.enAreaDesasignacion);

                            const neumaticosPorPosicion = new Map<string, typeof neumaticosNoDesasignados[0]>();
                            neumaticosNoDesasignados.forEach(n => {
                              const pos = (n.POSICION_NEU || n.POSICION);
                              if (pos) {
                                const existente = neumaticosPorPosicion.get(pos);
                                if (!existente || (n.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                                  neumaticosPorPosicion.set(pos, n);
                                }
                              }
                            });

                            const neumaticosActuales = Array.from(neumaticosPorPosicion.values()).map(n => {
                              const pos = n.POSICION_NEU || n.POSICION;
                              return {
                                ...n,
                                POSICION: pos,
                                POSICION_NEU: pos
                              };
                            });
                            console.log('[Button Asignar] Posiciones vacías:', posicionesVacias);
                            console.log('[Button Asignar] Neumáticos actuales:', neumaticosActuales.map(n => ({
                              codigo: n.CODIGO_NEU || n.CODIGO,
                              posicion: n.POSICION || n.POSICION_NEU
                            })));
                            onAbrirAsignacion({
                              cachedNeumaticosAsignados: neumaticosActuales,
                              posicionesVacias: posicionesVacias
                            });
                          }}
                        >
                          Asignar Neumáticos
                        </Button>
                      </>
                    );
                  })()}
                </Box>
              </Card>
            </Stack>

            {/* Columna derecha: Diagrama del vehículo */}
            <Card sx={{
              flex: 0.5, p: 2, position: 'relative',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              maxWidth: 400, minWidth: 320, width: '100%',
            }}>
              <Box sx={{ position: 'relative', width: '370px', height: '430px' }}>
                <DiagramaVehiculo
                  posicionResaltada={posicionResaltada}
                  neumaticosAsignados={(() => {
                    // Primero, obtener las posiciones de los neumáticos que están en área de desasignación
                    const posicionesEnArea = new Set(
                      neumaticosAsignadosState
                        .filter(n => n.enAreaDesasignacion)
                        .map(n => n.POSICION || n.POSICION_NEU)
                    );

                    // Luego, filtrar para mostrar solo los neumáticos que:
                    // 1. NO están en área de desasignación Y
                    // 2. Su posición NO está ocupada por un neumático que SÍ está en área de desasignación
                    const resultado = neumaticosAsignadosState.filter(n => {
                      const codigo = n.CODIGO_NEU || n.CODIGO;
                      const posicion = n.POSICION || n.POSICION_NEU;
                      const estaEnArea = n.enAreaDesasignacion;
                      const posicionOcupadaEnArea = posicionesEnArea.has(posicion);

                      if (posicion === 'POS04') {
                        console.log(`[DiagramaVehiculo] POS04 - Código: ${codigo}, enAreaDesasignacion: ${estaEnArea}, posiciónOcupadaEnArea: ${posicionOcupadaEnArea}`);
                      }

                      // Excluir si está en área O si su posición está ocupada por otro que sí está en área
                      return !estaEnArea && !posicionOcupadaEnArea;
                    });

                    return resultado;
                  })() as any}
                  layout="modal"
                  tipoModal="mantenimiento"
                  onPosicionClick={handlePosicionClick as any}
                  fromMantenimientoModal={true}
                  placa={placa}
                />

                {/* Imagen de placa */}
                <img
                  src="/assets/placa.png"
                  alt="Placa"
                  style={{
                    width: '130px', height: '60px', objectFit: 'contain',
                    position: 'absolute', top: '10px', right: '55px',
                    zIndex: 2, pointerEvents: 'none',
                  }}
                />

                {/* Texto de placa */}
                <Box sx={{
                  position: 'absolute', top: '24px', right: '60px', zIndex: 3,
                  color: 'black', padding: '2px 8px', borderRadius: '5px',
                  fontFamily: 'Arial, sans-serif', fontWeight: 'bold',
                  fontSize: '24px', textAlign: 'center',
                }}>
                  {placa}
                </Box>
              </Box>
            </Card>
          </Stack>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
};

// Componente para neumático draggable
export const DraggableNeumatico: React.FC<{ neumatico: Neumatico }> = ({ neumatico }) => {
  const dragId = neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION || 'neumatico-' + Math.random();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { ...neumatico, from: neumatico.POSICION || 'area-desasignacion' },
  });

  const style = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 62,
    borderRadius: '11px',
    background: '#fff',
    border: isDragging ? '2px solid #2196f3' : '2px solid #bdbdbd',
    boxShadow: isDragging ? '0 0 12px #2196f3' : '0 5px 7px #bbb',
    margin: '0 auto 12px auto',
    cursor: 'grab',
    opacity: isDragging ? 0.7 : 1,
    transition: 'box-shadow 0.2s, border 0.2s, opacity 0.2s',
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
      }}
      {...listeners}
      {...attributes}
    >
      <img
        src={'/assets/neumatico.png'}
        alt="Neumático"
        style={{
          width: 28,
          height: 77,
          objectFit: 'contain',
          filter: isDragging ? 'brightness(0.8)' : undefined
        }}
      />
    </div>
  );
};

// Componente para mostrar información de neumático
const NeumaticoInfo: React.FC<{ neumatico: Neumatico }> = ({ neumatico }) => (
  <>
    <Typography variant="caption" fontWeight="bold" sx={{ mt: 0.5, fontSize: 11, textAlign: 'center', width: '100%' }}>
      {neumatico.CODIGO_NEU || neumatico.CODIGO || 'Sin código'}
    </Typography>
    <Typography variant="caption" sx={{ fontSize: 9, color: '#666', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>
      {neumatico.POSICION || neumatico.POSICION_NEU || ''}
    </Typography>
    <Typography variant="caption" sx={{ fontSize: 10, color: '#888', textAlign: 'center', width: '100%' }}>
      {neumatico.MARCA || ''}
    </Typography>
  </>
);

// Dropzone para neumáticos por desasignar
export const DropNeumaticosPorDesasignar: React.FC<{
  onDropNeumatico: (neu: Neumatico) => void;
  children: React.ReactNode
}> = ({ onDropNeumatico, children }) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: 'neumaticos-por-desasignar' });

  useEffect(() => {
    if (isOver && active && active.data?.current) {
      const neu = active.data.current as Neumatico;
      if (neu && typeof neu.POSICION === 'string' && neu.POSICION) {
        onDropNeumatico({ ...neu, POSICION: neu.POSICION });
      }
    }
  }, [isOver, active, onDropNeumatico]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: 150, // Altura fija aumentada
        width: '320px', // Ancho fijo para 4 neumáticos
        background: isOver ? '#e8f5e8' : '#fafafa',
        border: isOver ? '2px solid #4caf50' : '1px solid #bdbdbd',
        borderRadius: 2,
        p: 1,
        transition: 'background 0.2s, border 0.2s',
        overflow: 'hidden', // Sin scroll
      }}
    >
      {children}
    </Box>
  );
};

// Función auxiliar para obtener última inspección
async function obtenerYSetearUltimaInspeccionPorPlaca(placa: string): Promise<string | null> {
  if (!placa) return null;
  try {
    const fecha = await getUltimaFechaInspeccionPorPlaca(placa);
    console.log('[DEBUG] Última inspección recibida para placa', placa, ':', fecha);
    return fecha || null;
  } catch (error) {
    console.error('Error obteniendo la última inspección por placa:', error);
    return null;
  }
}

export default ModalDesasignar;