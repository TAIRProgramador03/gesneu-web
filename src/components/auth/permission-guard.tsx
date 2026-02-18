'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';

export interface PermissionGuardProps {
  children: React.ReactNode;
  blockedUsers?: string[];
}

export function PermissionGuard({ children, blockedUsers = [] }: PermissionGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (isLoading) return;

    if (user && blockedUsers.includes(user.usuario?.trim() ?? '')) {
      router.replace(paths.dashboard.overview);
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, blockedUsers, router]);

  if (isChecking || isLoading) return null;

  return <React.Fragment>{children}</React.Fragment>;
}
