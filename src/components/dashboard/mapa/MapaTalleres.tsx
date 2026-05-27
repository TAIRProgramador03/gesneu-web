'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import { useQuery } from '@tanstack/react-query';
import { obtenerTalleresConNeumaticos, TallerConNeumaticos } from '@/api/Neumaticos';

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

const MOCK_UBICACIONES: { [key: string]: number[] } = {
  'TICLIO': [-11.6108641, -76.1982964],
  'ANDAYCHAGUA': [-11.7428773, -76.0150865],
  'COLQUIJIRCA': [-10.7768825, -76.3024666],
  'TOQUEPALA': [-17.287097, -70.6665241],
  'ANTAMINA': [-9.542866, -77.050220],
  'TALARA': [-4.586442, -81.255584],
  'SAN JOSE': [-16.5674543, -71.8301575],
  'RAURA': [-10.456336, -76.7352098],
  'HUALLANCA': [-9.8976421, -76.9403488],
  'PUCAMARCA': [-17.812127, -69.805307],
  'CUAJONE': [-17.069073, -70.780786],
  'SAN CRISTOBAL': [-11.7279782, -76.0717685],
  'HUANCAVELICA': [-12.563888, -74.392081],
  'CHUNGAR': [-11.0274750, -76.4311920],
  // *
  'TAIR LIMA': [-12.0464, -77.0428],
  'ILO': [-17.6433, -71.3411],
  'MARCONA': [-15.1764, -75.1219],
  'TAIR AREQUIPA': [-16.4090, -71.5375],
};

function getColor(t: TallerConNeumaticos): string {
  const pct = t.NEUMATICOS_DISPONIBLES / t.CANTIDAD_NEUMATICOS;
  if (pct >= 0.20) return '#22C55E';
  if (pct >= 0.12) return '#F59E0B';
  return '#EF4444';
}

function getRadius(total: number, min: number, max: number): number {
  if (max === min) return 9;
  return 8 + ((total - min) / (max - min)) * 12;
}

// Vuela al taller seleccionado (o vuelve a la vista completa de Perú)
function MapFlyTo({ taller }: { taller: TallerConNeumaticos | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (taller) {
      map.flyTo((MOCK_UBICACIONES[taller.TALLER] || [-9.5, -75.5]) as [number, number], 8, { animate: true, duration: 1.2 });
    } else {
      map.flyTo([-9.5, -75.5], 6, { animate: true, duration: 1.0 });
    }

  }, [taller?.ID]);
  return null;
}

