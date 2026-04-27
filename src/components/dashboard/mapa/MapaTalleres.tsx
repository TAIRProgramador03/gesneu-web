'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';

interface Taller {
  id: number;
  nombre: string;
  ciudad: string;
  zona: string;
  lat: number;
  lng: number;
  total: number;
  asignados: number;
  disponibles: number;
  baja: number;
}

// TODO: Reemplazar con endpoint que devuelva talleres con sus conteos y coordenadas.
const MOCK_TALLERES: Taller[] = [
  { id: 1, nombre: 'TAIR Lima Norte', ciudad: 'Lima', zona: 'Lima Metropolitana', lat: -11.985, lng: -77.060, total: 184, asignados: 142, disponibles: 38, baja: 4 },
  { id: 2, nombre: 'TAIR Lima Sur', ciudad: 'Lima', zona: 'Lima Metropolitana', lat: -12.200, lng: -76.990, total: 127, asignados: 98, disponibles: 24, baja: 5 },
  { id: 3, nombre: 'TAIR Arequipa', ciudad: 'Arequipa', zona: 'Sur', lat: -16.409, lng: -71.537, total: 96, asignados: 71, disponibles: 21, baja: 4 },
  { id: 4, nombre: 'TAIR Trujillo', ciudad: 'Trujillo', zona: 'Norte', lat: -8.112, lng: -79.029, total: 73, asignados: 55, disponibles: 15, baja: 3 },
  { id: 5, nombre: 'TAIR Cusco', ciudad: 'Cusco', zona: 'Sur Andino', lat: -13.532, lng: -71.967, total: 45, asignados: 34, disponibles: 9, baja: 2 },
  { id: 6, nombre: 'TAIR Piura', ciudad: 'Piura', zona: 'Norte', lat: -5.194, lng: -80.633, total: 58, asignados: 44, disponibles: 12, baja: 2 },
];

const TOTAL_FLOTA = MOCK_TALLERES.reduce((s, t) => s + t.total, 0);
const TOTAL_ASIG = MOCK_TALLERES.reduce((s, t) => s + t.asignados, 0);
const TOTAL_DISP = MOCK_TALLERES.reduce((s, t) => s + t.disponibles, 0);
const TOTAL_BAJA = MOCK_TALLERES.reduce((s, t) => s + t.baja, 0);
const MAX_TOTAL = Math.max(...MOCK_TALLERES.map(t => t.total));
const MIN_TOTAL = Math.min(...MOCK_TALLERES.map(t => t.total));
const MAYOR = MOCK_TALLERES.reduce((a, b) => b.total > a.total ? b : a);
const PROMEDIO = Math.round(TOTAL_FLOTA / MOCK_TALLERES.length);

function getColor(t: Taller): string {
  const pct = t.disponibles / t.total;
  if (pct >= 0.20) return '#22C55E';
  if (pct >= 0.12) return '#F59E0B';
  return '#EF4444';
}

function getRadius(total: number): number {
  return 14 + ((total - MIN_TOTAL) / (MAX_TOTAL - MIN_TOTAL)) * 18;
}

// Vuela al taller seleccionado (o vuelve a la vista completa de Perú)
function MapFlyTo({ taller }: { taller: Taller | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (taller) {
      map.flyTo([taller.lat, taller.lng], 10, { animate: true, duration: 1.2 });
    } else {
      map.flyTo([-9.5, -75.5], 6, { animate: true, duration: 1.0 });
    }

  }, [taller?.id]);
  return null;
}

