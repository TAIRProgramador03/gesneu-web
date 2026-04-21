import React from "react"

export default async function Page({ params }: { params: Promise<{ codigo: string }> }): Promise<React.JSX.Element> {

  const { codigo } = await params

  return (
    <h1>Hola, este es el código del neúmatico a revisar: {codigo}</h1>
  )
}