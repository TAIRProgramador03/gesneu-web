import { useEffect } from 'react';
import { useSessionError } from '../contexts/session-error-context';
import { setupAxiosInterceptors } from '@/lib/auth/axios-interceptors';

export function AxiosInterceptorLoader() {
  const { setSessionError } = useSessionError();
  useEffect(() => {
    setupAxiosInterceptors(setSessionError);
  }, [setSessionError]);
  return null;
}