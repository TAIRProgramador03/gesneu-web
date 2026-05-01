
import React from 'react'

export default async function Page({ params }: { params: Promise<{ placa: string }> }): Promise<React.JSX.Element> {
  const { placa } = await params
  return (
    <>
      <p>Esta es la página de la placa:</p>
      <span>{placa}</span>
    </>
  )
}
