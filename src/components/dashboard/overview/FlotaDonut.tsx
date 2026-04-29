'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';

function DonutTooltip({ active, payload, total }: any) {
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
    }}
      className='z-999999'
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
      </div>
      <div style={{ fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{value} neumáticos</div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
        {((value / total) * 100).toFixed(1)}% del parque
      </div>
    </div>
  );
}

interface DataFlotaDonut {
  name: string,
  value: number,
  color: string,
  [key: string]: any,
}

export const FlotaDonut = ({ data }: { data: DataFlotaDonut[] }): React.JSX.Element => {
  const theme = useTheme();

  const TOTAL = useMemo(() => {
    return data.reduce((s, d) => d.name !== "Recuperados" ? s + d.value : s + 0, 0)
  }, [data])

  return (
    <div style={{ padding: '20px' }}>

      {
        TOTAL === 0 && (
          <div className='flex gap-1 flex-wrap justify-center items-center bg-sky-50 text-sky-700 border-2 border-sky-700 p-2 rounded-lg'>
            <BadgeCheck width={12} />
            <span className='italic text-xs'>Almacén Vacío.</span>
          </div>
        )
      }

      {
        TOTAL >= 1 && (
          <>
            {/* Donut */}
            <div style={{ position: 'relative', height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={98}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip total={TOTAL} />} wrapperStyle={{ zIndex: 100 }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Total en el centro */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 0.2
              }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1 }}>
                  {TOTAL}
                </div>
                <div style={{ fontSize: 11, color: theme.palette.text.secondary, marginTop: 4, letterSpacing: '0.05em' }}>
                  TOTAL
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {data.map((item) => {
                const pct = TOTAL === 0 ? 0 : ((item.value / TOTAL) * 100).toFixed(1);
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: theme.palette.text.primary }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                      {item.value}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: theme.palette.text.secondary,
                      minWidth: 40,
                      textAlign: 'right',
                    }}>
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
