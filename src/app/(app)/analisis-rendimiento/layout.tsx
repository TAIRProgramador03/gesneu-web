import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';
import { PermissionGuard } from '@/components/auth/permission-guard';

export const metadata: Metadata = {
  title: `Análisis | ${config.site.name}`,
}

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionGuard allowedUsers={['GESNEU', 'EGAMBOA']}>
      {children}
    </PermissionGuard>
  )
}
