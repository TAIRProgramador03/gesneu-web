import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';
import { SideBarMain } from '@/components/navegation/SideBarMain';

export const metadata: Metadata = {
  title: `Padrón | ${config.site.name}`,
}

export default function PadronLayout({
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
