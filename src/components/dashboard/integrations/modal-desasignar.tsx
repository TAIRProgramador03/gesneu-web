import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog, DialogContent, Typography, Button, Stack, Box, Card, TextField, MenuItem
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
import { CheckCircle, TriangleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ModalDesasignarProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback solo cuando la acción se completa exitosamente
  neumaticosAsignados: Neumatico[];
  placa: string;
  vehiculo?: Vehiculo;
  kilometraje: number;
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
  kilometraje,
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
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<any>(null);

  // Estados para neumáticos seleccionados y formulario
  const [neumaticosSeleccionados, setNeumaticoSeleccionados] = useState<Neumatico[]>([]);
  const [ultimaPosicionDesasignada, setUltimaPosicionDesasignada] = useState<string>('');
  const [posicionResaltada, setPosicionResaltada] = useState<string>('');
  const [accion, setAccion] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

  // Estado para asignaciones temporales (NO guardadas en BD)
  const [asignacionesTemporales, setAsignacionesTemporales] = useState<any[]>([]);

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
          // NOTA: No se incluye REMANENTE porque sin REMANENTE_ORIGINAL ni ESTADO se interpreta
          // erróneamente como porcentaje y pinta el neumático de rojo. El neumático recién asignado
          // aún no tiene inspección, por lo que se muestra sin color (transparente).
          const neumaticoTemporal: any = {
            CODIGO: asig.CodigoNeumatico?.toString(),
            CODIGO_NEU: asig.CodigoNeumatico?.toString(),
            POSICION: asig.Posicion,
            POSICION_NEU: asig.Posicion,
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
      // Bloquear neumáticos temporales (recién asignados desde modal de asignación)
      if ((neumatico as any).TIPO_MOVIMIENTO === 'TEMPORAL') {
        return;
      }

      // Bloquear nuevas desasignaciones cuando ya hay asignaciones temporales pendientes
      if (asignacionesTemporales.length > 0) {
        toast.info('Ya hay neumáticos pendientes de asignación. Usa "Restaurar" para empezar de nuevo.')
        return;
      }

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

  // Handler para limpiar todo y volver al estado inicial
  const handleLimpiar = () => {
    setNeumaticoSeleccionados([]);
    setAsignacionesTemporales([]);
    setAccion('');
    setObservacion('');
    // Restaurar diagrama al estado original sin temporales ni marcas de desasignación
    setNeumaticosAsignadosState(
      neumaticosAsignados.map(n => ({ ...n, enAreaDesasignacion: false }))
    );
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

      // Bloquear neumáticos temporales (recién asignados desde modal de asignación)
      if ((neumatico as any).TIPO_MOVIMIENTO === 'TEMPORAL') {
        toast.warning('Este neumático está pendiente de asignación y no puede ser desasignado.')
        return;
      }

      // Bloquear nuevas desasignaciones cuando ya hay asignaciones temporales pendientes
      if (asignacionesTemporales.length > 0) {
        toast.info('Ya hay neumáticos pendientes de asignación. Usa "Restaurar" para empezar de nuevo.')
        return;
      }

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

      // Bloquear si la posición destino tiene un neumático TEMPORAL (recién asignado)
      // Esto aplica incluso si es la posición original del neumático arrastrado
      const temporalEnDestino = neumaticosAsignadosState.find(n =>
        (n.POSICION === overId || n.POSICION_NEU === overId) &&
        (n.CODIGO_NEU || n.CODIGO) !== codigoNeumatico &&
        (n as any).TIPO_MOVIMIENTO === 'TEMPORAL'
      );

      if (temporalEnDestino) {
        toast.warning(`La posición ${overId} ya tiene un neumático asignado. No se puede mover el neumático desasignado aquí.`)
        return;
      }

      // Verificar si la posición de destino está reservada por un neumático en área de desasignación
      const posicionReservadaEnArea = neumaticosAsignadosState.find(n =>
        (n.POSICION === overId || n.POSICION_NEU === overId) &&
        (n.CODIGO_NEU || n.CODIGO) !== codigoNeumatico &&
        n.enAreaDesasignacion
      );

      if (posicionReservadaEnArea) {
        console.log(`[handleDragEnd] ⚠️ Posición ${overId} reservada por neumático en área de desasignación`);
        toast.warning(`La posición ${overId} está reservada (neumático pendiente de desasignación)`)
        return;
      }

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
        toast.info(`La posición ${overId} ya está ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`)
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

    neumaticosParaProcesar.forEach((n: any) => {
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
      toast.warning('La observación es obligatoria. Por favor, ingresa una observación.')
      return;
    }

    // 2. Validar que haya neumáticos seleccionados
    if (neumaticosSeleccionados.length === 0) {
      toast.warning('Selecciona al menos un neumático para desasignar.')
      return;
    }

    // 3. Validar que haya acción seleccionada
    if (!accion) {
      toast.warning('Selecciona una acción para la desasignación.')
      return;
    }

    // 4. Validar inspección previa
    if (!fechaUltimaInspeccion || isNaN(new Date(fechaUltimaInspeccion).getTime())) {
      toast.error('No se puede desasignar: primero debe existir una inspección válida para este neumático.', {
        duration: 6000
      })
      return;
    }

    try {
      console.log('[DEBUG] Enviando desasignaciones con:', {
        placa,
        neumaticosSeleccionados: neumaticosSeleccionados.length,
        accion,
        observacion,
        fechaUltimaInspeccion,
        asignacionesTemporales: asignacionesTemporales.length
      });

      // Asignaciones temporales son OBLIGATORIAS para guardar la desasignación
      if (asignacionesTemporales.length === 0) {
        toast.error('Debes asignar neumáticos de reemplazo antes de guardar la desasignación. Usa el botón "Asignar Neumáticos".', {
          duration: 6000
        })
        return;
      }

      // **FLUJO ÚNICO**: Usar endpoint /api/desasignar-con-reemplazo
      if (asignacionesTemporales.length > 0) {
        console.log('[handleGuardarDesasignacion] Usando endpoint desasignar-con-reemplazo');

        // Preparar desasignaciones

        const kilometroActual = kilometraje ?? 0;
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
            KILOMETRO: kilometroActual,
            REMANENTE: neumaticoSeleccionado.REMANENTE,
            COD_SUPERVISOR: vehiculo?.cod_supervisor,
            ID_OPERACION: vehiculo?.id_operacion
          });
        }

        let asignacionesTempo = asignacionesTemporales.map((asi: any) => ({
          ...asi,
          Odometro: kilometroActual,
          COD_SUPERVISOR: vehiculo?.cod_supervisor,
          ID_OPERACION: vehiculo?.id_operacion,
          FechaAsignacion: asi.FechaRegistro
        }))

        // Enviar asignaciones + desasignaciones juntas
        const payload = {
          desasignaciones,
          asignaciones: asignacionesTempo
        };

        console.log('[handleGuardarDesasignacion] Payload completo:', payload);
        const data = await desasignarConReemplazo(payload);

        // if()

        console.log({ dasldwifwa: data })

        toast.success(`${neumaticosSeleccionados.length} desasignación(es) y ${asignacionesTempo.length} asignación(es) registradas correctamente.`, {
          position: 'top-right',
          duration: 6000
        })

        // Limpiar asignaciones temporales
        setAsignacionesTemporales([]);
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
    } catch (error: any) {
      const mensajeError = error?.response?.data?.detalle || error?.message || 'Error desconocido';
      toast.error(`Error al registrar la desasignación: ${mensajeError}`, {
        duration: 8000
      })
    }
  };

  // Posiciones que quedaron vacías por la desasignación actual
  const posicionesVaciasActuales = detectarPosicionesVacias();
  // Verificar si todas las posiciones vacías ya tienen asignación temporal
  const todasPosicionesVaciasAsignadas = posicionesVaciasActuales.length === 0 ||
    posicionesVaciasActuales.every(pos => asignacionesTemporales.some((a: any) => a.Posicion === pos));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
                  <Box sx={{ flexDirection: 'column', gap: 1, minWidth: 220, flex: 1, height: 190 }}>
                    <TextField
                      select
                      label="Acción"
                      size="small"
                      value={accion}
                      onChange={(e) => setAccion(e.target.value)}
                      sx={{ minWidth: 220, flex: 0.4, marginBottom: '14px', marginTop: '10px' }}
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
                    {
                      // const tienePosicionesVacias = posicionesVaciasActuales.length > 0;
                      posicionesVaciasActuales.length > 0 && (
                        <Box
                          sx={{
                            marginTop: '8px',
                            marginBottom: '8px',
                            p: 1.5,
                            bgcolor: todasPosicionesVaciasAsignadas ? 'success.lighter' : 'warning.lighter',
                            border: '1px solid',
                            borderColor: todasPosicionesVaciasAsignadas ? 'success.main' : 'warning.main',
                            borderRadius: 1,
                            maxWidth: 350,
                            mb: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            color={todasPosicionesVaciasAsignadas ? 'success.dark' : 'warning.dark'}
                            sx={{ fontWeight: 500 }}
                          >
                            {todasPosicionesVaciasAsignadas
                              ? (
                                <div className='flex gap-2 items-center'>
                                  <CheckCircle width={15} />
                                  <span>
                                    {`Posiciones cubiertas: ${posicionesVaciasActuales.join(', ')}`}
                                  </span>
                                </div>
                              )
                              : (
                                <div className='flex gap-2 items-center'>
                                  <TriangleAlertIcon width={28} />
                                  <span>
                                    {`Debes asignar nuevos neumáticos en: ${posicionesVaciasActuales.filter(pos => !asignacionesTemporales.some((a: any) => a.Posicion === pos)).join(', ')}`}
                                  </span>
                                </div>
                              )
                            }
                          </Typography>
                        </Box>
                      )}

                  </Box>

                  <Box sx={{ position: 'relative', width: '420px' }}>
                    <DropNeumaticosPorDesasignar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                      <Box sx={{
                        mt: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                        height: 150, width: '420px', // Tamaño fijo para 4 neumáticos horizontales aumentado
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
                            Arrastra neumáticos aquí para desasignar
                          </Typography>
                        )}
                      </Box>
                    </DropNeumaticosPorDesasignar>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button onClick={onClose} color="error" variant="outlined">
                    Cerrar
                  </Button>
                  <Button
                    color="inherit"
                    variant="contained"
                    sx={{ ml: 1 }}
                    onClick={handleLimpiar}
                    disabled={neumaticosSeleccionados.length === 0 && asignacionesTemporales.length === 0 && !accion && !observacion}
                  >
                    Restaurar
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    sx={{ ml: 1 }}
                    onClick={handleGuardarDesasignacion}
                    disabled={neumaticosSeleccionados.length === 0 || !accion || !todasPosicionesVaciasAsignadas}
                  >
                    Guardar Desasignación y Asignación
                  </Button>
                  {onAbrirAsignacion && (() => {
                    const tienePosicionesVacias = posicionesVaciasActuales.length > 0;
                    const tieneAccionYObservacion = accion.trim() !== '' && observacion.trim() !== '';

                    return (
                      <>
                        {/* Mensaje informativo si hay posiciones vacías */}


                        {/* Botón Asignar Neumáticos */}
                        <Button
                          color="success"
                          variant="contained"
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
                            console.log('[Button Asignar] Posiciones vacías:', posicionesVaciasActuales);
                            console.log('[Button Asignar] Neumáticos actuales:', neumaticosActuales.map(n => ({
                              codigo: n.CODIGO_NEU || n.CODIGO,
                              posicion: n.POSICION || n.POSICION_NEU
                            })));
                            onAbrirAsignacion({
                              cachedNeumaticosAsignados: neumaticosActuales,
                              posicionesVacias: posicionesVaciasActuales
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
              maxWidth: 400, minWidth: 420, width: '100%',
            }}>
              <Box sx={{ position: 'relative', width: '370px', height: '430px' }}>
                <DiagramaVehiculo
                  key={`diagrama-live-${Date.now()}`}
                  // posicionResaltada={posicionResaltada}
                  neumaticosAsignados={neumaticosAsignadosState.filter(n => !n.enAreaDesasignacion) as any}
                  layout="modal"
                  tipoModal="mantenimiento"
                  onPosicionClick={handlePosicionClick as any}
                  fromMantenimientoModal={true}
                  placa={placa}
                />
                <Image src='/assets/placa.png' alt='Placa' width={130} height={60} style={{
                  objectFit: 'contain',
                  position: 'absolute',
                  top: '10px',
                  right: '55px',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
                />
                {/* Texto de placa */}
                <Box sx={{
                  position: 'absolute', top: '28px', right: '65px', zIndex: 3,
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
    </Dialog >
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
        src={'/assets/neumatico-new.png'}
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
        width: '420px', // Ancho fijo para 4 neumáticos
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
    return fecha?.fecha_registro || null;
  } catch (error) {
    console.error('Error obteniendo la última inspección por placa:', error);
    return null;
  }
}

export default ModalDesasignar;