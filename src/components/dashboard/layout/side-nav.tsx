'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import { CaretLeft, CaretRight, Buildings, CaretUpDown } from '@phosphor-icons/react';

import Tooltip from '@mui/material/Tooltip';
import type { User } from '@/types/user';


import { useUser } from '@/hooks/use-user';
import { usePopover } from '@/hooks/use-popover';
import { Decoracion } from '@/temporadas/temporada-provider';
import { filtrarNavSecciones, navSecciones } from './config';
import { ANCHO_SIDENAV, ANCHO_SIDENAV_COLAPSADO, NAV_FONDO, NAV_FOCO } from './nav-constantes';
import { NavMenu } from './nav-menu';
import { UserPopover } from './user-popover';

interface SideNavProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  /** false hasta que se leyó el estado guardado: evita animar el salto inicial. */
  animar?: boolean;
}

export function SideNav({ collapsed, setCollapsed, animar = true }: SideNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const secciones = React.useMemo(
    () => filtrarNavSecciones(navSecciones, user?.usuario ?? ''),
    [user?.usuario]
  );

  return (
    <Box
      sx={{
        width: collapsed ? ANCHO_SIDENAV_COLAPSADO : ANCHO_SIDENAV,
        minWidth: collapsed ? ANCHO_SIDENAV_COLAPSADO : ANCHO_SIDENAV,
        transition: animar ? 'width 0.2s' : 'none',
        overflow: 'hidden',
        bgcolor: NAV_FONDO,
        color: 'var(--SideNav-color)',
        height: '100dvh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}
    >
      {!collapsed && <Decoracion nombre="coronaMenu" />}
      {/* Logo y botón */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
          minHeight: 72,
          px: 2,
          flex: '0 0 auto',
        }}
      >
        {!collapsed && (
          <Typography
            variant="h6"
            noWrap
            sx={{ color: '#fff', fontSize: '1.15rem', lineHeight: 1.2, minWidth: 0, flex: '1 1 auto' }}
          >
            Gestor de Neumáticos
          </Typography>
        )}
        <Button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Plegar menú'}
          sx={{
            minWidth: 0,
            width: 32,
            height: 32,
            flex: '0 0 auto',
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
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: '10px', mt: '8px', scrollbarWidth: 'thin' }}>
        <NavMenu secciones={secciones} pathname={pathname} colapsado={collapsed} />
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
          '&:focus-visible': { outline: `2px solid ${NAV_FOCO}`, outlineOffset: '-2px' },
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
            {/* font-size = diámetro del avatar: el gorro de temporada se mide en em. */}
            <Box sx={{ position: 'relative', fontSize: 40, lineHeight: 0, flexShrink: 0 }}>
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
              <Decoracion nombre="sombreroAvatar" />
            </Box>
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
