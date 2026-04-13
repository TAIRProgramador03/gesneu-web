import React, { useState, useMemo, useEffect, memo } from 'react';
import {
    Box,
    Card,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    Chip,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ModalAvertAsigNeu from './modal-avert-asig-neu';
import ModalInputsNeu from './modal-inputs-neu';
import { Neumatico } from '@/types/types';
import { toast } from 'sonner';
import Image from 'next/image';
import { convertToDateHuman } from '@/lib/utils';
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsNeuParaAsignar, columnsNeuParaAsignarDesdeDesasignar } from '@/app/dashboard/integrations/columns';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { ClipboardCheck, ClipboardList } from 'lucide-react';
import ModalInputsNeuDesasignacion from './modal-inputs-neu-desasignacion';
import { getUltimaFechaInspeccionPorPlaca, obtenerNeumaticosDisponibles } from '@/api/Neumaticos';
import { useQuery } from '@tanstack/react-query';

const ItemType = {
    NEUMATICO: 'neumatico',
};

export interface ModalAsignacionNeuDesdeDesasignacionProps {
    open: boolean;
    onClose: () => void;
    data: any[];
    cachedNeumaticosAsignados: Neumatico[]; // Datos cacheados desde desasignación
    posicionesVacias: string[]; // Posiciones que deben ser llenadas
    placa: string;
    kilometro: number;
    onAssignedUpdate?: () => void; // Callback para refrescar asignados
    onTemporaryAssign?: (asignaciones: any[]) => void; // Callback para retornar asignaciones temporales
}

