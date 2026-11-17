import type { NavItemConfig, NavSeccion } from '@/types/nav';
import { paths } from '@/paths';

/**
 * Menú lateral. Cada sección es un bloque con título opcional.
 *
 * - Enlace simple:   { key, title, href, icon }
 * - Grupo desplegable: { key, title, icon, items: [ ...enlaces u otros grupos ] }
 *   (el grupo no lleva href; se abre solo si alguno de sus hijos es la página actual)
 * - Restringir por usuario: allowedUsers: ['GESNEU', 'EGAMBOA']
 *
 * Ejemplo de grupo:
 *   { key: 'analisis', title: 'Análisis', icon: 'bajas', items: [
 *     { key: 'bajas', title: 'Por rendimiento', href: paths.dashboard.reportes },
 *     { key: 'consumos', title: 'Por consumos', href: paths.dashboard.consumos },
 *   ] }
 */
export const navSecciones: NavSeccion[] = [
  {
    key: 'principal',
    items: [
      { key: 'overview', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie' },
    ],
  },
  {
    key: 'operacion',
    titulo: 'Operación',
    items: [
      { key: 'integrations', title: 'Movimiento', href: paths.dashboard.integrations, icon: 'plugs-connected' },
      { key: 'padron', title: 'Padrón de Neumáticos', href: paths.dashboard.padron, icon: 'users' },
      { key: 'mapa', title: 'Mapa de Talleres', href: paths.dashboard.mapa, icon: 'map-pin' },
      { key: 'fichas_tecnicas', title: 'Fichas técnicas', href: paths.dashboard.ficha_tecnica, icon: 'file-stack' },
    ],
  },
  {
    key: 'analisis',
    titulo: 'Análisis',
    items: [
      { key: 'bajas', title: 'Por rendimiento', href: paths.dashboard.reportes, icon: 'bajas' },
      { key: 'consumos', title: 'Por consumos', href: paths.dashboard.consumos, icon: 'consumos' },
    ],
  },
];

/** Quita lo que el usuario no puede ver, y los grupos que se quedan sin hijos. */
function filtrarItems(items: NavItemConfig[], usuario: string): NavItemConfig[] {
  return items
    .filter((item) => !item.allowedUsers || item.allowedUsers.includes(usuario))
    .filter((item) => !item.blockedUsers?.includes(usuario))
    .map((item) => (item.items ? { ...item, items: filtrarItems(item.items, usuario) } : item))
    .filter((item) => !item.items || item.items.length > 0);
}

export function filtrarNavSecciones(secciones: NavSeccion[], usuario: string): NavSeccion[] {
  const u = usuario.trim().toUpperCase();
  return secciones
    .map((s) => ({ ...s, items: filtrarItems(s.items, u) }))
    .filter((s) => s.items.length > 0);
}
