export const runtime = 'edge';
import React from 'react'
import { PlacaDashboard } from './PlacaDashboard'

export default async function Page({ params }: { params: Promise<{ placa: string }> }): Promise<React.JSX.Element> {
  const { placa } = await params
  return <PlacaDashboard placa={placa} />
}
