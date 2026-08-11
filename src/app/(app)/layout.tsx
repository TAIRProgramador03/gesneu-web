import * as React from 'react';
import { SideBarMain } from '@/components/navegation/SideBarMain';

export default function AppLayout({
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
