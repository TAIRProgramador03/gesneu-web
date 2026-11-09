"use client"

import React from "react"
import { SearchX, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  height?: number
  className?: string
}

export function EmptyState({
  icon: Icon = SearchX,
  title = "Sin resultados",
  description = "No encontramos datos para los filtros seleccionados. Prueba ajustando o limpiando los filtros.",
  height = 340,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-superficie-1/60 px-6 text-center",
        className
      )}
      style={{ height }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-superficie-2">
        <Icon className="h-7 w-7 text-texto-apagado" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-texto-apagado">{description}</p>
      </div>
    </div>
  )
}
