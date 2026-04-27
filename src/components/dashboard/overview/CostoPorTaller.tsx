'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import type { SxProps } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

export interface CostoPorTallerProps {
  sx?: SxProps;
}

// TODO: Reemplazar con endpoint que devuelva suma de COSTO_NEUMATICO agrupada por TALLER_ACTUAL.
const MOCK_TALLERES = [
  { taller: 'Lima Norte', costo: 285400 },
  { taller: 'Lima Sur', costo: 193800 },
  { taller: 'Callao', costo: 142100 },
  { taller: 'Ate Vitarte', costo: 98600 },
];

const TOTAL_COSTO = MOCK_TALLERES.reduce((s, d) => s + d.costo, 0);
const BAR_COLOR = '#3B82F6';

const formatShort = (value: number | string | undefined | null | boolean) => {
  if (typeof value !== 'number') return '';
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S/ ${(value / 1_000).toFixed(0)}K`;
  return `S/ ${value}`;
};

const formatFull = (value: number) =>
  `S/ ${value.toLocaleString('es-PE')}`;

function TallerTooltip({ active, payload }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!active || !payload?.length) return null;
  const { taller, costo } = payload[0].payload;
  const pct = ((costo / TOTAL_COSTO) * 100).toFixed(1);

  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b', marginBottom: 4 }}>
        {taller}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: BAR_COLOR }}>{formatFull(costo)}</div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
        {pct}% del costo total
      </div>
    </div>
  );
}

export function CostoPorTaller({ sx }: CostoPorTallerProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card sx={sx}>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 className="font-semibold text-xl mb-1">Costo por Taller</h3>
            <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>
              Capital inmovilizado en neumáticos asignados
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: theme.palette.text.secondary }}>Total</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.palette.text.primary }}>
              {formatFull(TOTAL_COSTO)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={MOCK_TALLERES}
            barSize={22}
            margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: theme.palette.text.secondary as string }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatShort}
            />
            <YAxis
              type="category"
              dataKey="taller"
              width={88}
              tick={{ fontSize: 12, fill: theme.palette.text.primary as string, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TallerTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="costo" radius={[0, 5, 5, 0]}>
              {MOCK_TALLERES.map((entry, index) => (
                <Cell
                  key={entry.taller}
                  fill={BAR_COLOR}
                  fillOpacity={1 - index * 0.15}
                />
              ))}
              <LabelList
                dataKey="costo"
                position="right"
                formatter={formatShort}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fill: theme.palette.text.primary as string,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