export default function MapaTalleres() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPri = isDark ? '#f1f5f9' : '#1e293b';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const trackBg = isDark ? '#334155' : '#e2e8f0';

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const selectedTaller = MOCK_TALLERES.find(t => t.id === selectedId) ?? null;

  function handleSelect(id: number) {
    setSelectedId(prev => prev === id ? null : id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

      {/* ── 4 Mini KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flexShrink: 0 }}>
        {([
          { label: 'Total flota', value: TOTAL_FLOTA, sub: 'neumáticos', color: '#3B82F6' },
          { label: 'Talleres activos', value: MOCK_TALLERES.length, sub: 'en todo el Perú', color: '#8B5CF6' },
          { label: 'Mayor taller', value: MAYOR.total, sub: MAYOR.nombre, color: '#F59E0B' },
          { label: 'Promedio por taller', value: PROMEDIO, sub: 'neumáticos / taller', color: '#22C55E' },
        ] as { label: string; value: number | string; sub: string; color: string }[]).map(({ label, value, sub, color }) => (
          <div
            key={label}
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderTop: `3px solid ${color}`,
              borderRadius: 10,
              padding: '12px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow sutil */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: `${color}0C`, pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: textSec, letterSpacing: '0.07em', marginBottom: 4 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textPri, lineHeight: 1, marginBottom: 3 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Mapa + Panel ── */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* Mapa */}
        <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${border}` }}>
          <MapContainer
            center={[-9.5, -75.5]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url={tileUrl}
            />

            <MapFlyTo taller={selectedTaller} />

            {MOCK_TALLERES.map((taller) => {
              const color = getColor(taller);
              const radius = getRadius(taller.total);
              const selected = selectedId === taller.id;
              return (
                <CircleMarker
                  key={taller.id}
                  center={[taller.lat, taller.lng]}
                  radius={selected ? radius + 5 : radius}
                  pathOptions={{
                    fillColor: color,
                    color: selected ? '#fff' : color,
                    weight: selected ? 3 : 1.5,
                    fillOpacity: selected ? 0.95 : 0.82,
                    opacity: 1,
                  }}
                  eventHandlers={{ click: () => handleSelect(taller.id) }}
                >
                  <Tooltip direction="top" offset={[0, -(radius + 4)]}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{taller.nombre}</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{taller.total} neumáticos</span>
                  </Tooltip>

                  <Popup minWidth={200}>
                    <div style={{ fontFamily: 'inherit' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: '#1e293b' }}>
                        {taller.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                        {taller.ciudad} · Zona {taller.zona}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4, columnGap: 16, fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>Total flota</span>
                        <span style={{ fontWeight: 700, textAlign: 'right' }}>{taller.total}</span>
                        <span style={{ color: '#3B82F6' }}>Asignados</span>
                        <span style={{ fontWeight: 600, color: '#3B82F6', textAlign: 'right' }}>{taller.asignados}</span>
                        <span style={{ color: '#22C55E' }}>Disponibles</span>
                        <span style={{ fontWeight: 600, color: '#22C55E', textAlign: 'right' }}>{taller.disponibles}</span>
                        <span style={{ color: '#EF4444' }}>Baja definitiva</span>
                        <span style={{ fontWeight: 600, color: '#EF4444', textAlign: 'right' }}>{taller.baja}</span>
                      </div>
                      <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(taller.asignados / taller.total) * 100}%`, background: '#3B82F6' }} />
                        <div style={{ width: `${(taller.disponibles / taller.total) * 100}%`, background: '#22C55E' }} />
                        <div style={{ width: `${(taller.baja / taller.total) * 100}%`, background: '#EF4444' }} />
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Panel lateral */}
        <div style={{
          width: 272, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 8,
          background: cardBg, border: `1px solid ${border}`,
          borderRadius: 12, padding: 16, overflowY: 'auto',
        }}>

          {/* Resumen nacional */}
          <div style={{ fontSize: 11, fontWeight: 700, color: textSec, letterSpacing: '0.07em', marginBottom: 2 }}>
            RESUMEN NACIONAL
          </div>
          <div style={{ height: 7, borderRadius: 3, background: trackBg, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(TOTAL_ASIG / TOTAL_FLOTA) * 100}%`, background: '#3B82F6' }} />
            <div style={{ width: `${(TOTAL_DISP / TOTAL_FLOTA) * 100}%`, background: '#22C55E' }} />
            <div style={{ width: `${(TOTAL_BAJA / TOTAL_FLOTA) * 100}%`, background: '#EF4444' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            {([
              { color: '#3B82F6', label: 'Asig.', value: TOTAL_ASIG },
              { color: '#22C55E', label: 'Disp.', value: TOTAL_DISP },
              { color: '#EF4444', label: 'Baja', value: TOTAL_BAJA },
            ] as { color: string; label: string; value: number }[]).map(({ color, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: textSec }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: textPri }}>{value}</span>
              </div>
            ))}
          </div>

          <Divider sx={{ my: 0.5 }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: textSec, letterSpacing: '0.07em', marginBottom: 2 }}>
            TALLERES — click para hacer zoom
          </div>

          {MOCK_TALLERES.map((taller) => {
            const color = getColor(taller);
            const selected = selectedId === taller.id;
            return (
              <div
                key={taller.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(taller.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(taller.id);
                  }
                }}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${selected ? color : border}`,
                  background: selected ? `${color}12` : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {taller.nombre}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: textPri, flexShrink: 0, marginLeft: 6 }}>
                    {taller.total}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: textSec, marginBottom: 6 }}>
                  {taller.ciudad} · {taller.zona}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: trackBg, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(taller.asignados / taller.total) * 100}%`, background: '#3B82F6' }} />
                  <div style={{ width: `${(taller.disponibles / taller.total) * 100}%`, background: '#22C55E' }} />
                  <div style={{ width: `${(taller.baja / taller.total) * 100}%`, background: '#EF4444' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#3B82F6' }}>{taller.asignados} asig.</span>
                  <span style={{ fontSize: 10, color: '#22C55E' }}>{taller.disponibles} disp.</span>
                  <span style={{ fontSize: 10, color: '#EF4444' }}>{taller.baja} baja</span>
                </div>
              </div>
            );
          })}

          <Divider sx={{ my: 0.5 }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: textSec, letterSpacing: '0.07em', marginBottom: 4 }}>
            LEYENDA — tamaño = flota total
          </div>
          {([
            { color: '#22C55E', label: '≥ 20% disponibles — Bueno' },
            { color: '#F59E0B', label: '12–19% disponibles — Regular' },
            { color: '#EF4444', label: '< 12% disponibles — Crítico' },
          ] as { color: string; label: string }[]).map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: textSec }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
