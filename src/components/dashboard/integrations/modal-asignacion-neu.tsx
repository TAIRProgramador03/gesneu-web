import React, { useState, useMemo, useEffect, memo } from 'react';
import { Box, Card, Chip, DialogTitle, Stack, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import ModalAvertAsigNeu from './modal-avert-asig-neu';
import ModalInputsNeu from './modal-inputs-neu';
import { Neumatico } from '@/types/types';
import { asignarNeumatico } from '../../../api/Neumaticos';
import { toast } from 'sonner';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { Button as ButtonCustom } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';
import { LinearProgressItem } from '@/components/ui/LinearProgress';
import { convertToDateHuman, mensajeErrorApi } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    ArrowUpDown,
    BadgeAlert,
    Check,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    Gauge,
    Lock,
    MapPinned,
    MousePointerClick,
    Pencil,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { ModalInformacionAsignacion } from './modal-informacion-asignacion';
import { obtenerConfiguracionNeumaticos, esPosicionRepuesto } from '@/utils/configuraciones-neumaticos';
import { ColumnDef } from '@tanstack/react-table';

export interface ModalAsignacionNeuProps {
    open: boolean;
    onClose: () => void;
    data: any[];
    assignedNeumaticos: any[];
    placa: string;
    kilometro: number;
    /** Cantidad de neumáticos del vehículo (2/5/7) — determina las posiciones a asignar. Por defecto 5 (auto/camioneta). */
    cantidadNeumaticos?: number | string | null;
    onAssignedUpdate?: () => void;
    enTransito: boolean,
    taller?: string;
}

const codigoDe = (neumatico: any): string => neumatico?.CODIGO ?? neumatico?.CODIGO_NEU ?? '';

/**
 * Un neumático ya colocado en el diagrama sólo está listo para enviar cuando tiene
 * los datos de instalación completos. Mismos criterios que la validación de handleConfirm
 * (incluida la excepción del repuesto, al que el backend sí le acepta torque 0).
 */
const datosCompletos = (neumatico: any, posicion: string): boolean => {
    if (!neumatico) return false;
    const valido = (valor: any) => valor !== null && valor !== undefined && valor !== '' && !isNaN(Number(valor)) && Number(valor) !== 0;
    if (!neumatico.FECHA_ASIGNACION) return false;
    if (!valido(neumatico.REMANENTE)) return false;
    if (!valido(neumatico.PRESION_AIRE)) return false;
    if (esPosicionRepuesto(posicion)) return true;
    return valido(neumatico.TORQUE_APLICADO);
};

const isDuplicadoEnOtraPos = (
    codigo: string,
    posicionActual: string,
    asignaciones: { [key: string]: Neumatico | null }
): boolean => {
    return Object.entries(asignaciones).some(
        ([posicion, neumatico]) => codigoDe(neumatico) === codigo && posicion !== posicionActual
    );
};

/**
 * Estado de selección compartido con las celdas de la tabla de disponibles.
 * Va por contexto (y no por props de columna) para que la definición de columnas
 * sea estable y la tabla no se reinicie al seleccionar un neumático.
 */
interface SeleccionContextValue {
    codigoSeleccionado: string | null;
    /** código de neumático -> posición del diagrama donde ya está colocado */
    posicionPorCodigo: Record<string, string>;
    onSeleccionar: (neumatico: any) => void;
}

const SeleccionContext = React.createContext<SeleccionContextValue>({
    codigoSeleccionado: null,
    posicionPorCodigo: {},
    onSeleccionar: () => { },
});

const CeldaSeleccion: React.FC<{ neumatico: any }> = ({ neumatico }) => {
    const { codigoSeleccionado, posicionPorCodigo, onSeleccionar } = React.useContext(SeleccionContext);
    const codigo = codigoDe(neumatico);
    const posicionAsignada = posicionPorCodigo[codigo];

    if (posicionAsignada) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                En {posicionAsignada}
            </span>
        );
    }

    const seleccionado = codigoSeleccionado === codigo;
    return (
        <ButtonCustom
            variant={seleccionado ? 'indigo' : 'teal'}
            size="sm"
            onClick={() => onSeleccionar(neumatico)}
        >
            {seleccionado ? <Check className="h-3.5 w-3.5" /> : <MousePointerClick className="h-3.5 w-3.5" />}
            {seleccionado ? 'Seleccionado' : 'Seleccionar'}
        </ButtonCustom>
    );
};

