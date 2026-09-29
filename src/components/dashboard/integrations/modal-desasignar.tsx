'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
    ArrowLeft, ArrowRight, ArrowUpDown, Check, CircleAlert, CircleMinus, ClipboardList,
    MousePointerClick, Pencil, RotateCcw, Search, Trash2, TriangleAlert, Undo2, X,
} from 'lucide-react';
import { toast } from 'sonner';

import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import ModalInputsNeu from './modal-inputs-neu';
import { desasignarConReemplazo, getUltimaFechaInspeccionPorPlaca, obtenerNeumaticosDisponibles } from '../../../api/Neumaticos';
import { Neumatico, Vehiculo } from '../../../types/types';
import { obtenerConfiguracionNeumaticos } from '@/utils/configuraciones-neumaticos';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';
import { LinearProgressItem } from '@/components/ui/LinearProgress';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModalDesasignarProps {
    open: boolean;
    onClose: () => void;
    /** Solo se dispara cuando la operación se guardó correctamente. */
    onSuccess?: () => void;
    neumaticosAsignados: Neumatico[];
    placa: string;
    vehiculo?: Vehiculo;
    kilometraje: number;
    enTransito: boolean;
    taller?: string;
}

/** Reemplazo elegido para una posición liberada, con sus datos de instalación ya capturados. */
interface Reemplazo {
    neumatico: any;
    REMANENTE: number;
    PRESION_AIRE: number;
    TORQUE_APLICADO: number;
    FECHA_ASIGNACION: string;
}

const ACCIONES = [
    { valor: 'RECUPERADO', etiqueta: 'Recuperado' },
    { valor: 'BAJA DEFINITIVA', etiqueta: 'Baja definitiva' },
];

const TIPOS_BAJA = [
    { valor: 'DESGASTE NORMAL', etiqueta: 'Desgaste normal' },
    { valor: 'DESGASTE IRREGULAR', etiqueta: 'Desgaste irregular' },
    { valor: 'RECOBRO', etiqueta: 'Recobro' },
    { valor: 'SINIESTRO', etiqueta: 'Siniestro' },
    { valor: 'FALLA DE FABRICA', etiqueta: 'Falla de fábrica' },
];

const PASOS = ['Qué sale', 'Qué entra', 'Confirmar'];
const TOPE_TARJETAS = 40;

const codigoDe = (neumatico: any): string => neumatico?.CODIGO ?? neumatico?.CODIGO_NEU ?? '';
const posicionDe = (neumatico: any): string => neumatico?.POSICION ?? neumatico?.POSICION_NEU ?? '';

/**
 * Mismos criterios que validaba `handleConfirm` del antiguo modal de asignación:
 * ningún dato vacío ni en cero, con la excepción del torque en el repuesto.
 */
const datosCompletos = (r: Reemplazo | undefined, posicion: string): boolean => {
    if (!r) return false;
    const valido = (v: any) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)) && Number(v) !== 0;
    if (!r.FECHA_ASIGNACION) return false;
    if (!valido(r.REMANENTE)) return false;
    if (!valido(r.PRESION_AIRE)) return false;
    if (posicion === 'RES01') return true;
    return valido(r.TORQUE_APLICADO);
};

/* ------------------------------------------------------------------ */
/* Subcomponentes a nivel de módulo (definición estable entre renders) */
/* ------------------------------------------------------------------ */

