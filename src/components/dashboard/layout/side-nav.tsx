'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import { CaretLeft, CaretRight, Buildings, CaretUpDown } from '@phosphor-icons/react';

import Tooltip from '@mui/material/Tooltip';
import type { User } from '@/types/user';
import type { NavItemConfig } from '@/types/nav';
import { isNavItemActive } from '@/lib/is-nav-item-active';


import { useUser } from '@/hooks/use-user';
import { usePopover } from '@/hooks/use-popover';
import { navItems } from './config';
import { navIcons } from './nav-icons';
import { UserPopover } from './user-popover';

interface SideNavProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export function SideNav({ collapsed, setCollapsed }: SideNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const username = user?.usuario?.toUpperCase() ?? '';
  const visibleNavItems = navItems.filter((item) =>
    !item.allowedUsers || item.allowedUsers.includes(username.trim())
  );

  return (
    <Box
      sx={{
        width: collapsed ? 72 : 280,
        minWidth: collapsed ? 72 : 280,
        transition: 'width 0.2s',
        bgcolor: '#002141',
        color: 'var(--SideNav-color)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}
    >
      {/* Logo y botón */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          height: 64,
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
          {/* <img src="/logo-tair.png" alt="Logo" style={{ width: 40, height: 40 }} /> */}
          {!collapsed && (
            <Typography variant="h6" sx={{ ml: 1, color: '#fff', fontSize: '1.6em' }}>
              Gestor de Neumáticos
            </Typography>
          )}
        </Box>
        <Button
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            minWidth: 0,
            width: 32,
            height: 32,
            ml: collapsed ? 0 : 1,
            borderRadius: '50%',
            p: 0,
            color: "#fff",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? <CaretRight size={20} /> : <CaretLeft size={20} />}
        </Button>
      </Box>
      {/* <Divider /> */}
      {/* Menú */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, marginTop: '25px' }}>
        <Box component="nav" sx={{ width: '100%', padding: '10px' }}>
          {renderNavItems({ pathname, items: visibleNavItems, collapsed })}
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      {/* User description */}
      <UserCard user={user} collapsed={collapsed} />
    </Box>
  );
}

function UserCard({ user, collapsed }: { user: User | null; collapsed: boolean }): React.JSX.Element {
  const nombreCompleto = user
    ? `${String(user.nombre ?? '')} ${String(user.apellido_paterno ?? '')}`.trim()
    : '';
  const displayName = nombreCompleto || String(user?.nombre ?? user?.name ?? 'Usuario');
  const usuario = String(user?.usuario ?? user?.email ?? '');
  const rol =
    Array.isArray(user?.perfiles) && user.perfiles.length > 0
      ? String((user.perfiles[0] as { descripcion?: string }).descripcion ?? '')
      : '';

  const iniciales = (nombreCompleto || usuario || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  const talleres: string[] = (() => {
    const raw = user?.talleres;
    const arr = Array.isArray(raw) ? raw : raw !== null && raw !== undefined ? [raw] : [];
    return arr
      .map((t) => (typeof t === 'string' ? t : t?.taller ?? ''))
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  const tieneTalleres = talleres.length > 0;
  const tooltipTalleres = tieneTalleres ? `Talleres: ${talleres.join(', ')}` : '';
  const tooltipColapsado = [
    `${displayName}${rol ? ` · ${rol}` : ''}`,
    tooltipTalleres,
  ]
    .filter(Boolean)
    .join('\n');

  const MAX_CHIPS = 2;
  const visibles = talleres.slice(0, MAX_CHIPS);
  const ocultos = talleres.slice(MAX_CHIPS);

  const popover = usePopover<HTMLDivElement>();

  return (
    <>
      <Box
        ref={popover.anchorRef}
        role="button"
        tabIndex={0}
        onClick={popover.handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            popover.handleToggle();
          }
        }}
        aria-label="Abrir menú de usuario"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: collapsed ? 0 : 2,
          py: 2,
          cursor: 'pointer',
          outline: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          '&:focus-visible': { outline: '2px solid #67b0f5', outlineOffset: '-2px' },
        }}
      >
        <Tooltip
          title={collapsed ? <span style={{ whiteSpace: 'pre-line' }}>{tooltipColapsado}</span> : ''}
          placement="right"
          arrow
        >
          <Badge
            badgeContent={collapsed && talleres.length > 1 ? talleres.length : 0}
            color="primary"
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ '& .MuiBadge-badge': { bgcolor: '#167bd9', color: '#fff', fontSize: '0.6rem' } }}
          >
            <Avatar
              src={user?.avatar}
              sx={{
                bgcolor: '#167bd9',
                color: '#fff',
                width: 40,
                height: 40,
                fontSize: '0.95rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {iniciales}
            </Avatar>
          </Badge>
        </Tooltip>
        {!collapsed && (
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography
              sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}
              noWrap
            >
              {displayName}
            </Typography>
            {rol && (
              <Typography sx={{ color: '#167bd9', fontSize: '0.75rem', fontWeight: 500 }} noWrap>
                {rol}
              </Typography>
            )}
            {usuario && (
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }} noWrap>
                {usuario}
              </Typography>
            )}
            {tieneTalleres && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                {visibles.map((nombre) => (
                  <Tooltip key={nombre} title={nombre} placement="top" arrow>
                    <Chip
                      size="small"
                      icon={<Buildings size={13} weight="fill" />}
                      label={nombre}
                      sx={{
                        maxWidth: 130,
                        height: 22,
                        bgcolor: 'rgba(22,123,217,0.18)',
                        color: '#cfe6ff',
                        border: '1px solid rgba(22,123,217,0.45)',
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 500 },
                        '& .MuiChip-icon': { color: '#67b0f5', ml: 0.5 },
                      }}
                    />
                  </Tooltip>
                ))}
                {ocultos.length > 0 && (
                  <Tooltip
                    title={<span style={{ whiteSpace: 'pre-line' }}>{ocultos.join('\n')}</span>}
                    placement="top"
                    arrow
                  >
                    <Chip
                      size="small"
                      label={`+${ocultos.length}`}
                      sx={{
                        height: 22,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.85)',
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 600 },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        )}
        {!collapsed && (
          <CaretUpDown size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
        )}
      </Box>
      <UserPopover
        anchorEl={popover.anchorRef.current}
        open={popover.open}
        onClose={popover.handleClose}
      />
    </>
  );
}

