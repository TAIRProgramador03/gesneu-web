'use client';

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { Experimental_CssVarsProvider as CssVarsProvider, useColorScheme } from '@mui/material/styles';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

import { createTheme } from '@/styles/theme/create-theme';

import EmotionCache from './emotion-cache';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * La app tiene dos sistemas de color que no se hablan:
 *   - Tailwind/shadcn mira la clase `.dark` del <html>
 *   - MUI mira el atributo `data-mui-color-scheme` del <html>
 *
 * next-themes es el único dueño del estado (persiste en localStorage y sabe
 * seguir al sistema operativo) y escribe LOS DOS marcadores desde su script
 * inline, antes del primer pintado: por eso no hay flash blanco al recargar.
 *
 * Este puente existe igual porque MUI además guarda el modo en su propio
 * estado de React, y hay componentes que lo leen con `useColorScheme()`
 * (por ejemplo `core/logo.tsx`). Sin esto, el atributo cambiaría pero esos
 * componentes seguirían creyendo que estamos en claro.
 */
function PuenteModoMui({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { resolvedTheme } = useTheme();
  const { mode, setMode } = useColorScheme();

  React.useEffect(() => {
    if (resolvedTheme !== 'dark' && resolvedTheme !== 'light') return;
    if (mode === resolvedTheme) return;
    setMode(resolvedTheme);
  }, [resolvedTheme, mode, setMode]);

  return <>{children}</>;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const theme = React.useMemo(() => createTheme(), []);

  return (
    <NextThemesProvider
      attribute={['class', 'data-mui-color-scheme']}
      defaultTheme="light"
      enableSystem
      storageKey="gesneu-tema"
      // Sin esto, cada transition de color de la app se dispara a la vez al
      // cambiar de modo y el cambio se ve como un barrido sucio.
      disableTransitionOnChange
    >
      <EmotionCache options={{ key: 'mui' }}>
        <CssVarsProvider theme={theme} defaultMode="light">
          <CssBaseline />
          <PuenteModoMui>{children}</PuenteModoMui>
        </CssVarsProvider>
      </EmotionCache>
    </NextThemesProvider>
  );
}
