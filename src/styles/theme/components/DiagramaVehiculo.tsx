import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { obtenerInfoDesgaste } from '../../../utils/tire-utils';
import {
    obtenerConfiguracionNeumaticos,
    type ConfiguracionNeumaticos,
    type LadoPosicion,
    type PosicionNeumatico as PosicionCatalogo,
} from '../../../utils/configuraciones-neumaticos';
import { obtenerConfiguracionImagen, type MarcadorImagen } from '../../../utils/posiciones-imagen-vehiculo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SteeringWheel } from '@phosphor-icons/react/dist/ssr/SteeringWheel';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { CheckCircle } from 'lucide-react';

interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
    PRESION_AIRE?: string | number;
    KM_TOTAL_VIDA?: string | number;
    REMANENTE?: string | number;
}

interface DiagramaVehiculoProps {
    neumaticosAsignados: any;
    layout?: 'dashboard' | 'modal';
    tipoModal?: 'inspeccion' | 'mantenimiento';
    editable?: boolean;
    onDragEnd?: (event: any) => void;
    posicionResaltada?: string;
    /** Cantidad de neumáticos del vehículo (CANTIDAD_NEUMATICOS) — determina la configuración de posiciones a dibujar. */
    cantidadNeumaticos?: number | string | null;
    /** Códigos de posición ya guardados/completados (ej. inspección local pendiente de enviar) — se marcan con un check. */
    posicionesCompletadas?: string[];
    /** Ancho máximo del contenedor en px — sobrescribe el valor por defecto de `layout`/`tipoModal` para instancias que necesiten un diagrama más compacto. */
    anchoMax?: number;
}

// Ancho máximo por contexto — el alto se deriva del contenido (imagen o filas).
const CONTENEDOR = {
    dashboard: { width: 150 },
    modalInspeccion: { width: 150 },
    modalMantenimiento: { width: 320 },
};

const LADO_LABEL: Record<string, string> = { IZQ: 'Izq', DER: 'Der', CENTRO: '' };

// Colores del marcador por estado — mismos umbrales que utils/tire-utils.ts
const ESTADO_COLORES: Record<string, { fill: string; stroke: string }> = {
    ok: { fill: '#e6f4ea', stroke: '#2e7d32' },
    warn: { fill: '#fbf3d9', stroke: '#c9a227' },
    crit: { fill: '#fbe6e6', stroke: '#d32f2f' },
    neutral: { fill: '#eef2f6', stroke: '#94a3b8' },
};

function conAlpha(hex: string, alpha: number): string {
    const valor = hex.replace('#', '');
    const r = parseInt(valor.substring(0, 2), 16);
    const g = parseInt(valor.substring(2, 4), 16);
    const b = parseInt(valor.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function estadoDesdeDesgaste(color: string): keyof typeof ESTADO_COLORES {
    if (color === 'red') return 'crit';
    if (color === 'yellow') return 'warn';
    if (color === 'green' || color === 'lightgreen') return 'ok';
    return 'neutral';
}

/** Estado/lógica compartida entre el chip de fila (Grid) y el marcador sobre imagen. */
function useEstadoMarcador(keyPos: string, neumatico: any | undefined, posicionResaltada?: string) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: keyPos });
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION) : keyPos,
        disabled: !neumatico,
        data: neumatico ? { ...neumatico, from: keyPos } : undefined,
    });

    const infoDesgaste = neumatico
        ? obtenerInfoDesgaste({
            REMANENTE: neumatico.REMANENTE,
            REMANENTE_ORIGINAL: (neumatico as any).REMANENTE_ORIGINAL,
            ESTADO: neumatico.ESTADO,
        })
        : { porcentajeDesgaste: 0, color: 'transparent' as const, bgColor: 'transparent' };

    const esResaltada = posicionResaltada === keyPos;
    const esTemporal = (neumatico as any)?.TIPO_MOVIMIENTO === 'TEMPORAL';
    const estado = esTemporal ? 'neutral' : estadoDesdeDesgaste(infoDesgaste.color);
    const colores = ESTADO_COLORES[estado];

    const combinedRef = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        setDropRef(node);
    };

    const [kmRecorrido, setKmRecorrido] = useState<string>('—');
    useEffect(() => {
        if (!neumatico) {
            setKmRecorrido('—');
            return;
        }
        if (neumatico.KM_TOTAL_VIDA !== undefined && neumatico.KM_TOTAL_VIDA !== null) {
            setKmRecorrido(Number(neumatico.KM_TOTAL_VIDA).toLocaleString() + ' km');
        } else {
            setKmRecorrido('—');
        }
    }, [neumatico]);

    return { combinedRef, attributes, listeners, isDragging, isOver, colores, esTemporal, esResaltada, kmRecorrido };
}

