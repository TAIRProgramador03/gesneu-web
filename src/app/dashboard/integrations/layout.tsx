import React from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';

export const metadata = {
  title: `Asignación | Gesneu`,
};

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <PermissionGuard blockedUsers={['GESNEU']}>
      {children}
    </PermissionGuard>
  );
}