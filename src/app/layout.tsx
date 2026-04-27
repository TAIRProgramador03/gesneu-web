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
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  return (
    <html lang="en">
      <head>
        <link href="/assets/icon-tair-2.png" rel="shortcut icon" type="image/vnd.microsoft.icon"></link>
        <title>Gesneu</title>
      </head>
      <body>
        <NextTopLoader color="#167bd9" showSpinner={false} />
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider>
            <UserProvider>
              <ThemeProvider>
                <TooltipProvider>
                  {children}
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