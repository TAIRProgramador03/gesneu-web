'use client';

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Desktop as DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop';
import { Moon as MoonIcon } from '@phosphor-icons/react/dist/ssr/Moon';
import { Sun as SunIcon } from '@phosphor-icons/react/dist/ssr/Sun';
import { useTheme } from 'next-themes';

type Modo = 'light' | 'dark' | 'system';

const OPCIONES: { valor: Modo; etiqueta: string; Icon: React.ElementType }[] = [
  { valor: 'light', etiqueta: 'Claro', Icon: SunIcon },
  { valor: 'dark', etiqueta: 'Oscuro', Icon: MoonIcon },
  { valor: 'system', etiqueta: 'Según el sistema', Icon: DesktopIcon },
];

export function ThemeToggle(): React.JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  // En el servidor no se sabe qué modo tiene guardado el navegador. Pintar el
  // ícono antes de montar produce mismatch de hidratación, así que hasta que
  // monta se muestra el del modo claro y después se corrige.
  const [montado, setMontado] = React.useState(false);
  React.useEffect(() => {
    setMontado(true);
  }, []);

  const modoActual = (theme as Modo | undefined) ?? 'light';
  const esOscuro = montado && resolvedTheme === 'dark';
  const IconoActual = esOscuro ? MoonIcon : SunIcon;

  const titulo = montado
    ? `Tema: ${OPCIONES.find((o) => o.valor === modoActual)?.etiqueta ?? 'Claro'}`
    : 'Tema';

  return (
    <React.Fragment>
      <Tooltip title={titulo}>
        <IconButton
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
          aria-label="Cambiar tema"
        >
          <IconoActual weight="bold" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {OPCIONES.map(({ valor, etiqueta, Icon }) => (
          <MenuItem
            key={valor}
            selected={montado && modoActual === valor}
            onClick={() => {
              setTheme(valor);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>{etiqueta}</ListItemText>
            {montado && modoActual === valor ? (
              <CheckIcon style={{ marginLeft: 12 }} color="var(--mui-palette-primary-main)" />
            ) : null}
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
}
