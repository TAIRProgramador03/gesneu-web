'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { obtenerCantidadPorMedida } from '@/api/Neumaticos';

const COLOR_ASIG = '#0084d1';
const COLOR_BAJ = '#e7000b';
const COLOR_DISP = '#00a63e';

function MedidasTooltip({ active, payload, label }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit', minWidth: 190,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b', marginBottom: 8, fontFamily: 'monospace' }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b' }}>{p.value}</span>
        </div>
      ))}
      <div style={{
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        marginTop: 6, paddingTop: 6,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Total</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b' }}>{total}</span>
      </div>
    </div>
  );
}

export const MedidasChart = (): React.JSX.Element => {
  const theme = useTheme();

  const { data = [] } = useQuery({
    queryKey: ['cantidad-de-neumaticos-por-medida'],
    queryFn: obtenerCantidadPorMedida
  })

  const medidasPorNeumaticos = data.map((neu) => {
    return {
      medida: neu.MEDIDA_NEUMATICO,
      asignados: neu.MEDIDA_ASIGNADA,
      disponibles: neu.MEDIDA_DISPONIBLE,
      baja: neu.MEDIDA_BAJA,
      total: neu.CANTIDAD_NEUMATICOS
    }
  })

  const TOTAL_FLOTA = data.reduce((s, d) => s + d.CANTIDAD_NEUMATICOS, 0);

  // eslint-disable-next-line react/no-unstable-nested-components
  function TotalLabel({ x, y, width, height, index }: any) {
    const item = medidasPorNeumaticos[index as number];
    if (!item) return null;
    const pct = ((item.total / TOTAL_FLOTA) * 100).toFixed(1);
    const xPos = (x as number) + (width as number) + 8;
    const yMid = (y as number) + (height as number) / 2;
    return (
      <g>
        <text x={xPos} y={yMid - 5} dominantBaseline="auto" fontSize={13} fontWeight={700} fill={theme.palette.text.primary as string}>
          {item.total}
        </text>
        <text x={xPos} y={yMid + 8} dominantBaseline="auto" fontSize={10} fill={theme.palette.text.secondary as string}>
          {pct}%
        </text>
      </g>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Mini leyenda */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', marginBottom: 8 }}>
        {[{ color: COLOR_DISP, label: 'Disponibles' }, { color: COLOR_ASIG, label: 'Asignados' }, { color: COLOR_BAJ, label: 'Bajas' }].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>{label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={268}>
        <BarChart
          layout="vertical"
          data={medidasPorNeumaticos}
          barSize={16}
          margin={{ top: 0, right: 58, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: theme.palette.text.secondary as string }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="medida"
            width={104}
            tick={{ fontSize: 11, fill: theme.palette.text.primary as string, fontWeight: 600, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<MedidasTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="disponibles" name="Disponibles" stackId="a" fill={COLOR_DISP} radius={[3, 0, 0, 3]} />
          <Bar dataKey="asignados" name="Asignados" stackId="a" fill={COLOR_ASIG} radius={[0, 0, 0, 0]} />
          <Bar dataKey="baja" name="Bajas" stackId="a" fill={COLOR_BAJ} radius={[0, 3, 3, 0]}>
            <LabelList content={<TotalLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
