'use client';

import * as React from 'react';
import Tooltip from '@mui/material/Tooltip';

import { useConnectionStatus } from '@/hooks/use-connection-status';

const CONFIG = {
  online: { color: '#15b79f', label: 'Conectado' },
  low: { color: '#fb9c0c', label: 'Baja señal' },
  offline: { color: '#f04438', label: 'Sin conexión' },
} as const;

/** Punto de color que late: verde conectado, ámbar con baja señal, rojo sin conexión. */
export function ConnectionStatus(): React.JSX.Element {
  const { status, latency } = useConnectionStatus();
  const { color, label } = CONFIG[status];

  const title = latency !== null && status !== 'offline' ? `${label} · ${latency} ms` : label;

  return (
    <Tooltip title={title}>
      <span
        role="status"
        aria-label={title}
        className="relative mx-2 inline-flex size-3 shrink-0 items-center justify-center"
      >
        <span
          className="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
          style={{ backgroundColor: color }}
        />
        <span
          className="relative inline-flex size-2.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </span>
    </Tooltip>
  );
}