function TooltipPosicion({ keyPos, esRepuesto, neumatico, kmRecorrido }: {
    keyPos: string;
    esRepuesto: boolean;
    neumatico: any | undefined;
    kmRecorrido: string;
}) {
    return (
        <TooltipContent>
            <ul>
                <li>Posición: {keyPos}{esRepuesto ? ' (repuesto)' : ''}</li>
                {neumatico && (
                    <>
                        <li>Neumático: {neumatico.CODIGO_NEU || neumatico.CODIGO}</li>
                        {neumatico.REMANENTE && <li>Remanente: {neumatico.REMANENTE}mm</li>}
                        {neumatico.ESTADO && <li>Estado: {neumatico.ESTADO}%</li>}
                        {neumatico.PRESION_AIRE && <li>Presión: {neumatico.PRESION_AIRE} psi</li>}
                        <li>Km recorrido: {kmRecorrido}</li>
                    </>
                )}
            </ul>
        </TooltipContent>
    );
}

interface FilaLayout {
    etiqueta: string;
    posiciones: PosicionCatalogo[];
}

interface DiagramaLayout {
    filas: FilaLayout[];
    chipW: number;
    chipH: number;
}

/**
 * Agrupa el catálogo de posiciones en filas por eje (+ una fila final de
 * repuestos) y calcula el tamaño de chip que mejor entra en el ancho
 * disponible según la fila más cargada (ej. eje trasero doble = 4 chips).
 * Se usa como respaldo genérico (cantidades sin imagen mapeada) y para la
 * fila de repuestos que acompaña a la silueta con imagen.
 */
function calcularLayoutFilas(posiciones: PosicionCatalogo[], contW: number, soloEtiqueta?: string): DiagramaLayout {
    const ejes: number[] = [];
    posiciones.forEach((p) => {
        if (p.eje !== null && !ejes.includes(p.eje)) ejes.push(p.eje);
    });
    ejes.sort((a, b) => a - b);

    const filas: FilaLayout[] = soloEtiqueta
        ? [{ etiqueta: soloEtiqueta, posiciones }]
        : ejes.map((eje) => ({ etiqueta: `EJE ${eje}`, posiciones: posiciones.filter((p) => p.eje === eje) }));

    const maxChipsEnFila = Math.max(1, ...filas.map((f) => f.posiciones.length));
    const labelWidth = 40;
    const rowGap = 8;
    const chipGap = 6;
    const paddingContenedor = 24; // '14px 12px' del contenedor: 12px a cada lado
    const margenSeguridad = 4;
    const disponible = contW - paddingContenedor - labelWidth - rowGap - margenSeguridad;
    const chipW = Math.max(34, Math.min(56, (disponible - (maxChipsEnFila - 1) * chipGap) / maxChipsEnFila));
    const chipH = Math.max(34, chipW * 0.86);

    return { filas, chipW, chipH };
}

const DiagramaVehiculo: React.FC<
    DiagramaVehiculoProps & {
        /** Click en una posición. `codigoPosicion` llega siempre (incluso si la posición está vacía). */
        onPosicionClick?: (neumatico: Neumatico | undefined, codigoPosicion: string) => void;
        onMantenimientoClick?: () => void;
        fromMantenimientoModal?: boolean;
        placa?: string;
    }
