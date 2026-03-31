import React, { useState, useMemo, useEffect, memo } from 'react';
import {
    Box,
    Card,
    Chip,
    DialogTitle,
    Stack,
    TextField,
    useTheme,
} from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ModalAvertAsigNeu from './modal-avert-asig-neu';
import ModalInputsNeu from './modal-inputs-neu';
import { Neumatico } from '@/types/types';
import { asignarNeumatico } from '../../../api/Neumaticos';
import { toast } from 'sonner';
import Image from 'next/image';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsNeuParaAsignar, columnsNeuTemporales } from '@/app/dashboard/integrations/columns';
import { NeuTemporalTable } from '@/types/neumatico';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { ClipboardList, CloudCheck } from 'lucide-react';

const ItemType = {
    NEUMATICO: 'neumatico',
};

export interface ModalAsignacionNeuProps {
    open: boolean;
    onClose: () => void;
    data: any[];
    assignedNeumaticos: any[]; // Added this property
    placa: string;
    kilometro: number;
    onAssignedUpdate?: () => void; // Nuevo callback para refrescar asignados
}

export const DraggableNeumatico: React.FC<{
    neumatico: Neumatico;
    disabled?: boolean;
}> = React.memo(({ neumatico, disabled = false }) => {
    const [{ isDragging }, drag, dragPreview] = useDrag(
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
                margin: '0 auto',
                backgroundColor: 'transparent',
                width: '25px',
                height: '56px'
            }}
        >
            <Image
                src="/assets/neumatico-new.png"
                alt="Neumático"
                width={25}
                height={50}
                style={{
                    margin: '0px auto',
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
    kilometro: number; // <-- Agregado
}

// Elimina la interfaz ModalInputsNeuData, ya que no es compatible con el componente ModalInputsNeu

const DropZone: React.FC<DropZoneProps> = memo(({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
    kilometro, // <-- Agregado
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
        setTimeout(() => setIsShaking(false), 600); // Dura 600ms
    };

    const handleInputsModalSubmit = (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }): void => {
        // Guarda los datos en el neumático asignado a esta posición
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
    // Hook y ref para drop de react-dnd
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: ItemType.NEUMATICO,
        drop: (item: Neumatico) => {
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
                return { ...prev, [position]: item };
            });
            if (shouldShake) {
                setTimeout(() => { triggerShake(); }, 0);
            } else {
                setInputsModalOpen(true);
            }
            if (shouldShake) {
                setTimeout(() => { triggerShake(); }, 0);
            }
        },
    });
    drop(ref);

    const handleContextMenu = (event: React.MouseEvent): void => {
        event.preventDefault();
        if (isAssigned) {
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

    // Determinar si el neumático de la posición está en baja definitiva o recuperado
    const neumatico = assignedNeumaticos[position];


    const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');

    // Estilo para POS01-04 y RES01
    const isPosicionPrincipal = ['POS01', 'POS02', 'POS03', 'POS04'].includes(position);
    const dropZoneStyle: React.CSSProperties = isPosicionPrincipal
        ? {
            width: '27px',
            height: '58px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isAssigned && !esBajaORecuperado ? 'lightgreen' : 'transparent',
            borderRadius: '6px',
            border: 'none',
            pointerEvents: 'auto',
            cursor: isAssigned && !esBajaORecuperado ? 'pointer' : 'default',
            boxShadow: isShaking ? '0 0 10px 4px red' : 'none',
            transition: 'box-shadow 0.2s ease-in-out',
        }
        : {
            width: '58px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isAssigned && !esBajaORecuperado ? 'lightgreen' : 'transparent',
            borderRadius: '6px',
            border: 'none',
            pointerEvents: 'auto',
            cursor: isAssigned && !esBajaORecuperado ? 'pointer' : 'default',
            boxShadow: isShaking ? '0 0 10px 4px red' : 'none',
            transition: 'box-shadow 0.2s ease-in-out',
        };
    return (
        <div
            ref={ref}
            onContextMenu={handleContextMenu}
            style={dropZoneStyle}
        >
            {/* El número/código ahora se muestra fuera del DropZone en el diagrama principal */}
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
            <ModalInputsNeu
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
            />
        </div>
    );
});




