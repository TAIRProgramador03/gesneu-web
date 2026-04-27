'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { obtenerCantidadNeumaticosVidaUtil } from '@/api/Neumaticos';

function VidaTooltip({ active, payload, total }: any) {

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!active || !payload?.length) return null;
  const { rango, desc, cantidad, color } = payload[0].payload;

  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{rango}</span>
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6 }}>{desc}</div>
      <div style={{ fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 600 }}>
        {cantidad} neumáticos
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
        {((cantidad / total) * 100).toFixed(1)}% del total
      </div>
    </div>
  );
}

// Label encima de cada barra: número grande + porcentaje
function TopLabel({ x, y, width, value, index, total, items }: any) {
  const theme = useTheme();
  const item = items[index];
  if (!item) return null;
  const pct = ((value / total) * 100).toFixed(0);
  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 18}
        textAnchor="middle"
        fill={item.color}
        fontSize={20}
        fontWeight={700}
        fontFamily="inherit"
      >
        {value}
      </text>
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fill={theme.palette.text.secondary as string}
        fontSize={11}
        fontFamily="inherit"
      >
        {pct}%
      </text>
    </g>
  );
}

export const VidaUtilDistribucion = (): React.JSX.Element => {
  const theme = useTheme();

  const { data } = useQuery({
    queryKey: ['vida-util-neumaticos'],
    queryFn: () => obtenerCantidadNeumaticosVidaUtil()
  })

  const MOCK_VIDA_UTIL = [
    { rango: 'Buen estado', desc: '100 - 79% vida útil', cantidad: data?.NEUMATICOS_BUENO ?? 0, color: '#2e7d32' },
    { rango: 'Desgaste regular', desc: '39 – 78%', cantidad: data?.NEUMATICOS_REGULAR ?? 0, color: '#efdc34' },
    { rango: 'Crítico', desc: '< 39% vida útil', cantidad: data?.NEUMATICOS_CRITICO ?? 0, color: '#d32f2f' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={MOCK_VIDA_UTIL}
          barSize={80}
          margin={{ top: 40, right: 12, bottom: 0, left: -24 }}
        >
          <XAxis
            dataKey="rango"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary as string, fontWeight: 600 }}
            axisLine={{ stroke: theme.palette.divider }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<VidaTooltip total={data?.NEUMATICOS_TOTALES ?? 0} />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 } as any} />
          <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
            {MOCK_VIDA_UTIL.map((entry) => (
              <Cell key={entry.rango} fill={entry.color} fillOpacity={0.82} />
            ))}
            <LabelList dataKey="cantidad" content={<TopLabel total={data?.NEUMATICOS_TOTALES ?? 0} items={MOCK_VIDA_UTIL} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Badges de rango */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14 }}>
        {MOCK_VIDA_UTIL.map((item) => (
          <div key={item.rango} style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              color: item.color,
              background: `${item.color}18`,
              border: `1px solid ${item.color}50`,
              borderRadius: 20,
              padding: '2px 10px',
            }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
