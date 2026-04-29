import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie' },
  // { key: 'mapa',      title: 'Mapa de Talleres',   href: paths.dashboard.mapa,     icon: 'map-pin'   },
  // { key: 'customers', title: 'Padrón de Neumáticos', href: paths.dashboard.customers, icon: 'users' },
  { key: 'padron', title: 'Padrón de Neumáticos', href: paths.dashboard.padron, icon: 'users' },
  { key: 'integrations', title: 'Movimientos', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Perfil', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
