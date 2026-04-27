'use client';

import * as React from 'react';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

type TipoMovimiento = 'ASIGNACION' | 'INSPECCION' | 'ROTACION' | 'BAJA' | 'REUBICACION' | 'RECUPERADO';

const TIPO_CONFIG: Record<TipoMovimiento, { color: string; label: string; simbolo: string }> = {
  ASIGNACION: { color: '#22C55E', label: 'Asignación', simbolo: '↑' },
  INSPECCION: { color: '#3B82F6', label: 'Inspección', simbolo: '◎' },
  ROTACION: { color: '#8B5CF6', label: 'Rotación', simbolo: '↻' },
  BAJA: { color: '#EF4444', label: 'Baja', simbolo: '✕' },
  REUBICACION: { color: '#F59E0B', label: 'Reubicación', simbolo: '→' },
  RECUPERADO: { color: '#14B8A6', label: 'Recuperado', simbolo: '↺' },
};

interface Actividad {
  id: number;
  tipo: TipoMovimiento;
  codigo: string;
  placa: string | null;
  tiempo: string;
  esReciente: boolean;
  detalle: string | null;
  dia: 'hoy' | 'ayer' | 'antes';
}

// TODO: Reemplazar con un endpoint que devuelva los últimos N movimientos del taller actual,
//   ordenados por FECHA_REGISTRO_MOVIMIENTO DESC. Usar dayjs().fromNow() para el campo tiempo.
const MOCK_ACTIVIDAD: Actividad[] = [
  { id: 1, tipo: 'ASIGNACION', codigo: 'NEU-2891', placa: 'F5K-830', tiempo: 'hace 5 min', esReciente: true, detalle: null, dia: 'hoy' },
  { id: 2, tipo: 'INSPECCION', codigo: 'NEU-1143', placa: 'D3M-512', tiempo: 'hace 23 min', esReciente: true, detalle: '12.5 mm', dia: 'hoy' },
  { id: 3, tipo: 'BAJA', codigo: 'NEU-0341', placa: 'A1P-993', tiempo: 'hace 1 h', esReciente: true, detalle: '2.1 mm', dia: 'hoy' },
  { id: 4, tipo: 'ROTACION', codigo: 'NEU-3307', placa: 'F5K-830', tiempo: 'hace 2 h', esReciente: false, detalle: null, dia: 'hoy' },
  { id: 5, tipo: 'INSPECCION', codigo: 'NEU-4012', placa: 'E2R-654', tiempo: 'hace 3 h', esReciente: false, detalle: '8.2 mm', dia: 'hoy' },
  { id: 6, tipo: 'REUBICACION', codigo: 'NEU-1789', placa: 'C4N-778', tiempo: 'hace 4 h', esReciente: false, detalle: null, dia: 'hoy' },
  { id: 7, tipo: 'RECUPERADO', codigo: 'NEU-0567', placa: null, tiempo: 'hace 18 h', esReciente: false, detalle: null, dia: 'ayer' },
  { id: 8, tipo: 'INSPECCION', codigo: 'NEU-2156', placa: 'B7X-241', tiempo: 'hace 21 h', esReciente: false, detalle: '7.0 mm', dia: 'ayer' },
  { id: 9, tipo: 'ASIGNACION', codigo: 'NEU-3891', placa: 'D3M-512', tiempo: 'hace 23 h', esReciente: false, detalle: null, dia: 'ayer' },
  { id: 10, tipo: 'BAJA', codigo: 'NEU-1023', placa: 'G8M-441', tiempo: 'hace 2 días', esReciente: false, detalle: '1.8 mm', dia: 'antes' },
];

function getDescripcion(item: Actividad): React.ReactNode {
  const code = <span style={{ fontWeight: 700 }}>{item.codigo}</span>;
  const placa = item.placa ? <span style={{ fontWeight: 600 }}>{item.placa}</span> : null;

  switch (item.tipo) {
    case 'ASIGNACION':
      return <>{code} {placa && <>→ {placa}</>}</>;
    case 'INSPECCION':
      return <>{code}{item.detalle && <> · <span style={{ fontFamily: 'monospace' }}>{item.detalle}</span></>}{placa && <> · {placa}</>}</>;
    case 'BAJA':
      return <>{code} retirado{item.detalle && <> · <span style={{ fontFamily: 'monospace' }}>{item.detalle}</span></>}{placa && <> · {placa}</>}</>;
    case 'ROTACION':
      return <>{code} rotado{placa && <> · {placa}</>}</>;
    case 'REUBICACION':
      return <>{code} reubicado{placa && <> → {placa}</>}</>;
    case 'RECUPERADO':
      return <>{code} recuperado</>;
    default:
      return code;
  }
}