const Paso: React.FC<{ indice: number; actual: number; etiqueta: string; onClick: () => void }> = ({ indice, actual, etiqueta, onClick }) => {
    const completado = indice < actual;
    const activo = indice === actual;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={indice > actual}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${activo ? 'bg-blue-600 text-white' : completado ? 'text-blue-700 hover:bg-blue-50' : 'text-slate-400'
                } ${indice > actual ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-xs font-bold ${activo ? 'bg-white/25 text-white' : completado ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                {completado ? <Check className="h-3 w-3" /> : indice + 1}
            </span>
            <span className="hidden sm:inline">{etiqueta}</span>
        </button>
    );
};

/** Fila del paso 1: un neumático instalado, con el botón para marcarlo o devolverlo. */
const FilaInstalado: React.FC<{
    posicion: string;
    neumatico: any | undefined;
    marcado: boolean;
    bloqueado: boolean;
    onToggle: () => void;
}> = ({ posicion, neumatico, marcado, bloqueado, onToggle }) => (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors ${marcado ? 'border-red-200 bg-red-50/70' : neumatico ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'
        }`}>
        <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs font-extrabold ${marcado ? 'bg-red-600 text-white' : neumatico ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
            {posicion}
        </span>

        <div className="min-w-0 flex-1">
            {neumatico ? (
                <>
                    <p className={`truncate text-sm font-bold ${marcado ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                        {codigoDe(neumatico)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        {[neumatico.MARCA, neumatico.MEDIDA].filter(Boolean).join(' · ') || '—'}
                        {neumatico.REMANENTE ? ` · ${neumatico.REMANENTE} mm` : ''}
                    </p>
                </>
            ) : (
                <p className="text-sm italic text-slate-400">Sin neumático</p>
            )}
        </div>

        {neumatico && (
            <ButtonCustom
                variant={marcado ? 'lime' : 'destructive'}
                size="sm"
                onClick={onToggle}
                disabled={bloqueado}
                className="shrink-0"
                title={bloqueado ? 'Quita primero los reemplazos elegidos para cambiar la selección' : undefined}
            >
                {marcado ? <><Undo2 className="h-3.5 w-3.5" />Devolver</> : <><CircleMinus className="h-3.5 w-3.5" />Sacar</>}
            </ButtonCustom>
        )}
    </div>
);

/** Tarjeta del paso 2: una posición liberada y su reemplazo (o el botón para elegirlo). */
const TarjetaPosicionLiberada: React.FC<{
    posicion: string;
    reemplazo: Reemplazo | undefined;
    esObjetivo: boolean;
    onElegir: () => void;
    onEditar: () => void;
    onQuitar: () => void;
}> = ({ posicion, reemplazo, esObjetivo, onElegir, onEditar, onQuitar }) => (
    <div className={`rounded-xl border px-3 py-2.5 transition-colors ${esObjetivo ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-200'
        : reemplazo ? 'border-emerald-200 bg-emerald-50/50' : 'border-dashed border-amber-300 bg-amber-50/50'
        }`}>
        <div className="flex items-center gap-2.5">
            <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 font-mono text-xs font-extrabold text-white">
                {posicion}
            </span>

            <div className="min-w-0 flex-1">
                {reemplazo ? (
                    <>
                        <p className="truncate text-sm font-bold text-slate-800">{codigoDe(reemplazo.neumatico)}</p>
                        <p className="truncate text-xs text-slate-500">
                            {[reemplazo.neumatico.MARCA, reemplazo.neumatico.MEDIDA].filter(Boolean).join(' · ') || '—'}
                        </p>
                    </>
                ) : (
                    <p className="text-xs font-medium text-amber-700">
                        {esObjetivo ? 'Elige un neumático de la lista →' : 'Falta el reemplazo'}
                    </p>
                )}
            </div>

            {reemplazo ? (
                <div className="flex shrink-0 gap-1">
                    <ButtonCustom variant="ghost" size="icon" onClick={onEditar} title="Editar datos">
                        <Pencil className="h-3.5 w-3.5" />
                    </ButtonCustom>
                    <ButtonCustom variant="ghost" size="icon" onClick={onQuitar} title="Quitar reemplazo" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                    </ButtonCustom>
                </div>
            ) : (
                <ButtonCustom variant={esObjetivo ? 'indigo' : 'teal'} size="sm" onClick={onElegir} className="shrink-0">
                    {esObjetivo ? 'Eligiendo…' : 'Elegir'}
                </ButtonCustom>
            )}
        </div>

        {reemplazo && (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[
                    { label: 'Reman.', valor: reemplazo.REMANENTE, unidad: 'mm' },
                    { label: 'Presión', valor: reemplazo.PRESION_AIRE, unidad: 'psi' },
                    { label: 'Torque', valor: reemplazo.TORQUE_APLICADO, unidad: 'N·m' },
                ].map((d) => (
                    <div key={d.label} className="rounded-lg border border-slate-200/70 bg-white px-2 py-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{d.label}</p>
                        <p className="text-xs font-bold text-slate-700">
                            {d.valor}<span className="ml-0.5 text-xs font-semibold text-slate-400">{d.unidad}</span>
                        </p>
                    </div>
                ))}
            </div>
        )}
    </div>
);

/** Estado de selección compartido con la tabla de disponibles (columnas estables). */
interface SeleccionContextValue {
    codigosUsados: Record<string, string>;
    onSeleccionar: (neumatico: any) => void;
    hayObjetivo: boolean;
}

const SeleccionContext = React.createContext<SeleccionContextValue>({
    codigosUsados: {},
    onSeleccionar: () => { },
    hayObjetivo: false,
});

