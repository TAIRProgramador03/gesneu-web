import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';

export const metadata: Metadata = {
  title: `Movimientos | ${config.site.name}`,
}

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
