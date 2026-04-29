'use client';

import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { obtenerCodigosNeumaticosDesgastadosPorMilKms, obtenerDesgastePorMilKms } from '@/api/Neumaticos';
import { Divider, Skeleton } from '@mui/material';
import { BadgeCheck } from 'lucide-react';
import SelectBetter, { MultiValue } from 'react-select'
import Select from 'react-select/dist/declarations/src/Select';

function getTasaColor(desgasteMilKms: number): string {
  if (desgasteMilKms > 2.5) return '#EF4444';
  if (desgasteMilKms > 1.5) return '#F59E0B';
  return '#22C55E';
}

function getTasaBg(desgasteMilKms: number): string {
  if (desgasteMilKms > 2.5) return '#EF444415';
  if (desgasteMilKms > 1.5) return '#F59E0B15';
  return '#22C55E15';
}

function DesgasteTooltip({ active, payload, fleetAvg }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  const { codNeumatico, desgasteMilKms, remanenteMontado, remanenteActual, costoPorKm, kmTotales, costo, marca, placa, posicion, kmRemanente } = payload[0].payload;
  const color = getTasaColor(desgasteMilKms);
  const severity = desgasteMilKms > 2.5 ? 'Alto' : desgasteMilKms > 1.5 ? 'Moderado' : 'Normal';

  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
    }}>
      <div>
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'} mb-4`} >
          {codNeumatico}
        </span>
        <span className='text-[10px] font-light'>
          &nbsp; {marca} &middot; {placa} &middot; {posicion}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Km. recorrido</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{kmTotales}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Tasa desgaste</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{desgasteMilKms.toFixed(1)} mm/1000km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Remanente montado</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{remanenteMontado}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Remanente actual</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{remanenteActual}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Costo</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>${costo}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Costo * Km.</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>${costoPorKm}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Km. * mm</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{kmRemanente}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>Desgaste</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color,
            background: getTasaBg(desgasteMilKms),
            borderRadius: 4, padding: '1px 6px',
          }}>
            {severity}
          </span>
        </div>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2, paddingTop: 6, borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Promedio flota</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{fleetAvg} mm/1000km</span>
        </div> */}
      </div>
    </div>
  );
}

function TasaLabel({ x, y, width, height, index, desgastes }: any) {
  const item = desgastes[index as number];
  if (!item) return null;
  const color = getTasaColor(item.desgasteMilKms);
  return (
    <text
      x={(x as number) + (width as number) + 8}
      y={(y as number) + (height as number) / 2}
      dominantBaseline="middle"
      fontSize={12}
      fontWeight={700}
      fill={color}
    >
      {item.desgasteMilKms.toFixed(1)}
    </text>
  );
}

