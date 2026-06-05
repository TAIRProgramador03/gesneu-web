'use client';

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { WifiHigh as WifiHighIcon } from '@phosphor-icons/react/dist/ssr/WifiHigh';
import { WifiLow as WifiLowIcon } from '@phosphor-icons/react/dist/ssr/WifiLow';
import { WifiSlash as WifiSlashIcon } from '@phosphor-icons/react/dist/ssr/WifiSlash';

import { useConnectionStatus } from '@/hooks/use-connection-status';

const CONFIG = {
  online: { color: '#15b79f', label: 'Conectado', Icon: WifiHighIcon },
  low: { color: '#fb9c0c', label: 'Baja señal', Icon: WifiLowIcon },
  offline: { color: '#f04438', label: 'Sin conexión', Icon: WifiSlashIcon },
} as const;

export function ConnectionStatus(): React.JSX.Element {
  const { status, latency } = useConnectionStatus();
  const { color, label, Icon } = CONFIG[status];

  const title = latency !== null && status !== 'offline' ? `${label} · ${latency} ms` : label;

  return (
    <Tooltip title={title}>
      <span>
        <IconButton sx={{ color }}>
          <Icon weight="bold" />
        </IconButton>
      </span>
    </Tooltip>
  );
}
