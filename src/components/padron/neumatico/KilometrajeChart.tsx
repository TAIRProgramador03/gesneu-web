
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
  placa: string
  odometro: number
  km_etapa: number
}

function CustomTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs min-w-40">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-gray-800">{d.placa}</span>
        <span className="text-gray-400">{d.fecha}</span>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">Recorrido en etapa</span>
          <span className="font-bold text-blue-600">{d.km_etapa} km</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">Remanente</span>
          <span className="font-semibold text-gray-700">{d.remanente} mm</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">Odómetro</span>
          <span className="text-gray-700">{d.odometro - d.km_etapa} → {d.odometro} km</span>
        </div>
      </div>
    </div>
  )
}

export const KilometrajeChart = ({ historial, neu }: { historial: MovimientoHistorial[]; neu: NeumaticoBuscado }) => {

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...historial]
      .filter((h) => h.ACCION_REALIZADA === 'INSPECCION RUTINARIA' && h.KM_RECORRIDOS_EN_ETAPA !== 0)
      .map((m) => {
        const raw = m.FECHA_MOVIMIENTO
        return {
          id: m.ID_MOVIMIENTO,
          fecha: convertToDateHuman(raw),
          remanente: m.REMANENTE_MEDIDO_MM,
          tipo: `${m.ACCION_REALIZADA.charAt(0).toUpperCase()}${m.ACCION_REALIZADA.slice(1).toLowerCase()}`,
          label: `${convertToDateHuman(raw)}`,
          placa: m.PLACA_VEHICULO,
          odometro: m.ODOMETRO_VEHICULAR,
          km_etapa: m.KM_RECORRIDOS_EN_ETAPA
        }
      })
  }, [historial])

  if (chartData.length <= 0) return null

  const REMANENTE_MINIMO = 3
  const original = 0
  const maxY = Math.max(original, ...chartData.map((d) => d.km_etapa)) + 2
  const strokeColorD = "#3b82f6"
  const fillColorD = "#3b82f6"

  return (
    <CollapsibleSection title="Kilómetros recorridos entre inspecciones" icon={<BarChart3 className="size-4" />} border='border-sky-500' >
      <div className="h-70 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="km_etapaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColorD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={fillColorD} stopOpacity={0} />
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
              unit=" km"
            />
            <RechartsTooltip content={<CustomTooltipContent />} />
            <Area
              type="monotone"
              dataKey="km_etapa"
              stroke={strokeColorD}
              strokeWidth={2.5}
              fill="url(#km_etapaFill)"
              dot={{ r: 4, fill: "#fff", stroke: strokeColorD, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: strokeColorD, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CollapsibleSection>
  )
}