const DraggableNeumatico: React.FC<{
    neumatico: Neumatico;
    disabled?: boolean;
}> = React.memo(({ neumatico, disabled = false }) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ItemType.NEUMATICO,
            item: { ...neumatico },
            canDrag: !disabled,
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }),
        [neumatico, disabled]
    );

    const ref = React.useRef<HTMLDivElement>(null);
    drag(ref);

    return (
        <div
            ref={ref}
            style={{
                cursor: disabled ? 'not-allowed' : 'grab',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <img
                src="/assets/neumatico-new.png"
                alt="Neumático"
                style={{
                    width: '30px',
                    height: '60px',
                    display: 'block',
                    margin: '0 auto',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
});

const isDuplicadoEnOtraPos = (
    codigo: string,
    posicionActual: string,
    asignaciones: { [key: string]: Neumatico | null }
): boolean => {
    return Object.entries(asignaciones).some(
        ([posicion, neumatico]) =>
            neumatico?.CODIGO === codigo && posicion !== posicionActual
    );
};

interface DropZoneProps {
    position: string;
    onDrop: (neumatico: Neumatico) => void;
    isAssigned: boolean;
    assignedNeumaticos: Record<string, Neumatico | null>;
    setAssignedNeumaticos: React.Dispatch<React.SetStateAction<Record<string, Neumatico | null>>>;
    kilometro: number;
    esPosicionVacia: boolean; // Nueva prop: indica si esta posición debe ser llenada
    posicionesVacias: string[]; // Lista de posiciones vacías requeridas
    fechaInspeccion: string
}

const DropZone: React.FC<DropZoneProps> = memo(({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
    kilometro,
    esPosicionVacia,
    posicionesVacias,
    fechaInspeccion
}) => {
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
    const [dropBlocked, setDropBlocked] = React.useState<boolean>(false);
    const [lastRemovedCode, setLastRemovedCode] = React.useState<string | null>(null);
    const [isShaking, setIsShaking] = React.useState<boolean>(false);
    const [inputsModalOpen, setInputsModalOpen] = React.useState<boolean>(false);
    const [pendingInputs, setPendingInputs] = React.useState<null | { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }>(null);

    const triggerShake = (): void => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
    };

    const handleInputsModalSubmit = (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }): void => {
        setAssignedNeumaticos((prev) => {
            const current = prev[position];
            if (!current) return prev;
            return {
                ...prev,
                [position]: {
                    ...current,
                    REMANENTE: data.Remanente,
                    PRESION_AIRE: data.PresionAire,
                    TORQUE_APLICADO: data.TorqueAplicado,
                    ODOMETRO: data.Odometro,
                    FECHA_ASIGNACION: data.FechaAsignacion,
                },
            };
        });
        setInputsModalOpen(false);
    };

    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: ItemType.NEUMATICO,
        drop: (item: Neumatico) => {
            // BLOQUEAR si la posición NO está en la lista de posiciones vacías
            if (!esPosicionVacia) {
                triggerShake();
                return;
            }

            if (isModalOpen || dropBlocked) return;
            if (item.CODIGO === lastRemovedCode) {
                return;
            }
            let shouldShake = false;
            setAssignedNeumaticos((prev) => {
                if (isDuplicadoEnOtraPos(item.CODIGO, position, prev)) {
                    shouldShake = true;
                    return prev;
                }
                return { ...prev, [position]: { ...item, TIPO_MOVIMIENTO: 'TEMPORAL' } as Neumatico };
            });
            if (shouldShake) {
                setTimeout(() => { triggerShake(); }, 0);
            } else {
                setInputsModalOpen(true);
            }
        },
    });
    drop(ref);

    const handleContextMenu = (event: React.MouseEvent): void => {
        event.preventDefault();
        // Solo mostrar menú en posiciones vacías que ya tienen un neumático asignado
        if (isAssigned && esPosicionVacia) {
            setMenuAnchor(event.currentTarget as HTMLElement);
        }
    };

    const handleCloseMenu = (): void => {
        setMenuAnchor(null);
    };

    const handleOpenModal = (): void => {
        setIsModalOpen(true);
        handleCloseMenu();
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
    };

    const handleConfirmRemove = (): void => {
        const removedCode = assignedNeumaticos[position]?.CODIGO || null;
        setIsModalOpen(false);
        setDropBlocked(true);
        setLastRemovedCode(removedCode);

        setTimeout(() => {
            setAssignedNeumaticos((prev) => ({
                ...prev,
                [position]: null,
            }));

            setTimeout(() => {
                setDropBlocked(false);
                setLastRemovedCode(null);
            }, 200);
        }, 0);
    };

    const neumatico = assignedNeumaticos[position];
    const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');

    const isPosicionPrincipal = ['POS01', 'POS02', 'POS03', 'POS04'].includes(position);

    // Estilo especial para posiciones vacías requeridas
    const backgroundColor = esPosicionVacia && !isAssigned
        ? 'rgb(255 204 211)' // Amarillo claro para indicar que debe ser llenada
        : isAssigned && !esBajaORecuperado
            ? (neumatico?.TIPO_MOVIMIENTO === 'TEMPORAL' ? '#00ACC1' : 'lightgreen') // Turquesa: recién asignado sin inspección
            : 'transparent';

    const borderColor = esPosicionVacia && !isAssigned
        ? '2px dashed rgb(199 0 54)' // Borde naranja para posiciones vacías requeridas
        : 'none';

    const dropZoneStyle: React.CSSProperties = isPosicionPrincipal
        ? {
            width: '27px',
            height: '58px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor,
            borderRadius: '6px',
            border: borderColor,
            pointerEvents: 'auto',
            cursor: esPosicionVacia ? 'grab' : (isAssigned && !esBajaORecuperado ? 'pointer' : 'not-allowed'),
            boxShadow: isShaking ? '0 0 10px 4px red' : (esPosicionVacia && !isAssigned ? '0 0 8px 2px rgb(126, 2, 2)' : 'none'),
            transition: 'box-shadow 0.2s ease-in-out',
        }
        : {
            width: '58px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor,
            borderRadius: '6px',
            border: borderColor,
            pointerEvents: 'auto',
            cursor: esPosicionVacia ? 'grab' : (isAssigned && !esBajaORecuperado ? 'pointer' : 'not-allowed'),
            boxShadow: isShaking ? '0 0 10px 4px red' : (esPosicionVacia && !isAssigned ? '0 0 8px 2px rgb(126, 2, 2)' : 'none'),
            transition: 'box-shadow 0.2s ease-in-out',
        };

    return (
        <div
            ref={ref}
            onContextMenu={handleContextMenu}
            style={dropZoneStyle}
        >
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
                <MenuItem onClick={() => { setInputsModalOpen(true); handleCloseMenu(); }}>Editar neumático</MenuItem>
                <MenuItem onClick={handleOpenModal}>Quitar neumático</MenuItem>
            </Menu>

            <ModalAvertAsigNeu
                open={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmRemove}
                message={`¿Deseas quitar el neumático asignado en la posición ${position}?`}
            />
            <ModalInputsNeuDesasignacion
                open={inputsModalOpen}
                onClose={() => setInputsModalOpen(false)}
                onSubmit={handleInputsModalSubmit}
                initialRemanente={assignedNeumaticos[position]?.REMANENTE ? Number(assignedNeumaticos[position]?.REMANENTE) : 0}
                initialOdometro={typeof kilometro === 'number' ? kilometro : 0}
                initialPresionAire={assignedNeumaticos[position]?.PRESION_AIRE ? Number(assignedNeumaticos[position]?.PRESION_AIRE) : 0}
                initialTorqueAplicado={assignedNeumaticos[position]?.TORQUE_APLICADO ? Number(assignedNeumaticos[position]?.TORQUE_APLICADO) : 0}
                initialFechaAsignacion={assignedNeumaticos[position]?.FECHA_ASIGNACION || ''}
                fechaRegistroNeumatico={assignedNeumaticos[position]?.FECHA_REGISTRO || ''}
                esRecuperado={assignedNeumaticos[position]?.RECUPERADO || false}
                fechaRecuperado={assignedNeumaticos[position]?.FECHA_RECUPERADO || null}
                fechaInspeccion={fechaInspeccion}
            />
        </div>
    );
});

