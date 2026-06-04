import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'mapa', title: 'Mapa de Talleres', href: paths.dashboard.mapa, icon: 'map-pin' },
  // { key: 'bajas', title: 'Análisis de bajas', href: paths.dashboard.bajas, icon: 'bajas', allowedUsers: ['GESNEU', 'EGAMBOA'] },
  { key: 'padron', title: 'Padrón de Neumáticos', href: paths.dashboard.padron, icon: 'users' },
  { key: 'integrations', title: 'Movimiento', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  { key: 'account', title: 'Perfil', href: paths.dashboard.account, icon: 'user' },
  { key: 'fichas_tecnicas', title: 'Fichas técnicas', href: paths.dashboard.ficha_tecnica, icon: 'file-stack' },
] as NavItemConfig[];