export const DesgasteNeumaticos = (): React.JSX.Element => {
  const theme = useTheme();

  const [selectedNeumaticos, setSelectedNeumaticos] = useState<MultiValue<{
    value: number;
    label: string;
  }>>([]);

  const initialized = useRef(false);

  const { data: codigosNeumaticos = [] } = useQuery({
    queryKey: ['codigos-neumaticos-desgastes-por-neumatico-1000-kms'],
    queryFn: obtenerCodigosNeumaticosDesgastadosPorMilKms
  })

  const codigosFormatSelect = useMemo(() =>
    codigosNeumaticos.map((n) => ({
      value: n.ID_NEUMATICO,
      label: n.CODIGO_NEUMATICO
    }))
    , [codigosNeumaticos])

  useEffect(() => {
    if (codigosFormatSelect.length > 0 && !initialized.current) {
      initialized.current = true;
      setSelectedNeumaticos(codigosFormatSelect.slice(0, 5));
    }
  }, [codigosFormatSelect])

  const { data = [], isLoading } = useQuery({
    queryKey: ['desgastes-por-neumatico-1000-kms', { values: selectedNeumaticos }],
    queryFn: () => obtenerDesgastePorMilKms(selectedNeumaticos),
    staleTime: 1000 * 60 * 5
  })

  const desgasteNeumaticos = useMemo(() => {
    const neumaticos = data.map((n) => ({
      idNeumatico: n.ID_NEUMATICO,
      codNeumatico: n.CODIGO_NEUMATICO,
      desgasteMilKms: n.DESGASTE_POR_1000KM,
      remanenteMontado: n.REMANENTE_MONTADO,
      remanenteActual: n.REMANENTE_ACTUAL,
      costoPorKm: n.COSTO_POR_KM,
      kmTotales: n.KM_TOTAL_VIDA_NEUMATICO,
      costo: n.COSTO_NEUMATICO,
      marca: n.MARCA_NEUMATICO,
      placa: n.PLACA_VEHICULO,
      posicion: n.POSICION_NEUMATICO,
      kmRemanente: n.KM_POR_REMAMENTE
    }))

    const alertCount = neumaticos.filter(d => d.desgasteMilKms > 2.0).length;
    const fleetAvg = neumaticos.length > 0
      ? parseFloat((neumaticos.reduce((sum, n) => sum + n.desgasteMilKms, 0) / neumaticos.length).toFixed(2))
      : 0;

    return { neumaticos, alertCount, fleetAvg }
  }, [data])

  const handleChange = (e: MultiValue<{
    value: number;
    label: string;
  }>) => {
    setSelectedNeumaticos(e)
  }

  return (
    <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column' }}>

      {
        isLoading && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton variant="rounded" height={16} width="55%" />
            <Skeleton variant="rounded" height={16} width="80%" />
            <Skeleton variant="rounded" height={140} sx={{ mt: 1 }} />
          </div>
        )
      }

      {
        desgasteNeumaticos.neumaticos.length === 0 && !isLoading && (
          <div className='flex gap-1 flex-wrap justify-center items-center bg-red-50 text-red-700 border-2 border-red-700 p-2 rounded-lg'>
            <BadgeCheck width={12} />
            <span className='italic text-xs'>Sin neumáticos asignados.</span>
          </div>
        )
      }

      {
        desgasteNeumaticos.neumaticos.length >= 1 && !isLoading && (
          <>
            <div className='mb-5'>
              <SelectBetter
                onChange={(e) => handleChange(e)}
                isMulti
                isSearchable
                isDisabled={isLoading}
                isOptionDisabled={(option) =>
                  selectedNeumaticos.length >= 8
                }
                styles={{
                  multiValue: (base, state) => ({
                    ...base,
                    backgroundColor: '#edf3fe',
                    borderRadius: '6px',
                    border: '.5px solid #3B82F6'
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#3B82F6',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#364153',
                    borderRadius: '0 6px 6px 0',
                    ':hover': {
                      backgroundColor: '#f9fafbb3',
                      color: '#364153',
                      cursor: 'pointer'
                    },
                  }),
                }}
                value={selectedNeumaticos}
                options={codigosFormatSelect}
                name="neumaticos"
                placeholder="Neumáticos"
                noOptionsMessage={() => "Sin neumáticos."}
              />
            </div>

            {/* Badge alerta */}
            {desgasteNeumaticos.alertCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#EF4444',
                  background: '#EF444415',
                  border: '1px solid #EF444435',
                  borderRadius: 20,
                  padding: '3px 11px',
                  whiteSpace: 'nowrap',
                }}>
                  {desgasteNeumaticos.alertCount} en alerta
                </span>
              </div>
            )}

            {/* Leyenda de severidad */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {[
                { color: '#EF4444', label: '> 2.5 — Alto' },
                { color: '#F59E0B', label: '1.5–2.5 — Moderado' },
                { color: '#22C55E', label: '< 1.5 — Normal' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: theme.palette.text.secondary }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Gráfico */}
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={desgasteNeumaticos.neumaticos}
                  barSize={18}
                  margin={{ top: 4, right: 52, bottom: 0, left: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 3.2]}
                    tick={{ fontSize: 10, fill: theme.palette.text.secondary as string }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="codNeumatico"
                    width={72}
                    tick={{ fontSize: 12, fill: theme.palette.text.primary as string, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DesgasteTooltip fleetAvg={desgasteNeumaticos.fleetAvg} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

                  {/* Línea de referencia: promedio flota */}
                  <ReferenceLine
                    x={desgasteNeumaticos.fleetAvg}
                    stroke="#94a3b8"
                    strokeDasharray="5 3"
                    label={{
                      value: `Prom. ${desgasteNeumaticos.fleetAvg}`,
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: '#94a3b8',
                      dy: -4,
                    }}
                  />

                  <Bar dataKey="desgasteMilKms" radius={[0, 5, 5, 0]}>
                    {desgasteNeumaticos.neumaticos.map((entry) => (
                      <Cell key={entry.codNeumatico} fill={getTasaColor(entry.desgasteMilKms)} fillOpacity={0.85} />
                    ))}
                    <LabelList content={<TasaLabel desgastes={desgasteNeumaticos.neumaticos} />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <Divider sx={{ mt: 'auto' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px 12px' }}>
              <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
                Promedio neumáticos
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: getTasaColor(desgasteNeumaticos.fleetAvg) }}>
                {desgasteNeumaticos.fleetAvg} mm/1000km
              </span>
            </div>
          </>
        )
      }
    </div>
  );
}
