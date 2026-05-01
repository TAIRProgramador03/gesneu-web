import React, { useMemo } from 'react'
import { NeumaticoBuscado } from '@/api/Neumaticos';
import { MovimientoHistorial } from '@/hooks/use-neumatico-detail';
import { convertToDateHuman } from '@/lib/utils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { BarChart3 } from 'lucide-react';
import { AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, ReferenceLine, Area } from 'recharts';

interface ChartDataPoint {
  id: number
  fecha: string
  remanente: number
  tipo: string
  label: string
}

function CustomTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800">{d.label}</p>
      <p className="text-gray-500 mt-0.5">{d.tipo}</p>
      <p className="font-bold text-sky-700 mt-1">{d.remanente} mm</p>
    </div>
  )
}

export const RemanenteChart = ({ historial, neu }: { historial: MovimientoHistorial[]; neu: NeumaticoBuscado }) => {

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...historial]
      .map((m) => {
        const raw = m.FECHA_MOVIMIENTO
        return {
          id: m.ID_MOVIMIENTO,
          fecha: convertToDateHuman(raw),
          remanente: m.REMANENTE_MEDIDO_MM,
          tipo: `${m.ACCION_REALIZADA.charAt(0).toUpperCase()}${m.ACCION_REALIZADA.slice(1).toLowerCase()}`,
          label: `${convertToDateHuman(raw)}`,
        }
      })
  }, [historial])

  if (chartData.length < 2) return null

  const REMANENTE_MINIMO = 3
  const original = neu.REMANENTE_MONTADO ?? 0
  const maxY = Math.max(original, ...chartData.map((d) => d.remanente)) + 2
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const strokeColor = pct >= 60 ? "#14b8a6" : pct >= 30 ? "#eab308" : "#ef4444"
  const fillColor = pct >= 60 ? "#14b8a6" : pct >= 30 ? "#eab308" : "#ef4444"

  return (
    <CollapsibleSection title="Evolución del Remanente" icon={<BarChart3 className="size-4" />} border='border-sky-500' >
      <div className="h-70 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="remanenteFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="id"
              tickFormatter={(id) => chartData.find((d) => d.id === id)?.fecha ?? String(id)}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              unit=" mm"
            />
            <RechartsTooltip content={<CustomTooltipContent />} />
            {/* Minimum threshold line */}
            <ReferenceLine
              y={REMANENTE_MINIMO}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Mínimo ${REMANENTE_MINIMO} mm`,
                position: "insideBottomRight",
                fontSize: 10,
                fill: "#ef4444",
              }}
            />
            {/* Original remanente reference */}
            {original > 0 && (
              <ReferenceLine
                y={original}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `Montado ${original} mm`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#94a3b8",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="remanente"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#remanenteFill)"
              dot={{ r: 4, fill: "#fff", stroke: strokeColor, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: strokeColor, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CollapsibleSection>
  )
}
