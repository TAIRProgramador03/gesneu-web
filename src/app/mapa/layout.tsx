import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';
import { SideBarMain } from '@/components/navegation/SideBarMain';
import { PermissionGuard } from '@/components/auth/permission-guard';

export const metadata: Metadata = {
  title: `Mapa de Talleres | ${config.site.name}`,
}

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SideBarMain>
      {/* <PermissionGuard allowedUsers={['GESNEU', 'EGAMBOA']}> */}
      {children}
      {/* </PermissionGuard> */}
    </SideBarMain>
  )
}
