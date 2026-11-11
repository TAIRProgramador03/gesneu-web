'use client';

import * as React from 'react';

import { obtenerTemporadaActiva } from './index';
import type { ClaveDecoracion, ClaveImagen, ClaveTexto, Temporada } from './tipos';

const TemporadaContext = React.createContext<Temporada | null>(null);

export function TemporadaProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Arranca en null para que servidor y cliente rendericen igual (sin error de
  // hidratación); la temporada se resuelve al montar.
  const [temporada, setTemporada] = React.useState<Temporada | null>(null);

  React.useEffect(() => {
    setTemporada(obtenerTemporadaActiva());
  }, []);

  React.useEffect(() => {
    if (!temporada) return;
    document.documentElement.dataset.temporada = temporada.id;
    void temporada.cargarEstilos?.();
    return () => {
      delete document.documentElement.dataset.temporada;
    };
  }, [temporada]);

  const Efectos = temporada?.Efectos;

  return (
    <TemporadaContext.Provider value={temporada}>
      {children}
      {Efectos ? <Efectos /> : null}
    </TemporadaContext.Provider>
  );
}

/** Pinta el adorno de la temporada activa para ese lugar; nada si no hay. */
export function Decoracion({ nombre }: { nombre: ClaveDecoracion }): React.JSX.Element | null {
  const temporada = React.useContext(TemporadaContext);
  const Adorno = temporada?.decoraciones?.[nombre];
  return Adorno ? <Adorno /> : null;
}

export function useTemporada(): {
  temporada: Temporada | null;
  imagen: (clave: ClaveImagen, porDefecto: string) => string;
  texto: (clave: ClaveTexto, porDefecto: string) => string;
} {
  const temporada = React.useContext(TemporadaContext);
  return {
    temporada,
    imagen: (clave, porDefecto) => temporada?.imagenes?.[clave] ?? porDefecto,
    texto: (clave, porDefecto) => temporada?.textos?.[clave] ?? porDefecto,
  };
}
