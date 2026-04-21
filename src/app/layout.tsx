'use client'

import * as React from 'react';
import type { Viewport } from 'next';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import '@/styles/global.css';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Box, GlobalStyles, IconButton } from '@mui/material';
import { SideNav } from '@/components/dashboard/layout/side-nav';
import { MenuIcon } from 'lucide-react';
import Container from '@mui/material/Container';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';
import { MainNav } from '@/components/dashboard/layout/main-nav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1,
    }
  }
})

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <html lang="en">
      <head>
        <link href="/assets/icon-tair.jpg" rel="shortcut icon" type="image/vnd.microsoft.icon"></link>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider>
            <UserProvider>
              <ThemeProvider>
                <TooltipProvider>

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
                        <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
                      </Box>

                      {/* Botón hamburguesa solo en móvil */}
                      <IconButton
                        onClick={() => setMobileOpen(true)}
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
                      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

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


                </TooltipProvider>
              </ThemeProvider>
            </UserProvider>
          </LocalizationProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster position="bottom-right" richColors />
        </QueryClientProvider>
      </body>
    </html>
  );
}
