import { cn } from '@/lib/utils'
import { vidaBgBar, vidaColor, vidaRingColor, vidaTrackColor } from '@/utils/helpers'
import React from 'react'

export const SemiGauge = ({ pct }: { pct: number }) => {

  const radius = 80
  const stroke = 12
  const r = radius - stroke / 2
  const halfCirc = r * Math.PI
  const offset = halfCirc - (Math.min(pct, 100) / 100) * halfCirc

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={radius * 2}
        height={radius + 8}
        viewBox={`0 0 ${radius * 2} ${radius + 8}`}
      >
        <path
          d={`M ${stroke / 2},${radius} A ${r},${r} 0 0,1 ${radius * 2 - stroke / 2},${radius}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={vidaTrackColor(pct)}
        />
        <path
          d={`M ${stroke / 2},${radius} A ${r},${r} 0 0,1 ${radius * 2 - stroke / 2},${radius}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          className={cn(vidaRingColor(pct), "transition-all duration-700 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className={cn("text-4xl font-extrabold leading-none", vidaColor(pct))}>
          {pct}<span className="text-lg">%</span>
        </span>
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-semibold mt-1.5",
          pct < 39 ? "bg-red-50 text-red-700" :
            pct < 79 ? "bg-yellow-50 text-yellow-700" :
              "bg-teal-50 text-teal-700"
        )}>
          <span className={cn("size-1.5 rounded-full", vidaBgBar(pct))} />
          {pct < 39 ? "Desgaste crítico" : pct < 79 ? "Desgaste regular" : "Buen estado"}
        </div>
      </div>
    </div>
  )
}
