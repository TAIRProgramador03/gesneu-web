import React from 'react'

export const Spec = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <span className="text-gray-400 block">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
