import React from "react"
import { NeumaticoDashboard } from "./NeumaticoDashboard"

export default async function Page({ params }: { params: Promise<{ codigo: string }> }): Promise<React.JSX.Element> {
  const { codigo } = await params
  return <NeumaticoDashboard codigo={codigo} />
}
