import React, { forwardRef, useState, useMemo, useEffect, memo } from 'react';
import {
    Box,
    Card,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    useTheme,
} from '@mui/material';
import Button from '@mui/material/Button';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
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
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import TablePagination from '@mui/material/TablePagination';

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
    kilometro: number; // <-- Agregado
}

// Elimina la interfaz ModalInputsNeuData, ya que no es compatible con el componente ModalInputsNeu

const DropZone: React.FC<DropZoneProps> = ({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
    kilometro, // <-- Agregado
}) => {

    console.log({ haaa: assignedNeumaticos })

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
                console.log('Drop ignorado: mismo código que el eliminado recientemente.');
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

    console.log({ JIJI: neumatico })


    const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');

    // Log para depuración: mostrar qué neumático está asignado a esta posición
    useEffect(() => {
        if (neumatico) {
            console.log(`[DropZone] Posición: ${position} | Neumático asignado:`, neumatico);
        } else {
            console.log(`[DropZone] Posición: ${position} | Sin neumático asignado`);
        }
    }, [neumatico, position]);

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
            />
        </div>
    );
};




const ModalAsignacionNeu: React.FC<ModalAsignacionNeuProps> = memo(({ open, onClose, data, assignedNeumaticos: initialAssignedNeumaticos, placa, kilometro, onAssignedUpdate }) => {


    console.log({ ModalJe: initialAssignedNeumaticos })
    console.log({ dawdwjdilw: data })


    //console.log('ModalAsignacionNeu props:', { open, onClose, data, initialAssignedNeumaticos, placa, kilometro, onAssignedUpdate });
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

    // Snackbar personalizado para feedback visual
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');



    const theme = useTheme();

    // ——————————————————————————————————————
    // 𝐂𝐨𝐝𝐢𝐠𝐨𝐬 𝐝𝐞 𝐥𝐨𝐬 𝐧𝐞𝐮𝐦𝐚𝐭𝐢𝐜𝐨𝐬 𝐪𝐮𝐞 𝐩𝐨𝐬𝐭𝐞𝐫𝐢𝐨𝐫𝐦𝐞𝐧𝐭𝐞 𝐞𝐬𝐭𝐚𝐧 𝐚𝐬𝐢𝐠𝐧𝐚𝐝𝐨𝐬
    const assignedCodes = useMemo(
        () =>
            new Set(
                Object.values(assignedNeumaticos)
                    .filter((n): n is Neumatico => n !== null)
                    .map((n) => n.CODIGO ?? (n as any).CODIGO_NEU)
            ),
        [assignedNeumaticos]
    );



    useEffect(() => {
        if (open) {
            setAssignedNeumaticos(initialAssignedMap);
        }
        // LOG extra para ver qué props llegan desde el padre
        // console.log('PROPS assignedNeumaticos (initialAssignedNeumaticos):', initialAssignedNeumaticos);
        // console.log('initialAssignedMap:', initialAssignedMap);
    }, [open, initialAssignedMap, initialAssignedNeumaticos]);

    useEffect(() => {
        // LOG para ver el estado local del modal
        // console.log('Assigned Neumaticos (estado local):', assignedNeumaticos);
    }, [assignedNeumaticos]);

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
            setSnackbarMsg('Debes asignar un neumático en las 5 posiciones antes de confirmar.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        const fechas = Object.values(assignedNeumaticos)
            .filter(Boolean)
            .map((neu) => neu!.FECHA_ASIGNACION ?? '');
        const todasIguales = fechas.every((f) => f === fechas[0]);
        if (!todasIguales) {
            setSnackbarMsg('Todos los neumáticos deben tener la misma fecha de asignación.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
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
            setSnackbarMsg('No hay neumáticos asignados para actualizar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Validación robusta de campos requeridos
        const camposRequeridos = ['CODIGO', 'REMANENTE', 'PRESION_AIRE', 'TORQUE_APLICADO', 'FECHA_ASIGNACION'];
        for (const [pos, neu] of toAssign) {
            for (const campo of camposRequeridos) {
                // Permite 0 como valor válido, pero no null, undefined o NaN
                const valor = (neu as any)[campo] ?? (neu as any)[campo.toUpperCase()];
                if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '') || (typeof valor === 'number' && isNaN(valor))) {
                    setSnackbarMsg(`Falta completar el campo "${campo}" en la posición ${pos}.`);
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    return;
                }
                // Validación extra: el backend no acepta 0, así que bloqueamos 0 explícitamente (excepto FECHA_ASIGNACION)
                if (campo !== 'FECHA_ASIGNACION' && typeof valor === 'number' && valor === 0) {
                    setSnackbarMsg(`El campo "${campo}" no puede ser 0 en la posición ${pos}.`);
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
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

            // --- INICIO DEPURACIÓN DE PAYLOAD ---
            console.log('--- INICIO DEPURACIÓN DE PAYLOAD ---');
            payloadArray.forEach((item, index) => {
                console.log(`Elemento ${index}:`);
                console.log(`  - CodigoNeumatico: ${item.CodigoNeumatico} (Tipo: ${typeof item.CodigoNeumatico})`);
                console.log(`  - Remanente: ${item.Remanente} (Tipo: ${typeof item.Remanente})`);
                console.log(`  - PresionAire: ${item.PresionAire} (Tipo: ${typeof item.PresionAire})`);
                console.log(`  - TorqueAplicado: ${item.TorqueAplicado} (Tipo: ${typeof item.TorqueAplicado})`);
                console.log(`  - Placa: ${item.Placa} (Tipo: ${typeof item.Placa})`);
                console.log(`  - Posicion: ${item.Posicion} (Tipo: ${typeof item.Posicion})`);
                console.log(`  - Odometro: ${item.Odometro} (Tipo: ${typeof item.Odometro})`);
                console.log(`  - FechaAsignacion: ${item.FechaAsignacion} (Tipo: ${typeof item.FechaAsignacion})`);
                console.log(`  - ID_OPERACION: ${item.ID_OPERACION} (Tipo: ${typeof item.ID_OPERACION})`);
                console.log(`  - COD_SUPERVISOR: ${item.COD_SUPERVISOR} (Tipo: ${typeof item.COD_SUPERVISOR})`);
                // console.log(`  - KmRecorridoxEtapa: ${item.KmRecorridoxEtapa} (Tipo: ${typeof item.KmRecorridoxEtapa})`);
            });
            console.log('--- FIN DEPURACIÓN DE PAYLOAD ---');

            console.log('Payload enviado a asignarNeumatico:', payloadArray);
            await asignarNeumatico(payloadArray); // axios ya envía Content-Type: application/json
            setSnackbarMsg('Neumático(s) asignado(s) y kilometraje actualizado.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            if (typeof onAssignedUpdate === 'function') {
                await onAssignedUpdate();
            }
            // refetch de asignados
            onClose();
        } catch (e: any) {
            console.error(e);
            setSnackbarMsg(e.message || 'Error al asignar neumático.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
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
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    elevation={6}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarSeverity === 'success' && (
                        <AlertTitle>Éxito</AlertTitle>
                    )}
                    {snackbarSeverity === 'error' && (
                        <AlertTitle>Error</AlertTitle>
                    )}
                    {snackbarSeverity === 'info' && (
                        <AlertTitle>Información</AlertTitle>
                    )}
                    {snackbarSeverity === 'warning' && (
                        <AlertTitle>Advertencia</AlertTitle>
                    )}
                    {snackbarMsg}
                </MuiAlert>
            </Snackbar>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: '1400px',
                        width: '100%',
                    },
                }}
            >
                <DialogContent>
                    <Stack direction="row" spacing={2}>
                        {/* Panel Izquierdo: Diagrama y tabla de instalados */}
                        <Card sx={{ flex: 0.6, p: 2, position: 'relative', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                            <Box sx={{ position: 'relative', width: '100%', height: '370px' }}>
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
                                    sx={{ maxWidth: 180, ml: 2 }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: kmError || Odometro === '' ? 'error.main' : 'text.secondary',
                                        minWidth: 180,
                                        ml: 1,
                                        marginTop: '5px',
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
                                <img
                                    src="/assets/car-diagram-new.png"
                                    alt="Diagrama del Vehículo"
                                    style={{
                                        width: '256px',
                                        height: '380px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '-6px',
                                        left: '308px',
                                        zIndex: 1,
                                    }}
                                />
                                {/* DropZones */}
                                {/* POS01: DropZone y número a la derecha */}
                                <Box sx={{ position: 'absolute', top: '58px', left: '472px', zIndex: 2 }}>
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
                                </Box>
                                {/* POS02: DropZone y número a la izquierda */}
                                <Box sx={{ position: 'absolute', top: '58px', left: '374px', zIndex: 2 }}>
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
                                </Box>
                                {/* POS03: DropZone y número a la derecha */}
                                <Box sx={{ position: 'absolute', top: '223px', left: '474px', zIndex: 2 }}>
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
                                </Box>
                                {/* POS04: DropZone y número a la izquierda */}
                                <Box sx={{ position: 'absolute', top: '223px', left: '374px', zIndex: 2 }}>
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
                                </Box>
                                {/* RES01: DropZone y número abajo */}
                                <Box sx={{ position: 'absolute', top: '293px', left: '407px', zIndex: 2 }}>
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
                                </Box>
                                <img
                                    src="/assets/placa.png"
                                    alt="Placa"
                                    style={{
                                        width: '120px',
                                        height: '70px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '-8px',
                                        left: '225px',
                                        zIndex: 1,
                                    }}
                                />
                                <Typography
                                    variant="h6"
                                    sx={{
                                        position: 'absolute',
                                        top: '14px',
                                        left: '284px',
                                        transform: 'translateX(-50%)',
                                        zIndex: 2,
                                        color: 'black',
                                        padding: '3px 2px',
                                        borderRadius: '5px',
                                        fontFamily: 'Arial, sans-serif',
                                        fontWeight: 'bold',
                                        fontSize: '25px',
                                        textAlign: 'center',

                                    }}>
                                    {placa}
                                </Typography>
                            </Box>
                            {/* Tabla de Neumáticos Actuales debajo del diagrama */}
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
                                            {/* <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Situación</TableCell> */}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(assignedNeumaticos).map(([position, neumatico]) => {
                                            const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');
                                            return (
                                                <TableRow key={position}>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{position}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.CODIGO || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.MARCA || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.FECHA_ASIGNACION?.split(" ")[0] || '----')}</TableCell>
                                                    {/* <TableCell sx={{ fontSize: '0.78rem' }}>
                                                        {esBajaORecuperado
                                                            ? '----'
                                                            : neumatico?.TIPO_MOVIMIENTO === 'ASIGNADO'
                                                                ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span>ASIGNADO</span>
                                                                        <CheckBoxIcon style={{ color: 'green' }} />
                                                                    </div>
                                                                )
                                                                : (neumatico?.TIPO_MOVIMIENTO || '----')
                                                        }
                                                    </TableCell> */}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                        {/* Panel Derecho: Neumáticos nuevos disponibles */}
                        <Stack direction="column" spacing={2} sx={{ flex: 0.4, width: '100%', height: '100%' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <TextField
                                        label="Buscar por Neu."
                                        variant="outlined"
                                        sx={{ maxWidth: '200px' }}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            // setPage(0);
                                        }}
                                    />
                                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', minWidth: 110 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem', background: '#e3f2fd', borderRadius: 2, px: 1.5, py: 0.5, border: '1px solid #1976d2' }}>
                                            Neu. Disponibles: {filteredData.length}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={!hasAssignedNeumaticos || !allPositionsAssigned || kmError || Odometro === '' || isNaN(Number(Odometro))}
                                        onClick={handleConfirm}
                                    >
                                        Confirmar Asignación
                                    </Button>
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, maxHeight: '100%', maxWidth: '100%', minWidth: 0, mx: 0, overflowY: 'auto' }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ width: '50px', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }} />
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Código</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Marca</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Diseño</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Remanente</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Medida</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>F.Registro</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Estado</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredData.length > 0 ? (
                                                    filteredData.map((neumatico) => {
                                                        const isDisabled = neumatico.TIPO_MOVIMIENTO === 'ASIGNADO';
                                                        return (
                                                            <TableRow
                                                                key={neumatico.CODIGO}
                                                                sx={{
                                                                    backgroundColor: isDisabled
                                                                        ? theme.palette.action.disabledBackground
                                                                        : 'inherit',
                                                                    pointerEvents: isDisabled ? 'none' : 'auto',
                                                                    transition: 'box-shadow 0.2s, background 0.2s',
                                                                    '&:hover': !isDisabled
                                                                        ? {
                                                                            boxShadow: '0 2px 12px 0 #bdbdbd',
                                                                            backgroundColor: '#f5f5f5',
                                                                        }
                                                                        : {},
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>
                                                                    <DraggableNeumatico
                                                                        neumatico={neumatico}
                                                                        disabled={isDisabled}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.CODIGO}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.MARCA}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.DISEÑO}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.REMANENTE}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.MEDIDA}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico?.FECHA_REGISTRO.split(" ")[0]}</TableCell>
                                                                <TableCell align="center" sx={{ fontSize: '0.78rem' }}>
                                                                    <Box sx={{ position: 'relative', width: '100px' }}>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={
                                                                                typeof neumatico.ESTADO === 'string'
                                                                                    ? parseInt(neumatico.ESTADO.replace('%', ''), 10)
                                                                                    : neumatico.ESTADO
                                                                            }
                                                                            sx={{
                                                                                border: `.5px solid #2a2a2a`,
                                                                                height: 20,
                                                                                borderRadius: 5,
                                                                                backgroundColor: '#eee',
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
                                                                            sx={{
                                                                                position: 'absolute',
                                                                                top: 0,
                                                                                left: 0,
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                fontWeight: 'bold',
                                                                                color: `${neumatico.ESTADO < 79 && neumatico.ESTADO > 39 ? '#000' : (neumatico.ESTADO <= 39) ? '#000' : '#fff'}`,
                                                                            }}
                                                                        >
                                                                            {typeof neumatico.ESTADO === 'string'
                                                                                ? neumatico.ESTADO
                                                                                : `${neumatico.ESTADO}%`}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ fontSize: '0.78rem' }}>
                                                            No hay neumáticos disponibles.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
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


