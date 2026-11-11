'use client';

import * as React from 'react';
import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { usePopover } from '@/hooks/use-popover';
import { Decoracion } from '@/temporadas/temporada-provider';

import { ConnectionStatus } from './connection-status';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { UserPopover } from './user-popover';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: '1',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton
              onClick={(): void => {
                setOpenNav(true);
              }}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>
          </Stack>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            {/* <ThemeToggle /> */}
            <Decoracion nombre="arbolitoCabecera" />
            <ConnectionStatus />
            {/* <Tooltip title="Contactos">
              <span>
                <IconButton disabled={true}>
                  <UsersIcon />
                </IconButton>
              </span>
            </Tooltip> */}
            {/* <Tooltip title="Notificaciones">
              <span>
                <IconButton disabled={true}>
                  <BellIcon />
                </IconButton>
              </span>
            </Tooltip> */}
            {/* font-size = diámetro del avatar: el gorro de temporada se mide en em. */}
            <Box sx={{ position: 'relative', fontSize: 40, lineHeight: 0, flexShrink: 0 }}>
              <Avatar
                onClick={userPopover.handleOpen}
                ref={userPopover.anchorRef}
                src="/assets/avatar.png"
                sx={{ cursor: 'pointer' }}
              />
              <Decoracion nombre="sombreroAvatar" />
            </Box>
          </Stack>
        </Stack>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
      <MobileNav
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
    </React.Fragment>
  );
}