function renderNavItems({
  items = [],
  pathname,
  collapsed = false,
}: {
  items?: NavItemConfig[];
  pathname: string;
  collapsed?: boolean;
}): React.JSX.Element {
  const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
    const { key, divider, ...item } = curr;

    if (divider) {
      acc.push(
        <Divider key={`divider-${key}`} sx={{ my: 1, borderColor: 'rgba(255,255,255,0.30)' }} />
      );
    }

    acc.push(<NavItem key={key} pathname={pathname} collapsed={collapsed} {...item} />);

    return acc;
  }, []);

  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  collapsed?: boolean;
}

function NavItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  collapsed,
}: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;

  return (
    <Tooltip title={collapsed ? title : ''} placement="right" arrow>
      <li>
        <Box
          {...(href
            ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
            : { role: 'button', tabIndex: disabled ? -1 : 0 })}
          sx={{
            alignItems: 'center',
            borderRadius: 1,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            flex: '0 0 auto',
            gap: 1,
            p: collapsed ? '6px' : '6px 16px',
            position: 'relative',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background-color 0.15s ease',
            '&:focus-visible': { outline: '2px solid #67b0f5', outlineOffset: '2px' },
            ...(!active &&
              !disabled && {
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
            }),
            ...(disabled && {
              bgcolor: 'var(--NavItem-disabled-background)',
              color: 'var(--NavItem-disabled-color)',
              cursor: 'not-allowed',
            }),
            ...(active && { bgcolor: '#167bd9', color: '#fff' }),
          }}
        >
          <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
            {Icon ? (
              <Icon
                strokeWidth={2.5}
                fill={active ? '#fff' : 'rgba(255,255,255,0.75)'}
                fontSize="var(--icon-fontSize-lg)"
                weight={'bold'}
              />
            ) : null}
          </Box>
          {/* Solo muestra el nombre si NO está colapsado */}
          {!collapsed && (
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography
                component="span"
                sx={{
                  color: 'inherit', fontSize: '16px', fontWeight: 500, lineHeight: '28px'
                }}
              >
                {title}
              </Typography>
            </Box>
          )}
        </Box>
      </li>
    </Tooltip>
  );
}
