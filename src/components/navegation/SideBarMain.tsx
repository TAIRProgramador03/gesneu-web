'use client'
import React, { useState } from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';
import { useSideBar } from '@/hooks/use-side-bar';

export const SideBarMain = ({ children }: { children: React.ReactNode }) => {

  const { mobileOpen, collapsed, handleChangeMobileOpen, handleChangeCollapsed } = useSideBar()

  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '280px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />
      {/* #FFF8E1  */}
      <Box
        sx={{
          bgcolor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* SideNav solo visible en escritorio */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <SideNav collapsed={collapsed} setCollapsed={handleChangeCollapsed} />
        </Box>

        {/* Botón hamburguesa solo en móvil */}
        <IconButton
          onClick={() => handleChangeMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            display: { xs: 'inline-flex', md: 'none' },
            bgcolor: '#fff',
            boxShadow: 1,
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Drawer móvil */}
        <MobileNav open={mobileOpen} onClose={() => handleChangeMobileOpen(false)} />

        {/* ...resto del layout... */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            pl: { lg: collapsed ? '72px' : 'var(--SideNav-width)' },
            transition: 'padding-left 0.2s',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <MainNav />
          <main style={{ flex: 1, overflow: 'auto', height: '100%' }}>
            <Container maxWidth={false} sx={{ py: '32px', px: { xs: 1, md: 3 }, marginTop: '17px' }}>
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  )
}
