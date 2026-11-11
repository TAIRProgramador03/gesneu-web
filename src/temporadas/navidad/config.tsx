import type * as React from 'react';
import type { Temporada } from '../tipos';
import { ArbolitoNavidad, CoronaNavidad } from './adornos';
import { EfectoNieve } from './efecto-nieve';
import { SombreroNavidad } from './sombrero';

/** Gorro apoyado sobre el final ("ón") del título del login, inclinado a la derecha. */
function SombreroTituloLogin(): React.JSX.Element {
  return (
    <SombreroNavidad
      style={{ position: 'absolute', right: '-0.3em', top: '-0.78em', transform: 'rotate(12deg)' }}
    />
  );
}

/**
 * Gorro sobre el avatar. El contenedor que lo envuelve fija font-size al
 * diámetro del avatar (40px), así que las medidas en em escalan con él.
 */
function SombreroAvatar(): React.JSX.Element {
  return (
    <SombreroNavidad
      style={{
        position: 'absolute',
        right: '-0.14em',
        top: '-0.4em',
        width: '0.8em',
        height: '0.8em',
        transform: 'rotate(14deg)',
      }}
    />
  );
}

/**
 * Corona en el espacio vacío del menú lateral, centrada sobre la tarjeta de
 * usuario (como colgada en una puerta). Se oculta en pantallas bajas para no
 * pisar las opciones del menú (ver .corona-menu en navidad.css).
 */
function CoronaMenu(): React.JSX.Element {
  return (
    <CoronaNavidad
      className="corona-menu"
      style={{ position: 'absolute', bottom: 160, left: '50%', width: 96, height: 96, marginLeft: -48 }}
    />
  );
}

export const navidad: Temporada = {
  id: 'navidad',
  desde: { mes: 12, dia: 1 },
  hasta: { mes: 12, dia: 26 },
  imagenes: {
    login: '/assets/gemini-login-navidad.jpg',
  },
  decoraciones: {
    sombreroTituloLogin: SombreroTituloLogin,
    sombreroAvatar: SombreroAvatar,
    arbolitoCabecera: ArbolitoNavidad,
    coronaMenu: CoronaMenu,
  },
  Efectos: EfectoNieve,
  // Los estilos (botones caramelo, etc.) solo se descargan en temporada.
  cargarEstilos: () => import('./navidad.css'),
};