const columnasDisponibles: ColumnDef<any>[] = [
    {
        id: 'SELECCION',
        header: 'Acción',
        cell: ({ row }) => <CeldaSeleccion neumatico={row.original} />,
    },
    {
        accessorKey: 'CODIGO',
        header: ({ column }) => (
            <ButtonCustom variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Código
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </ButtonCustom>
        ),
        cell: ({ row }) => (
            <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank" className="text-blue-600 underline">
                {row.original.CODIGO}
            </Link>
        ),
    },
    { accessorKey: 'MARCA', header: 'Marca' },
    { accessorKey: 'DISEÑO', header: 'Diseño' },
    {
        accessorKey: 'REMANENTE',
        header: ({ column }) => (
            <ButtonCustom variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Remanente
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </ButtonCustom>
        ),
    },
    { accessorKey: 'MEDIDA', header: 'Medida' },
    {
        accessorKey: 'FECHA_REGISTRO',
        header: 'Envío',
        cell: ({ row }) => convertToDateHuman(row.original.FECHA_REGISTRO),
    },
    {
        accessorKey: 'RECUPERADO',
        header: 'Recuperado',
        cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
    },
    {
        accessorKey: 'ESTADO',
        header: ({ column }) => (
            <ButtonCustom variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Estado
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </ButtonCustom>
        ),
        cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} width="100px" />,
    },
];

/** Tarjeta de un neumático disponible — reemplaza a la tabla en móvil/tablet. */
const TarjetaDisponible: React.FC<{
    neumatico: any;
    posicionAsignada?: string;
    seleccionado: boolean;
    etiquetaAccion: string;
    onAccion: () => void;
}> = ({ neumatico, posicionAsignada, seleccionado, etiquetaAccion, onAccion }) => {
    const codigo = codigoDe(neumatico);
    return (
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${seleccionado ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-white'
            }`}>
            <div className="min-w-0 flex-1">
                <Link
                    href={`/padron/neumatico/${codigo}`}
                    target="_blank"
                    className="text-sm font-bold text-[#167bd9] underline underline-offset-2"
                >
                    {codigo}
                </Link>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[neumatico.MARCA, neumatico.DISEÑO, neumatico.MEDIDA].filter(Boolean).join(' · ') || '—'}
                </p>
            </div>

            <div className="shrink-0 text-center">
                <p className="text-sm font-bold leading-none text-slate-700">
                    {neumatico.REMANENTE ?? '—'}
                    <span className="ml-0.5 text-xs">mm</span>
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">remanente</p>
            </div>

            {posicionAsignada ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    {posicionAsignada}
                </span>
            ) : (
                <ButtonCustom variant={seleccionado ? 'indigo' : 'teal'} size="sm" onClick={onAccion} className="shrink-0">
                    {etiquetaAccion}
                </ButtonCustom>
            )}
        </div>
    );
};

/** Fila de la lista de posiciones del vehículo (debajo del diagrama). */
const FilaPosicion: React.FC<{
    posicion: string;
    esRepuesto: boolean;
    neumatico: any | null;
    haySeleccionado: boolean;
    /**
     * La posición ya venía montada desde la base, no se llenó en este modal. No se
     * puede editar ni quitar desde acá: este modal sólo monta lo que falta. Para
     * cambiar o sacar un neumático que ya está puesto se usa Desasignar o Reubicar,
     * que son los flujos que sí registran el movimiento de salida.
     */
    yaMontado: boolean;
    /** En móvil, una posición vacía ofrece ir a elegir un neumático para ella. */
    onElegirNeumatico?: (posicion: string) => void;
    onAsignarAqui: (posicion: string) => void;
    onEditar: (posicion: string) => void;
    onQuitar: (posicion: string) => void;
}> = ({ posicion, esRepuesto, neumatico, haySeleccionado, yaMontado, onElegirNeumatico, onAsignarAqui, onEditar, onQuitar }) => {
    const ocupada = Boolean(neumatico);
    const completo = datosCompletos(neumatico, posicion);

    return (
        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${ocupada ? 'border-violet-100 bg-violet-50/50' : 'border-dashed border-slate-200 bg-slate-50/60'
            }`}>
            <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold tracking-wide ${ocupada ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                {posicion}
            </span>

            <div className="min-w-0 flex-1">
                {ocupada ? (
                    <>
                        <p className="truncate text-sm font-semibold text-slate-800">{codigoDe(neumatico)}</p>
                        <p className="truncate text-xs text-slate-500">
                            {neumatico.MARCA || '—'}
                            {neumatico.FECHA_ASIGNACION ? ` · ${convertToDateHuman(neumatico.FECHA_ASIGNACION)}` : ''}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-slate-400">
                        Sin asignar{esRepuesto ? ' (repuesto)' : ''}
                    </p>
                )}
            </div>

            {ocupada && !completo && !yaMontado && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <CircleAlert className="h-3 w-3" />
                    Faltan datos
                </span>
            )}

            <div className="flex shrink-0 items-center gap-1">
                {yaMontado ? (
                    <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                        title="Ya está montado. Para cambiarlo o sacarlo usa Desasignar o Reubicar."
                    >
                        <Lock className="h-3 w-3" />
                        Montado
                    </span>
                ) : ocupada ? (
                    <>
                        <ButtonCustom variant="warning" size="sm" onClick={() => onEditar(posicion)} title="Editar datos de instalación">
                            <Pencil className="h-3.5 w-3.5" />
                        </ButtonCustom>
                        <ButtonCustom variant="destructive" size="sm" onClick={() => onQuitar(posicion)} title="Quitar neumático de esta posición">
                            <Trash2 className="h-3.5 w-3.5" />
                        </ButtonCustom>
                    </>
                ) : haySeleccionado ? (
                    <ButtonCustom variant="indigo" size="sm" onClick={() => onAsignarAqui(posicion)}>
                        Asignar aquí
                    </ButtonCustom>
                ) : onElegirNeumatico ? (
                    <ButtonCustom variant="outline" size="sm" onClick={() => onElegirNeumatico(posicion)}>
                        Elegir
                        <ChevronRight className="h-3.5 w-3.5" />
                    </ButtonCustom>
                ) : (
                    <span className="px-2 text-xs text-slate-300">—</span>
                )}
            </div>
        </div>
    );
};

