import React, { forwardRef, useState, useMemo, useEffect } from 'react';
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
    Chip,
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
import ModalAvertAsigNeu from './modal-avertAsigNeu';
import ModalInputsNeu from './modal-inputsNeu';
import { Neumatico } from '@/types/types';
import { asignarNeumatico } from '../../../api/Neumaticos';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import TablePagination from '@mui/material/TablePagination';

const ItemType = {
    NEUMATICO: 'neumatico',
};

export interface ModalAsignacionNeuDesdeDesasignacionProps {
    open: boolean;
    onClose: () => void;
    data: Neumatico[];
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
                src="/assets/neumatico.png"
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
}

const DropZone: React.FC<DropZoneProps> = ({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
    kilometro,
    esPosicionVacia,
    posicionesVacias,
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
        },
    });
    drop(ref);

    const handleContextMenu = (event: React.MouseEvent): void => {
        event.preventDefault();
        // Solo permitir quitar si la posición NO es requerida (no está vacía)
        if (isAssigned && !esPosicionVacia) {
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
        ? '#fff3cd' // Amarillo claro para indicar que debe ser llenada
        : isAssigned && !esBajaORecuperado
            ? 'lightgreen'
            : 'transparent';

    const borderColor = esPosicionVacia && !isAssigned
        ? '2px dashed #ff9800' // Borde naranja para posiciones vacías requeridas
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
            boxShadow: isShaking ? '0 0 10px 4px red' : (esPosicionVacia && !isAssigned ? '0 0 8px 2px #ff9800' : 'none'),
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
            boxShadow: isShaking ? '0 0 10px 4px red' : (esPosicionVacia && !isAssigned ? '0 0 8px 2px #ff9800' : 'none'),
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

const ModalAsignacionNeuDesdeDesasignacion: React.FC<ModalAsignacionNeuDesdeDesasignacionProps> = ({
    open,
    onClose,
    data,
    cachedNeumaticosAsignados,
    posicionesVacias,
    placa,
    kilometro,
    onAssignedUpdate,
    onTemporaryAssign
}) => {
    // Log para debug
    useEffect(() => {
        if (open) {
            console.log('[ModalAsignacionDesdeDesasignacion] Abriendo modal con:');
            console.log('  - Posiciones vacías recibidas:', posicionesVacias);
            console.log('  - Neumáticos cacheados:', cachedNeumaticosAsignados.map(n => ({
                codigo: n.CODIGO_NEU || n.CODIGO,
                posicion: n.POSICION || n.POSICION_NEU
            })));
        }
    }, [open, posicionesVacias, cachedNeumaticosAsignados]);

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

            console.log('[ModalAsignacionDesdeDesasignacion] useEffect - Procesando neumáticos cacheados:', cachedNeumaticosAsignados.length);

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
                    console.log(`[ModalAsignacionDesdeDesasignacion] Asignando neumático ${neu.CODIGO_NEU || neu.CODIGO} a posición ${pos}`);
                } else {
                    console.warn(`[ModalAsignacionDesdeDesasignacion] Neumático sin posición válida:`, {
                        codigo: neu.CODIGO_NEU || neu.CODIGO,
                        POSICION: neu.POSICION,
                        POSICION_NEU: neu.POSICION_NEU,
                        posCalculada: pos
                    });
                }
            });

            console.log('[ModalAsignacionDesdeDesasignacion] useEffect - Nuevo mapa creado:', {
                POS01: nuevoMapa.POS01 ? (nuevoMapa.POS01.CODIGO_NEU || nuevoMapa.POS01.CODIGO) : 'null',
                POS02: nuevoMapa.POS02 ? (nuevoMapa.POS02.CODIGO_NEU || nuevoMapa.POS02.CODIGO) : 'null',
                POS03: nuevoMapa.POS03 ? (nuevoMapa.POS03.CODIGO_NEU || nuevoMapa.POS03.CODIGO) : 'null',
                POS04: nuevoMapa.POS04 ? (nuevoMapa.POS04.CODIGO_NEU || nuevoMapa.POS04.CODIGO) : 'null',
                RES01: nuevoMapa.RES01 ? (nuevoMapa.RES01.CODIGO_NEU || nuevoMapa.RES01.CODIGO) : 'null',
            });
            console.log('[ModalAsignacionDesdeDesasignacion] useEffect - Detalle POS01:', nuevoMapa.POS01 ? {
                codigo: nuevoMapa.POS01.CODIGO_NEU || nuevoMapa.POS01.CODIGO,
                posicion: nuevoMapa.POS01.POSICION || nuevoMapa.POS01.POSICION_NEU,
                tipo: nuevoMapa.POS01.TIPO_MOVIMIENTO
            } : 'null');
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

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    const theme = useTheme();

    const assignedCodes = useMemo(
        () =>
            new Set(
                Object.values(assignedNeumaticos)
                    .filter((n): n is Neumatico => n !== null)
                    .map((n) => n.CODIGO ?? (n as any).CODIGO_NEU)
            ),
        [assignedNeumaticos]
    );

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState('');

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleDialogClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus();
        }, 0);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDrop = (position: string, neumatico: Neumatico) => {
        // Validar que la posición esté en la lista de posiciones vacías
        console.log('[handleDrop] Intentando asignar a posición:', position);
        console.log('[handleDrop] Posiciones vacías permitidas:', posicionesVacias);
        console.log('[handleDrop] ¿Está permitida?:', posicionesVacias.includes(position));

        if (!posicionesVacias.includes(position)) {
            setSnackbarMsg(`No puedes asignar a la posición ${position}. Solo puedes asignar a las posiciones vacías: ${posicionesVacias.join(', ')}.`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        const isDuplicate = Object.entries(assignedNeumaticos).some(
            ([key, assigned]) => assigned?.CODIGO === neumatico.CODIGO && key !== position
        );

        if (isDuplicate) {
            setSnackbarMsg(`El neumático con código ${neumatico.CODIGO} ya está asignado a otra posición.`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
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

    const paginatedData = useMemo(() => {
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handleConfirm = async () => {
        // Validar que todas las posiciones vacías estén llenas
        if (!todasPosicionesVaciasLlenas) {
            const faltantes = posicionesVacias.filter(pos => assignedNeumaticos[pos] === null);
            setSnackbarMsg(`Debes asignar neumáticos a las siguientes posiciones: ${faltantes.join(', ')}.`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        // Solo asignar a las posiciones que estaban vacías (nuevas asignaciones)
        const toAssign = posicionesVacias
            .map(pos => [pos, assignedNeumaticos[pos]] as [string, Neumatico | null])
            .filter(([pos, neu]) => neu !== null)
            .map(([pos, neu]) => [pos, neu!] as [string, Neumatico]);

        if (toAssign.length === 0) {
            setSnackbarMsg('No hay neumáticos nuevos para asignar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }

        // Validación robusta de campos requeridos
        const camposRequeridos = ['CODIGO', 'REMANENTE', 'PRESION_AIRE', 'TORQUE_APLICADO', 'FECHA_ASIGNACION'];
        for (const [pos, neu] of toAssign) {
            for (const campo of camposRequeridos) {
                const valor = (neu as any)[campo] ?? (neu as any)[campo.toUpperCase()];
                if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '') || (typeof valor === 'number' && isNaN(valor))) {
                    setSnackbarMsg(`Falta completar el campo "${campo}" en la posición ${pos}.`);
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    return;
                }
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
                const fechaRegistro = neu!.FECHA_ASIGNACION || neu!.FECHA_REGISTRO || new Date().toISOString().slice(0, 10);

                return {
                    CodigoNeumatico: codigo,
                    Remanente: remanente,
                    PresionAire: presionAire,
                    TorqueAplicado: torqueAplicado,
                    Placa: typeof placa === 'string' ? placa.trim() : placa,
                    Posicion: pos,
                    Odometro: Number(Odometro),
                    FechaRegistro: fechaRegistro,
                };
            });

            console.log('[ModalAsignacionDesdeDesasignacion] Payload preparado (TEMPORAL):', payloadArray);

            // NO guardar en BD, solo retornar al modal desasignar
            if (typeof onTemporaryAssign === 'function') {
                onTemporaryAssign(payloadArray);
                setSnackbarMsg(`${toAssign.length} neumático(s) preparado(s) para asignación temporal. Guarda la desasignación para confirmar.`);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                // Fallback: si no hay callback, guardar directamente (no debería pasar)
                console.warn('[ModalAsignacionDesdeDesasignacion] No hay callback onTemporaryAssign, guardando directamente');
                await asignarNeumatico(payloadArray);
                setSnackbarMsg(`${toAssign.length} neumático(s) asignado(s) correctamente.`);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                if (typeof onAssignedUpdate === 'function') {
                    await onAssignedUpdate();
                }
                onClose();
            }
        } catch (e: any) {
            console.error(e);
            setSnackbarMsg(e.message || 'Error al preparar asignación.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const [Odometro, setOdometro] = useState<string>('');
    const [initialOdometro, setInitialOdometro] = useState<number>(kilometro || 0);
    const [kmError, setKmError] = useState<boolean>(false);
    const prevOpenRef = React.useRef(false);

    useEffect(() => {
        // Solo resetear cuando el modal se abre (no cuando se cierra)
        if (open && !prevOpenRef.current) {
            setOdometro('');
            setInitialOdometro(kilometro || 0);
            setKmError(false);
        }
        prevOpenRef.current = open;
    }, [open, kilometro]);

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
                    {snackbarSeverity === 'success' && <AlertTitle>Éxito</AlertTitle>}
                    {snackbarSeverity === 'error' && <AlertTitle>Error</AlertTitle>}
                    {snackbarSeverity === 'info' && <AlertTitle>Información</AlertTitle>}
                    {snackbarSeverity === 'warning' && <AlertTitle>Advertencia</AlertTitle>}
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
                    {/* Banner informativo */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffc107' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#856404' }}>
                            Asignación desde Desasignación
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: '#856404' }}>
                            Debes asignar neumáticos a las siguientes posiciones que quedaron vacías:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {posicionesVacias.map(pos => (
                                <Chip
                                    key={pos}
                                    label={pos}
                                    color={assignedNeumaticos[pos] ? 'success' : 'warning'}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#856404', fontStyle: 'italic' }}>
                            Nota: Solo puedes asignar a las posiciones marcadas. Las demás posiciones están bloqueadas.
                        </Typography>
                    </Box>

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
                                        setOdometro(value);
                                        const numValue = Number(value);
                                        if (value === '' || isNaN(numValue)) {
                                            setKmError(true);
                                        } else if (numValue >= initialOdometro) {
                                            setKmError(false);
                                        } else {
                                            setKmError(true);
                                        }
                                    }}
                                    fullWidth
                                    error={kmError && Odometro !== ''}
                                    InputProps={{
                                        inputProps: { min: initialOdometro },
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
                                        whiteSpace: 'nowrap',
                                        fontWeight: kmError || Odometro === '' ? 'bold' : 'normal',
                                    }}
                                >
                                    {Odometro === ''
                                        ? ` (último ${initialOdometro.toLocaleString()} km)`
                                        : kmError
                                            ? `No puede ser menor a ${initialOdometro.toLocaleString()} km`
                                            : `Kilometraje actual: ${Number(Odometro).toLocaleString()} km`}
                                </Typography>
                                <img
                                    src="/assets/car-diagram.png"
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
                                <Box sx={{ position: 'absolute', top: '58px', left: '472px', zIndex: 2 }}>
                                    {(() => {
                                        const pos01Neu = assignedNeumaticos.POS01;
                                        console.log('[Render POS01] Estado actual:', {
                                            existe: !!pos01Neu,
                                            codigo: pos01Neu ? (pos01Neu.CODIGO_NEU || pos01Neu.CODIGO) : 'null',
                                            posicion: pos01Neu ? (pos01Neu.POSICION || pos01Neu.POSICION_NEU) : 'null',
                                            tipo: pos01Neu ? pos01Neu.TIPO_MOVIMIENTO : 'null'
                                        });
                                        return null;
                                    })()}
                                    <DropZone
                                        position="POS01"
                                        onDrop={(neumatico) => handleDrop('POS01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS01')}
                                        posicionesVacias={posicionesVacias}
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
                                </Box>
                                <Box sx={{ position: 'absolute', top: '58px', left: '374px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS02"
                                        onDrop={(neumatico) => handleDrop('POS02', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS02}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS02')}
                                        posicionesVacias={posicionesVacias}
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
                                </Box>
                                <Box sx={{ position: 'absolute', top: '223px', left: '474px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS03"
                                        onDrop={(neumatico) => handleDrop('POS03', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS03}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS03')}
                                        posicionesVacias={posicionesVacias}
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
                                </Box>
                                <Box sx={{ position: 'absolute', top: '223px', left: '374px', zIndex: 2 }}>
                                    <DropZone
                                        position="POS04"
                                        onDrop={(neumatico) => handleDrop('POS04', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS04}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('POS04')}
                                        posicionesVacias={posicionesVacias}
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
                                </Box>
                                <Box sx={{ position: 'absolute', top: '293px', left: '407px', zIndex: 2 }}>
                                    <DropZone
                                        position="RES01"
                                        onDrop={(neumatico) => handleDrop('RES01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.RES01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                        esPosicionVacia={posicionesVacias.includes('RES01')}
                                        posicionesVacias={posicionesVacias}
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
                                                    sx={{
                                                        bgcolor: esVacia && !neumatico ? '#fff3cd' : 'inherit',
                                                    }}
                                                >
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>
                                                        {position}
                                                        {esVacia && !neumatico && (
                                                            <Chip label="REQUERIDA" size="small" color="warning" sx={{ ml: 1 }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.CODIGO || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.MARCA || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{esBajaORecuperado ? '----' : (neumatico?.FECHA_ASIGNACION || neumatico?.FECHA_REGISTRO || '----')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>
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
                                                    </TableCell>
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
                                            setPage(0);
                                        }}
                                    />
                                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', minWidth: 110 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem', background: '#e3f2fd', borderRadius: 2, px: 1.5, py: 0.5 }}>
                                            Neu. Disponibles: {filteredData.length}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={!todasPosicionesVaciasLlenas || kmError || Odometro === '' || isNaN(Number(Odometro))}
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
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Fecha</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', zIndex: 2, fontSize: '0.78rem' }}>Estado</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {paginatedData.length > 0 ? (
                                                    paginatedData.map((neumatico) => {
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
                                                                <TableCell sx={{ fontSize: '0.78rem' }}>{neumatico.FECHA_REGISTRO}</TableCell>
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
                                                                                height: 20,
                                                                                borderRadius: 5,
                                                                                '& .MuiLinearProgress-bar': {
                                                                                    backgroundColor: 'green',
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
                                                                                color: 'white',
                                                                                fontWeight: 'bold',
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
};

export default ModalAsignacionNeuDesdeDesasignacion;

