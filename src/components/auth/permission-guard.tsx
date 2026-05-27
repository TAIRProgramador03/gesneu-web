'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';

export interface PermissionGuardProps {
  children: React.ReactNode;
  blockedUsers?: string[];
  allowedUsers?: string[];
}

export function PermissionGuard({ children, blockedUsers = [], allowedUsers }: PermissionGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (isLoading) return;

    const username = user?.usuario?.trim() ?? '';

    if (allowedUsers && allowedUsers.length > 0) {
      if (!user || !allowedUsers.includes(username)) {
        router.replace(paths.dashboard.overview);
        return;
      }
    } else if (user && blockedUsers.includes(username)) {
      router.replace(paths.dashboard.overview);
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, blockedUsers, allowedUsers, router]);

  if (isChecking || isLoading) return null;

  return <React.Fragment>{children}</React.Fragment>;
}
