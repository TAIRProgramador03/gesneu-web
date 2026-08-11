import * as React from 'react';
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
  return <>{children}</>
}
