'use client'

import * as React from 'react';
import type { Viewport } from 'next';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import '@/styles/global.css';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NextTopLoader from 'nextjs-toploader';
import { UserProvider } from '@/contexts/user-context';
import { AxiosInterceptorLoader } from '@/components/AxiosInterceptorLoader';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    }
  }
})

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  // suppressHydrationWarning: next-themes escribe la clase `.dark` y el
  // atributo de MUI en el <html> desde un script inline, antes de hidratar.
  // Sin esto React marca el mismatch en cada carga en modo oscuro.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/assets/icon-tair-2.png" rel="shortcut icon" type="image/vnd.microsoft.icon"></link>
        <title>Gesneu</title>
      </head>
      <body>
        <NextTopLoader color="#167bd9" showSpinner={false} />
        <QueryClientProvider client={queryClient}>
          <AxiosInterceptorLoader />
          <LocalizationProvider>
            <UserProvider>
              <ThemeProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
                {/* El Toaster va DENTRO del ThemeProvider: lee el tema con
                    useTheme() de next-themes y fuera del provider siempre
                    creía estar en claro, así que los avisos salían blancos
                    sobre la app oscura. */}
                <Toaster position="bottom-right" richColors />
              </ThemeProvider>
            </UserProvider>
          </LocalizationProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}