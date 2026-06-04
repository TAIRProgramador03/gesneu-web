import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { Car, Layers3Icon, LayoutDashboardIcon, User2Icon, MapPin, ChartColumnStacked, FileStack } from 'lucide-react';

export const navIcons = {
  'chart-pie': LayoutDashboardIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': Car,
  'x-square': XSquare,
  user: User2Icon,
  users: Layers3Icon,
  'map-pin': MapPin,
  'bajas': ChartColumnStacked,
  'file-stack': FileStack,
} as Record<string, Icon>;
