'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CaretDown } from '@phosphor-icons/react';

import type { NavItemConfig, NavSeccion } from '@/types/nav';
import { encontrarClaveActiva } from '@/lib/is-nav-item-active';

import { NAV_ACTIVO, NAV_FONDO, NAV_FOCO } from './nav-constantes';
import { navIcons } from './nav-icons';

interface NavMenuProps {
  secciones: NavSeccion[];
  pathname: string;
  /** Modo de iconos solos (sidebar de escritorio plegado). */
  colapsado?: boolean;
  /** Se llama al elegir un destino; el drawer móvil lo usa para cerrarse. */
  alNavegar?: () => void;
}

interface ContextoNav {
  claveActiva: string | null;
  colapsado: boolean;
  alNavegar?: () => void;
}

const tieneHijos = (item: NavItemConfig): boolean => Boolean(item.items?.length);

const contieneClave = (item: NavItemConfig, clave: string | null): boolean =>
  clave !== null && Boolean(item.items?.some((h) => h.key === clave || contieneClave(h, clave)));

/**
 * Menú de navegación compartido por el sidebar y el drawer móvil.
 * Acepta enlaces simples y grupos desplegables (con sub-items, a cualquier nivel).
 */
export function NavMenu({ secciones, pathname, colapsado = false, alNavegar }: NavMenuProps): React.JSX.Element {
  const claveActiva = React.useMemo(
    () => encontrarClaveActiva(secciones.flatMap((s) => s.items), pathname),
    [secciones, pathname]
  );
  const ctx: ContextoNav = { claveActiva, colapsado, alNavegar };

  return (
    <Box component="nav" aria-label="Navegación principal" sx={{ width: '100%' }}>
      <Stack spacing={2}>
        {secciones.map((seccion, i) => (
          <Box key={seccion.key}>
            {seccion.titulo ? (
              colapsado ? (
                i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.18)', mb: 1 }} />
              ) : (
                <Typography
                  sx={{
                    px: 2,
                    pb: 0.75,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {seccion.titulo}
                </Typography>
              )
            ) : null}
            <ListaNav items={seccion.items} nivel={0} ctx={ctx} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function ListaNav({ items, nivel, ctx }: { items: NavItemConfig[]; nivel: number; ctx: ContextoNav }): React.JSX.Element {
  return (
    <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item) =>
        tieneHijos(item) ? (
          <NavGrupo key={item.key} item={item} nivel={nivel} ctx={ctx} />
        ) : (
          <NavEnlace key={item.key} item={item} nivel={nivel} ctx={ctx} />
        )
      )}
    </Stack>
  );
}

/** Estilo base de una fila (enlace o cabecera de grupo). */
function estiloFila(nivel: number, colapsado: boolean, activo: boolean, deshabilitado?: boolean) {
  return {
    alignItems: 'center',
    background: 'none',
    border: 0,
    borderRadius: 1,
    color: deshabilitado ? 'rgba(255,255,255,0.35)' : '#fff',
    cursor: deshabilitado ? 'not-allowed' : 'pointer',
    display: 'flex',
    font: 'inherit',
    gap: 1.25,
    justifyContent: colapsado ? 'center' : 'flex-start',
    minHeight: 40,
    p: colapsado ? '6px' : nivel > 0 ? '6px 12px 6px 44px' : '6px 16px',
    position: 'relative',
    textAlign: 'left',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
    whiteSpace: 'nowrap',
    width: '100%',
    '&:focus-visible': { outline: `2px solid ${NAV_FOCO}`, outlineOffset: '2px' },
    ...(!activo && !deshabilitado && { '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }),
    ...(activo && { bgcolor: NAV_ACTIVO }),
  } as const;
}

function IconoNav({ icono }: { icono?: string }): React.JSX.Element | null {
  const Icono = icono ? navIcons[icono] : null;
  return Icono ? (
    <Box sx={{ alignItems: 'center', display: 'flex', flex: '0 0 auto', justifyContent: 'center' }}>
      <Icono size={20} />
    </Box>
  ) : null;
}

/** El texto se oculta por opacidad y ancho, no se desmonta: así no parpadea al plegar o desplegar. */
function EtiquetaNav({ texto, colapsado, nivel }: { texto?: string; colapsado: boolean; nivel: number }): React.JSX.Element {
  return (
    <Box
      sx={{
        flex: colapsado ? '0 0 0' : '1 1 auto',
        maxWidth: colapsado ? 0 : 'none',
        opacity: colapsado ? 0 : 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: 'opacity 0.15s ease',
      }}
    >
      <Typography
        component="span"
        sx={{ color: 'inherit', fontSize: nivel > 0 ? '0.9rem' : '1rem', fontWeight: 500, lineHeight: '28px' }}
      >
        {texto}
      </Typography>
    </Box>
  );
}

function NavEnlace({ item, nivel, ctx }: { item: NavItemConfig; nivel: number; ctx: ContextoNav }): React.JSX.Element {
  const { href, external, disabled, title, icon, key } = item;
  const activo = ctx.claveActiva === key;
  // Los sub-items no se muestran con el menú plegado (van en el popover del grupo).
  const mostrarIcono = nivel === 0;

  return (
    <li>
      <Tooltip title={ctx.colapsado && nivel === 0 ? title ?? '' : ''} placement="right" arrow>
        <Box
          // Ganchos de estilo para temporadas (hover caramelo, activo con nieve).
          className={['nav-item-temporada', activo && 'nav-item-activo', ctx.colapsado && 'nav-item-colapsado']
            .filter(Boolean)
            .join(' ')}
          aria-current={activo ? 'page' : undefined}
          aria-disabled={disabled || undefined}
          {...(href && !disabled
            ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
              onClick: ctx.alNavegar,
            }
            : { role: 'button', tabIndex: disabled ? -1 : 0 })}
          sx={estiloFila(nivel, ctx.colapsado, activo, disabled)}
        >
          {mostrarIcono ? <IconoNav icono={icon} /> : null}
          <EtiquetaNav texto={title} colapsado={ctx.colapsado} nivel={nivel} />
        </Box>
      </Tooltip>
    </li>
  );
}

function NavGrupo({ item, nivel, ctx }: { item: NavItemConfig; nivel: number; ctx: ContextoNav }): React.JSX.Element {
  const contieneActivo = contieneClave(item, ctx.claveActiva);
  const [abierto, setAbierto] = React.useState<boolean>(contieneActivo);
  const [ancla, setAncla] = React.useState<HTMLElement | null>(null);
  const idLista = `nav-grupo-${item.key}`;

  // Al navegar a un hijo (por ejemplo desde un enlace interno) el grupo se abre solo.
  React.useEffect(() => {
    if (contieneActivo) setAbierto(true);
  }, [contieneActivo]);

  const alPulsar = (e: React.MouseEvent<HTMLElement>): void => {
    if (ctx.colapsado) setAncla(e.currentTarget);
    else setAbierto((a) => !a);
  };

  return (
    <li>
      <Tooltip title={ctx.colapsado ? item.title ?? '' : ''} placement="right" arrow>
        <Box
          component="button"
          type="button"
          onClick={alPulsar}
          aria-expanded={ctx.colapsado ? Boolean(ancla) : abierto}
          aria-controls={idLista}
          sx={{
            ...estiloFila(nivel, ctx.colapsado, false),
            // Con un hijo activo el grupo se marca suave; el hijo lleva el color fuerte.
            ...(contieneActivo && { bgcolor: 'rgba(255,255,255,0.12)' }),
          }}
        >
          <IconoNav icono={item.icon} />
          <EtiquetaNav texto={item.title} colapsado={ctx.colapsado} nivel={nivel} />
          {!ctx.colapsado && (
            <CaretDown
              size={16}
              style={{ flex: '0 0 auto', transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            />
          )}
        </Box>
      </Tooltip>

      {/* Menú expandido: la lista se despliega en el sitio. */}
      {!ctx.colapsado && (
        <Collapse in={abierto} timeout="auto" unmountOnExit>
          <Box id={idLista} sx={{ pt: 0.5 }}>
            <ListaNav items={item.items ?? []} nivel={nivel + 1} ctx={ctx} />
          </Box>
        </Collapse>
      )}

      {/* Menú plegado: no hay sitio para desplegar, los hijos salen en un menú lateral. */}
      {ctx.colapsado && (
        <Menu
          id={idLista}
          anchorEl={ancla}
          open={Boolean(ancla)}
          onClose={() => setAncla(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: { sx: { bgcolor: NAV_FONDO, color: '#fff', minWidth: 200, ml: 1, backgroundImage: 'none' } },
          }}
        >
          <Typography sx={{ px: 2, py: 0.5, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            {item.title}
          </Typography>
          {(item.items ?? []).filter((h) => h.href).map((h) => (
            <MenuItem
              key={h.key}
              component={RouterLink}
              href={h.href as string}
              selected={ctx.claveActiva === h.key}
              onClick={() => {
                setAncla(null);
                ctx.alNavegar?.();
              }}
              sx={{ '&.Mui-selected': { bgcolor: NAV_ACTIVO }, '&.Mui-selected:hover': { bgcolor: NAV_ACTIVO } }}
            >
              {h.title}
            </MenuItem>
          ))}
        </Menu>
      )}
    </li>
  );
}
