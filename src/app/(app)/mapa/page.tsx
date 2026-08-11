'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const MapaTalleres = dynamic(
  () => import('@/components/dashboard/mapa/MapaTalleres').then((m) => m.MapaTalleres),
  { ssr: false }
);

export default function Page(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4, color: '#1e293b' }}>
          Mapa de Talleres
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
          Distribución geográfica de la flota por taller
        </p>
      </div>

      {/* Mapa */}
      <Card>
        <CardContent sx={{ p: '20px !important', height: 700 }}>
          <MapaTalleres />
        </CardContent>
      </Card>
    </div>
  );
}
