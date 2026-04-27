'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// TODO: Reemplazar con el rol real del UserContext
const MOCK_ROL: 'supervisor_general' | 'supervisor_taller' = 'supervisor_general';

const MapaTalleres = dynamic(
  () => import('@/components/dashboard/mapa/MapaTalleres'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '3px solid #3B82F6', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: 14, color: '#64748b' }}>Cargando mapa...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function Page(): React.JSX.Element {
  if (MOCK_ROL !== 'supervisor_general') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 420, gap: 14 }}>
        <div style={{ fontSize: 52 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Acceso restringido</div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 340 }}>
          Esta vista está disponible únicamente para el <strong>Supervisor General</strong>.
          Contacta a tu administrador si necesitas acceso.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Banner modo simulación */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '9px 16px',
        background: '#1e3a5f0f',
        border: '1px solid #1e3a5f25',
        borderRadius: 10,
        fontSize: 12, color: '#1e3a5f',
      }}>
        <span style={{ fontSize: 15 }}>🎭</span>
        <span>
          <strong>Modo simulación:</strong> visualizando como{' '}
          <strong>Supervisor General</strong>. En producción, la visibilidad de esta
          página depende del rol del usuario autenticado.
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.04em' }}>supervisor_general</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4, color: '#1e293b' }}>
          Mapa de Talleres
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
          Distribución geográfica de la flota por taller · datos mock
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
