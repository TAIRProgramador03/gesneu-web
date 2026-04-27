'use client';

import * as React from 'react';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from 'recharts';

// TODO: Reemplazar con endpoint que calcule tasa de desgaste por PLACA_VEHICULO:
//   tasa = sum(REMANENTE_MONTADO - REMANENTE_ACTUAL) / sum(KM_RECORRIDOS_EN_ETAPA) * 1000
//   Solo incluir vehículos con KM_RECORRIDOS_EN_ETAPA > 0.
const MOCK_DESGASTE = [
  { placa: 'F5K-830', tasa: 2.8, neumaticos: 6 },
  { placa: 'D3M-512', tasa: 2.1, neumaticos: 4 },
  { placa: 'B7X-241', tasa: 1.9, neumaticos: 6 },
  { placa: 'C4N-778', tasa: 1.5, neumaticos: 4 },
  { placa: 'A1P-993', tasa: 1.3, neumaticos: 6 },
  { placa: 'G8M-441', tasa: 1.1, neumaticos: 4 },
  { placa: 'E2R-654', tasa: 0.9, neumaticos: 4 },
].sort((a, b) => b.tasa - a.tasa);

const FLEET_AVG = parseFloat(
  (MOCK_DESGASTE.reduce((s, d) => s + d.tasa, 0) / MOCK_DESGASTE.length).toFixed(2)
);
const ALERT_COUNT = MOCK_DESGASTE.filter(d => d.tasa > 2.0).length;

function getTasaColor(tasa: number): string {
  if (tasa > 2.5) return '#EF4444';
  if (tasa > 1.5) return '#F59E0B';
  return '#22C55E';
}

function getTasaBg(tasa: number): string {
  if (tasa > 2.5) return '#EF444415';
  if (tasa > 1.5) return '#F59E0B15';
  return '#22C55E15';
}

function DesgasteTooltip({ active, payload }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  const { placa, tasa, neumaticos } = payload[0].payload;
  const color = getTasaColor(tasa);
  const severity = tasa > 2.5 ? 'Alto' : tasa > 1.5 ? 'Moderado' : 'Normal';

  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#f1f5f9' : '#1e293b', marginBottom: 8 }}>
        {placa}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Tasa desgaste</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{tasa.toFixed(1)} mm/1000km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Neumáticos</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{neumaticos}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Desgaste</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color,
            background: getTasaBg(tasa),
            borderRadius: 4, padding: '1px 6px',
          }}>
            {severity}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2, paddingTop: 6, borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Promedio flota</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{FLEET_AVG} mm/1000km</span>
        </div>
      </div>
    </div>
  );
}

export function DesgasteVehiculos(): React.JSX.Element {
  const theme = useTheme();

  // eslint-disable-next-line react/no-unstable-nested-components
  function TasaLabel({ x, y, width, height, index }: any) {
    const item = MOCK_DESGASTE[index as number];
    if (!item) return null;
    const color = getTasaColor(item.tasa);
    return (
      <text
        x={(x as number) + (width as number) + 8}
        y={(y as number) + (height as number) / 2}
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={700}
        fill={color}
      >
        {item.tasa.toFixed(1)}
      </text>
    );
  }

  return (
    <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column' }}>
      {/* Badge alerta */}
      {ALERT_COUNT > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: '#EF4444',
            background: '#EF444415',
            border: '1px solid #EF444435',
            borderRadius: 20,
            padding: '3px 11px',
            whiteSpace: 'nowrap',
          }}>
            {ALERT_COUNT} en alerta
          </span>
        </div>
      )}

      {/* Leyenda de severidad */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {[
          { color: '#EF4444', label: '> 2.5 — Alto' },
          { color: '#F59E0B', label: '1.5–2.5 — Moderado' },
          { color: '#22C55E', label: '< 1.5 — Normal' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: theme.palette.text.secondary }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            layout="vertical"
            data={MOCK_DESGASTE}
            barSize={18}
            margin={{ top: 4, right: 52, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 3.2]}
              tick={{ fontSize: 10, fill: theme.palette.text.secondary as string }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="placa"
              width={72}
              tick={{ fontSize: 12, fill: theme.palette.text.primary as string, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DesgasteTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

            {/* Línea de referencia: promedio flota */}
            <ReferenceLine
              x={FLEET_AVG}
              stroke="#94a3b8"
              strokeDasharray="5 3"
              label={{
                value: `Prom. ${FLEET_AVG}`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#94a3b8',
                dy: -4,
              }}
            />

            <Bar dataKey="tasa" radius={[0, 5, 5, 0]}>
              {MOCK_DESGASTE.map((entry) => (
                <Cell key={entry.placa} fill={getTasaColor(entry.tasa)} fillOpacity={0.85} />
              ))}
              <LabelList content={<TasaLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <Divider sx={{ mt: 'auto' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px 12px' }}>
        <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
          Promedio flota
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: getTasaColor(FLEET_AVG) }}>
          {FLEET_AVG} mm/1000km
        </span>
      </div>
    </div>
  );
}