export const MapaTalleres = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data: talleresConNeumaticos = [] } = useQuery({
    queryKey: ['talleres-con-neumaticos'],
    queryFn: obtenerTalleresConNeumaticos
  })

  const TOTAL_FLOTA = talleresConNeumaticos.reduce((s, t) => s + t.CANTIDAD_NEUMATICOS, 0);
  const MIN_NEU = talleresConNeumaticos.length ? Math.min(...talleresConNeumaticos.map(t => t.CANTIDAD_NEUMATICOS)) : 0;
  const MAX_NEU = talleresConNeumaticos.length ? Math.max(...talleresConNeumaticos.map(t => t.CANTIDAD_NEUMATICOS)) : 1;
  const MAYOR = talleresConNeumaticos.reduce((a, b) => b.CANTIDAD_NEUMATICOS > a.CANTIDAD_NEUMATICOS ? b : a, {
    ID: 0,
    TALLER: 'Sin taller',
    CH_SERI_TALLER: 'SNT',
    CANTIDAD_NEUMATICOS: 0,
  });
  const PROMEDIO = Math.round(TOTAL_FLOTA / talleresConNeumaticos.length);

  // * calcular el total del todo talleresConNeumaticos
  const TOTAL_ASIG = talleresConNeumaticos.reduce((s, t) => s + t.NEUMATICOS_ASIGNADOS, 0);
  const TOTAL_DISP = talleresConNeumaticos.reduce((s, t) => s + t.NEUMATICOS_DISPONIBLES, 0);
  const TOTAL_BAJA = talleresConNeumaticos.reduce((s, t) => s + t.NEUMATICOS_BAJAS, 0);
  // * fin del calculo


  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPri = isDark ? '#f1f5f9' : '#1e293b';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const trackBg = isDark ? '#334155' : '#e2e8f0';

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const selectedTaller = talleresConNeumaticos.find(t => `${t.ID}${t.CH_SERI_TALLER}` === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

      {/* ── 4 Mini KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flexShrink: 0 }}>
        {([
          { label: 'Total neumáticos', value: TOTAL_FLOTA, sub: 'neumáticos', color: '#3B82F6' },
          { label: 'Talleres con neumáticos', value: talleresConNeumaticos.length, sub: 'en todo el Perú', color: '#8B5CF6' },
          { label: 'Mayor taller', value: MAYOR.CANTIDAD_NEUMATICOS, sub: MAYOR.TALLER, color: '#F59E0B' },
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
            minZoom={5}
            maxZoom={10}
            maxBounds={[[-18.5, -82.0], [0.0, -68.0]]}
            maxBoundsViscosity={0.8}
            style={{ height: '100%', width: '100%' }}
          // scrollWheelZoom
          >
            <TileLayer
              attribution={tileAttribution}
              url={tileUrl}
            />

            <MapFlyTo taller={selectedTaller} />

            {talleresConNeumaticos.map((taller) => {
              const color = getColor(taller);
              const radius = getRadius(taller.CANTIDAD_NEUMATICOS, MIN_NEU, MAX_NEU);
              const idConcat = `${taller.ID}${taller.CH_SERI_TALLER}`
              const selected = selectedId === idConcat;
              return (
                <CircleMarker
                  key={idConcat}
                  center={(MOCK_UBICACIONES[taller.TALLER] || [-9.5, -75.5]) as [number, number]}
                  radius={selected ? radius + 2 : radius}
                  pathOptions={{
                    fillColor: color,
                    color: selected ? '#fff' : color,
                    weight: selected ? 3 : 1.5,
                    fillOpacity: selected ? 0.95 : 0.82,
                    opacity: 1,
                  }}
                  eventHandlers={{ click: () => handleSelect(idConcat) }}
                >
                  <Tooltip direction="top" offset={[0, -(radius + 4)]} permanent={selected} sticky={false}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{taller.TALLER}</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{taller.CANTIDAD_NEUMATICOS} neumáticos</span>
                  </Tooltip>

                  <Popup minWidth={200}>
                    <div style={{ fontFamily: 'inherit' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: '#1e293b' }}>
                        {taller.TALLER}
                      </div>
                      {/* <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                        {taller.ciudad} · Zona {taller.zona}
                        Lima · Zona Metropolitana
                      </div> */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4, columnGap: 16, fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>Total neumáticos</span>
                        <span style={{ fontWeight: 700, textAlign: 'right' }}>{taller.CANTIDAD_NEUMATICOS}</span>
                        <span style={{ color: '#3B82F6' }}>Asignados</span>
                        <span style={{ fontWeight: 600, color: '#3B82F6', textAlign: 'right' }}>{taller.NEUMATICOS_ASIGNADOS}</span>
                        <span style={{ color: '#22C55E' }}>Disponibles</span>
                        <span style={{ fontWeight: 600, color: '#22C55E', textAlign: 'right' }}>{taller.NEUMATICOS_DISPONIBLES}</span>
                        <span style={{ color: '#EF4444' }}>Baja definitiva</span>
                        <span style={{ fontWeight: 600, color: '#EF4444', textAlign: 'right' }}>{taller.NEUMATICOS_BAJAS}</span>
                      </div>
                      <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(taller.NEUMATICOS_ASIGNADOS / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#3B82F6' }} />
                        <div style={{ width: `${(taller.NEUMATICOS_DISPONIBLES / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#22C55E' }} />
                        <div style={{ width: `${(taller.NEUMATICOS_BAJAS / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#EF4444' }} />
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

          {talleresConNeumaticos.map((taller) => {
            const color = getColor(taller);
            const selected = selectedId === `${taller.ID}${taller.CH_SERI_TALLER}`;
            return (
              <div
                key={`${taller.ID}${taller.CH_SERI_TALLER}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(`${taller.ID}${taller.CH_SERI_TALLER}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(`${taller.ID}${taller.CH_SERI_TALLER}`);
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
                      {taller.TALLER}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: textPri, flexShrink: 0, marginLeft: 6 }}>
                    {taller.CANTIDAD_NEUMATICOS}
                  </span>
                </div>
                {/* <div style={{ fontSize: 10, color: textSec, marginBottom: 6 }}>
                  {taller.ciudad} · {taller.zona}
                </div> */}
                <div style={{ height: 4, borderRadius: 2, background: trackBg, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(taller.NEUMATICOS_ASIGNADOS / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#3B82F6' }} />
                  <div style={{ width: `${(taller.NEUMATICOS_DISPONIBLES / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#22C55E' }} />
                  <div style={{ width: `${(taller.NEUMATICOS_BAJAS / taller.CANTIDAD_NEUMATICOS) * 100}%`, background: '#EF4444' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#3B82F6' }}>{taller.NEUMATICOS_ASIGNADOS} asig.</span>
                  <span style={{ fontSize: 10, color: '#22C55E' }}>{taller.NEUMATICOS_DISPONIBLES} disp.</span>
                  <span style={{ fontSize: 10, color: '#EF4444' }}>{taller.NEUMATICOS_BAJAS} baja</span>
                </div>
              </div>
            );
          })}

          <Divider sx={{ my: 0.5 }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: textSec, letterSpacing: '0.07em', marginBottom: 4 }}>
            LEYENDA — tamaño = neumáticos totales
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