const ModalAsignacionNeu: React.FC<ModalAsignacionNeuProps> = memo(({ open, onClose, data, assignedNeumaticos: initialAssignedNeumaticos, placa, kilometro, cantidadNeumaticos, onAssignedUpdate, enTransito, taller }) => {

    // Posiciones del vehículo (2/5/7) — mismo catálogo que usa DiagramaVehiculo. Por defecto, la
    // configuración de auto/camioneta (4 posiciones + repuesto) si no llega cantidadNeumaticos.
    const configuracion = useMemo(
        () => obtenerConfiguracionNeumaticos(cantidadNeumaticos) ?? obtenerConfiguracionNeumaticos(5),
        [cantidadNeumaticos]
    );
    const posiciones = configuracion?.posiciones ?? [];

    const initialAssignedMap = useMemo<Record<string, Neumatico | null>>(
        () => {
            const mapa: Record<string, Neumatico | null> = {};
            posiciones.forEach((p) => { mapa[p.codigo] = null; });

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

            neumaticosPorPosicion.forEach((neu, pos) => {
                mapa[pos] = neu;
            });
            return mapa;
        },
        [initialAssignedNeumaticos, posiciones]
    );

    const [assignedNeumaticos, setAssignedNeumaticos] = useState(initialAssignedMap);

    /**
     * Lo que de verdad se va a registrar: sólo las posiciones que cambiaron en esta
     * pasada. Las que ya venían montadas desde la base y siguen con el MISMO neumático
     * se dejan en paz.
     *
     * Antes se enviaban las N posiciones siempre. Eso funcionaba cuando el modal era
     * sólo para vehículos vacíos, pero dejó de serlo: una camioneta que pasa de 5 a 6
     * posiciones entra acá a montar el que le falta. Al reenviar los otros 5, el backend
     * les registraba un MONTAJE duplicado y —peor— les pisaba ODOMETRO_AL_MONTAR, que es
     * desde dónde se cuenta su kilometraje recorrido. No hay guarda en el backend contra
     * re-montar algo ya montado, así que el filtro tiene que estar acá.
     *
     * La pantalla de reconfirmación usa esta misma lista: si mostrara las 6 cuando sólo
     * se monta 1, le estaría mintiendo al técnico.
     */
    const posicionesAMontar = useMemo(
        () => Object.entries(assignedNeumaticos).filter(([pos, neu]) => {
            if (!neu) return false;
            if (neu.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neu.TIPO_MOVIMIENTO === 'RECUPERADO') return false;
            const yaMontado = initialAssignedMap[pos];
            if (yaMontado && codigoDe(yaMontado) === codigoDe(neu)) return false;
            return true;
        }),
        [assignedNeumaticos, initialAssignedMap]
    );

    const [openDialog, setOpenDialog] = useState(false);
    const [neumaticoSeleccionado, setNeumaticoSeleccionado] = useState<any | null>(null);

    // En pantallas chicas el modal cambia de estructura: pestañas en vez de dos columnas,
    // y el flujo se invierte (se elige primero la posición y después el neumático).
    const theme = useTheme();
    const esPantallaChica = useMediaQuery(theme.breakpoints.down('lg'));
    const [tabMovil, setTabMovil] = useState<0 | 1>(0);
    const [posicionDestino, setPosicionDestino] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');

    // Cada vez que el modal se abre o cambian los asignados, sincroniza con los props
    useEffect(() => {
        if (open) {
            setAssignedNeumaticos(initialAssignedMap);
            setNeumaticoSeleccionado(null);
            setPosicionDestino(null);
            setBusqueda('');
            setTabMovil(0);
        }
    }, [open, initialAssignedMap]);

    const allPositionsAssigned = Object.values(assignedNeumaticos).filter(Boolean).length === posiciones.length;
    const totalAsignados = Object.values(assignedNeumaticos).filter(Boolean).length;

    // Estado para el popup de datos (Remanente/Presión/Torque/Fecha) — una sola instancia,
    // compartida tanto para "rellenar al asignar" como para "editar una posición ya asignada".
    const [inputsModalPosition, setInputsModalPosition] = useState<string | null>(null);
    const [inputsModalOpen, setInputsModalOpen] = useState<boolean>(false);

    const handleInputsModalSubmit = (inputData: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }): void => {
        if (!inputsModalPosition) return;
        setAssignedNeumaticos((prev) => {
            const current = prev[inputsModalPosition];
            if (!current) return prev;
            return {
                ...prev,
                [inputsModalPosition]: {
                    ...current,
                    REMANENTE: inputData.Remanente,
                    PRESION_AIRE: inputData.PresionAire,
                    TORQUE_APLICADO: inputData.TorqueAplicado,
                    ODOMETRO: inputData.Odometro,
                    FECHA_ASIGNACION: inputData.FechaAsignacion,
                },
            };
        });
        setInputsModalOpen(false);
    };

    // Estado para confirmar la remoción de un neumático ya asignado
    const [removePosition, setRemovePosition] = useState<string | null>(null);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState<boolean>(false);

    const handleConfirmRemove = (): void => {
        if (!removePosition) return;
        setAssignedNeumaticos((prev) => ({ ...prev, [removePosition]: null }));
        setRemoveConfirmOpen(false);
        setRemovePosition(null);
    };

    /** Coloca un neumático en una posición y pide sus datos de instalación. */
    const asignarNeumaticoEnPosicion = (neumatico: any, posicion: string) => {
        const codigo = codigoDe(neumatico);
        if (isDuplicadoEnOtraPos(codigo, posicion, assignedNeumaticos)) {
            toast.warning(`El neumático ${codigo} ya está asignado a otra posición.`);
            return;
        }

        setAssignedNeumaticos((prev) => ({ ...prev, [posicion]: neumatico }));
        setNeumaticoSeleccionado(null);
        setPosicionDestino(null);
        setInputsModalPosition(posicion);
        setInputsModalOpen(true);
        setTabMovil(0);
    };

    const asignarAPosicion = (posicion: string) => {
        if (!neumaticoSeleccionado) {
            toast.info('Primero selecciona un neumático de la lista de disponibles.');
            return;
        }
        asignarNeumaticoEnPosicion(neumaticoSeleccionado, posicion);
    };

    /** Móvil: desde una posición vacía se va a elegir el neumático que irá ahí. */
    const elegirNeumaticoPara = (posicion: string) => {
        setPosicionDestino(posicion);
        setNeumaticoSeleccionado(null);
        setTabMovil(1);
    };

    /**
     * La posición ya venía montada desde la base y nadie la cambió en este modal.
     * Este modal sólo monta lo que falta: tocar un neumático que ya está puesto es
     * trabajo de Desasignar o Reubicar, que sí registran el movimiento de salida.
     */
    const estaYaMontado = (posicion: string) => {
        const original = initialAssignedMap[posicion];
        if (!original) return false;
        return codigoDe(original) === codigoDe(assignedNeumaticos[posicion]);
    };

    const avisarMontado = () => {
        toast.info('Ese neumático ya está montado. Para cambiarlo o sacarlo usa Desasignar o Reubicar.');
    };

    const abrirEdicion = (posicion: string) => {
        if (estaYaMontado(posicion)) { avisarMontado(); return; }
        setInputsModalPosition(posicion);
        setInputsModalOpen(true);
    };

    const pedirQuitar = (posicion: string) => {
        if (estaYaMontado(posicion)) { avisarMontado(); return; }
        setRemovePosition(posicion);
        setRemoveConfirmOpen(true);
    };

    /** Click sobre una posición del diagrama: si está ocupada edita, si está libre asigna el seleccionado. */
    const handleClickPosicion = (posicion: string) => {
        if (!posicion) return;
        if (assignedNeumaticos[posicion]) {
            abrirEdicion(posicion);
            return;
        }
        asignarAPosicion(posicion);
    };

    const hasAssignedNeumaticos = totalAsignados > 0;

    const posicionPorCodigo = useMemo(() => {
        const mapa: Record<string, string> = {};
        Object.entries(assignedNeumaticos).forEach(([pos, neu]) => {
            const codigo = codigoDe(neu);
            if (codigo) mapa[codigo] = pos;
        });
        return mapa;
    }, [assignedNeumaticos]);

    const posicionesLibres = useMemo(
        () => posiciones.map((p) => p.codigo).filter((codigo) => !assignedNeumaticos[codigo]),
        [posiciones, assignedNeumaticos]
    );

    const filteredData = useMemo(
        () => data.filter((neumatico) => neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE'),
        [data]
    );

    // Móvil: sin DataTable, el filtrado se hace con un buscador simple y se acota la lista
    // para no renderizar cientos de tarjetas de golpe.
    const TOPE_TARJETAS = 40;
    const resultadosBusqueda = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return filteredData;
        return filteredData.filter((n) =>
            `${codigoDe(n)} ${n.MARCA ?? ''} ${n.MEDIDA ?? ''} ${n.DISEÑO ?? ''}`.toLowerCase().includes(termino)
        );
    }, [filteredData, busqueda]);
    const tarjetasVisibles = resultadosBusqueda.slice(0, TOPE_TARJETAS);

    const seleccionContextValue = useMemo<SeleccionContextValue>(() => ({
        codigoSeleccionado: neumaticoSeleccionado ? codigoDe(neumaticoSeleccionado) : null,
        posicionPorCodigo,
        onSeleccionar: (neumatico: any) => {
            setNeumaticoSeleccionado((prev: any) =>
                prev && codigoDe(prev) === codigoDe(neumatico) ? null : neumatico
            );
        },
    }), [neumaticoSeleccionado, posicionPorCodigo]);

    const handleDialogClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus();
        }, 0);
    };

    // ------------------------------------------------
    // Insert de la asignación de los neumáticos
    const handleConfirm = async () => {
        const allPositionsAssigned1 = Object.values(assignedNeumaticos).filter(Boolean).length === posiciones.length;

        if (!allPositionsAssigned1) {
            toast.warning(`Debes asignar un neumático en las ${posiciones.length} posiciones antes de confirmar.`);
            return;
        }

        // Ver `posicionesAMontar`: sólo lo que cambió en esta pasada.
        const toAssign = posicionesAMontar;
        if (toAssign.length === 0) {
            toast.info('No hay cambios que guardar: las posiciones ya estaban montadas con esos mismos neumáticos.');
            return;
        }

        // La fecha se exige igual sólo entre los que se van a montar ahora. Antes se
        // comparaba contra todas las posiciones: una camioneta que pasa de 5 a 6 nunca
        // habría podido guardar, porque los 5 viejos traen su fecha de montaje original
        // y el nuevo la de hoy.
        const fechas = toAssign.map(([, neu]) => neu!.FECHA_ASIGNACION ?? '');
        if (!fechas.every((f) => f === fechas[0])) {
            toast.error('Todos los neumáticos a montar deben tener la misma fecha de asignación.');
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
                    if (esPosicionRepuesto(pos) && campo === 'TORQUE_APLICADO') continue;
                    toast.error(`El campo "${campo}" no puede ser 0 en la posición ${pos}.`);
                    return;
                }
            }
        }

        setOpenDialog(false)

        try {
            const payloadArray = toAssign.map(([pos, neu]) => {
                const codigo = neu!.CODIGO ?? neu!.CODIGO_NEU;
                const remanente = typeof neu!.REMANENTE === 'string' ? parseFloat(neu!.REMANENTE) : (neu!.REMANENTE ?? 0);
                const presionAire = typeof neu!.PRESION_AIRE === 'string' ? parseFloat(neu!.PRESION_AIRE) : (neu!.PRESION_AIRE ?? 0);
                const torqueAplicado = typeof neu!.TORQUE_APLICADO === 'string' ? parseFloat(neu!.TORQUE_APLICADO) : (neu!.TORQUE_APLICADO ?? 0);
                const idOperacion = Number(neu?.ID_OPERACION);
                const codSupervisor = neu?.COD_SUPERVISOR;

                // Lógica de fecha:
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
                    Odometro: Number(Odometro),
                    ID_OPERACION: idOperacion,
                    COD_SUPERVISOR: codSupervisor,
                    FechaAsignacion: fechaRegistro,
                    EnTransito: enTransito,
                    Taller: taller
                };
            });

            const respuesta = await asignarNeumatico(payloadArray);

            // El backend responde por ítem: puede salir 207 con unas asignadas y otras
            // rechazadas. Sin mirar `resultados` el front cantaba "asignado
            // correctamente" aunque no se hubiera grabado nada — pasó en producción el
            // 2026-11-02: no se registró el movimiento ni se actualizó el neumático, y
            // el usuario no se enteró.
            const fallidos = Array.isArray(respuesta?.resultados)
                ? respuesta.resultados.filter((r: any) => r?.error)
                : [];

            if (fallidos.length > 0) {
                const detalle = fallidos
                    .map((r: any) => r.detalle || r.error)
                    .join(' · ');
                toast.error(`No se pudo asignar ${fallidos.length} neumático(s): ${detalle}`, {
                    position: 'top-center',
                    duration: 12000,
                });
                if (typeof onAssignedUpdate === 'function') {
                    await onAssignedUpdate();
                }
                return;
            }

            toast.success('Neumático(s) asignado(s) y kilometraje actualizado.', {
                position: 'top-right',
                duration: 6000
            });
            if (typeof onAssignedUpdate === 'function') {
                await onAssignedUpdate();
            }
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error(mensajeErrorApi(e, 'Error al asignar neumático.'), { duration: 6000 });
        }
    };
    // ------------------------------------------------

    const [Odometro, setOdometro] = useState<string>('');
    const [initialOdometro, setInitialOdometro] = useState<number>(kilometro || 0);
    const [kmError, setKmError] = useState<boolean>(false);

    // Sincronizar Odometro e initialOdometro cuando cambie la prop kilometro o al abrir el modal.
    //
    // El campo arranca con el kilometraje actual del vehículo en vez de vacío: montar un
    // neumático no es recorrer kilómetros. Cuando sólo se agrega el que falta a un
    // vehículo que ya anda, el odómetro no cambió y obligar a escribir un número mayor
    // sería inventar un dato. Si de verdad subió, el técnico lo corrige — la validación
    // acepta desde el valor actual hasta +25.000 km.
    useEffect(() => {
        setOdometro(kilometro ? String(kilometro) : '');
        setInitialOdometro(kilometro || 0);
        setKmError(false);
    }, [kilometro, open]);

    const kmDeshabilitado = !hasAssignedNeumaticos || !allPositionsAssigned;
    const confirmarDeshabilitado = !hasAssignedNeumaticos || !allPositionsAssigned || kmError || Odometro === '' || isNaN(Number(Odometro));

    // --- Bloques reutilizados por el layout de escritorio y el de pantallas chicas ---

    const campoKilometraje = (
        <Field className="w-full">
            <FieldLabel htmlFor="kilometraje-asignacion">Kilometraje</FieldLabel>
            <InputGroup className={kmDeshabilitado ? 'opacity-50' : ''}>
                <InputGroupAddon>
                    <Gauge className="h-4 w-4 text-slate-400" />
                </InputGroupAddon>
                <InputGroupInput
                    id="kilometraje-asignacion"
                    type="number"
                    value={Odometro}
                    disabled={kmDeshabilitado}
                    min={initialOdometro}
                    max={initialOdometro + 25000}
                    placeholder={initialOdometro.toLocaleString()}
                    onChange={(e) => {
                        const value = e.target.value;
                        const numValue = Number(value);

                        if (value === '' || isNaN(numValue)) {
                            setKmError(true);
                            return;
                        }

                        setOdometro(value);

                        if (numValue >= initialOdometro && numValue < (initialOdometro + 25000)) {
                            setKmError(false);
                        } else {
                            setKmError(true);
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupText>km</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
            <FieldDescription className={kmError || Odometro === '' ? 'font-semibold text-rose-600' : ''}>
                {Odometro === ''
                    ? `Último registrado: ${initialOdometro.toLocaleString()} km`
                    : kmError
                        ? `Debe ser mayor a ${initialOdometro.toLocaleString()} km y menor a ${(initialOdometro + 25000).toLocaleString()} km`
                        : `Kilometraje actual: ${Number(Odometro).toLocaleString()} km`}
            </FieldDescription>
        </Field>
    );

    const diagrama = (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MapPinned className="h-3.5 w-3.5" />
                Posiciones
            </div>
            <DiagramaVehiculo
                    etiquetaDatos="remanente"
                neumaticosAsignados={Object.entries(assignedNeumaticos)
                    .filter(([, neu]) => neu)
                    .map(([pos, neu]) => ({ ...neu, POSICION: pos, POSICION_NEU: pos }))}
                layout="modal"
                tipoModal="mantenimiento"
                anchoMax={esPantallaChica ? 170 : 150}
                cantidadNeumaticos={cantidadNeumaticos ?? 5}
                onPosicionClick={(_neu: any, codigoPosicion: string) => handleClickPosicion(codigoPosicion)}
                onMantenimientoClick={() => { }}
            />
        </Box>
    );

    const listaPosiciones = (
        <>
            <div className="mt-3 mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Neumáticos instalados</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {totalAsignados}/{posiciones.length}
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                {posiciones.map((p) => (
                    <FilaPosicion
                        key={p.codigo}
                        posicion={p.codigo}
                        esRepuesto={p.repuesto}
                        neumatico={assignedNeumaticos[p.codigo]}
                        yaMontado={estaYaMontado(p.codigo)}
                        haySeleccionado={Boolean(neumaticoSeleccionado)}
                        onElegirNeumatico={esPantallaChica ? elegirNeumaticoPara : undefined}
                        onAsignarAqui={asignarAPosicion}
                        onEditar={abrirEdicion}
                        onQuitar={pedirQuitar}
                    />
                ))}
            </div>
        </>
    );

    const botonConfirmar = (
        <LoadingButton2
            variant="primary"
            icon={<BadgeAlert />}
            disabled={confirmarDeshabilitado}
            onClick={() => setOpenDialog(true)}
        >
            {esPantallaChica ? 'Confirmar' : 'Confirmar Asignación'}
        </LoadingButton2>
    );

    const tarjetaSeleccionado = neumaticoSeleccionado ? (
        <div className="mb-3 rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-3">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Seleccionado</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                    {codigoDe(neumaticoSeleccionado)}
                    <span className="ml-2 font-normal text-slate-500">{neumaticoSeleccionado.MARCA}</span>
                </p>
                <ButtonCustom variant="ghost" size="sm" onClick={() => setNeumaticoSeleccionado(null)} title="Cancelar selección">
                    <X className="h-3.5 w-3.5" />
                </ButtonCustom>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">Enviar a:</span>
                {posicionesLibres.length > 0 ? (
                    posicionesLibres.map((codigo) => (
                        <ButtonCustom key={codigo} variant="indigo" size="sm" onClick={() => asignarAPosicion(codigo)}>
                            {codigo}
                        </ButtonCustom>
                    ))
                ) : (
                    <span className="text-xs italic text-slate-400">
                        Todas las posiciones están ocupadas — quita una para reemplazarla.
                    </span>
                )}
            </div>
        </div>
    ) : null;

    /** Pantallas chicas: buscador + tarjetas, en vez de la tabla de 8 columnas. */
    const listaDisponiblesMovil = (
        <>
            {posicionDestino ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                    <span className="shrink-0 rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{posicionDestino}</span>
                    <p className="min-w-0 flex-1 text-xs text-indigo-900">Elige el neumático que irá en esta posición.</p>
                    <ButtonCustom variant="ghost" size="sm" onClick={() => setPosicionDestino(null)} title="Cancelar">
                        <X className="h-3.5 w-3.5" />
                    </ButtonCustom>
                </div>
            ) : (
                tarjetaSeleccionado
            )}

            <InputGroup className="mb-3">
                <InputGroupAddon>
                    <Search className="h-4 w-4 text-slate-400" />
                </InputGroupAddon>
                <InputGroupInput
                    placeholder="Buscar por código, marca o medida"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </InputGroup>

            <div className="grid gap-2 sm:grid-cols-2">
                {tarjetasVisibles.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400 sm:col-span-2">No hay neumáticos que coincidan.</p>
                ) : (
                    tarjetasVisibles.map((n) => {
                        const codigo = codigoDe(n);
                        const seleccionado = Boolean(neumaticoSeleccionado) && codigoDe(neumaticoSeleccionado) === codigo;
                        return (
                            <TarjetaDisponible
                                key={codigo}
                                neumatico={n}
                                posicionAsignada={posicionPorCodigo[codigo]}
                                seleccionado={seleccionado}
                                etiquetaAccion={posicionDestino ? `Asignar a ${posicionDestino}` : seleccionado ? 'Seleccionado' : 'Seleccionar'}
                                onAccion={() => {
                                    if (posicionDestino) {
                                        asignarNeumaticoEnPosicion(n, posicionDestino);
                                        return;
                                    }
                                    seleccionContextValue.onSeleccionar(n);
                                    setTabMovil(0);
                                }}
                            />
                        );
                    })
                )}

                {resultadosBusqueda.length > TOPE_TARJETAS && (
                    <p className="py-2 text-center text-xs text-slate-400 sm:col-span-2">
                        Mostrando {TOPE_TARJETAS} de {resultadosBusqueda.length} — refina la búsqueda para ver más.
                    </p>
                )}
            </div>
        </>
    );

    const modalConfirmacion = openDialog ? (
        <ModalInformacionAsignacion
            placa={placa}
            kilometraje={Odometro}
            neumaticos={
                posicionesAMontar.map(([pos, neu]) => {
                    const codigo = neu!.CODIGO ?? neu!.CODIGO_NEU;
                    const remanente = typeof neu!.REMANENTE === 'string' ? parseFloat(neu!.REMANENTE) : (neu!.REMANENTE ?? 0);
                    const presionAire = typeof neu!.PRESION_AIRE === 'string' ? parseFloat(neu!.PRESION_AIRE) : (neu!.PRESION_AIRE ?? 0);
                    const torqueAplicado = typeof neu!.TORQUE_APLICADO === 'string' ? parseFloat(neu!.TORQUE_APLICADO) : (neu!.TORQUE_APLICADO ?? 0);
                    const fechaRegistro = neu!.FECHA_ASIGNACION || neu!.FECHA_REGISTRO || new Date().toISOString().slice(0, 10);
                    return {
                        Posicion: pos,
                        CodigoNeumatico: codigo,
                        Marca: neu!.MARCA ?? '-',
                        FechaAsignacion: fechaRegistro,
                        Remanente: remanente,
                        PresionAire: presionAire,
                        TorqueAplicado: torqueAplicado
                    };
                })
            }
            open={openDialog}
            onSuccessInspeccion={handleConfirm}
            onClose={() => setOpenDialog(false)} />
    ) : null;

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth="lg"
            fullWidth
            fullScreen={esPantallaChica}
            disableEnforceFocus
            disableAutoFocus
            sx={{
                '& .MuiDialog-paper': {
                    maxWidth: '1650px',
                    width: '100%',
                    // El scroll vertical lo maneja el DialogContent; si el Paper también scrollea
                    // aparecen dos barras anidadas.
                    overflowY: 'hidden'
                },
            }}
            PaperProps={{ sx: { borderRadius: { xs: 0, md: 3 } } }}
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
                        Asignación de Neumáticos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
                        <Chip
                            label={placa}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
                        />
                    </Box>
                    <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic', fontSize: { xs: '0.75rem', md: '0.875rem' }, lineHeight: 1.35 }}>
                        <span className='font-bold'>Nota: </span>
                        Selecciona un neumático de la lista y envíalo a una posición. Al asignarlo se solicitarán los datos de instalación. <b>Las {posiciones.length} posiciones son obligatorias</b>.
                    </Typography>
                </Box>

                <ButtonCustom
                    variant="ghost"
                    size="icon"
                    onClick={handleDialogClose}
                    title="Cerrar"
                    aria-label="Cerrar"
                    className="shrink-0 self-start text-slate-400 hover:text-slate-700"
                >
                    <X className="h-4 w-4" />
                </ButtonCustom>
            </DialogTitle>

            {esPantallaChica ? (
                /* --- Pantallas chicas: pasos en pestañas, el flujo va de la posición al neumático --- */
                <>
                    <Box sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Tabs
                            value={tabMovil}
                            onChange={(_e, v) => setTabMovil(v)}
                            variant="fullWidth"
                            sx={{ minHeight: 42, '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontWeight: 700, fontSize: '0.875rem' } }}
                        >
                            <Tab value={0} label={`1. Vehículo (${totalAsignados}/${posiciones.length})`} />
                            <Tab value={1} label={posicionDestino ? `2. Elegir para ${posicionDestino}` : '2. Neumáticos'} />
                        </Tabs>
                    </Box>

                    <DialogContent sx={{ px: 1.5, pt: 2 }}>
                        {tabMovil === 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>{diagrama}</div>
                                <div>
                                    {campoKilometraje}
                                    {listaPosiciones}
                                </div>
                            </div>
                        ) : (
                            listaDisponiblesMovil
                        )}
                    </DialogContent>

                    {/* Barra de acción fija */}
                    <Box
                        sx={{
                            position: 'sticky', bottom: 0, zIndex: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                            px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
                        }}
                    >
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                            {totalAsignados}/{posiciones.length} posiciones
                        </span>
                        <div className="min-w-0 flex-1 [&>button]:w-full sm:flex-none sm:[&>button]:w-auto">{botonConfirmar}</div>
                    </Box>
                </>
            ) : (
                /* --- Escritorio: dos columnas --- */
                <DialogContent sx={{ px: 3 }}>
                    <Stack direction="row" spacing={2}>
                        {/* Panel Izquierdo: kilometraje, diagrama y posiciones */}
                        <Card sx={{ flex: 0.38, width: '100%', p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', marginTop: '10px', minWidth: 360 }}>
                            {campoKilometraje}
                            <Box sx={{ mt: 2 }}>{diagrama}</Box>
                            {listaPosiciones}
                        </Card>

                        {/* Panel Derecho: neumáticos disponibles */}
                        {/* minWidth: 0 — sin esto el ancho natural de la tabla infla la columna
                            y el modal entero termina con scroll horizontal. */}
                        <Stack direction="column" spacing={2} sx={{ flex: 0.62, width: '100%', minWidth: 0, height: '100%', marginTop: '10px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                        Neu. disponibles: {filteredData.length}
                                    </span>
                                    {botonConfirmar}
                                </div>

                                {tarjetaSeleccionado}

                                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                    <SeleccionContext.Provider value={seleccionContextValue}>
                                        <DataTableNeumaticos columns={columnasDisponibles} data={filteredData} type='pagination' filters={true} />
                                    </SeleccionContext.Provider>
                                </Box>
                            </Card>
                        </Stack>
                    </Stack>
                </DialogContent>
            )}

            {modalConfirmacion}

            <ModalInputsNeu
                cantidadNeumaticos={cantidadNeumaticos}
                open={inputsModalOpen}
                onClose={() => setInputsModalOpen(false)}
                onSubmit={handleInputsModalSubmit}
                initialRemanente={inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.REMANENTE ? Number(assignedNeumaticos[inputsModalPosition]?.REMANENTE) : 0}
                initialOdometro={typeof kilometro === 'number' ? kilometro : 0}
                initialPresionAire={inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.PRESION_AIRE ? Number(assignedNeumaticos[inputsModalPosition]?.PRESION_AIRE) : 0}
                initialTorqueAplicado={inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.TORQUE_APLICADO ? Number(assignedNeumaticos[inputsModalPosition]?.TORQUE_APLICADO) : 0}
                initialFechaAsignacion={(inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.FECHA_ASIGNACION) || ''}
                fechaRegistroNeumatico={(inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.FECHA_REGISTRO) || ''}
                esRecuperado={(inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.RECUPERADO) || false}
                fechaRecuperado={(inputsModalPosition && assignedNeumaticos[inputsModalPosition]?.FECHA_RECUPERADO) || null}
                position={inputsModalPosition}
            />

            <ModalAvertAsigNeu
                open={removeConfirmOpen}
                onClose={() => setRemoveConfirmOpen(false)}
                onConfirm={handleConfirmRemove}
                message={`¿Deseas quitar el neumático asignado en la posición ${removePosition}?`}
            />
        </Dialog>
    );
});

export default ModalAsignacionNeu;
