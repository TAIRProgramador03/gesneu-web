import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';
import { SideBarMain } from '@/components/navegation/SideBarMain';

export const metadata: Metadata = {
  title: `Movimientos | ${config.site.name}`,
}

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SideBarMain>
      {children}
    </SideBarMain>
  )
}
