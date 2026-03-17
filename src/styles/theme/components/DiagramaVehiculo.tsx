import * as React from 'react';
import Box from '@mui/material/Box';
import { useDroppable, useDraggable } from '@dnd-kit/core';
// import ModalMantenimientoNeu from '../../../components/dashboard/integrations/modal-mantenimientoNeu'; // Eliminado
import ModalInpeccionNeu from '../../../components/dashboard/integrations/modal-inspeccion-neu';
import { useEffect, useState } from 'react';
import { obtenerUltimosMovimientosPorCodigo } from '../../../api/Neumaticos';
import { calcularKmRecorrido, MovimientoNeumatico } from './calculo-km-recorrido';
import { obtenerInfoDesgaste } from '../../../utils/tire-utils';
import axios from 'axios';
import { Customer } from '@/components/dashboard/customer/customers-table';

interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
    PRESION_AIRE?: string | number;
    KM_ULTIMA_INSPECCION?: string | number;
    KM_ASIGNACION?: string | number;
    KM_TOTAL_VIDA?: string | number;
    REMANENTE?: string | number;
}

interface DiagramaVehiculoProps {
    neumaticosAsignados: any;
    layout?: 'dashboard' | 'modal';
    tipoModal?: 'inspeccion' | 'mantenimiento'; // NUEVO: para distinguir el modal
    editable?: boolean; // <-- Agregado para permitir la prop editable
    onDragEnd?: (event: any) => void; // <-- Agregado para permitir la prop onDragEnd
    posicionResaltada?: string; // <-- Agregado para resaltar posiciones
}

// Layouts diferenciados para dashboard, modalInspeccion y modalMantenimiento
const posiciones = {
    dashboard: [
        { key: 'POS01', top: '38px', left: '333px' },
        { key: 'POS02', top: '38px', left: '228px' },
        { key: 'POS03', top: '211px', left: '333px' },
        { key: 'POS04', top: '211px', left: '228px' },
        { key: 'RES01', top: '284px', left: '264px' },
    ],
    modalInspeccion: [
        { key: 'POS01', top: '124px', left: '145px' },
        { key: 'POS02', top: '124px', left: '45px' },
        { key: 'POS03', top: '288px', left: '145px' },
        { key: 'POS04', top: '288px', left: '45px' },
        { key: 'RES01', top: '359px', left: '79px' },
    ],
    modalMantenimiento: [
        { key: 'POS01', top: '115px', left: '268px' },
        { key: 'POS02', top: '115px', left: '168px' },
        { key: 'POS03', top: '279px', left: '268px' },
        { key: 'POS04', top: '279px', left: '168px' },
        { key: 'RES01', top: '348px', left: '202px' },
    ],
};