const ModalAsignacionNeuDesdeDesasignacion: React.FC<ModalAsignacionNeuDesdeDesasignacionProps> = memo(({
    open,
    onClose,
    cachedNeumaticosAsignados,
    posicionesVacias,
    placa,
    kilometro,
    onAssignedUpdate,
    onTemporaryAssign
}) => {


    const { data: neumaticosDisponiblesConBajas = [] } = useQuery({
        queryKey: ['neumaticos-disponibles-con-bajas'],
        queryFn: () => obtenerNeumaticosDisponibles('desasignacion'),
        staleTime: 0
    })

    const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState('')

    useEffect(() => {
        if (open && placa) {
            obtenerYSetearUltimaInspeccionPorPlaca(placa).then(fecha => {
                if (fecha) {
                    setFechaUltimaInspeccion(fecha);
                }
            });
        }
    }, [open, placa]);

    // Inicializar con mapa vacío, se llenará en el useEffect cuando el modal se abra
    const [assignedNeumaticos, setAssignedNeumaticos] = useState<Record<string, Neumatico | null>>({
        POS01: null,
        POS02: null,
        POS03: null,
        POS04: null,
        RES01: null,
    });

    useEffect(() => {
        if (open && cachedNeumaticosAsignados && cachedNeumaticosAsignados.length > 0) {
            // Crear un nuevo objeto para evitar referencias que causen loops
            const nuevoMapa: Record<string, Neumatico | null> = {
                POS01: null,
                POS02: null,
                POS03: null,
                POS04: null,
                RES01: null,
            };


            cachedNeumaticosAsignados.forEach((neu) => {
                // Usar POSICION_NEU primero (como el modal original), luego POSICION como fallback
                const pos = neu.POSICION_NEU || neu.POSICION;
                if (pos && nuevoMapa.hasOwnProperty(pos)) {
                    // Asegurar que el neumático tenga ambas propiedades de posición normalizadas
                    nuevoMapa[pos] = {
                        ...neu,
                        POSICION: pos,
                        POSICION_NEU: pos
                    };
                } else {
                    console.warn(`[ModalAsignacionDesdeDesasignacion] Neumático sin posición válida:`, {
                        codigo: neu.CODIGO_NEU || neu.CODIGO,
                        POSICION: neu.POSICION,
                        POSICION_NEU: neu.POSICION_NEU,
                        posCalculada: pos
                    });
                }
            });

            setAssignedNeumaticos(nuevoMapa);
        } else if (open) {
            // Si el modal se abre pero no hay datos cacheados, inicializar vacío
            setAssignedNeumaticos({
                POS01: null,
                POS02: null,
                POS03: null,
                POS04: null,
                RES01: null,
            });
        }
    }, [open, cachedNeumaticosAsignados]);

    // Validación: solo requiere que las posiciones vacías estén llenas
    const todasPosicionesVaciasLlenas = useMemo(() => {
        return posicionesVacias.every(pos => assignedNeumaticos[pos] !== null);
    }, [posicionesVacias, assignedNeumaticos]);

    const theme = useTheme();

    const handleDialogClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus();
        }, 0);
    };

    const handleDrop = (position: string, neumatico: Neumatico) => {
        // Validar que la posición esté en la lista de posiciones vacías

        if (!posicionesVacias.includes(position)) {
            toast.warning(`No puedes asignar a la posición ${position}. Solo puedes asignar a las posiciones vacías: ${posicionesVacias.join(', ')}.`);
            return;
        }

        const isDuplicate = Object.entries(assignedNeumaticos).some(
            ([key, assigned]) => assigned?.CODIGO === neumatico.CODIGO && key !== position
        );

        if (isDuplicate) {
            toast.warning(`El neumático con código ${neumatico.CODIGO} ya está asignado a otra posición.`);
            return;
        }

        setAssignedNeumaticos((prev) => ({
            ...prev,
            [position]: { ...neumatico, TIPO_MOVIMIENTO: 'TEMPORAL' } as Neumatico,
        }));
    };

    // const filteredData = useMemo(() => {
    //     return data.filter(
    //         (neumatico) =>
    //             neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE' &&
    //             (neumatico.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //                 neumatico.MARCA.toLowerCase().includes(searchTerm.toLowerCase()))
    //     );
    // }, [data, searchTerm]);


    const handleConfirm = async () => {
        // Validar que todas las posiciones vacías estén llenas
        if (!todasPosicionesVaciasLlenas) {
            const faltantes = posicionesVacias.filter(pos => assignedNeumaticos[pos] === null);
            toast.warning(`Debes asignar neumáticos a las siguientes posiciones: ${faltantes.join(', ')}.`);
            return;
        }

        const fechasTemporales = Object.values(assignedNeumaticos)
            .filter((neu): neu is Neumatico => neu !== null && (neu as any).TIPO_MOVIMIENTO === 'TEMPORAL')
            .map((neu) => neu.FECHA_ASIGNACION ?? '');
        const todasIguales = fechasTemporales.length === 0 || fechasTemporales.every((f) => f === fechasTemporales[0]);
        if (!todasIguales) {
            toast.info('Todos los neumáticos temporales deben tener la misma fecha de asignación.', {
                duration: 6000
            });
            return;
        }


        // Solo asignar a las posiciones que estaban vacías (nuevas asignaciones)
        const toAssign = posicionesVacias
            .map(pos => [pos, assignedNeumaticos[pos]] as [string, Neumatico | null])
            .filter(([pos, neu]) => neu !== null)
            .map(([pos, neu]) => [pos, neu!] as [string, Neumatico]);

        if (toAssign.length === 0) {
            toast.warning('No hay neumáticos nuevos para asignar.');
            return;
        }

        // Validación robusta de campos requeridos
        const camposRequeridos = ['CODIGO', 'REMANENTE', 'PRESION_AIRE', 'TORQUE_APLICADO', 'FECHA_ASIGNACION'];
        for (const [pos, neu] of toAssign) {
            for (const campo of camposRequeridos) {
                const valor = (neu as any)[campo] ?? (neu as any)[campo.toUpperCase()];
                if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '') || (typeof valor === 'number' && isNaN(valor))) {
                    toast.error(`Falta completar el campo "${campo}" en la posición ${pos}.`);
                    return;
                }
                if (campo !== 'FECHA_ASIGNACION' && typeof valor === 'number' && valor === 0) {
                    toast.error(`El campo "${campo}" no puede ser 0 en la posición ${pos}.`);
                    return;
                }
            }
        }

        try {
            const payloadArray = toAssign.map(([pos, neu]) => {
                const codigo = neu!.CODIGO ?? neu!.CODIGO_NEU;
                const remanente = typeof neu!.REMANENTE === 'string' ? parseFloat(neu!.REMANENTE) : (neu!.REMANENTE ?? 0);
                const presionAire = typeof neu!.PRESION_AIRE === 'string' ? parseFloat(neu!.PRESION_AIRE) : (neu!.PRESION_AIRE ?? 0);
                const torqueAplicado = typeof neu!.TORQUE_APLICADO === 'string' ? parseFloat(neu!.TORQUE_APLICADO) : (neu!.TORQUE_APLICADO ?? 0);
                const fechaRegistro = neu!.FECHA_ASIGNACION || neu!.FECHA_REGISTRO || new Date().toISOString().slice(0, 10);

                return {
                    CodigoNeumatico: codigo,
                    Remanente: remanente,
                    PresionAire: presionAire,
                    TorqueAplicado: torqueAplicado,
                    Placa: typeof placa === 'string' ? placa.trim() : placa,
                    Posicion: pos,
                    Odometro: 0,
                    FechaRegistro: fechaRegistro,
                };
            });


            // NO guardar en BD, solo retornar al modal desasignar
            if (typeof onTemporaryAssign === 'function') {
                onTemporaryAssign(payloadArray);
                toast.info(`${toAssign.length} neumático(s) preparado(s) para asignación temporal. Guarda la desasignación para confirmar.`, {
                    position: 'top-right',
                    duration: 6000
                })
                setTimeout(() => {
                    onClose();
                }, 1500);
            }

            // else {
            //     // Fallback: si no hay callback, guardar directamente (no debería pasar)
            //     console.warn('[ModalAsignacionDesdeDesasignacion] No hay callback onTemporaryAssign, guardando directamente');
            //     await asignarNeumatico(payloadArray);
            //     if (typeof onAssignedUpdate === 'function') {
            //         await onAssignedUpdate();
            //     }
            //     onClose();
            // }
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Error al preparar asignación.');
        }
    };

    // const [Odometro, setOdometro] = useState<string>('');
    const [initialOdometro, setInitialOdometro] = useState<number>(kilometro || 0);
    const [kmError, setKmError] = useState<boolean>(false);
    const prevOpenRef = React.useRef(false);

    useEffect(() => {
        // Solo resetear cuando el modal se abre (no cuando se cierra)
        if (open && !prevOpenRef.current) {
            // setOdometro('');
            setInitialOdometro(kilometro || 0);
            setKmError(false);
        }
        prevOpenRef.current = open;
    }, [open, kilometro]);

    return (
        <DndProvider backend={HTML5Backend}>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: '1650px',
                        width: '100%',
                        overflowY: 'hidden'
                    },
                }}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
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
                            Asignación desde una Desasignación
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
                            <Chip
                                label={placa}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
                            />
                            <Typography variant="body2" color="text.secondary">Posiciones vacías:</Typography>
                            {posicionesVacias.map(pos => (
                                <Chip
                                    key={pos}
                                    label={pos}
                                    size="small"
                                    sx={{
                                        fontWeight: 700, fontSize: 11,
                                        bgcolor: assignedNeumaticos[pos] ? '#0891b2' : '#e11d48',
                                        color: '#fff',
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                            <span className='font-bold'>Nota: </span>
                            Solo puedes asignar a las posiciones marcadas. Las demás posiciones están bloqueadas.
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, overflowY: 'auto' }}>

                    <Stack direction="row" spacing={2}>
                        {/* Panel Izquierdo: Diagrama y tabla de instalados */}
                        <Card sx={{ flex: 0.6, p: 2, position: 'relative', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', marginTop: '10px' }}>

                            <div className='flex justify-end h-20'>
                                <div className='relative'>
                                    <Image src='/assets/placa.png' alt='Placa' width={120} height={70} style={{
                                        objectFit: 'contain',
                                        zIndex: 1,
                                    }}
                                    />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            position: 'absolute',
                                            top: '16px',
                                            left: '10px',
                                            zIndex: 2,
                                            color: 'black',
                                            padding: '3px 2px',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            fontSize: '25px',
                                            textAlign: 'center',
                                        }}>
                                        {placa}
                                    </Typography>
                                </div>

                            </div>


                            <div style={{ position: 'relative', width: '470px', height: '390px', flexShrink: 0 }}>
                                <img
                                    src="/assets/car-diagram.png"
                                    alt="Diagrama del Vehículo"
                                    style={{
                                        width: '256px',
                                        height: '380px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        top: 0,
                                        zIndex: 1,
                                    }}
                                />
                                {/* DropZones */}
                                <Box sx={{ position: 'absolute', top: '65px', left: '272px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS01"
                                        onDrop={(neumatico) => handleDrop('POS01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS01')}
                                        posicionesVacias={posicionesVacias}
                                        fechaInspeccion={fechaUltimaInspeccion}
                                    />
                                    {assignedNeumaticos.POS01 && assignedNeumaticos.POS01.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS01.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '38px',
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS01.CODIGO_NEU || assignedNeumaticos.POS01.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute left-[38px] top-[36px]'>
                                        POS01
                                    </span>
                                </Box>
                                <Box sx={{ position: 'absolute', top: '65px', left: '172px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS02"
                                        onDrop={(neumatico) => handleDrop('POS02', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS02}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS02')}
                                        posicionesVacias={posicionesVacias}
                                        fechaInspeccion={fechaUltimaInspeccion}
                                    />
                                    {assignedNeumaticos.POS02 && assignedNeumaticos.POS02.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS02.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            right: '38px',
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS02.CODIGO_NEU || assignedNeumaticos.POS02.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[38px] top-[36px]'>
                                        POS02
                                    </span>
                                </Box>
                                <Box sx={{ position: 'absolute', top: '230px', left: '272px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS03"
                                        onDrop={(neumatico) => handleDrop('POS03', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS03}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS03')}
                                        posicionesVacias={posicionesVacias}
                                        fechaInspeccion={fechaUltimaInspeccion}
                                    />
                                    {assignedNeumaticos.POS03 && assignedNeumaticos.POS03.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS03.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '38px',
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS03.CODIGO_NEU || assignedNeumaticos.POS03.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute left-[38px] top-[36px]'>
                                        POS03
                                    </span>
                                </Box>
                                <Box sx={{ position: 'absolute', top: '230px', left: '172px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS04"
                                        onDrop={(neumatico) => handleDrop('POS04', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS04}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS04')}
                                        posicionesVacias={posicionesVacias}
                                        fechaInspeccion={fechaUltimaInspeccion}
                                    />
                                    {assignedNeumaticos.POS04 && assignedNeumaticos.POS04.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS04.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            right: '38px',
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS04.CODIGO_NEU || assignedNeumaticos.POS04.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[38px] top-[36px]'>
                                        POS04
                                    </span>
                                </Box>
                                <Box sx={{ position: 'absolute', top: '299px', left: '206px', zIndex: 2 }}>
                                    <DropZone
                                        position="RES01"
                                        onDrop={(neumatico) => handleDrop('RES01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.RES01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('RES01')}
                                        posicionesVacias={posicionesVacias}
                                        fechaInspeccion={fechaUltimaInspeccion}
                                    />
                                    {assignedNeumaticos.RES01 && assignedNeumaticos.RES01.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.RES01.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '38px',
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.RES01.CODIGO_NEU || assignedNeumaticos.RES01.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[10px] top-[64px]'>
                                        RES01
                                    </span>
                                </Box>
                            </div>






                            {/* Tabla de Neumáticos Actuales */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                                <Typography variant="h6">Neumáticos Instalados</Typography>
                            </Box>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Posición</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Código</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Marca</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Fecha Asig.</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Situación</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(assignedNeumaticos).map(([position, neumatico]) => {
                                            const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');
                                            const esVacia = posicionesVacias.includes(position);
                                            return (
                                                <TableRow
                                                    key={position}
                                                    className={esVacia && !neumatico ? `bg-rose-200` : 'inherit'}
                                                // sx={{
                                                //     bgcolor: esVacia && !neumatico ? '#fff3cd' : 'inherit',
                                                // }}
                                                >
                                                    <TableCell sx={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column' }}>
                                                        {position}
                                                        {/* {esVacia && !neumatico && (
                                                            <Chip label="REQUERIDA" size="small" color="warning" sx={{ marginTop: '5px' }} />
                                                        )} */}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.CODIGO || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.MARCA || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (convertToDateHuman(neumatico?.FECHA_ASIGNACION ?? '') || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>
                                                        {esBajaORecuperado
                                                            ? '----'
                                                            : (
                                                                <TipoMovimientoBadge tipoMovimiento={neumatico?.TIPO_MOVIMIENTO ?? 'REQUERIDO'} />
                                                            )
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                        {/* Panel Derecho: Neumáticos nuevos disponibles */}
                        <Stack direction="column" spacing={2} sx={{ flex: 0.4, width: '100%', height: '100%', marginTop: '10px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <div></div>
                                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', minWidth: 110 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem', background: '#e3f2fd', borderRadius: 2, px: 1.5, py: 0.5, border: '1px solid #1976d2' }}>
                                            Neumáticos: {neumaticosDisponiblesConBajas.length}
                                        </Typography>
                                    </Box>
                                    <LoadingButton2
                                        variant={'primary'}
                                        disabled={!todasPosicionesVaciasLlenas || kmError}
                                        onClick={handleConfirm}
                                        icon={<ClipboardCheck />}
                                    >
                                        Confirmar Asignación
                                    </LoadingButton2>
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <DataTableNeumaticos columns={columnsNeuParaAsignarDesdeDesasignar} data={neumaticosDisponiblesConBajas} type='pagination' filters={true} />
                                </Box>
                            </Card>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </DndProvider >
    );
});

export default ModalAsignacionNeuDesdeDesasignacion;

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