const DIA_LABEL: Record<string, string> = { hoy: 'Hoy', ayer: 'Ayer', antes: 'Días anteriores' };

function DaySeparator({ label, theme }: { label: string; theme: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 4px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: theme.palette.divider }} />
    </div>
  );
}

export function ActividadReciente(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const [hoveredId, setHoveredId] = React.useState<number | null>(null);

  const grupos = React.useMemo(() => {
    const map = new Map<string, Actividad[]>();
    for (const item of MOCK_ACTIVIDAD) {
      if (!map.has(item.dia)) map.set(item.dia, []);
      map.get(item.dia)!.push(item);
    }
    return Array.from(map.entries());
  }, []);

  const totalHoy = MOCK_ACTIVIDAD.filter(i => i.dia === 'hoy').length;

  return (
    <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-header: conteo + EN VIVO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
          {totalHoy} movimientos hoy
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="relative flex" style={{ width: 8, height: 8 }}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#22C55E' }} />
            <span className="relative inline-flex rounded-full" style={{ width: 8, height: 8, backgroundColor: '#22C55E' }} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: '0.05em' }}>EN VIVO</span>
        </div>
      </div>

      {/* Lista con scroll */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 360, paddingRight: 2, marginRight: -4 }}>
        {grupos.map(([dia, items]) => (
          <div key={dia}>
            <DaySeparator label={DIA_LABEL[dia] ?? dia} theme={theme} />
            {items.map((item) => {
              const config = TIPO_CONFIG[item.tipo];
              const isHovered = hoveredId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/padron/neumatico/${item.codigo}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/padron/neumatico/${item.codigo}`);
                    }
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px 8px 12px',
                    borderLeft: `3px solid ${config.color}`,
                    borderRadius: '0 6px 6px 0',
                    marginBottom: 3,
                    background: isHovered ? `${config.color}10` : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    outline: 'none',
                  }}
                  tabIndex={0}
                  aria-label={`Ver detalle de ${item.codigo}`}
                >
                  {/* Ícono / indicador */}
                  {item.esReciente ? (
                    <span className="relative flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22 }}>
                      <span className="animate-ping absolute inline-flex rounded-full opacity-40" style={{ width: 14, height: 14, backgroundColor: config.color }} />
                      <span
                        className="relative inline-flex items-center justify-center rounded-full text-white font-bold"
                        style={{ width: 20, height: 20, backgroundColor: config.color, fontSize: 10, flexShrink: 0 }}
                      >
                        {config.simbolo}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 22, height: 22,
                        background: `${config.color}18`,
                        border: `1.5px solid ${config.color}50`,
                        color: config.color,
                        fontSize: 10, fontWeight: 700,
                      }}
                    >
                      {config.simbolo}
                    </span>
                  )}

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: config.color,
                        background: `${config.color}15`,
                        borderRadius: 3,
                        padding: '1px 5px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {config.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: theme.palette.text.primary,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {getDescripcion(item)}
                    </div>
                  </div>

                  {/* Tiempo */}
                  <span style={{
                    fontSize: 11,
                    color: item.esReciente ? config.color : theme.palette.text.secondary,
                    fontWeight: item.esReciente ? 700 : 400,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {item.tiempo}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <Divider sx={{ mt: 1 }} />
      <div style={{ padding: '10px 0 12px', textAlign: 'center' }}>
        <button
          type="button"
          style={{
            fontSize: 12,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'inherit'
          }}
          onClick={() => router.push('/padron')}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push('/padron');
            }
          }}
          tabIndex={0}
          aria-label="Ver historial completo"
        >
          Ver historial completo →
        </button>
      </div>
    </div>
  );
}
