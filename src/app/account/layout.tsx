import React from 'react'
import { Metadata } from 'next'
import { config } from '@/config';

export const metadata: Metadata = {
  title: `Cuenta | ${config.site.name}`,
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
