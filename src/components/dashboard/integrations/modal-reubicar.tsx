import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, Typography, Button, Stack, Box, Card, TextField
} from '@mui/material';
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { Neumatico, Vehiculo, User } from '../../../types/types';
import {
  registrarReubicacionNeumatico,
  getUltimaFechaInspeccionPorPlaca
} from '../../../api/Neumaticos';
import { toast } from 'sonner';
import Image from 'next/image';
import { convertToDateHuman } from '@/lib/utils';

interface ModalReubicarProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback solo cuando la acción se completa exitosamente
  neumaticosAsignados: Neumatico[];
  placa: string;
  vehiculo?: Vehiculo;
  user?: User;
  onAbrirInspeccion?: () => void;
}

export const ModalReubicar: React.FC<ModalReubicarProps> = ({
  open,
  onClose,
  onSuccess,
  neumaticosAsignados,
  placa,
  vehiculo,
  user,
  onAbrirInspeccion,
}) => {
  // console.log('[ModalReubicar] Abriendo modal con props:', { open, placa, neumaticosAsignados: neumaticosAsignados.length });

  const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<Neumatico[]>([]);
  const [initialAssignedMap, setInitialAssignedMap] = useState<Record<string, Neumatico>>({});
  const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<string>('');
  const [reubicacionBloqueada, setReubicacionBloqueada] = useState<boolean>(false);

  // Estados para control de arrastrar y soltar
  const [posicionOriginal, setPosicionOriginal] = useState<string | null>(null);
  const [codigoOriginal, setCodigoOriginal] = useState<string | null>(null);
  const [swapInfo, setSwapInfo] = useState<{ from: string; to: string } | null>(null);

  // Estados para formulario
  const [observacion, setObservacion] = useState<string>('');

  // Estado para controlar neumático en zona temporal (solo uno a la vez)
  const [neumaticoEnZonaTemporal, setNeumaticoEnZonaTemporal] = useState<Neumatico | null>(null);

  // Estado para forzar re-renderización visual
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado directo para DiagramaVehiculo (sincronización inmediata)
  const [diagramaData, setDiagramaData] = useState<Neumatico[]>([]);

  // Estado para mapa de posiciones ocupadas
  const [posicionesOcupadas, setPosicionesOcupadas] = useState<Map<string, Neumatico>>(new Map());

  // Inicializar state cuando se abre el modal
  useEffect(() => {
    if (open && neumaticosAsignados && neumaticosAsignados.length > 0) {
      console.log('[ModalReubicar] Inicializando con neumaticosAsignados:', neumaticosAsignados);

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

      console.log('[ModalReubicar] Neumáticos limpios (sin duplicados):', neumaticosFinales.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION}`));
      console.log('[ModalReubicar] Posiciones ocupadas:', Array.from(posicionesMap.keys()));

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
      console.log('[ModalReubicar] Mapa inicial creado:', mapa);

      // Inicializar posicionesOcupadas con Map (incluye POS y RES)
      const mapaOcupadas = new Map<string, Neumatico>();
      Object.entries(mapa).forEach(([pos, neu]) => {
        mapaOcupadas.set(pos, neu);
      });
      console.log('[ModalReubicar] 🎯 Mapa ocupadas inicial:', Array.from(mapaOcupadas.keys()));
      setPosicionesOcupadas(mapaOcupadas);

      // Inicializar diagramaData con datos del mapa
      const initialDiagramaData = Array.from(Object.entries(mapa)).map(([pos, neu]) => ({
        ...neu,
        POSICION: pos,
        POSICION_NEU: pos,
      }));
      setDiagramaData(initialDiagramaData);
      console.log('[ModalReubicar] 🎯 DiagramaData inicial:', initialDiagramaData.map(n => `${n.CODIGO_NEU || n.CODIGO}→${n.POSICION}`));

      // Limpiar zona temporal y observación cuando se abre el modal
      setNeumaticoEnZonaTemporal(null);
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
    console.log('[ModalReubicar] 🔄 SINCRONIZACIÓN FORZADA');
    console.log('[ModalReubicar] 🎯 DiagramaData actualizado:', arrayFromMap.map(n => `${n.CODIGO_NEU || n.CODIGO}→${n.POSICION}`).join(', '));
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

    console.log('[actualizarEstados] 🚀 Estados sincronizados:', Array.from(nuevoPosicionesMap.keys()));
    console.log('[actualizarEstados] 📦 Neumáticos totales:', nuevosNeumaticos.length, '| En posiciones:', nuevoPosicionesMap.size);
  };

  // Handler para drop de neumático
  const handleDropNeumatico = (neumatico: Neumatico, posicion: string) => {
    console.log('[handleDropNeumatico] Neumatico:', neumatico.CODIGO_NEU || neumatico.CODIGO, 'Posicion actual:', neumatico.POSICION, 'Destino:', posicion);
    console.log('[handleDropNeumatico] Zona temporal ocupada:', neumaticoEnZonaTemporal ? (neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO) : 'vacía');

    if (posicion === '') {
      // Moviendo a zona temporal - solo permitir si no hay otro neumático
      if (neumaticoEnZonaTemporal) {
        console.log('[handleDropNeumatico] Rechazando: zona temporal ya ocupada');
        toast.warning('Solo puede haber un neumático en la zona de reubicación a la vez.');
        return;
      }

      if (neumatico.POSICION) {
        // Mover neumático a zona temporal y liberar su posición
        setNeumaticoEnZonaTemporal({ ...neumatico });

        // Remover el neumático de su posición actual
        const nuevosNeumaticos = neumaticosAsignadosState.filter(n =>
          (n.CODIGO_NEU || n.CODIGO) !== (neumatico.CODIGO_NEU || neumatico.CODIGO)
        );
        actualizarEstados(nuevosNeumaticos);

        console.log(`[handleDropNeumatico] ✅ Neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO} movido a zona temporal, posición ${neumatico.POSICION} liberada`);
        console.log(`[handleDropNeumatico] 📊 NUEVO ESTADO:`, nuevosNeumaticos.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION}`));
      }
    }
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
    const activeData = active.data.current as Neumatico & { from?: string } | undefined;

    console.log('[handleDragEnd] 🎯 DRAG DEBUG - activeId:', activeId, 'overId:', overId);
    console.log('[handleDragEnd] 🎯 DRAG DEBUG - active.data:', activeData);
    console.log('[handleDragEnd] Estado zona temporal:', neumaticoEnZonaTemporal ? (neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO) : 'vacía');
    console.log('[handleDragEnd] Neumáticos en estado:', neumaticosAsignadosState.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION}`));

    // CASO 1: Movimiento desde zona temporal a una posición  
    const codigoZonaTemporal = neumaticoEnZonaTemporal ? (neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO) : null;
    // Verificar si viene de zona temporal: el activeId puede ser "zona-temporal-{codigo}" o solo el código
    const esDesdeZonaTemporal = !!neumaticoEnZonaTemporal && (
      activeId.toString().startsWith('zona-temporal-') ||
      activeId.toString() === `zona-temporal-${codigoZonaTemporal}` ||
      (neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO) === activeId ||
      activeData?.POSICION === 'zona-temporal' ||
      (activeData?.CODIGO_NEU || activeData?.CODIGO) === codigoZonaTemporal
    );

    console.log('[handleDragEnd] 🔍 VERIFICACIÓN ZONA TEMPORAL:');
    console.log('  - Código en zona temporal:', codigoZonaTemporal);
    console.log('  - ActiveId recibido:', activeId);
    console.log('  - Active.data.POSICION:', activeData?.POSICION);
    console.log('  - ¿Es desde zona temporal?:', esDesdeZonaTemporal);

    if (esDesdeZonaTemporal) {
      console.log(`[handleDragEnd] 🔵 CASO 1: Movimiento desde zona temporal - ${activeId} hacia ${overId}`);
      console.log(`[handleDragEnd] 🔵 Verificación zona temporal: código=${neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO}, activeId=${activeId}`);
      console.log('[handleDragEnd] 🔵 Neumático en zona temporal:', neumaticoEnZonaTemporal);

      if (overId.startsWith('POS') || overId.startsWith('RES')) {
        // Verificar si la posición de destino está ocupada
        const neumaticoEnDestino = neumaticosAsignadosState.find(n => n.POSICION === overId);
        console.log(`[handleDragEnd] Verificando posición ${overId}, ocupada por:`, neumaticoEnDestino ? (neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO) : 'nadie');

        if (neumaticoEnDestino) {
          toast.warning(`La posición ${overId} ya está ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`)
          return;
        }
        // Eliminar cualquier instancia previa de este neumático (por código)
        const codigo = neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO;
        const nuevosNeumaticos = [
          ...neumaticosAsignadosState.filter(n => (n.CODIGO_NEU || n.CODIGO) !== codigo),
          { ...neumaticoEnZonaTemporal, POSICION: overId }
        ];

        console.log('[handleDragEnd] 🔵 Moviendo desde zona temporal:', {
          neumatico: { ...neumaticoEnZonaTemporal, POSICION: overId },
          estadoAnterior: neumaticosAsignadosState.length,
          estadoNuevo: nuevosNeumaticos.length
        });

        actualizarEstados(nuevosNeumaticos);
        setNeumaticoEnZonaTemporal(null);

        console.log(`[handleDragEnd] ✅ Neumático ${neumaticoEnZonaTemporal.CODIGO_NEU || neumaticoEnZonaTemporal.CODIGO} movido desde zona temporal a ${overId}`);
        console.log(`[handleDragEnd] 📊 NUEVO ESTADO:`, nuevosNeumaticos.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION}`));
        return;
      }
      console.log(`[handleDragEnd] ⚠️ Destino ${overId} no es una posición válida para zona temporal`);
      return;
    }

    // CASO 2: Movimiento desde posición a zona temporal
    if (overId === 'neumaticos-por-rotar') {
      console.log(`[handleDragEnd] 🟡 CASO 2: Movimiento desde posición a zona temporal - ${activeId}`);

      // Intentar obtener el neumático desde active.data.current primero (viene del diagrama)
      let neumatico: Neumatico | undefined;
      if (activeData) {
        neumatico = activeData as Neumatico;
        console.log(`[handleDragEnd] 🟡 Neumático obtenido desde active.data.current:`, neumatico.CODIGO_NEU || neumatico.CODIGO);
      } else {
        // Fallback: buscar en el estado por código o posición
        neumatico = neumaticosAsignadosState.find(n =>
          (n.CODIGO_NEU || n.CODIGO) === activeId ||
          n.POSICION === activeId ||
          (n.CODIGO_NEU || n.CODIGO || n.POSICION) === activeId
        );
        console.log(`[handleDragEnd] 🟡 Neumático obtenido desde estado:`, neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : 'no encontrado');
      }

      if (neumatico) {
        handleDropNeumatico(neumatico, '');
      } else {
        console.log(`[handleDragEnd] ⚠️ No se encontró neumático ${activeId} en el estado ni en active.data`);
      }
      return;
    }

    // CASO 3: Movimiento directo entre posiciones (sin zona temporal)
    if (overId.startsWith('POS') || overId.startsWith('RES')) {
      console.log(`[handleDragEnd] 🟢 CASO 3: Movimiento directo entre posiciones - ${activeId} hacia ${overId}`);

      // Intentar obtener el neumático desde active.data.current primero (viene del diagrama)
      let neumatico: Neumatico | undefined;
      if (activeData) {
        neumatico = activeData as Neumatico;
        console.log(`[handleDragEnd] 🟢 Neumático obtenido desde active.data.current:`, neumatico.CODIGO_NEU || neumatico.CODIGO);
      } else {
        // Fallback: buscar en el estado por código o posición
        neumatico = neumaticosAsignadosState.find(n =>
          (n.CODIGO_NEU || n.CODIGO) === activeId ||
          n.POSICION === activeId
        );
        console.log(`[handleDragEnd] 🟢 Neumático obtenido desde estado:`, neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : 'no encontrado');
      }

      if (!neumatico) {
        console.log('[handleDragEnd] ⚠️ Neumático no encontrado para movimiento directo');
        return;
      }

      const codigoNeumatico = neumatico.CODIGO_NEU || neumatico.CODIGO;
      console.log(`[handleDragEnd] Neumático encontrado: ${codigoNeumatico} en posición ${neumatico.POSICION}`);

      // Verificar si la posición de destino está ocupada por OTRO neumático
      const neumaticoEnDestino = neumaticosAsignadosState.find(n =>
        n.POSICION === overId && (n.CODIGO_NEU || n.CODIGO) !== codigoNeumatico
      );

      if (neumaticoEnDestino) {
        console.log(`[handleDragEnd] ⚠️ Posición ${overId} ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`);
        toast.warning(`La posición ${overId} ya está ocupada por ${neumaticoEnDestino.CODIGO_NEU || neumaticoEnDestino.CODIGO}`)
        return;
      }

      // Realizar el movimiento directo - actualizar solo el neumático correcto
      const nuevosNeumaticos = neumaticosAsignadosState.map(n => {
        const codigoN = n.CODIGO_NEU || n.CODIGO;
        if (codigoN === codigoNeumatico) {
          console.log(`[handleDragEnd] Actualizando ${codigoNeumatico}: ${n.POSICION} -> ${overId}`);
          return { ...n, POSICION: overId };
        }
        return n;
      });

      actualizarEstados(nuevosNeumaticos);
      console.log(`[handleDragEnd] ✅ Movimiento directo completado: ${codigoNeumatico} de ${neumatico.POSICION} a ${overId}`);
      console.log(`[handleDragEnd] 📊 NUEVO ESTADO:`, nuevosNeumaticos.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION}`));
      return;
    }

    console.log(`[handleDragEnd] ⚠️ Destino ${overId} no manejado`);
  };

  // Handler para guardar reubicación
  const handleGuardarReubicacion = async () => {
    if (!fechaUltimaInspeccion) {
      toast.error('No se puede reubicar: primero debe existir una inspección válida.');
      return;
    }

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
          FECHA_REGISTRO: fechaUltimaInspeccion ? fechaUltimaInspeccion.slice(0, 10) : new Date().toISOString().slice(0, 10),
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
          COD_SUPERVISOR: vehiculo?.cod_supervisor
        };

        movimientosPorCodigo.set(codigoNeu, movimiento);
        movimientos.push(movimiento);
      }
    }

    if (movimientos.length === 0) {
      toast.info('No hay cambios de posición para registrar.');
      return;
    }

    console.log('[handleGuardarReubicacion] Movimientos a registrar:', movimientos);

    try {
      const normalizedPayloadArray = movimientos.map(normalizePayload);
      await registrarReubicacionNeumatico(normalizedPayloadArray);

      toast.success('Reubicación registrada correctamente', {
        duration: 6000,
        position: 'top-right'
      })

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
        toast.error('Error al registrar la reubicación: ' + error.message);
      } else {
        toast.error('Error al registrar la reubicación: ' + String(error));
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
    setNeumaticoEnZonaTemporal(null); // Limpiar zona temporal
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogContent>
        <DndContext
          onDragStart={(event: DragStartEvent) => {
            console.log('[DndContext] 🚀 DRAG START - activeId:', event.active.id, 'data:', event.active.data.current);
          }}
          onDragEnd={handleDragEnd}
        >
          <Stack direction="row" spacing={2}>
            <Stack direction="column" spacing={2} sx={{
              flex: 1, width: '350px',
              maxWidth: 400, minWidth: 320
            }}>
              {/* Card de información del vehículo */}
              <Card sx={{
                p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                maxWidth: 400, minWidth: 320, width: '100%'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Reubicar Neumáticos
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

              {/* Card para REUBICAR */}
              <Card sx={{
                p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                maxWidth: 400, minWidth: 320, width: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                  <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>REUBICAR</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha última inspección:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {convertToDateHuman(fechaUltimaInspeccion) || 'Sin registro'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100%', flex: 1, height: 100 }}>
                    <TextField
                      label="Motivo de la reubicación"
                      size="small"
                      multiline
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      sx={{ minWidth: '100%', width: '100%', flex: 1 }}
                      InputProps={{
                        sx: { height: '100%', alignItems: 'flex-start' }
                      }}
                    />
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
                      Zona de Reubicación
                    </Typography>

                    {/* Área de drop solo cuando está vacía */}
                    {!neumaticoEnZonaTemporal && (
                      <DropNeumaticosPorRotar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                        <Box sx={{
                          mt: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
                          minHeight: 120, height: 120, width: '230px', maxWidth: '230px',
                          mx: 0, p: 1,
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic', textAlign: 'center' }}>
                            Arrastre un neumático aquí para reubicarlo
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              (Solo uno a la vez)
                            </Typography>
                          </Typography>
                        </Box>
                      </DropNeumaticosPorRotar>
                    )}

                    {/* Neumático en zona temporal - renderizado idéntico a desasignación */}
                    {neumaticoEnZonaTemporal && (
                      <Box sx={{
                        minHeight: 150,
                        width: '250px', // Mismo ancho que en desasignación
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        position: 'relative',
                        border: '1px solid #bdbdbd',
                        borderRadius: 2,
                        background: '#fafafa',
                        p: 1,
                        gap: 1,
                        flexWrap: 'wrap',
                      }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: 70,
                          maxWidth: 70, // Ancho fijo para cada neumático
                          position: 'relative',
                        }}>
                          <Box sx={{
                            position: 'relative',
                            zIndex: 20, // Asegurar que el neumático esté por encima
                            pointerEvents: 'auto', // Asegurar que reciba eventos
                          }}>
                            <DraggableNeumatico
                              neumatico={{
                                ...neumaticoEnZonaTemporal,
                                POSICION: 'zona-temporal' // Identificar que está en zona temporal
                              }}
                            />
                          </Box>
                          <Box sx={{ pointerEvents: 'none' }}> {/* Evitar que NeumaticoInfo capture eventos */}
                            <NeumaticoInfo neumatico={neumaticoEnZonaTemporal} />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleClose} color="primary" variant="contained">
                    Cerrar
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    sx={{ ml: 1 }}
                    onClick={handleGuardarReubicacion}
                  >
                    Guardar Reubicación
                  </Button>
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
                  key={`diagrama-live-${refreshKey}-${Date.now()}`}
                  neumaticosAsignados={(() => {
                    // USAR DATOS SINCRONIZADOS DIRECTOS
                    const dataWithForce = diagramaData.map((n, idx) => ({
                      ...n,
                      _forceRender: Date.now() + idx // Garantizar nueva referencia
                    }));

                    console.log('[DiagramaVehiculo] 🚀 DATOS SINCRONIZADOS ENVIADOS:', dataWithForce.map(n => `${n.CODIGO_NEU || n.CODIGO}:${n.POSICION || 'SIN_POS'}`));
                    return dataWithForce;
                  })() as any}
                  layout="modal"
                  tipoModal="mantenimiento"
                  onPosicionClick={(() => { }) as any}
                  fromMantenimientoModal={true}
                  placa={placa}
                />

                {/* Imagen de placa */}
                {/* <img
                  src="/assets/placa.png"
                  alt="Placa"
                  style={{
                    width: '130px', height: '60px', objectFit: 'contain',
                    position: 'absolute', top: '10px', right: '55px',
                    zIndex: 2, pointerEvents: 'none',
                  }}
                /> */}

                <Image src='/assets/placa.png' alt='Placa' width={130} height={60} style={{
                  objectFit: 'contain',
                  position: 'absolute',
                  top: '0px',
                  right: '75px',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
                />

                {/* Texto de placa */}
                <Box sx={{
                  position: 'absolute', top: '16px', right: '85px', zIndex: 3,
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
  // Usar un ID único que incluya la posición para evitar conflictos
  const baseId = neumatico.CODIGO_NEU || neumatico.CODIGO || 'neumatico-' + Math.random();
  const dragId = neumatico.POSICION === 'zona-temporal'
    ? `zona-temporal-${baseId}`
    : baseId;

  // Determinar la posición real - si es 'zona-temporal', usar eso explícitamente
  const posicionReal = neumatico.POSICION === 'zona-temporal' ? 'zona-temporal' : (neumatico.POSICION || 'zona-temporal');

  // Memoizar el data para asegurar que se actualice cuando cambie el neumático
  const draggableData = React.useMemo(() => ({
    ...neumatico,
    POSICION: posicionReal, // Usar la posición real (zona-temporal si está ahí)
    from: posicionReal
  }), [neumatico, posicionReal]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: draggableData,
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
    margin: '0 auto',
    cursor: 'grab',
    opacity: isDragging ? 0.7 : 1,
    transition: 'box-shadow 0.2s, border 0.2s, opacity 0.2s',
    position: 'relative' as const,
    zIndex: neumatico.POSICION === 'zona-temporal' ? 10 : 'auto', // Asegurar que el neumático en zona temporal esté por encima
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
          filter: isDragging ? 'brightness(0.8)' : undefined,
          pointerEvents: 'none', // Permitir que los eventos pasen al div padre
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
    <br />
    <Typography variant="caption" sx={{ fontSize: 10, color: '#888', textAlign: 'center', width: '100%' }}>
      {neumatico.MARCA || ''}
    </Typography>
  </>
);

// Dropzone para neumáticos
export const DropNeumaticosPorRotar: React.FC<{
  onDropNeumatico: (neu: Neumatico) => void;
  children: React.ReactNode
}> = ({ onDropNeumatico, children }) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: 'neumaticos-por-rotar' });

  React.useEffect(() => {
    if (isOver && active) {
      console.log('[DropNeumaticosPorRotar] 🎯 DROPZONE ACTIVO - isOver:', isOver, 'activeId:', active.id);
    }
  }, [isOver, active]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 120,
        width: '250px',
        maxWidth: '100%',
        background: isOver ? '#e8f5e8' : '#fafafa',
        border: isOver ? '2px solid #4caf50' : '1px solid #bdbdbd',
        borderRadius: 2,
        p: 1,
        transition: 'background 0.2s, border 0.2s',
        overflow: 'auto',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
};

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
    TORQUE_APLICADO: mov.TORQUE_APLICADO || '',
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
  };
}

// Función auxiliar para obtener última inspección
async function obtenerYSetearUltimaInspeccionPorPlaca(placa: string): Promise<string | null> {
  if (!placa) return null;
  try {
    const fecha = await getUltimaFechaInspeccionPorPlaca(placa);
    console.log('[DEBUG] Última inspección recibida para placa', placa, ':', fecha?.fecha_registro);
    return fecha?.fecha_registro || null;
  } catch (error) {
    console.error('Error obteniendo la última inspección por placa:', error);
    return null;
  }
}

export default ModalReubicar;