'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { setupAxiosInterceptors } from '@/lib/auth/axios-interceptors';

export function AxiosInterceptorLoader(): null {
  useEffect(() => {
    setupAxiosInterceptors((msg) => {
      if (msg) toast.error(msg);
    });
  }, []);
  return null;
}
