"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface DonutChartSkeletonProps {
  legendItems?: number
  size?: number
  className?: string
}

export function DonutChartSkeleton({ legendItems = 4, size = 230, className }: DonutChartSkeletonProps) {
  return (
    <div className={cn("w-full animate-pulse", className)}>
      {/* anillo del donut */}
      <div className="relative flex items-center justify-center" style={{ height: size }}>
        <div
          className="skeleton-shimmer rounded-full"
          style={{
            width: size - 32,
            height: size - 32,
            mask: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))",
          }}
        />

        {/* total en el centro */}
        <div className="absolute flex flex-col items-center gap-1.5">
          <div className="skeleton-shimmer h-6 w-12 rounded" />
          <div className="skeleton-shimmer h-2.5 w-9 rounded" />
        </div>
      </div>

      {/* leyenda */}
      <div className="mt-1 flex flex-col gap-2.5">
        {Array.from({ length: legendItems }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="skeleton-shimmer h-2.5 w-2.5 shrink-0 rounded-sm" />
            <div className="skeleton-shimmer h-3 flex-1 rounded" />
            <div className="skeleton-shimmer h-3.5 w-8 rounded" />
            <div className="skeleton-shimmer h-2.5 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
