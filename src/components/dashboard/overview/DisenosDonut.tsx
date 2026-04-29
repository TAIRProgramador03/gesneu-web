'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { obtenerCantidadPorDiseno } from '@/api/Neumaticos';
import { BadgeCheck } from 'lucide-react';

const VIBRANT_COLORS = [
  '#4f46e5',
  '#65a30d',
  '#ea580c',
  '#0d9488',
  '#d946ef',
  '#dc2626',
  '#0891b2',
  '#ec4899',
  '#16a34a',
  '#d97706',
  '#059669',
  '#a855f7',
  '#ca8a04',
  '#0284c7',
  '#2563eb',
  '#e11d48',
  '#7c3aed',
];

function DisenosTooltip({ active, payload, total }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;

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
        <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
      </div>
      <div style={{ fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{value} neumáticos</div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
        {((value / total) * 100).toFixed(1)}% del total
      </div>
    </div>
  );
}

export const DisenosDonut = (): React.JSX.Element => {
  const theme = useTheme();

  const { data = [] } = useQuery({
    queryKey: ['cantidad-de-neumaticos-por-diseno'],
    queryFn: obtenerCantidadPorDiseno
  })

  const cantidadesPorMarca = data.map((neu, index) => {
    return {
      name: neu.DISENO_NEUMATICO,
      value: neu.CANTIDAD_NEUMATICOS,
      color: VIBRANT_COLORS[index % VIBRANT_COLORS.length]
    }
  })

  const total = data.reduce((d, a) => d + a.CANTIDAD_NEUMATICOS, 0)

  return (
    <div style={{ padding: '20px' }}>

      {
        total === 0 && (
          <div className='flex gap-1 flex-wrap justify-center items-center bg-cyan-50 text-cyan-700 border-2 border-cyan-700 p-2 rounded-lg'>
            <BadgeCheck width={12} />
            <span className='italic text-xs'>Almacén Vacío.</span>
          </div>
        )
      }

      {
        total >= 1 && (
          <>
            {/* Donut */}
            <div style={{ position: 'relative', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cantidadesPorMarca}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {cantidadesPorMarca.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DisenosTooltip total={total} />} wrapperStyle={{ zIndex: 100 }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1 }}>
                  {cantidadesPorMarca.length}
                </div>
                <div style={{ fontSize: 10, color: theme.palette.text.secondary, marginTop: 4, letterSpacing: '0.06em' }}>
                  DISEÑOS
                </div>
              </div>
            </div>

            {/* Leyenda en 2 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 4 }}>
              {cantidadesPorMarca.map((item) => {
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: theme.palette.text.primary, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 11, color: theme.palette.text.secondary, flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )
      }
    </div>
  );
}
