import React from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';

export const metadata = {
  title: `Gestion de Neumaticos`,
};

export const Layout = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <PermissionGuard blockedUsers={['GESNEU']}>
      {children}
    </PermissionGuard>
  );
}