> = React.memo(({ neumaticosAsignados = [], layout = 'dashboard', tipoModal, onPosicionClick, placa, posicionResaltada, cantidadNeumaticos, posicionesCompletadas, anchoMax, ...props }) => {
    const contenedor = anchoMax
        ? { width: anchoMax }
        : layout === 'dashboard'
            ? CONTENEDOR.dashboard
            : tipoModal === 'mantenimiento'
                ? CONTENEDOR.modalMantenimiento
                : CONTENEDOR.modalInspeccion;

    const configuracion = obtenerConfiguracionNeumaticos(cantidadNeumaticos);
    const configuracionImagen = obtenerConfiguracionImagen(cantidadNeumaticos);

    const neumaticosFiltrados = (() => {
        if (tipoModal === 'mantenimiento') {
            return neumaticosAsignados.filter((n: any) => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
        }

        const porPosicion = new Map<string, Neumatico>();
        for (const n of neumaticosAsignados) {
            if (n.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA') continue;
            const posX = n.POSICION_NEU || n.POSICION;
            if (!posX) continue;
            if (!porPosicion.has(posX) || ((n.ID_MOVIMIENTO || 0) > (porPosicion.get(posX)?.ID_MOVIMIENTO || 0))) {
                porPosicion.set(posX, n);
            }
        }

        const porCodigo = new Map<string, Neumatico>();
        for (const n of porPosicion.values()) {
            const codigo = n.CODIGO_NEU || n.CODIGO;
            if (!codigo) continue;
            if (!porCodigo.has(codigo) || ((n.ID_MOVIMIENTO || 0) > (porCodigo.get(codigo)?.ID_MOVIMIENTO || 0))) {
                porCodigo.set(codigo, n);
            }
        }

        return Array.from(porCodigo.values());
    })();

    if (!configuracion) {
        return (
            <Box
                sx={{
                    width: contenedor.width,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    textAlign: 'center',
                    color: 'text.secondary',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    padding: 2,
                }}
            >
                <WarningCircle size={24} weight="bold" color="#c9a227" />
                <Typography variant="caption">
                    Configuración de neumáticos no soportada{cantidadNeumaticos ? ` (${cantidadNeumaticos})` : ''}.
                    Contacta a soporte.
                </Typography>
            </Box>
        );
    }

    const repuestos = configuracion.posiciones.filter((p) => p.repuesto);

    // --- Silueta con imagen real (moto/auto/camión con coordenadas medidas) ---
    if (configuracionImagen) {
        // Un repuesto con marcador propio sobre la imagen ya no va en la fila aparte.
        const codigosEnImagen = new Set(configuracionImagen.marcadores.map((m) => m.codigo));
        const repuestosSinImagen = repuestos.filter((p) => !codigosEnImagen.has(p.codigo));
        const repuestosLayout = repuestosSinImagen.length > 0 ? calcularLayoutFilas(repuestosSinImagen, contenedor.width, 'REP.') : null;
        // Las etiquetas IZQ/DER se dibujan fuera de la silueta — se les reserva margen
        // a los costados sin achicar la imagen (el ancho total del componente crece).
        const margenEtiquetaLateral = 78;
        return (
            <Box sx={{ width: '100%', maxWidth: contenedor.width + margenEtiquetaLateral * 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', pt: '26px', pb: '34px' }}>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: contenedor.width,
                        aspectRatio: `${configuracionImagen.anchoNatural} / ${configuracionImagen.altoNatural}`,
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            background: '#fff',
                        }}
                    >
                        <Box
                            component="img"
                            src={configuracionImagen.imagen}
                            alt=""
                            draggable={false}
                            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
                        />
                    </Box>
                    {configuracionImagen.marcadores.map((marcador) => {
                        const neumatico = neumaticosFiltrados.find((n: any) => (n.POSICION_NEU || n.POSICION) === marcador.codigo);
                        return (
                            <MarcadorImagenNeumatico
                                key={marcador.codigo}
                                marcador={marcador}
                                anchoNatural={configuracionImagen.anchoNatural}
                                altoNatural={configuracionImagen.altoNatural}
                                neumatico={neumatico}
                                onPosicionClick={onPosicionClick}
                                posicionResaltada={posicionResaltada}
                                completada={posicionesCompletadas?.includes(marcador.codigo) ?? false}
                            />
                        );
                    })}
                </Box>

                {repuestosLayout && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Typography
                            sx={{ width: 40, flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.4px', color: 'text.secondary', fontFamily: 'monospace' }}
                        >
                            {repuestosLayout.filas[0].etiqueta}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {repuestosLayout.filas[0].posiciones.map((p) => {
                                const neumatico = neumaticosFiltrados.find((n: any) => (n.POSICION_NEU || n.POSICION) === p.codigo);
                                return (
                                    <PosicionNeumatico
                                        key={p.codigo}
                                        keyPos={p.codigo}
                                        lado={p.lado}
                                        width={repuestosLayout.chipW}
                                        height={repuestosLayout.chipH}
                                        esRepuesto
                                        neumatico={neumatico}
                                        onPosicionClick={onPosicionClick}
                                        posicionResaltada={posicionResaltada}
                                        completada={posicionesCompletadas?.includes(p.codigo) ?? false}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Box>
        );
    }

    // --- Respaldo genérico: filas por eje (cantidades sin imagen mapeada) ---
    const diagramaCompleto = calcularLayoutFilas(configuracion.posiciones.filter((p) => !p.repuesto), contenedor.width);
    const filasConRepuesto = repuestos.length > 0
        ? [...diagramaCompleto.filas, { etiqueta: 'REP.', posiciones: repuestos }]
        : diagramaCompleto.filas;

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: contenedor.width,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                padding: '14px 12px',
                background: '#fff',
            }}
        >
            {filasConRepuesto.map((fila) => (
                <Box key={fila.etiqueta} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Typography
                        sx={{
                            width: 40,
                            flexShrink: 0,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                        }}
                    >
                        {fila.etiqueta}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {fila.posiciones.map((p) => {
                            const neumatico = neumaticosFiltrados.find((n: any) => (n.POSICION_NEU || n.POSICION) === p.codigo);
                            return (
                                <PosicionNeumatico
                                    key={p.codigo}
                                    keyPos={p.codigo}
                                    lado={p.lado}
                                    width={diagramaCompleto.chipW}
                                    height={diagramaCompleto.chipH}
                                    esRepuesto={p.repuesto}
                                    neumatico={neumatico}
                                    onPosicionClick={onPosicionClick}
                                    posicionResaltada={posicionResaltada}
                                    completada={posicionesCompletadas?.includes(p.codigo) ?? false}
                                />
                            );
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    );
});

/** Marcador de fila (layout Grid genérico / fila de repuestos bajo la imagen). */
const PosicionNeumatico: React.FC<{
    keyPos: string;
    lado: LadoPosicion | null;
    width: number;
    height: number;
    esRepuesto: boolean;
    neumatico: any | undefined;
    onPosicionClick?: (neumatico: Neumatico | undefined, codigoPosicion: string) => void;
    posicionResaltada?: string;
    completada?: boolean;
}> = React.memo(({ keyPos, lado, width, height, esRepuesto, neumatico, onPosicionClick, posicionResaltada, completada }) => {
    const { combinedRef, attributes, listeners, isDragging, isOver, colores, esTemporal, esResaltada, kmRecorrido } =
        useEstadoMarcador(keyPos, neumatico, posicionResaltada);

    const subEtiqueta = esRepuesto ? 'repuesto' : lado ? LADO_LABEL[lado] : '';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Box
                    ref={combinedRef}
                    aria-label={neumatico ? `Arrastrar neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO}` : undefined}
                    {...(neumatico ? attributes : {})}
                    {...(neumatico ? listeners : {})}
                    onClick={() => onPosicionClick && onPosicionClick(neumatico ? { ...neumatico, POSICION: keyPos } : undefined, keyPos)}
                    sx={{
                        position: 'relative',
                        width,
                        height,
                        borderRadius: '10px',
                        backgroundColor: isOver ? '#e0f7fa' : colores.fill,
                        border: `2.5px solid ${isOver ? '#388e3c' : colores.stroke}`,
                        borderStyle: esTemporal ? 'dashed' : 'solid',
                        outline: esResaltada ? '3px dashed #f59e0b' : 'none',
                        outlineOffset: '3px',
                        animation: esResaltada ? 'diagramaResaltada 1.1s ease-in-out infinite' : 'none',
                        '@keyframes diagramaResaltada': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.55 },
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontFamily: 'monospace',
                        cursor: neumatico ? 'grab' : 'pointer',
                        transition: 'background 0.15s, border 0.15s',
                        opacity: neumatico && isDragging ? 0.55 : 1,
                        userSelect: 'none',
                    }}
                >
                    <Box component="span" sx={{ fontSize: Math.max(9, width * 0.22), lineHeight: 1 }}>
                        {keyPos}
                    </Box>
                    {subEtiqueta && (
                        <Box
                            component="span"
                            sx={{
                                fontSize: Math.max(7, width * 0.15),
                                fontWeight: 500,
                                color: '#64748b',
                                lineHeight: 1,
                                textTransform: 'uppercase',
                            }}
                        >
                            {subEtiqueta}
                        </Box>
                    )}

                    {esTemporal && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: '#5fd4a0',
                                border: '1.5px solid #fff',
                            }}
                        />
                    )}

                    {completada && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                zIndex: 7,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#16a34a',
                                border: '1.5px solid #fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                pointerEvents: 'none',
                            }}
                        >
                            <CheckCircle size={11} color="#fff" strokeWidth={3} />
                        </Box>
                    )}

                    {/* Insignia fija: POS01 = posición del conductor */}
                    {keyPos === 'POS01' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -20,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                                color: '#fff',
                                borderRadius: '999px',
                                padding: '2px 7px 2px 5px',
                                // Se mantiene pequeño a propósito: es una marca de orientación, no un dato
                                // que se lea de lejos. Al escalarlo tapaba la etiqueta de la posición POS01.
                                fontSize: '0.55rem',
                                fontWeight: 700,
                                letterSpacing: '0.2px',
                                boxShadow: '0 2px 6px rgba(25,118,210,0.45)',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <SteeringWheel size={9} weight="fill" />
                            CONDUCTOR
                        </Box>
                    )}
                </Box>
            </TooltipTrigger>
            <TooltipPosicion keyPos={keyPos} esRepuesto={esRepuesto} neumatico={neumatico} kmRecorrido={kmRecorrido} />
        </Tooltip>
    );
});

/** Marcador que "sombrea" la rueda dibujada en la imagen del vehículo. */
const MarcadorImagenNeumatico: React.FC<{
    marcador: MarcadorImagen;
    anchoNatural: number;
    altoNatural: number;
    neumatico: any | undefined;
    onPosicionClick?: (neumatico: Neumatico | undefined, codigoPosicion: string) => void;
    posicionResaltada?: string;
    completada?: boolean;
}> = React.memo(({ marcador, anchoNatural, altoNatural, neumatico, onPosicionClick, posicionResaltada, completada }) => {
    const keyPos = marcador.codigo;
    const { combinedRef, attributes, listeners, isDragging, isOver, colores, esTemporal, esResaltada, kmRecorrido } =
        useEstadoMarcador(keyPos, neumatico, posicionResaltada);

    const leftPct = ((marcador.x - marcador.w / 2) / anchoNatural) * 100;
    const topPct = ((marcador.y - marcador.h / 2) / altoNatural) * 100;
    const widthPct = (marcador.w / anchoNatural) * 100;
    const heightPct = (marcador.h / altoNatural) * 100;
    // Sin override explícito, la etiqueta sigue al lado de la rueda (el repuesto va abajo).
    const posicionEtiqueta = marcador.etiqueta ?? marcador.lado ?? 'ABAJO';
    // Si el override manda a un costado una rueda que no está en ese costado (ej. la moto,
    // con ambas ruedas al centro), la etiqueta se ancla al borde del diagrama en vez de
    // pegarse al marcador: si no, quedaría encima de la silueta.
    const etiquetaAlBorde = marcador.etiqueta !== undefined && marcador.etiqueta !== marcador.lado;
    // Distancias en % del ancho del marcador (su caja es el bloque contenedor de la etiqueta).
    const hastaBordeIzq = ((leftPct + widthPct) / widthPct) * 100;
    const hastaBordeDer = ((100 - leftPct) / widthPct) * 100;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Box
                    ref={combinedRef}
                    aria-label={neumatico ? `Arrastrar neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO}` : undefined}
                    {...(neumatico ? attributes : {})}
                    {...(neumatico ? listeners : {})}
                    onClick={() => onPosicionClick && onPosicionClick(neumatico ? { ...neumatico, POSICION: keyPos } : undefined, keyPos)}
                    sx={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        borderRadius: '18%',
                        backgroundColor: isOver ? conAlpha('#388e3c', 0.55) : conAlpha(colores.stroke, 0.5),
                        border: `2.5px solid ${isOver ? '#388e3c' : colores.stroke}`,
                        borderStyle: esTemporal ? 'dashed' : 'solid',
                        outline: esResaltada ? '3px dashed #f59e0b' : 'none',
                        outlineOffset: '2px',
                        animation: esResaltada ? 'diagramaResaltadaBorde 1.1s ease-in-out infinite' : 'none',
                        '@keyframes diagramaResaltadaBorde': {
                            '0%, 100%': { outlineColor: '#f59e0b' },
                            '50%': { outlineColor: '#fde68a' },
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: neumatico ? 'grab' : 'pointer',
                        userSelect: 'none',
                        zIndex: 2,
                    }}
                >
                    <Box
                        component="span"
                        sx={{
                            fontSize: 'clamp(10px, 6cqw, 13px)',
                            fontWeight: 800,
                            color: '#fff',
                            fontFamily: 'monospace',
                            textShadow: '0 1px 2px rgba(0,0,0,0.85)',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {keyPos.startsWith('RES') ? `R${keyPos.slice(3)}` : keyPos.replace(/^POS/, '')}
                    </Box>

                    {esTemporal && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: '#5fd4a0',
                                border: '1.5px solid #fff',
                            }}
                        />
                    )}

                    {completada && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                zIndex: 7,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#16a34a',
                                border: '1.5px solid #fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                pointerEvents: 'none',
                            }}
                        >
                            <CheckCircle size={11} color="#fff" strokeWidth={3} />
                        </Box>
                    )}

                    {/* Insignia fija: POS01 = posición del conductor */}
                    {keyPos === 'POS01' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -44,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                                color: '#fff',
                                borderRadius: '999px',
                                padding: '2px 7px 2px 5px',
                                fontSize: '0.60rem',
                                fontWeight: 700,
                                letterSpacing: '0.2px',
                                boxShadow: '0 2px 6px rgba(25,118,210,0.45)',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <SteeringWheel size={14} weight="fill" />
                            CONDUCTOR
                        </Box>
                    )}

                    {/* Etiqueta fija de remanente/km — visible siempre (los supervisores capturan el diagrama en foto, no pasan el mouse).
                        IZQ/DER van a los costados (fuera de la silueta, para no tapar la rueda/pilar); el repuesto se queda abajo. */}
                    {neumatico && (
                        <Box
                            sx={{
                                position: 'absolute',
                                ...(posicionEtiqueta === 'IZQ'
                                    ? { top: '50%', right: etiquetaAlBorde ? `${hastaBordeIzq}%` : '100%', transform: 'translate(-6px, -50%)' }
                                    : posicionEtiqueta === 'DER'
                                        ? { top: '50%', left: etiquetaAlBorde ? `${hastaBordeDer}%` : '100%', transform: 'translate(6px, -50%)' }
                                        : posicionEtiqueta === 'ARRIBA'
                                            ? { bottom: '100%', left: '50%', transform: 'translate(-50%, -5px)' }
                                            : { top: '100%', left: '50%', transform: 'translate(-50%, 5px)' }),
                                zIndex: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                background: 'linear-gradient(135deg, #f8fafc, #eef2f6)',
                                borderRadius: '7px',
                                padding: '4px 7px',
                                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
                                border: `1px solid ${conAlpha(colores.stroke, 0.85)}`,
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                            }}
                        >
                            <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.2px' }}>
                                {neumatico.CODIGO_NEU || neumatico.CODIGO || '—'}
                            </Box>
                            <Box component="span" sx={{ width: '100%', height: '1px', background: 'rgba(15, 23, 42, 0.12)' }} />
                            <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.2px' }}>
                                {neumatico.REMANENTE ?? '—'}mm
                            </Box>
                            <Box component="span" sx={{ width: '100%', height: '1px', background: 'rgba(15, 23, 42, 0.12)' }} />
                            <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', fontFamily: 'monospace' }}>
                                {kmRecorrido}
                            </Box>
                        </Box>
                    )}
                </Box>
            </TooltipTrigger>
            <TooltipPosicion keyPos={keyPos} esRepuesto={marcador.repuesto ?? false} neumatico={neumatico} kmRecorrido={kmRecorrido} />
        </Tooltip>
    );
});

export default DiagramaVehiculo;
