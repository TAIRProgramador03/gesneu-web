import { cn } from '@/lib/utils';
import React from 'react'

export const Sparkline = ({ points, color }: { points: number[]; color: string }) => {
  if (points.length < 2) return null

  const h = 48
  const w = 200
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const pad = 4

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (w - pad * 2),
    y: pad + ((max - v) / range) * (h - pad * 2),
  }))

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ")
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${h} L ${coords[0].x},${h} Z`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={color} stopOpacity="0.15" />
          <stop offset="100%" className={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${color})`} />
      <path d={linePath} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color.replace("stop-", "stroke-")} />
      {/* Last point dot */}
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="3"
        className={cn(color.replace("stop-", "fill-"))}
      />
    </svg>
  )
}
