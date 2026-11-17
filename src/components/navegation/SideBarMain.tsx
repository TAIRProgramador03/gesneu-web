'use client'
import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';
import { ANCHO_SIDENAV, ANCHO_SIDENAV_COLAPSADO } from '@/components/dashboard/layout/nav-constantes';

export const SideBarMain = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  // Hasta leer lo guardado no se anima: así el menú no "se encoge" al abrir la app.
  const [animar, setAnimar] = useState<boolean>(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    } catch {
      // localStorage bloqueado: queda desplegado.
    }
    const id = requestAnimationFrame(() => setAnimar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSetCollapsed = (value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem('sidebar-collapsed', String(value));
    } catch {
      // sin persistencia, el cambio igual se aplica en esta sesión.
    }
  };

  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': `${ANCHO_SIDENAV}px`,
            '--SideNav-zIndex': 1100,
          },
        }}
      />
      <Box
        sx={{
          // Este Box envuelve TODAS las pantallas de la app. Estaba fijo en
          // #f5f5f5, así que en modo oscuro quedaba un marco gris claro
          // alrededor de todo, y cualquier tarjeta con fondo translúcido
          // dejaba ver ese gris por detrás.
          bgcolor: 'var(--fondo-app)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          // dvh: en el navegador del teléfono 100vh incluye la barra de direcciones
          // y deja cortado el borde inferior.
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        {/* SideNav fijo solo desde lg. Por debajo, el menú es el drawer que abre MainNav
            (mismo breakpoint que el botón hamburguesa, para que nunca convivan). */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
          <SideNav collapsed={collapsed} setCollapsed={handleSetCollapsed} animar={animar} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            pl: { lg: collapsed ? `${ANCHO_SIDENAV_COLAPSADO}px` : 'var(--SideNav-width)' },
            transition: animar ? 'padding-left 0.2s' : 'none',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <MainNav />
          <main style={{ flex: 1, overflow: 'auto', height: '100%' }}>
            <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  )
}
