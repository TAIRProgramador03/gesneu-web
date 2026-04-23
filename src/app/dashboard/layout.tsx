import * as React from 'react';
import { SideBarMain } from '@/components/navegation/SideBarMain';
import { config } from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Dashboard | ${config.site.name}`,
}

export default function DashboardLayout({
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