const DiagramaVehiculo: React.FC<DiagramaVehiculoProps & { onPosicionClick?: (neumatico: Neumatico | undefined) => void; onMantenimientoClick?: () => void; fromMantenimientoModal?: boolean; placa?: string; }> = React.memo(({ neumaticosAsignados = [], layout = 'dashboard', tipoModal, onPosicionClick, fromMantenimientoModal, placa, posicionResaltada, ...props }) => {
    // Selección de layout según tipoModal
    let pos;
    if (layout === 'modal') {
        if (tipoModal === 'mantenimiento') {
            pos = posiciones.modalMantenimiento;
        } else {
            pos = posiciones.modalInspeccion;
        }
    } else {
        pos = posiciones.dashboard;
    }
    // Eliminar useMemo para evitar cache y forzar procesamiento inmediato
    const neumaticosFiltrados = (() => {
        // En el modal reubicar, usar directamente los datos sincronizados
        if (tipoModal === 'mantenimiento') {

            // PROCESAMIENTO DIRECTO - datos ya están sincronizados
            const result = neumaticosAsignados.filter((n: any) => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA');
            return result;
        }

        // Para otros casos, mantener el filtrado original
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

        const result = Array.from(porCodigo.values());
        return result;
    })();

    // --- INICIO INTEGRACIÓN MODALES ---
    const [openMantenimiento, setOpenMantenimiento] = React.useState(false);
    const [openInspeccion, setOpenInspeccion] = React.useState(false);

    // Definir placa y neumaticosAsignados para los modales
    // Usar solo la prop 'placa' (no buscar en los neumáticos)
    const placaModal = placa || '';
    // Usar el array original de neumáticos asignados, asegurando que CODIGO nunca sea undefined
    const neumaticosAsignadosModal = neumaticosAsignados.map((n: any) => ({
        ...n,
        CODIGO: n.CODIGO ?? '', // Forzar string
    }));

    // Puedes ajustar cuándo abrir cada modal según tu lógica
    // Por ejemplo, podrías abrir el modal de mantenimiento con un botón o acción específica
    // Aquí solo se muestra la integración básica

    return (
        <>
            {/* Renderizado del diagrama */}
            <Box
                sx={
                    layout === 'dashboard'
                        ? { position: 'relative', width: '262px', height: '365px' }
                        : { position: 'relative', width: '370px', height: '430px' }
                }
            >
                {/* Imagen base diferente según tipoModal */}
                <img
                    src={
                        tipoModal === 'mantenimiento'
                            ? '/assets/car-diagram.png'
                            : '/assets/car-diagram.png'
                    }
                    alt="Base"
                    style={
                        layout === 'dashboard'
                            ? {
                                width: '468px',
                                height: '400px',
                                objectFit: 'contain',
                                position: 'absolute',
                                top: '-30px',
                                left: '162px',
                                zIndex: 1,
                                pointerEvents: 'none',
                            }
                            : tipoModal === 'mantenimiento'
                                ? {
                                    width: '260px',
                                    height: '380px',
                                    objectFit: 'contain',
                                    position: 'absolute',
                                    top: '50px',
                                    left: '100px',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }
                                : {
                                    width: '250px',
                                    height: '380px',
                                    objectFit: 'contain',
                                    position: 'absolute',
                                    top: '60px',
                                    left: '-17px',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }
                    }
                />

                {pos.map(({ key, top, left }) => {
                    const neumatico = neumaticosFiltrados.find((n: any) => (n.POSICION_NEU || n.POSICION) === key);
                    if (neumatico) {
                        console.log(`[DiagramaVehiculo] 🎯 Renderizando ${key}:`, neumatico.CODIGO_NEU || neumatico.CODIGO);
                    } else {
                        console.log(`[DiagramaVehiculo] ❌ Posición ${key} vacía`);
                    }

                    return (
                        <PosicionNeumatico
                            key={`${key}-${neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : 'empty'}-${Date.now()}`}
                            keyPos={key}
                            top={top}
                            left={left}
                            neumatico={neumatico}
                            layout={layout}
                            tipoModal={tipoModal}
                            onPosicionClick={onPosicionClick}
                            posicionResaltada={posicionResaltada}
                            placa={placa}
                        />
                    );
                })}
            </Box>
        </>
    );
});

// Nuevo componente hijo para cada posición
const PosicionNeumatico: React.FC<{
    keyPos: string;
    top: string;
    left: string;
    neumatico: any | undefined;
    layout: 'dashboard' | 'modal';
    tipoModal?: 'inspeccion' | 'mantenimiento';
    onPosicionClick?: (neumatico: Neumatico | undefined) => void;
    posicionResaltada?: string;
    placa?: string | undefined
}> = React.memo(({ keyPos, top, left, neumatico, layout, tipoModal, onPosicionClick, posicionResaltada, placa = '' }) => {
    // Drop target para cada posición
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: keyPos });
    // Siempre ejecuta el hook, pero solo activa el draggable si hay neumático
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION) : keyPos,
        disabled: !neumatico,
        data: neumatico ? { ...neumatico, from: keyPos } : undefined,
    });
    // Usar función centralizada para obtener información de desgaste
    const infoDesgaste = neumatico ? obtenerInfoDesgaste({
        REMANENTE: neumatico.REMANENTE,
        REMANENTE_ORIGINAL: (neumatico as any).REMANENTE_ORIGINAL,
        ESTADO: neumatico.ESTADO
    }) : { porcentajeDesgaste: 0, color: 'transparent' as const, bgColor: 'transparent' };

    // Log para debugging - solo para el primer neumático para no saturar
    if (neumatico && keyPos === 'POS01') {
        console.log(`[DiagramaVehiculo] POS01 - ESTADO recibido: ${neumatico.ESTADO} (tipo: ${typeof neumatico.ESTADO})`);
        console.log(`[DiagramaVehiculo] POS01 - REMANENTE: ${neumatico.REMANENTE}, REMANENTE_ORIGINAL: ${(neumatico as any).REMANENTE_ORIGINAL || 'NULL'}`);
        console.log(`[DiagramaVehiculo] POS01 - infoDesgaste: porcentaje=${infoDesgaste.porcentajeDesgaste}, color=${infoDesgaste.color}, bgColor=${infoDesgaste.bgColor}`);
    }

    // Determinar si esta posición debe resaltarse
    const esResaltada = posicionResaltada === keyPos;

    let bgColor = 'transparent';
    if (esResaltada) {
        bgColor = '#ffeb3b'; // Amarillo brillante para resaltar
    } else if ((neumatico as any)?.TIPO_MOVIMIENTO === 'TEMPORAL') {
        bgColor = '#00ACC1'; // Turquesa: neumático recién asignado, sin inspección aún
    } else {
        bgColor = infoDesgaste.bgColor;
    }
    // Unir refs de draggable y droppable
    const combinedRef = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        setDropRef(node);
    };
    // Estado para km recorrido
    const [kmRecorrido, setKmRecorrido] = useState<string>('—');
    // Refrescar kmRecorrido cuando cambien los datos del neumático (props)
    useEffect(() => {
        fetchKm();

    }, [neumatico?.CODIGO, neumatico?.CODIGO_NEU]);
    useEffect(() => {
        fetchKm();

    }, [JSON.stringify(neumatico)]);
    useEffect(() => {
        const refrescarKm = () => {
            fetchKm();
        };
        window.addEventListener('actualizar-diagrama-vehiculo', refrescarKm);
        return () => {
            window.removeEventListener('actualizar-diagrama-vehiculo', refrescarKm);
        };
    }, [neumatico?.CODIGO, neumatico?.CODIGO_NEU]);



    // Nueva función para obtener el historial y calcular km recorrido
    const fetchKm = React.useCallback(async () => {
        if (!neumatico) {
            setKmRecorrido('—');
            return;
        }

        // PRIORIDAD: Usar KM_TOTAL_VIDA que viene directo de NEU_CABECERA
        if (neumatico.KM_TOTAL_VIDA !== undefined && neumatico.KM_TOTAL_VIDA !== null) {
            const val = Number(neumatico.KM_TOTAL_VIDA);
            setKmRecorrido(val.toLocaleString() + ' km');
            // Si queremos que compruebe historial si es 0, podriamos hacer val > 0 check.
            // Pero el usuario quiere ver lo que hay en BD. Si BD es 0, mostramos 0.
            return;
        }

        const codigo = neumatico.CODIGO || neumatico.CODIGO_NEU;
        if (!codigo) {
            setKmRecorrido('—');
            return;
        }
        // try {
        //     // Usar el endpoint correcto para historial completo
        //     const { obtenerHistorialMovimientosPorCodigo } = await import('../../../api/Neumaticos');
        //     const historial = await obtenerHistorialMovimientosPorCodigo(codigo);
        //     if (!Array.isArray(historial) || historial.length === 0) {
        //         setKmRecorrido('—');
        //         return;
        //     }
        //     // Log de depuración para ver los datos reales
        //     //console.log('[DEBUG calculoKmRecorrido] keyPos:', keyPos);
        //     //console.log('[DEBUG calculoKmRecorrido] historial:', historial);
        //     // Usar la función centralizada para calcular el km recorrido acumulado
        //     const kmTotal = calcularKmRecorrido(historial as MovimientoNeumatico[], keyPos);
        //     //console.log('[DEBUG calculoKmRecorrido] resultado kmTotal:', kmTotal);
        //     setKmRecorrido(kmTotal > 0 ? kmTotal.toLocaleString() + ' km' : '0 km');
        // } catch (e: any) {
        //     setKmRecorrido('—');
        // }
    }, [neumatico]);
    // Estilos personalizados para REPUESTO
    const isReserva = keyPos === 'RES01';
    const boxStyles = isReserva
        ? {
            position: 'absolute',
            top,
            left,
            zIndex: 2,
            width: '60px',
            height: '29px',
            borderRadius: '6px',
            backgroundColor: isOver ? '#e0f7fa' : bgColor,
            border: isOver ? '2px solid #388e3c' : esResaltada ? '3px solid #ff5722' : '2px solid transparent',
            animation: esResaltada ? 'pulso 1s infinite' : 'none',
            '@keyframes pulso': {
                '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 87, 34, 0.7)' },
                '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(255, 87, 34, 0)' },
                '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 87, 34, 0)' },
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#222',
            fontSize: 18,
            cursor: neumatico ? 'grab' : 'pointer',
            transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
            boxShadow: neumatico && isDragging ? `0 0 8px 2px ${bgColor}` : neumatico ? `0 0 8px 2px ${bgColor}` : 'none',
            opacity: neumatico && isDragging ? 0.5 : 1,
            userSelect: 'none',
            outline: neumatico && isDragging ? '2px solid #388e3c' : 'none',
        }
        : {
            position: 'absolute',
            top,
            left,
            zIndex: 2,
            width: layout === 'modal' ? '25px' : '26px',
            height: layout === 'modal' ? '58px' : '61px',
            borderRadius: '15px',
            backgroundColor: isOver ? '#e0f7fa' : bgColor,
            border: isOver ? '2px solid #388e3c' : esResaltada ? '3px solid #ff5722' : '2px solid transparent',
            animation: esResaltada ? 'pulso 1s infinite' : 'none',
            '@keyframes pulso': {
                '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 87, 34, 0.7)' },
                '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(255, 87, 34, 0)' },
                '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 87, 34, 0)' },
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#222',
            fontSize: 18,
            cursor: neumatico ? 'grab' : 'pointer',
            transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
            boxShadow: neumatico && isDragging ? `0 0 8px 2px ${bgColor}` : neumatico ? `0 0 8px 2px ${bgColor}` : 'none',
            opacity: neumatico && isDragging ? 0.5 : 1,
            userSelect: 'none',
            outline: neumatico && isDragging ? '2px solid #388e3c' : 'none',
        };
    return (
        <>
            <Box
                ref={combinedRef}
                key={keyPos}
                aria-label={neumatico ? `Arrastrar neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO}` : undefined}
                {...attributes}
                {...(neumatico ? listeners : {})}
                sx={boxStyles}
                onClick={() => onPosicionClick && onPosicionClick(neumatico ? { ...neumatico, POSICION: keyPos } : undefined)}
                title={keyPos + (neumatico ? ` - ${neumatico.CODIGO_NEU || neumatico.CODIGO || ''}` : '')}
            >
                <span style={{ fontWeight: 'bold', fontSize: isReserva ? '15px' : '13px', color: `#fff`, pointerEvents: 'none' }}>
                    {isReserva ? 'RES' : keyPos.replace('POS', '')}
                </span>
            </Box>
            {/* Mostrar presión de aire en dashboard y en modal de mantenimiento */}
            {(layout === 'dashboard' || (layout === 'modal' && tipoModal === 'mantenimiento')) && neumatico && neumatico.PRESION_AIRE !== undefined && neumatico.PRESION_AIRE !== null && neumatico.PRESION_AIRE !== '' && (
                keyPos === 'RES01' ? (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `calc(${top} + 30px)`,
                            left: `calc(${left} + -13px)`,
                            zIndex: 3,
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            pointerEvents: 'none',
                            minWidth: '85px',
                            textAlign: 'center',
                            border: '1px solid #b9b9b9',
                        }}
                    >
                        {` ${neumatico.PRESION_AIRE} psi`}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `calc(${top} + 5px)`,
                            left:
                                keyPos === 'POS01' || keyPos === 'POS03'
                                    ? `calc(${left} + 30px)` // Derecha para POS01 y POS03
                                    : `calc(${left} - 90px)`, // Izquierda para POS02 y POS04
                            zIndex: 3,
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            pointerEvents: 'none',
                            minWidth: '85px',
                            textAlign: 'center',
                            border: '1px solid #b9b9b9',
                        }}
                    >
                        {` ${neumatico.PRESION_AIRE} psi`}
                    </Box>
                )
            )}
            {layout === 'dashboard' && (
                <>
                    {/* Cuadro para POS01, POS02, POS03, POS04 */}
                    {(keyPos === 'POS01' || keyPos === 'POS02' || keyPos === 'POS03' || keyPos === 'POS04') && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: keyPos === 'POS01' ? '75px'
                                    : keyPos === 'POS02' ? '75px'
                                        : keyPos === 'POS03' ? '250px'
                                            : '250px',
                                left: keyPos === 'POS01' || keyPos === 'POS03' ? '385px' : '1px',
                                width: '200px',
                                minHeight: '90px',
                                border: '1px solid #3030302e',
                                borderRadius: '20px',
                                background: '#fdfdfd',
                                color: '#d32f2f',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '10px 12px',
                                zIndex: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                                {keyPos}: {neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : '—'}
                            </span>
                            <span style={{ color: '#222', fontWeight: 500, marginTop: 4 }}>
                                Km recorrido: {kmRecorrido}
                            </span>
                        </Box>
                    )}
                    {/* Cuadro para REPUESTO */}
                    {keyPos === 'RES01' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '340px',
                                left: '195px',
                                width: '190px',
                                minHeight: '90px',
                                border: '1px solid #3030302e',
                                borderRadius: '20px',
                                background: '#fdfdfd',
                                color: '#d32f2f',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '10px 12px',
                                zIndex: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                                {keyPos}: {neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : '—'}
                            </span>
                            <span style={{ color: '#222', fontWeight: 500, marginTop: 4 }}>
                                Km recorrido: {kmRecorrido}
                            </span>
                        </Box>
                    )}
                </>
            )}
        </>
    );
});

export default DiagramaVehiculo;
