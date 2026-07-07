"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface BarChartSkeletonProps {
  bars?: number
  height?: number
  className?: string
}

const HEIGHT_PATTERN = [55, 85, 40, 70, 95, 50, 65]

export function BarChartSkeleton({ bars = 6, height = 300, className }: BarChartSkeletonProps) {
  const heights = Array.from({ length: bars }, (_, i) => HEIGHT_PATTERN[i % HEIGHT_PATTERN.length])

  return (
    <div className={cn("w-full animate-pulse", className)} style={{ height }}>
      {/* pill de leyenda */}
      <div className="mb-4 flex gap-2">
        <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        <div className="skeleton-shimmer h-3 w-16 rounded-full" />
      </div>

      {/* area del grafico: lineas guia + barras */}
      <div className="relative flex h-[calc(100%-3.5rem)] items-end justify-around gap-3 border-b border-l border-slate-200 px-2 pb-0">
        {/* lineas horizontales guia */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-full flex-col justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-px w-full bg-slate-100" />
          ))}
        </div>

        {heights.map((h, i) => (
          <div key={i} className="relative z-10 flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="skeleton-shimmer h-3 w-6 rounded" />
            <div
              className="skeleton-shimmer w-full rounded-t-lg"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>

      {/* labels del eje X */}
      <div className="mt-2 flex justify-around gap-3 px-2">
        {heights.map((_, i) => (
          <div key={i} className="skeleton-shimmer h-2.5 w-10 rounded" />
        ))}
      </div>
    </div>
  )
}
