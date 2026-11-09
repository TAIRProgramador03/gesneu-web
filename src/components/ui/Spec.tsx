import React from 'react'

export const Spec = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <span className="text-texto-apagado block">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