const ModalAsignacionNeu: React.FC<ModalAsignacionNeuProps> = memo(({ open, onClose, data, assignedNeumaticos: initialAssignedNeumaticos, placa, kilometro, onAssignedUpdate }) => {


    const initialAssignedMap = useMemo<Record<string, Neumatico | null>>(
        () => {
            // Ahora incluye las cinco posiciones
            const mapa: Record<string, Neumatico | null> = {
                POS01: null,
                POS02: null,
                POS03: null,
                POS04: null,
                RES01: null,
            };
            // Agrupar por posición y quedarse con el más reciente si hay duplicados
            const neumaticosPorPosicion = new Map<string, typeof initialAssignedNeumaticos[0]>();
            initialAssignedNeumaticos.forEach((neu) => {
                const pos = neu.POSICION_NEU;
                if (pos && mapa.hasOwnProperty(pos)) {
                    const existente = neumaticosPorPosicion.get(pos);
                    if (!existente || (neu.ID_MOVIMIENTO || 0) > (existente.ID_MOVIMIENTO || 0)) {
                        neumaticosPorPosicion.set(pos, neu);
                    }
                }
            });

            // Asignar al mapa solo el más reciente por posición
            neumaticosPorPosicion.forEach((neu, pos) => {
                mapa[pos] = neu;
            });
            return mapa;
        },
        [initialAssignedNeumaticos]
    );


    // TODO
    const [assignedNeumaticos, setAssignedNeumaticos] = useState(initialAssignedMap);

    // Efecto: cada vez que el modal se abre o cambian los datos asignados, sincroniza los asignados con los props
    useEffect(() => {
        if (open) {
            setAssignedNeumaticos(initialAssignedMap);
        }
    }, [open, initialAssignedMap]);

    // Ahora requiere las 5 posiciones asignadas
    const allPositionsAssigned = Object.values(assignedNeumaticos).filter(Boolean).length === 5;

    const theme = useTheme();

    useEffect(() => {
        if (open) {
            setAssignedNeumaticos(initialAssignedMap);
        }
    }, [open, initialAssignedMap, initialAssignedNeumaticos]);

    const [searchTerm, setSearchTerm] = useState('');

    const handleDrop = (position: string, neumatico: Neumatico) => {
        const isDuplicate = Object.entries(assignedNeumaticos).some(
            ([key, assigned]) => assigned?.CODIGO === neumatico.CODIGO && key !== position
        );

        if (isDuplicate) {
            alert(`El neumático con código ${neumatico.CODIGO} ya está asignado a otra posición.`);
            return;
        }

        setAssignedNeumaticos((prev) => ({
            ...prev,
            [position]: neumatico,
        }));
    };



    const hasAssignedNeumaticos = Object.values(assignedNeumaticos).some((neumatico) => neumatico !== null);

    const filteredData = useMemo(() => {
        return data.filter(
            (neumatico) =>
                neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE' &&
                (neumatico.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    neumatico.MARCA.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data, searchTerm]);

    const handleDialogClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus();
        }, 0);
    };



    // TODO: Insert de la asignación de los neumaticos
    // ------------------------------------------------
    // Ahora asigna SIEMPRE los 4 neumáticos asignados (excepto baja/recuperado) con el mismo Odometro
    const handleConfirm = async () => {
        // Nuevo: requiere que las 5 posiciones estén asignadas
        const allPositionsAssigned1 = Object.values(assignedNeumaticos).filter(Boolean).length === 5;

        if (!allPositionsAssigned1) {
            toast.warning('Debes asignar un neumático en las 5 posiciones antes de confirmar.');
            return;
        }

        const fechas = Object.values(assignedNeumaticos)
            .filter(Boolean)
            .map((neu) => neu!.FECHA_ASIGNACION ?? '');
        const todasIguales = fechas.every((f) => f === fechas[0]);
        if (!todasIguales) {
            toast.error('Todos los neumáticos deben tener la misma fecha de asignación.');
            return;
        }

        // Tomar todos los asignados (excepto baja definitiva o recuperado)
        const toAssign = Object.entries(assignedNeumaticos).filter(
            ([pos, neu]) => {
                if (!neu) return false;
                // Excluir baja definitiva o recuperado
                if (neu.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neu.TIPO_MOVIMIENTO === 'RECUPERADO') return false;
                return true;
            }
        );
        if (toAssign.length === 0) {
            toast.info('No hay neumáticos asignados para actualizar.');
            return;
        }
        // Validación robusta de campos requeridos
        const camposRequeridos = ['CODIGO', 'REMANENTE', 'PRESION_AIRE', 'TORQUE_APLICADO', 'FECHA_ASIGNACION'];
        for (const [pos, neu] of toAssign) {
            for (const campo of camposRequeridos) {
                // Permite 0 como valor válido, pero no null, undefined o NaN
                const valor = (neu as any)[campo] ?? (neu as any)[campo.toUpperCase()];
                if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '') || (typeof valor === 'number' && isNaN(valor))) {
                    toast.error(`Falta completar el campo "${campo}" en la posición ${pos}.`);
                    return;
                }
                // Validación extra: el backend no acepta 0, así que bloqueamos 0 explícitamente (excepto FECHA_ASIGNACION)
                if (campo !== 'FECHA_ASIGNACION' && typeof valor === 'number' && valor === 0) {
                    toast.error(`El campo "${campo}" no puede ser 0 en la posición ${pos}.`);
                    return;
                }
            }
        }
        try {
            const payloadArray = toAssign.map(([pos, neu]) => {
                const codigo = Number(neu!.CODIGO ?? neu!.CODIGO_NEU);
                const remanente = typeof neu!.REMANENTE === 'string' ? parseFloat(neu!.REMANENTE) : (neu!.REMANENTE ?? 0);
                const presionAire = typeof neu!.PRESION_AIRE === 'string' ? parseFloat(neu!.PRESION_AIRE) : (neu!.PRESION_AIRE ?? 0);
                const torqueAplicado = typeof neu!.TORQUE_APLICADO === 'string' ? parseFloat(neu!.TORQUE_APLICADO) : (neu!.TORQUE_APLICADO ?? 0);
                const idOperacion = Number(neu?.ID_OPERACION);
                const codSupervisor = neu?.COD_SUPERVISOR;
                // const kmRecorrido = Number(Odometro) - initialOdometro

                // Lógica de fecha corregida:
                // 1. Para neumáticos existentes, usa su fecha de asignación o registro.
                // 2. Para neumáticos nuevos (que no tienen esas fechas), usa la fecha actual.
                const fechaRegistro = neu!.FECHA_ASIGNACION || neu!.FECHA_REGISTRO || new Date().toISOString().slice(0, 10);

                return {
                    CodigoNeumatico: codigo,
                    Remanente: remanente,
                    PresionAire: presionAire,
                    TorqueAplicado: torqueAplicado,
                    Placa: typeof placa === 'string' ? placa.trim() : placa,
                    Posicion: pos,
                    Odometro: Number(Odometro), // convertir a número
                    ID_OPERACION: idOperacion,
                    COD_SUPERVISOR: codSupervisor,
                    FechaAsignacion: fechaRegistro,
                    // KmRecorridoxEtapa: kmRecorrido,
                };
            });

            await asignarNeumatico(payloadArray); // axios ya envía Content-Type: application/json
            toast.success('Neumático(s) asignado(s) y kilometraje actualizado.', {
                position: 'top-right',
                duration: 6000
            });
            if (typeof onAssignedUpdate === 'function') {
                await onAssignedUpdate();
            }
            // refetch de asignados
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Error al asignar neumático.');
        }
    };
    // ------------------------------------------------


    // Definir estados para Odometro, initialOdometro y kmError
    const [Odometro, setOdometro] = useState<string>(''); // ahora string vacío
    const [initialOdometro, setInitialOdometro] = useState<number>(kilometro || 0);
    const [kmError, setKmError] = useState<boolean>(false);

    // Sincronizar Odometro e initialOdometro cuando cambie la prop kilometro o al abrir el modal
    useEffect(() => {
        setOdometro(''); // SIEMPRE vacío al abrir
        setInitialOdometro(kilometro || 0);
        setKmError(false);
    }, [kilometro, open]);


    return (
        <DndProvider backend={HTML5Backend}>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                maxWidth="lg"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: '1500px',
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
                            Asignación de Neumáticos
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
                            <Chip
                                label={placa}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
                            />
                        </Box>
                        <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                            <span className='font-bold'>Nota: </span>
                            Arrastra un neumático a una posición disponible. Al soltar, se solicitarán los datos de instalación. <b>Las 5 posiciones son obligatorias</b>.
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Stack direction="row" spacing={2}>
                        {/* Panel Izquierdo: Diagrama y tabla de instalados */}
                        <Card sx={{ flex: 0.5, p: 2, position: 'relative', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', marginTop: '10px' }}>
                            <div className='flex justify-between h-32.5'>
                                <div>
                                    <TextField
                                        label="Kilometraje"
                                        type="number"
                                        value={Odometro}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = Number(value);

                                            if (value === '' || isNaN(numValue)) {
                                                setKmError(true);
                                                return;
                                            }

                                            // if (numValue > (initialOdometro + 25000)) return;

                                            setOdometro(value);

                                            if (numValue >= initialOdometro && numValue < (initialOdometro + 25000)) {
                                                setKmError(false);
                                            } else {
                                                setKmError(true);
                                            }
                                        }}
                                        fullWidth
                                        error={kmError || Odometro === ''}
                                        InputProps={{
                                            inputProps: { min: initialOdometro, max: initialOdometro + 25000 },
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
                                        sx={{ maxWidth: 180, marginTop: '10px' }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: kmError || Odometro === '' ? 'error.main' : 'text.secondary',
                                            minWidth: 180,
                                            marginTop: '10px',
                                            whiteSpace: 'nowrap',
                                            fontWeight: kmError || Odometro === '' ? 'bold' : 'normal',
                                        }}
                                    >
                                        {Odometro === ''
                                            ? ` (último ${initialOdometro.toLocaleString()} km)`
                                            : kmError
                                                ?
                                                (
                                                    <>
                                                        <span>{`Kilometraje aceptado: Mayor a ${initialOdometro.toLocaleString()} km`}</span>
                                                        <br />
                                                        <span>{`y menor a ${(initialOdometro + 25000).toLocaleString()} km`}</span>
                                                    </>
                                                )
                                                : `Kilometraje actual: ${Number(Odometro).toLocaleString()} km`}
                                    </Typography>
                                </div>
                                <div className='relative'>
                                    <Image src='/assets/placa.png' alt='Placa' width={120} height={70} style={{
                                        objectFit: 'contain',
                                        // position: 'absolute',
                                        // top: '-8px',
                                        // left: '225px',
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
                                {/* POS01: DropZone y número a la derecha */}
                                <Box sx={{ position: 'absolute', top: '65px', left: '272px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS01"
                                        onDrop={(neumatico) => handleDrop('POS01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                    {assignedNeumaticos.POS01 && assignedNeumaticos.POS01.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS01.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '38px', // a la derecha del neumático
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS01.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute left-[38px] top-[36px]'>
                                        POS01
                                    </span>
                                </Box>
                                {/* POS02: DropZone y número a la izquierda */}
                                <Box sx={{ position: 'absolute', top: '65px', left: '172px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS02"
                                        onDrop={(neumatico) => handleDrop('POS02', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS02}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                    {assignedNeumaticos.POS02 && assignedNeumaticos.POS02.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS02.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            right: '38px', // a la izquierda del neumático
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS02.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[38px] top-[36px]'>
                                        POS02
                                    </span>
                                </Box>
                                {/* POS03: DropZone y número a la derecha */}
                                <Box sx={{ position: 'absolute', top: '230px', left: '272px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS03"
                                        onDrop={(neumatico) => handleDrop('POS03', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS03}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                    {assignedNeumaticos.POS03 && assignedNeumaticos.POS03.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.POS03.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '38px', // a la derecha del neumático
                                            top: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.POS03.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute left-[38px] top-[36px]'>
                                        POS03
                                    </span>
                                </Box>
                                {/* POS04: DropZone y número a la izquierda */}
                                <Box sx={{ position: 'absolute', top: '230px', left: '172px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS04"
                                        onDrop={(neumatico) => handleDrop('POS04', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS04}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
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
                                        }}>{assignedNeumaticos.POS04.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[38px] top-[36px]'>
                                        POS04
                                    </span>
                                </Box>
                                {/* RES01: DropZone y número abajo */}
                                <Box sx={{ position: 'absolute', top: '299px', left: '206px', zIndex: 2 }}>
                                    <DropZone
                                        position="RES01"
                                        onDrop={(neumatico) => handleDrop('RES01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.RES01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                    {assignedNeumaticos.RES01 && assignedNeumaticos.RES01.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && assignedNeumaticos.RES01.TIPO_MOVIMIENTO !== 'RECUPERADO' ? (
                                        <span style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '38px', // debajo del neumático
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1976d2',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            boxShadow: '0 1px 4px #bdbdbd',
                                            zIndex: 3,
                                        }}>{assignedNeumaticos.RES01.CODIGO}</span>
                                    ) : null}
                                    <span className='bg-slate-50 text-slate-600 p-1 rounded-md border-slate-200 border text-xs font-bold shadow-lg absolute right-[10px] top-[64px]'>
                                        RES01
                                    </span>
                                </Box>
                            </div>

                            {/* Tabla de Neumáticos Actuales debajo del diagrama */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                                <Typography variant="h6">Neumáticos Instalados</Typography>
                            </Box>

                            <DataTableNeumaticos columns={columnsNeuTemporales} data={
                                Object.entries(assignedNeumaticos).map(([position, neumatico]) => {
                                    return {
                                        POSICION_NEU: position,
                                        ...neumatico
                                    } as NeuTemporalTable
                                })

                            } />

                        </Card>
                        {/* Panel Derecho: Neumáticos nuevos disponibles */}
                        <Stack direction="column" spacing={2} sx={{ flex: 0.5, width: '100%', height: '100%', marginTop: '10px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <div></div>
                                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', minWidth: 110 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem', background: '#e3f2fd', borderRadius: 2, px: 1.5, py: 0.5, border: '1px solid #1976d2' }}>
                                            Neu. Disponibles: {filteredData.length}
                                        </Typography>
                                    </Box>
                                    <LoadingButton2
                                        variant="primary"
                                        icon={<CloudCheck />}
                                        disabled={!hasAssignedNeumaticos || !allPositionsAssigned || kmError || Odometro === '' || isNaN(Number(Odometro))}
                                        onClick={handleConfirm}
                                    >
                                        Confirmar Asignación
                                    </LoadingButton2>
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <DataTableNeumaticos columns={columnsNeuParaAsignar} data={filteredData} type='pagination' filters={true} />
                                </Box>
                            </Card>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </DndProvider>
    );
});

export default ModalAsignacionNeu;


