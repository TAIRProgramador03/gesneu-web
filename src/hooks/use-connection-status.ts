'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export type ConnectionStatus = 'online' | 'low' | 'offline';

interface UseConnectionStatusOptions {
  /** Ruta ligera para el heartbeat. */
  url?: string;
  /** Intervalo entre chequeos (ms). */
  intervalMs?: number;
  /** Timeout del heartbeat antes de considerarlo caído (ms). */
  timeoutMs?: number;
  /** Latencia (ms) por encima de la cual se considera "baja señal". */
  slowThresholdMs?: number;
}

// Network Information API (solo Chromium/Android). No tipada en TS por defecto.
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: 'change', cb: () => void) => void;
  removeEventListener?: (type: 'change', cb: () => void) => void;
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}): {
  status: ConnectionStatus;
  latency: number | null;
} {
  const {
    url = '/api/health',
    intervalMs = 15_000,
    timeoutMs = 5_000,
    slowThresholdMs = 1_500,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [latency, setLatency] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check(): Promise<void> {
      // Sin red de plano -> offline directo.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!cancelled) {
          setStatus('offline');
          setLatency(null);
        }
        return;
      }

      const start = performance.now();

      try {
        await axios.get(url, {
          withCredentials: true,
          timeout: timeoutMs,
          headers: { 'Cache-Control': 'no-store' },
        });
        const elapsed = performance.now() - start;
        if (cancelled) return;

        // axios lanza error si status no es 2xx, así que aquí ya es OK.
        setLatency(Math.round(elapsed));

        // Combinar latencia medida + Network Information API.
        const conn = getConnection();
        const slowType = conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g';
        if (elapsed > slowThresholdMs || slowType) {
          setStatus('low');
        } else {
          setStatus('online');
        }
      } catch {
        if (!cancelled) {
          setStatus('offline');
          setLatency(null);
        }
      }
    }

    // Chequeo inmediato + intervalo.
    void check();
    timerRef.current = setInterval(() => {
      void check();
    }, intervalMs);

    // Eventos del navegador: reaccionar al instante.
    const onOnline = (): void => {
      void check();
    };
    const onOffline = (): void => {
      setStatus('offline');
      setLatency(null);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const conn = getConnection();
    conn?.addEventListener?.('change', onOnline);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      conn?.removeEventListener?.('change', onOnline);
    };
  }, [url, intervalMs, timeoutMs, slowThresholdMs]);

  return { status, latency };
}
