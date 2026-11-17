'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina';
import { Tarjeta } from '@/components/ui/Tarjeta';

const MapaTalleres = dynamic(
  () => import('@/components/dashboard/mapa/MapaTalleres').then((m) => m.MapaTalleres),
  { ssr: false }
);

export default function Page(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        icono={<MapPin className="size-5" />}
        degradado="from-emerald-500 to-emerald-800"
        titulo="Mapa de talleres"
        descripcion="Distribución geográfica de la flota por taller."
      />

      <Tarjeta className="h-175 max-h-[80dvh] min-h-[420px] p-3 sm:p-5">
        <MapaTalleres />
      </Tarjeta>
    </div>
  );
}