const CeldaSeleccion: React.FC<{ neumatico: any }> = ({ neumatico }) => {
    const { codigosUsados, onSeleccionar, hayObjetivo } = React.useContext(SeleccionContext);
    const posicionUsada = codigosUsados[codigoDe(neumatico)];

    if (posicionUsada) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                En {posicionUsada}
            </span>
        );
    }

    return (
        <ButtonCustom variant="teal" size="sm" onClick={() => onSeleccionar(neumatico)} disabled={!hayObjetivo}>
            <MousePointerClick className="h-3.5 w-3.5" />
            Elegir
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
        header: 'Estado',
        cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} width="100px" />,
    },
];

/** Tarjeta de disponible — reemplaza a la tabla en móvil/tablet. */
const TarjetaDisponible: React.FC<{
    neumatico: any;
    posicionUsada?: string;
    habilitado: boolean;
    onElegir: () => void;
}> = ({ neumatico, posicionUsada, habilitado, onElegir }) => {
    const codigo = codigoDe(neumatico);
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <div className="min-w-0 flex-1">
                <Link href={`/padron/neumatico/${codigo}`} target="_blank" className="text-sm font-bold text-[#167bd9] underline underline-offset-2">
                    {codigo}
                </Link>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[neumatico.MARCA, neumatico.DISEÑO, neumatico.MEDIDA].filter(Boolean).join(' · ') || '—'}
                </p>
            </div>

            <div className="shrink-0 text-center">
                <p className="text-sm font-bold leading-none text-slate-700">
                    {neumatico.REMANENTE ?? '—'}<span className="ml-0.5 text-xs">mm</span>
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">remanente</p>
            </div>

            {posicionUsada ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    {posicionUsada}
                </span>
            ) : (
                <ButtonCustom variant="teal" size="sm" onClick={onElegir} disabled={!habilitado} className="shrink-0">
                    Elegir
                </ButtonCustom>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */

export const ModalDesasignar: React.FC<ModalDesasignarProps> = memo(({
    open, onClose, onSuccess, neumaticosAsignados, placa, vehiculo, kilometraje, enTransito, taller,
}) => {
    const theme = useTheme();
    const esPantallaChica = useMediaQuery(theme.breakpoints.down('lg'));

    const [paso, setPaso] = useState(0);
    /** posición -> neumático marcado para salir */
    const [marcados, setMarcados] = useState<Record<string, any>>({});
    const [accion, setAccion] = useState('');
    const [tipoAccion, setTipoAccion] = useState('');
    const [observacion, setObservacion] = useState('');
    /** posición liberada -> reemplazo elegido */
    const [reemplazos, setReemplazos] = useState<Record<string, Reemplazo>>({});
    const [posicionObjetivo, setPosicionObjetivo] = useState<string | null>(null);
    const [inputsPara, setInputsPara] = useState<{ posicion: string; neumatico: any } | null>(null);
    const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<string>('');
    const [busqueda, setBusqueda] = useState('');

    const { data: disponibles = [] } = useQuery({
        queryKey: ['neumaticos-disponibles-con-bajas'],
        queryFn: () => obtenerNeumaticosDisponibles('desasignacion'),
        staleTime: 0,
        enabled: open,
    });

    // Catálogo de posiciones del vehículo: nunca una lista fija (moto 2, auto 5, camión 7).
    const posiciones = useMemo(
        () => obtenerConfiguracionNeumaticos(vehiculo?.cantidad_neumaticos)?.posiciones.map(p => p.codigo)
            ?? ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'],
        [vehiculo?.cantidad_neumaticos]
    );

    /** Neumático activo por posición, según lo que llegó del backend. */
    const instaladoPorPosicion = useMemo(() => {
        const mapa: Record<string, any> = {};
        for (const n of neumaticosAsignados ?? []) {
            if (n.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA') continue;
            const pos = posicionDe(n);
            if (!pos) continue;
            const previo = mapa[pos];
            if (!previo || ((n as any).ID_MOVIMIENTO ?? 0) > (previo.ID_MOVIMIENTO ?? 0)) mapa[pos] = n;
        }
        return mapa;
    }, [neumaticosAsignados]);

    const posicionesLiberadas = useMemo(
        () => posiciones.filter(pos => Boolean(marcados[pos])),
        [posiciones, marcados]
    );

    const codigosUsados = useMemo(() => {
        const mapa: Record<string, string> = {};
        Object.entries(reemplazos).forEach(([pos, r]) => { mapa[codigoDe(r.neumatico)] = pos; });
        return mapa;
    }, [reemplazos]);

    // El diagrama muestra el estado resultante: sin los que salen, con los reemplazos ya elegidos.
    const neumaticosEnDiagrama = useMemo(() => {
        const resultado: any[] = [];
        posiciones.forEach(pos => {
            const reemplazo = reemplazos[pos];
            if (reemplazo) {
                resultado.push({
                    ...reemplazo.neumatico,
                    POSICION: pos,
                    POSICION_NEU: pos,
                    REMANENTE: reemplazo.REMANENTE,
                    PRESION_AIRE: reemplazo.PRESION_AIRE,
                    TORQUE_APLICADO: reemplazo.TORQUE_APLICADO,
                    TIPO_MOVIMIENTO: 'TEMPORAL',
                });
                return;
            }
            if (marcados[pos]) return; // sale: la posición queda vacía
            const actual = instaladoPorPosicion[pos];
            if (actual) resultado.push({ ...actual, POSICION: pos, POSICION_NEU: pos });
        });
        return resultado;
    }, [posiciones, reemplazos, marcados, instaladoPorPosicion]);

    const todasCubiertas = posicionesLiberadas.length > 0
        && posicionesLiberadas.every(pos => datosCompletos(reemplazos[pos], pos));

    const paso1Completo = posicionesLiberadas.length > 0
        && accion !== ''
        && (accion !== 'BAJA DEFINITIVA' || tipoAccion !== '')
        && observacion.trim() !== '';

    // Reset total al abrir: el modal nunca arrastra estado de una sesión anterior.
    useEffect(() => {
        if (!open) return;
        setPaso(0);
        setMarcados({});
        setAccion('');
        setTipoAccion('');
        setObservacion('');
        setReemplazos({});
        setPosicionObjetivo(null);
        setInputsPara(null);
        setBusqueda('');
    }, [open]);

    useEffect(() => {
        if (!open || !placa) return;
        let cancelado = false;
        getUltimaFechaInspeccionPorPlaca(placa)
            .then((res: any) => {
                if (cancelado) return;
                setFechaUltimaInspeccion(res?.fecha_registro ?? res?.FECHA_REGISTRO ?? '');
            })
            .catch(() => { if (!cancelado) setFechaUltimaInspeccion(''); });
        return () => { cancelado = true; };
    }, [open, placa]);

    // En el paso 2 la posición a cubrir se elige sola: siempre apunta a la primera pendiente,
    // así en móvil no hay que subir hasta la lista de posiciones antes de tocar un neumático.
    useEffect(() => {
        if (paso !== 1) return;
        if (posicionObjetivo && !reemplazos[posicionObjetivo]) return;
        const siguiente = posicionesLiberadas.find(pos => !reemplazos[pos]);
        setPosicionObjetivo(siguiente ?? null);
    }, [paso, posicionObjetivo, reemplazos, posicionesLiberadas]);

    const toggleMarcado = useCallback((pos: string) => {
        const instalado = instaladoPorPosicion[pos];
        if (!instalado) return;
        setMarcados(prev => (
            prev[pos]
                ? Object.fromEntries(Object.entries(prev).filter(([clave]) => clave !== pos))
                : { ...prev, [pos]: instalado }
        ));
        // Al dejar de sacar un neumático, su reemplazo pierde sentido.
        setReemplazos(prev => (
            prev[pos] ? Object.fromEntries(Object.entries(prev).filter(([clave]) => clave !== pos)) : prev
        ));
        setPosicionObjetivo(null);
    }, [instaladoPorPosicion]);

    const handleClickPosicion = useCallback((_n: any, codigoPosicion: string) => {
        if (paso === 0) {
            toggleMarcado(codigoPosicion);
            return;
        }
        if (paso === 1 && posicionesLiberadas.includes(codigoPosicion) && !reemplazos[codigoPosicion]) {
            setPosicionObjetivo(codigoPosicion);
        }
    }, [paso, toggleMarcado, posicionesLiberadas, reemplazos]);

    const elegirNeumatico = useCallback((neumatico: any) => {
        if (!posicionObjetivo) {
            toast.warning('Primero elige la posición que vas a cubrir.');
            return;
        }
        const codigo = codigoDe(neumatico);
        const yaUsado = codigosUsados[codigo];
        if (yaUsado && yaUsado !== posicionObjetivo) {
            toast.warning(`Ese neumático ya está asignado a ${yaUsado}.`);
            return;
        }
        setInputsPara({ posicion: posicionObjetivo, neumatico });
    }, [posicionObjetivo, codigosUsados]);

    const handleInputsSubmit = useCallback((data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }) => {
        if (!inputsPara) return;
        setReemplazos(prev => ({
            ...prev,
            [inputsPara.posicion]: {
                neumatico: inputsPara.neumatico,
                REMANENTE: data.Remanente,
                PRESION_AIRE: data.PresionAire,
                TORQUE_APLICADO: data.TorqueAplicado,
                FECHA_ASIGNACION: data.FechaAsignacion,
            },
        }));
        setInputsPara(null);
    }, [inputsPara]);

    const quitarReemplazo = useCallback((pos: string) => {
        setReemplazos(prev => Object.fromEntries(Object.entries(prev).filter(([clave]) => clave !== pos)));
    }, []);

    const reiniciar = useCallback(() => {
        setPaso(0);
        setMarcados({});
        setAccion('');
        setTipoAccion('');
        setObservacion('');
        setReemplazos({});
        setPosicionObjetivo(null);
    }, []);

    const resultadosBusqueda = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return disponibles as any[];
        return (disponibles as any[]).filter(n =>
            [codigoDe(n), n.MARCA, n.DISEÑO, n.MEDIDA].filter(Boolean).some((v: any) => String(v).toLowerCase().includes(texto))
        );
    }, [disponibles, busqueda]);

    const seleccionContextValue = useMemo<SeleccionContextValue>(() => ({
        codigosUsados,
        onSeleccionar: elegirNeumatico,
        hayObjetivo: Boolean(posicionObjetivo),
    }), [codigosUsados, elegirNeumatico, posicionObjetivo]);

    const handleGuardar = async () => {
        if (observacion.trim() === '') {
            toast.warning('La observación es obligatoria. Por favor, ingresa una observación.');
            return;
        }
        if (posicionesLiberadas.length === 0) {
            toast.warning('Selecciona al menos un neumático para desasignar.');
            return;
        }
        if (!accion) {
            toast.warning('Selecciona una acción para la desasignación.');
            return;
        }
        if (accion === 'BAJA DEFINITIVA' && tipoAccion.trim() === '') {
            toast.error('No se puede desasignar: Seleccionar un tipo de baja definitiva.', { duration: 4000 });
            return;
        }
        if (!fechaUltimaInspeccion || isNaN(new Date(fechaUltimaInspeccion).getTime())) {
            toast.error('No se puede desasignar: primero debe existir una inspección válida para este neumático.', { duration: 6000 });
            return;
        }
        const faltantes = posicionesLiberadas.filter(pos => !datosCompletos(reemplazos[pos], pos));
        if (faltantes.length > 0) {
            toast.error(`Faltan los datos del reemplazo en: ${faltantes.join(', ')}.`, { duration: 6000 });
            return;
        }
        // Todos los reemplazos comparten la fecha de la última inspección; se verifica por si acaso.
        const fechas = new Set(posicionesLiberadas.map(pos => reemplazos[pos].FECHA_ASIGNACION));
        if (fechas.size > 1) {
            toast.error('Todos los neumáticos de reemplazo deben tener la misma fecha de asignación.', { duration: 6000 });
            return;
        }

        const kilometroActual = kilometraje ?? 0;

        const desasignaciones = posicionesLiberadas
            .filter(pos => /^POS\d{2}$/.test(pos) || pos === 'RES01')
            .map(pos => ({
                CODIGO: codigoDe(marcados[pos]),
                TIPO_MOVIMIENTO: accion,
                TIPO_BAJA: accion === 'BAJA DEFINITIVA' ? tipoAccion : null,
                OBSERVACION: observacion,
                KILOMETRO: kilometroActual,
                REMANENTE: marcados[pos].REMANENTE,
                COD_SUPERVISOR: vehiculo?.cod_supervisor,
                ID_OPERACION: vehiculo?.id_operacion,
                POSICION: pos,
                TRANSITO: enTransito,
                TALLER: taller,
            }));

        const asignaciones = posicionesLiberadas.map(pos => {
            const r = reemplazos[pos];
            return {
                CodigoNeumatico: codigoDe(r.neumatico),
                Remanente: r.REMANENTE,
                PresionAire: r.PRESION_AIRE,
                TorqueAplicado: r.TORQUE_APLICADO,
                Placa: placa.trim(),
                Posicion: pos,
                FechaRegistro: r.FECHA_ASIGNACION,
                FechaAsignacion: r.FECHA_ASIGNACION,
                Odometro: kilometroActual,
                COD_SUPERVISOR: vehiculo?.cod_supervisor,
                ID_OPERACION: vehiculo?.id_operacion,
                EnTransito: enTransito,
                Taller: taller,
            };
        });

        try {
            const data = await desasignarConReemplazo({ desasignaciones, asignaciones });
            toast.success(
                data?.mensaje || `${desasignaciones.length} desasignación(es) y ${asignaciones.length} asignación(es) registradas correctamente.`,
                { position: 'top-right', duration: 6000 }
            );
            onSuccess?.();
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            const mensajeError = errData?.error || errData?.detalle || error?.message || 'Error desconocido';
            const detalle = errData?.error && errData?.detalle ? ` — ${errData.detalle}` : '';
            toast.error(`${mensajeError}`, { description: detalle, duration: 6000 });
        } finally {
        }
    };

    const avanzar = () => {
        if (paso === 0) {
            if (!paso1Completo) {
                toast.warning('Marca al menos un neumático y completa acción y observación.');
                return;
            }
            setPaso(1);
            return;
        }
        if (paso === 1) {
            if (!todasCubiertas) {
                toast.warning('Cada posición liberada necesita su neumático de reemplazo.');
                return;
            }
            setPaso(2);
        }
    };

    /* ---------------------------- Render ---------------------------- */

    const panelDiagrama = (
        <Card sx={{
            // pb extra: la etiqueta del repuesto cuelga por debajo del diagrama y se recortaba.
            p: 2, pb: 5, borderRadius: 2.5, border: '1px solid #e2e8f0',
            maxWidth: { xs: '100%', sm: 420, lg: 330 }, minWidth: { xs: 0, lg: 300 },
            display: 'flex', flexDirection: 'column', alignItems: 'center',
        }} elevation={0}>
            <div className="mb-1 flex w-full items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Posiciones</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    {placa}
                </span>
            </div>
            <p className="mb-2 w-full text-xs leading-snug text-slate-400">
                {paso === 0
                    ? 'Haz clic en una rueda para marcarla como saliente.'
                    : paso === 1
                        ? 'Haz clic en una posición vacía para cubrirla.'
                        : 'Así quedará el vehículo al guardar.'}
            </p>
            <DiagramaVehiculo
                neumaticosAsignados={neumaticosEnDiagrama}
                layout="modal"
                tipoModal="mantenimiento"
                anchoMax={150}
                cantidadNeumaticos={vehiculo?.cantidad_neumaticos}
                posicionResaltada={posicionObjetivo ?? undefined}
                onPosicionClick={handleClickPosicion}
            />
        </Card>
    );

    const panelPaso1 = (
        <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                    Neumáticos instalados
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                        {posicionesLiberadas.length} marcado{posicionesLiberadas.length === 1 ? '' : 's'}
                    </span>
                </p>
                <div className="flex flex-col gap-1.5">
                    {posiciones.map(pos => (
                        <FilaInstalado
                            key={pos}
                            posicion={pos}
                            neumatico={instaladoPorPosicion[pos]}
                            marcado={Boolean(marcados[pos])}
                            bloqueado={Boolean(reemplazos[pos])}
                            onToggle={() => toggleMarcado(pos)}
                        />
                    ))}
                </div>
            </Card>

            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
                <p className="mb-2 text-sm font-semibold text-slate-700">Motivo de la salida</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="accion-desasignar">Acción</FieldLabel>
                        <Select value={accion} onValueChange={(v) => { setAccion(v); if (v !== 'BAJA DEFINITIVA') setTipoAccion(''); }}>
                            <SelectTrigger id="accion-desasignar">
                                <SelectValue placeholder="Selecciona una acción" />
                            </SelectTrigger>
                            <SelectContent>
                                {ACCIONES.map(a => <SelectItem key={a.valor} value={a.valor}>{a.etiqueta}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>

                    {accion === 'BAJA DEFINITIVA' && (
                        <Field>
                            <FieldLabel htmlFor="tipo-baja">Tipo de baja</FieldLabel>
                            <Select value={tipoAccion} onValueChange={setTipoAccion}>
                                <SelectTrigger id="tipo-baja">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_BAJA.map(t => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                </div>

                <Field className="mt-3">
                    <FieldLabel htmlFor="observacion-desasignar">Observación</FieldLabel>
                    <Textarea
                        id="observacion-desasignar"
                        placeholder="Escribe la observación..."
                        className="h-20"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                    />
                </Field>
            </Card>
        </Stack>
    );

    const listaDisponibles = (
        <>
            <div className="mb-2 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Buscar por código, marca, medida…"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="h-9 pl-8"
                    />
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    {resultadosBusqueda.length}
                </span>
            </div>
            <div className="flex flex-col gap-1.5">
                {resultadosBusqueda.slice(0, TOPE_TARJETAS).map((n: any) => (
                    <TarjetaDisponible
                        key={codigoDe(n)}
                        neumatico={n}
                        posicionUsada={codigosUsados[codigoDe(n)]}
                        habilitado={Boolean(posicionObjetivo)}
                        onElegir={() => elegirNeumatico(n)}
                    />
                ))}
                {resultadosBusqueda.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">Sin neumáticos disponibles.</p>
                )}
                {resultadosBusqueda.length > TOPE_TARJETAS && (
                    <p className="py-2 text-center text-xs text-slate-400">
                        Mostrando {TOPE_TARJETAS} de {resultadosBusqueda.length} — refina la búsqueda para ver más.
                    </p>
                )}
            </div>
        </>
    );

    const panelPaso2 = (
        <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">Posiciones a cubrir</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${todasCubiertas ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {Object.keys(reemplazos).length}/{posicionesLiberadas.length}
                    </span>
                </div>
                <div className="flex flex-col gap-1.5">
                    {posicionesLiberadas.map(pos => (
                        <TarjetaPosicionLiberada
                            key={pos}
                            posicion={pos}
                            reemplazo={reemplazos[pos]}
                            esObjetivo={posicionObjetivo === pos}
                            onElegir={() => setPosicionObjetivo(pos)}
                            onEditar={() => setInputsPara({ posicion: pos, neumatico: reemplazos[pos].neumatico })}
                            onQuitar={() => quitarReemplazo(pos)}
                        />
                    ))}
                </div>
            </Card>

            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', minWidth: 0 }} elevation={0}>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                    Neumáticos disponibles
                    {posicionObjetivo ? (
                        <span className="ml-2 text-xs font-normal text-indigo-600">
                            Eligiendo para <b>{posicionObjetivo}</b>
                        </span>
                    ) : (
                        <span className="ml-2 text-xs font-normal text-emerald-600">
                            Todas las posiciones están cubiertas.
                        </span>
                    )}
                </p>
                {esPantallaChica ? listaDisponibles : (
                    <Box sx={{ minWidth: 0 }}>
                        <SeleccionContext.Provider value={seleccionContextValue}>
                            <DataTableNeumaticos columns={columnasDisponibles} data={resultadosBusqueda} type="pagination" filters />
                        </SeleccionContext.Provider>
                    </Box>
                )}
            </Card>
        </Stack>
    );

    const panelPaso3 = (
        <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #fecaca', bgcolor: '#fef2f2' }} elevation={0}>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-700">
                    <CircleMinus className="h-4 w-4" />
                    Salen del vehículo ({posicionesLiberadas.length})
                </p>
                <div className="flex flex-col gap-1.5">
                    {posicionesLiberadas.map(pos => (
                        <div key={pos} className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-white px-3 py-2">
                            <span className="shrink-0 rounded-md bg-red-600 px-2 py-1 font-mono text-xs font-extrabold text-white">{pos}</span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-800">{codigoDe(marcados[pos])}</p>
                                <p className="truncate text-xs text-slate-500">
                                    {[marcados[pos].MARCA, marcados[pos].MEDIDA].filter(Boolean).join(' · ') || '—'}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                                {accion === 'BAJA DEFINITIVA' ? tipoAccion || 'BAJA' : accion}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }} elevation={0}>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    <Check className="h-4 w-4" />
                    Entran al vehículo ({posicionesLiberadas.length})
                </p>
                <div className="flex flex-col gap-1.5">
                    {posicionesLiberadas.map(pos => {
                        const r = reemplazos[pos];
                        return (
                            <div key={pos} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 font-mono text-xs font-extrabold text-white">{pos}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-slate-800">{codigoDe(r?.neumatico)}</p>
                                        <p className="truncate text-xs text-slate-500">
                                            {[r?.neumatico?.MARCA, r?.neumatico?.MEDIDA].filter(Boolean).join(' · ') || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{r?.REMANENTE} mm</span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{r?.PRESION_AIRE} psi</span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{r?.TORQUE_APLICADO} N·m</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Observación</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{observacion}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span><b className="text-slate-700">Kilometraje:</b> {Number(kilometraje ?? 0).toLocaleString()} km</span>
                    <span><b className="text-slate-700">Última inspección:</b> {convertToDateHuman(fechaUltimaInspeccion) || 'Sin registro'}</span>
                </div>
            </Card>
        </Stack>
    );

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                fullScreen={esPantallaChica}
                PaperProps={{ sx: { borderRadius: { xs: 0, lg: 3 }, overflow: 'hidden' } }}
            >
                <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

                <DialogTitle sx={{ pb: 1.5, pt: 2, px: { xs: 2, md: 3 }, display: 'flex', alignItems: 'flex-start', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, borderRadius: 2,
                        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)', flexShrink: 0,
                    }}>
                        <ClipboardList size={20} className="text-blue-600" />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            Desasignación de Neumáticos
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
                            <Chip label={placa} size="small" sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }} />
                            {vehiculo?.marca && (
                                <Typography variant="caption" color="text.secondary">
                                    {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' · ')}
                                </Typography>
                            )}
                        </Box>
                        <div className="mt-1.5 flex items-center gap-1">
                            {PASOS.map((etiqueta, i) => (
                                <React.Fragment key={etiqueta}>
                                    {i > 0 && <span className="h-px w-3 bg-slate-200 sm:w-5" />}
                                    <Paso indice={i} actual={paso} etiqueta={etiqueta} onClick={() => { if (i < paso) setPaso(i); }} />
                                </React.Fragment>
                            ))}
                        </div>
                    </Box>

                    <ButtonCustom variant="ghost" size="icon" onClick={onClose} title="Cerrar" aria-label="Cerrar" className="shrink-0 text-slate-400 hover:text-slate-700">
                        <X className="h-4 w-4" />
                    </ButtonCustom>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, px: { xs: 1.5, md: 3 }, bgcolor: '#f8fafc' }}>
                    <div className='mt-3'></div>
                    {paso === 0 && posicionesLiberadas.length === 0 && (
                        <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <p className="text-xs leading-snug text-blue-800">
                                Marca los neumáticos que salen del vehículo. Después tendrás que cubrir cada posición
                                liberada con un reemplazo: <b>las posiciones no pueden quedar vacías</b>.
                            </p>
                        </div>
                    )}

                    <Stack direction={{ xs: 'column-reverse', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'flex-start' }}>
                        {paso === 0 ? panelPaso1 : paso === 1 ? panelPaso2 : panelPaso3}
                        <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                            {panelDiagrama}
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{
                    px: { xs: 2, md: 3 }, py: 1.5, borderTop: '1px solid', borderColor: 'divider', gap: 1.5,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    '& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' },
                }}>
                    <ButtonCustom
                        variant="warning"
                        onClick={reiniciar}
                        disabled={posicionesLiberadas.length === 0 && accion === '' && observacion.trim() === ''}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Restaurar
                    </ButtonCustom>

                    <Box sx={{ flex: { sm: 1 } }} />

                    {paso > 0 && (
                        <ButtonCustom variant="outline" onClick={() => setPaso(paso - 1)}>
                            <ArrowLeft className="h-4 w-4" />
                            Atrás
                        </ButtonCustom>
                    )}

                    {paso < 2 ? (
                        <ButtonCustom
                            variant="primary"
                            onClick={avanzar}
                            disabled={paso === 0 ? !paso1Completo : !todasCubiertas}
                        >
                            Siguiente
                            <ArrowRight className="h-4 w-4" />
                        </ButtonCustom>
                    ) : (
                        <LoadingButton2
                            variant="primary"
                            icon={<Check />}
                            disabled={!todasCubiertas}
                            onClick={handleGuardar}
                        >
                            Registrar desasignación
                        </LoadingButton2>
                    )}
                </DialogActions>
            </Dialog>

            {inputsPara && (
                <ModalInputsNeu
                    cantidadNeumaticos={vehiculo?.cantidad_neumaticos}
                    open
                    onClose={() => setInputsPara(null)}
                    onSubmit={handleInputsSubmit}
                    initialRemanente={Number(reemplazos[inputsPara.posicion]?.REMANENTE ?? inputsPara.neumatico?.REMANENTE ?? 0)}
                    initialOdometro={typeof kilometraje === 'number' ? kilometraje : 0}
                    initialPresionAire={Number(reemplazos[inputsPara.posicion]?.PRESION_AIRE ?? 0)}
                    initialTorqueAplicado={Number(reemplazos[inputsPara.posicion]?.TORQUE_APLICADO ?? 0)}
                    initialFechaAsignacion={reemplazos[inputsPara.posicion]?.FECHA_ASIGNACION ?? ''}
                    fechaRegistroNeumatico={inputsPara.neumatico?.FECHA_REGISTRO ?? ''}
                    esRecuperado={inputsPara.neumatico?.RECUPERADO ?? false}
                    fechaRecuperado={inputsPara.neumatico?.FECHA_RECUPERADO ?? null}
                    fechaFija={fechaUltimaInspeccion}
                    position={inputsPara.posicion}
                />
            )}
        </>
    );
});

ModalDesasignar.displayName = 'ModalDesasignar';

export default ModalDesasignar;
