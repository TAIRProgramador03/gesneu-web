import axios, { AxiosError } from 'axios';

import { paths } from '@/paths';

let interceptorId: number | null = null;
let isRedirecting = false;

const IGNORED_401_PATHS = ['/api/login', '/api/session'];

export function setupAxiosInterceptors(onSessionError?: (error: string | null) => void): void {
  // Evitar instalar el interceptor más de una vez.
  if (interceptorId !== null) return;

  interceptorId = axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url ?? '';

      if (status === 401 && !IGNORED_401_PATHS.some((p) => url.includes(p))) {
        // Solo en el navegador y si no estamos ya en una página de auth.
        const onAuthPage =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');

        if (typeof window !== 'undefined' && !onAuthPage && !isRedirecting) {
          isRedirecting = true;
          onSessionError?.('Tu sesión expiró. Inicia sesión nuevamente.');
          localStorage.removeItem('custom-auth-token');
          window.location.href = paths.auth.signIn;
        }
      }

      return Promise.reject(error);
    }
  );
}
