'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

import { useUser } from '@/hooks/use-user';
import { filtrarNavSecciones, navSecciones } from './config';
import { ANCHO_MOBILENAV, NAV_FONDO } from './nav-constantes';
import { NavMenu } from './nav-menu';

export interface MobileNavProps {
  onClose?: () => void;
  open?: boolean;
}

/** Drawer del menú en teléfono y tablet. Usa el mismo NavMenu y colores que el sidebar. */
export function MobileNav({ open, onClose }: MobileNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const secciones = React.useMemo(
    () => filtrarNavSecciones(navSecciones, user?.usuario ?? ''),
    [user?.usuario]
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: NAV_FONDO,
          backgroundImage: 'none',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          maxWidth: '85vw',
          width: ANCHO_MOBILENAV,
        },
      }}
    >
      <Box sx={{ px: 3, py: 2.5, flex: '0 0 auto' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.3rem' }}>
          Gestor de Neumáticos
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: '12px',
          pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <NavMenu secciones={secciones} pathname={pathname} alNavegar={onClose} />
      </Box>
    </Drawer>
  );
}
