'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';

// TODO: Reemplazar con endpoint que devuelva conteo de neumáticos por rango de días restantes,
//   calculado a partir de la tasa de desgaste y el remanente actual (igual que VidaUtilCard).
const MOCK_VENCER = [
  { rango: '≤ 30 días',  subtitulo: 'Reemplazo urgente',    cantidad: 12, color: '#EF4444' },
  { rango: '31–60 días', subtitulo: 'Planificar en breve',  cantidad: 23, color: '#F59E0B' },
  { rango: '61–90 días', subtitulo: 'En seguimiento',       cantidad: 31, color: '#22C55E' },
];

const TOTAL = MOCK_VENCER.reduce((s, d) => s + d.cantidad, 0);

export function ProximosVencer(): React.JSX.Element {
  const theme = useTheme();

  return (
    <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOCK_VENCER.map((item) => {
            const pct = (item.cantidad / TOTAL) * 100;
            return (
              <div
                key={item.rango}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${item.color}28`,
                  background: `${item.color}08`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                      {item.rango}
                    </div>
                    <div style={{ fontSize: 11, color: theme.palette.text.secondary, marginTop: 1 }}>
                      {item.subtitulo}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: item.color, lineHeight: 1 }}>
                      {item.cantidad}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: 5,
                  background: `${item.color}20`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: item.color,
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: theme.palette.text.secondary, marginTop: 4, textAlign: 'right' }}>
                  {pct.toFixed(0)}% del total
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
