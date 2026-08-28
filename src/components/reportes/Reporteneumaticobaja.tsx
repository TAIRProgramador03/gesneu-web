"use client";

import { obtenerDisenosConNeumaticosEnBaja, obtenerDistribucionMotivoDeBaja, obtenerDistribucionPorTerrenoBajas, obtenerLosTalleresDelUsuario, obtenerMarcasConNeumaticosEnBaja, obtenerTalleresConNeumaticosEnBaja, obtenerTodasLasMarcas, obtenerTodosLosDisenos, obtenerVehiculosPorTerreno, type MotivosDeBajaEnBaja, type TiposDeTerrenoEnBaja } from "@/api/Neumaticos";
import { BarChartSkeleton } from "@/components/ui/bar-chart-skeleton";
import { DonutChartSkeleton } from "@/components/ui/donut-chart-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from '@mui/material/styles';
import { BarChart2, CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import { es } from "date-fns/locale/es";
import { MultiSearchSelect } from "../ui/multiple-select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { capitalizeCustomString } from "@/lib/utils";
import { NeumaticosTerrenoDialog } from "./NeumaticosTerrenoDialog";
import { NeumaticosBajaDialog } from "./NeumaticosBajaDialog";

// ============================================
// CONSTANTES
// ============================================

const PALETA_DONUT_TERRENO = ["#1d4ed8", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#06b6d4"];

function fmtKm(n: number): string {
  return Math.round(n).toLocaleString("es-PE");
}

// ============================================
// COLOR SCALES
// ============================================
function lerpColor(a: string, b: string, t: number): string {
  const ah = a.replace("#", ""), bh = b.replace("#", "");
  const ar = parseInt(ah.slice(0, 2), 16), ag = parseInt(ah.slice(2, 4), 16), ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16), bg = parseInt(bh.slice(2, 4), 16), bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

// escala celeste (menos km) -> azul fuerte (mas km)
const TERRENO_CELESTE = "#8ec5ff"; // blue-300
const TERRENO_AZUL = "#1e40af";    // blue-800

function azulPorValor(v: number, min: number, max: number): string {
  const t = max > min ? (v - min) / (max - min) : 1;
  return lerpColor(TERRENO_CELESTE, TERRENO_AZUL, t);
}

// escala rojo claro (menos km) -> rojo intenso (mas km)
const MOTIVO_ROJO_CLARO = "#fca5a5"; // red-300
const MOTIVO_ROJO = "#991b1b";       // red-800

function rojoPorValor(v: number, min: number, max: number): string {
  const t = max > min ? (v - min) / (max - min) : 1;
  return lerpColor(MOTIVO_ROJO_CLARO, MOTIVO_ROJO, t);
}

// ============================================
// STAT PILL
// ============================================
interface StatPillProps {
  label: string;
  value: string;
  accent: string;   // color de acento (hex)
  muted?: boolean;  // valor en slate en vez de acento
}

function StatPill({ label, value, accent, muted }: StatPillProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <div
      className="group flex items-stretch gap-3 rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
      style={{
        minWidth: 104, paddingLeft: 4, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
        background: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#f1f5f9',
      }}
    >
      <span className="w-1 rounded-full" style={{ background: accent }} />
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
        <span className="text-xl font-extrabold leading-tight tabular-nums" style={{ color: muted ? theme.palette.text.primary : accent }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ============================================
// TOOLTIPS
// ============================================
function DonutTooltip({ active, payload, total }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;

  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
    }}
      className='z-999999'
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
      </div>
      <div style={{ fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>{value} vehiculos</div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
        {((value / total) * 100).toFixed(2)}% del total
      </div>
    </div>
  );
}

function TerrenoTooltip({ active, payload }: { active?: boolean; payload?: { payload: TiposDeTerrenoEnBaja }[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      color: theme.palette.text.primary as string, borderRadius: 10, padding: "10px 14px",
      fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{d.TIPO_TERRENO}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: theme.palette.text.secondary as string }}>Neumáticos</span><span style={{ fontWeight: 600 }}>{d.QTY_NEUMATICOS_BAJA}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: theme.palette.text.secondary as string }}>KM prom.</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_PROMEDIO)}</span>
      </div>
    </div>
  );
}

function MotivoTooltip({ active, payload }: { active?: boolean; payload?: { payload: MotivosDeBajaEnBaja }[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      color: theme.palette.text.primary as string, borderRadius: 10, padding: "10px 14px",
      fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{d.TIPO_BAJA}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: theme.palette.text.secondary as string }}>Neumáticos</span><span style={{ fontWeight: 600 }}>{d.QTY_NEUMATICOS_BAJA}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: theme.palette.text.secondary as string }}>KM prom.</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_PROMEDIO)}</span>
      </div>
    </div>
  );
}

// ============================================
// DATE PICKER (shadcn Popover + Calendar)
// ============================================
interface DatePickerProps {
  value: string;                       // "YYYY-MM-DD" o ""
  onChange: (value: string) => void;   // devuelve "YYYY-MM-DD" o ""
  placeholder?: string;
}

function DatePicker({ value, onChange, placeholder = "Seleccionar" }: DatePickerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;
  const activo = Boolean(value);
  const acento = "#ef4444";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8,
            border: `1.5px solid ${activo ? acento : (isDark ? '#334155' : '#e2e8f0')}`,
            fontSize: 13, background: isDark ? '#1e293b' : '#fff', cursor: "pointer", textAlign: "left",
            color: activo ? theme.palette.text.primary : theme.palette.text.secondary, boxSizing: "border-box",
          }}
        >
          <CalendarIcon size={15} color={activo ? acento : "#94a3b8"} />
          {activo ? dayjs(value).format("DD/MM/YYYY") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? dayjs(date).format("YYYY-MM-DD") : "");
            setOpen(false);
          }}
          locale={es}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// COMPONENT
// ============================================
export default function ReporteNeumaticoBaja() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ---- Estado de filtros ----
  const [talleresSeleccionados, setTalleresSeleccionados] = useState<string[]>([]);
  const [disenos, setDisenos] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [openModalTipoTerreno, setOpenModalTipoTerreno] = useState(false)
  const [selectedTipoTerreno, setSelectedTipoTerreno] = useState({
    TIPO_TERRENO: '',
    QTY_NEUMATICOS_BAJA: 0,
    KM_PROMEDIO: 0,
    KM_TOTAL: 0,
  })

  const [openModalTipoBaja, setOpenModalTipoBaja] = useState(false)
  const [selectedTipoBaja, setSelectedTipoBaja] = useState({
    TIPO_BAJA: '',
    QTY_NEUMATICOS_BAJA: 0,
    KM_PROMEDIO: 0,
    KM_TOTAL: 0,
  })

  // * marcas
  const { data: marcasConNeumaticosEnBaja = [], isLoading: isLoadingSelectMarca } = useQuery({
    queryKey: ['select-marcas'],
    queryFn: obtenerTodasLasMarcas
  })

  // * talleres
  const { data: talleresConNeumaticosEnBaja = [], isLoading: isLoadingSelectTaller } = useQuery({
    queryKey: ['talleres-del-usuario'],
    queryFn: obtenerLosTalleresDelUsuario,
  });

  // * diseños
  const { data: disenosConNeumaticosEnBaja = [], isLoading: isLoadingSelectDiseno } = useQuery({
    queryKey: ['select-diseños'],
    queryFn: obtenerTodosLosDisenos
  })

  // * distribución de tipo de terreno en baja
  const { data: distirbucionTipoTerrenoEnBaja = [], isLoading: isLoadingDistribucionTipoTerrenoEnBaja } = useQuery({
    queryKey: ['distribucion-tipos-de-terrenos-en-baja', { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin }],
    queryFn: () => obtenerDistribucionPorTerrenoBajas(talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
  })

  // * distribución de motivo de baja
  const { data: distribucionMotivoDeBaja = [], isLoading: isLoadingDistribucionMotivoDeBaja } = useQuery({
    queryKey: ['distribucion-motivo-de-baja', { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin }],
    queryFn: () => obtenerDistribucionMotivoDeBaja(talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
  })

  // * vehiculos por tipo de terreno en bajas
  const { data: distribucionVehicularPorTerreno = [], isLoading: isLoadingDistribucionVehicularPorTerreno } = useQuery({
    queryKey: ['distribucion-vehicular-por-terreno', { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin }],
    queryFn: () => obtenerVehiculosPorTerreno(talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
  })

  const limpiarFiltros = () => {
    setTalleresSeleccionados([]);
    setMarcas([]);
    setDisenos([]);
    setFechaInicio("");
    setFechaFin("");
  };

  const hayFiltrosActivos = talleresSeleccionados.length > 0 || marcas.length > 0 || disenos.length > 0 || fechaInicio || fechaFin;

  return (
    <div style={{
      background: theme.palette.background.default, minHeight: "100vh", padding: "28px 32px", color: theme.palette.text.primary,
    }}>

      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <BarChart2 size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, margin: 0, letterSpacing: "-0.4px" }}>
              Reporte de neumáticos en baja
            </h1>
          </div>
          <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>
            Análisis de rendimiento y costo por kilómetro (C.K) de neumáticos retirados del sistema.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: isDark ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        padding: "20px 24px", marginBottom: 24,
      }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>Filtros:</span>
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} style={{
              fontSize: 12, color: "#ef4444", background: "none", border: "none",
              cursor: "pointer", fontWeight: 500,
            }}>
              Limpiar todo
            </button>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Taller(es)
          </p>
          <MultiSearchSelect
            options={talleresConNeumaticosEnBaja}
            onChange={(values) => setTalleresSeleccionados(values)}
            value={talleresSeleccionados}
            placeholder="Seleccionar taller(es)"
            disabled={isLoadingSelectTaller}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Marca(s)
            </p>
            <MultiSearchSelect
              options={marcasConNeumaticosEnBaja}
              onChange={(value) => setMarcas(value)}
              value={marcas}
              placeholder="Seleccionar marca(s)"
              disabled={isLoadingSelectMarca}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Diseño(s)
            </p>
            <MultiSearchSelect
              options={disenosConNeumaticosEnBaja}
              value={disenos}
              onChange={(value) => setDisenos(value)}
              placeholder="Seleccionar diseño(s)"
              disabled={isLoadingSelectDiseno}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha desde</p>
            <DatePicker value={fechaInicio} onChange={setFechaInicio} placeholder="Todas" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha hasta</p>
            <DatePicker value={fechaFin} onChange={setFechaFin} placeholder="Todas" />
          </div>
        </div>
      </div>


      {/* Fila: distribución vehicular + distribución por tipo de terreno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Gráfico para la distrución vehicular */}
        <div
          className="rounded-2xl border border-t-[5px] shadow-sm transition-shadow hover:shadow-md"
          style={{
            background: isDark ? '#1e293b' : '#fff', padding: "20px 24px",
            borderColor: isDark ? '#334155' : '#e2e8f0', borderTopColor: "#059669",
          }}
        >
          {/* Header + stats */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Distribución vehicular</p>
              <p style={{ fontSize: 12, color: theme.palette.text.secondary, margin: "2px 0 0" }}>Vehículos con neumáticos dados de baja según terreno de operación</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(() => {
                const totalVeh = distribucionVehicularPorTerreno.reduce((a, b) => a + b.value, 0);
                return (
                  <>
                    <StatPill label="Tipos de terreno" value={distribucionVehicularPorTerreno.length.toString()} accent="#059669" />
                    <StatPill label="Vehículos" value={totalVeh.toString()} accent="#059669" />
                  </>
                );
              })()}
            </div>
          </div>

          {
            isLoadingDistribucionVehicularPorTerreno ? (
              <DonutChartSkeleton legendItems={4} size={230} />
            ) : distribucionVehicularPorTerreno.length === 0 ? (
              <EmptyState
                title="No hay datos de distribución vehicular"
                description="No se encontraron vehículos con neumáticos dados de baja según los parámetros seleccionados."
                height={340}
              />
            ) : (() => {

              const TOTAL = distribucionVehicularPorTerreno.reduce((a, b) => a + b.value, 0);

              return (
                <>
                  {/* Donut */}
                  <div style={{ position: 'relative', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionVehicularPorTerreno as unknown as Record<string, unknown>[]}
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={125}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {distribucionVehicularPorTerreno.map((entry, i) => (
                            <Cell key={entry.name} fill={PALETA_DONUT_TERRENO[i % PALETA_DONUT_TERRENO.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DonutTooltip total={TOTAL} />} wrapperStyle={{ zIndex: 100 }} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Total en el centro */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      zIndex: 0.2
                    }}>
                      <div style={{ fontSize: 34, fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1 }}>
                        {TOTAL}
                      </div>
                      <div style={{ fontSize: 11, color: theme.palette.text.secondary, marginTop: 4, letterSpacing: '0.05em' }}>
                        TOTAL
                      </div>
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {distribucionVehicularPorTerreno.map((item, i) => {
                      const pct = TOTAL === 0 ? 0 : ((item.value / TOTAL) * 100).toFixed(2);
                      return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: PALETA_DONUT_TERRENO[i % PALETA_DONUT_TERRENO.length], flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: theme.palette.text.primary }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                            {item.value}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: theme.palette.text.secondary,
                            minWidth: 40,
                            textAlign: 'right',
                          }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          }
        </div>


        {/* Gráfico para la Distribución por tipo de terreno */}
        <div
          className="rounded-2xl border border-t-[5px] shadow-sm transition-shadow hover:shadow-md"
          style={{
            background: isDark ? '#1e293b' : '#fff', padding: "20px 24px",
            borderColor: isDark ? '#334155' : '#e2e8f0', borderTopColor: "#1d4ed8",
          }}
        >
          {/* Header + stats */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Distribución por tipo de terreno</p>
              <p style={{ fontSize: 12, color: theme.palette.text.secondary, margin: "2px 0 0" }}>Neumáticos dados de baja según terreno de operación</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(() => {
                const totalNeu = distirbucionTipoTerrenoEnBaja.reduce((a, b) => a + b.QTY_NEUMATICOS_BAJA, 0);
                return (
                  <>
                    <StatPill label="Tipos de terreno" value={distirbucionTipoTerrenoEnBaja.length.toString()} accent="#1d4ed8" />
                    <StatPill label="Neumáticos" value={totalNeu.toString()} accent="#1d4ed8" />
                  </>
                );
              })()}
            </div>
          </div>

          {
            isLoadingDistribucionTipoTerrenoEnBaja ?
              (
                <BarChartSkeleton bars={4} height={340} className="px-1" />
              )
              : distirbucionTipoTerrenoEnBaja.length === 0 ? (
                <EmptyState
                  title="No hay datos de terreno"
                  description="No se encontraron neumáticos dados de baja según los parámetros seleccionados."
                  height={340}
                />
              )
                : (
                  <>
                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart data={distirbucionTipoTerrenoEnBaja} margin={{ top: 30, right: 12, bottom: 4, left: -12 }}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="TIPO_TERRENO"
                          tick={{ fontSize: 12, fill: theme.palette.text.secondary as string, fontWeight: 600 }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="KM_PROMEDIO"
                          tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<TerrenoTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                        <Bar dataKey="KM_PROMEDIO" radius={[8, 8, 0, 0]} maxBarSize={90} onClick={(data) => {
                          setSelectedTipoTerreno(data.payload)
                          setOpenModalTipoTerreno(prev => !prev)
                        }} className="cursor-pointer">
                          {(() => {
                            const vals = distirbucionTipoTerrenoEnBaja.map(d => d.KM_PROMEDIO);
                            const min = Math.min(...vals), max = Math.max(...vals);
                            return distirbucionTipoTerrenoEnBaja.map(entry => (
                              <Cell key={entry.TIPO_TERRENO} fill={azulPorValor(entry.KM_PROMEDIO, min, max)} />
                            ));
                          })()}
                          <LabelList
                            dataKey="KM_PROMEDIO"
                            position="top"
                            style={{ fontSize: 13, fontWeight: 700, fill: theme.palette.text.primary as string }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )
          }
        </div>

      </div>


      {/* Gráfico para la Distribución por motivo de baja */}
      <div
        className="rounded-2xl border border-t-[5px] shadow-sm transition-shadow hover:shadow-md"
        style={{
          background: isDark ? '#1e293b' : '#fff', padding: "20px 24px", marginBottom: 24,
          borderColor: isDark ? '#334155' : '#e2e8f0', borderTopColor: "#b91c1c",
        }}
      >
        {/* Header + stats */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Distribución por motivo de baja</p>
            <p style={{ fontSize: 12, color: theme.palette.text.secondary, margin: "2px 0 0" }}>Neumáticos dados de baja según motivo</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(() => {
              const totalNeu = distribucionMotivoDeBaja.reduce((a, b) => a + b.QTY_NEUMATICOS_BAJA, 0);
              return (
                <>
                  <StatPill label="Motivos de baja" value={distribucionMotivoDeBaja.length.toString()} accent="#b91c1c" />
                  <StatPill label="Neumáticos" value={totalNeu.toString()} accent="#b91c1c" />
                </>
              );
            })()}
          </div>
        </div>

        {
          isLoadingDistribucionMotivoDeBaja ?
            (
              <BarChartSkeleton bars={4} height={340} className="px-1" />
            ) : distribucionMotivoDeBaja.length === 0 ? (
              <EmptyState
                title="No hay datos de motivo de baja"
                description="No se encontraron neumáticos dados de baja según los parámetros seleccionados."
                height={340}
              />
            ) : (
              <>
                {/* Chart */}
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={distribucionMotivoDeBaja} margin={{ top: 30, right: 12, bottom: 4, left: -12 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="TIPO_BAJA"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary as string, fontWeight: 600 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="KM_PROMEDIO"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<MotivoTooltip />} cursor={{ fill: "rgba(239,68,68,0.06)" }} />
                    <Bar dataKey="KM_PROMEDIO" radius={[8, 8, 0, 0]} maxBarSize={90}
                      onClick={(data) => {
                        setSelectedTipoBaja(data.payload)
                        setOpenModalTipoBaja(prev => !prev)
                      }}
                      className="cursor-pointer">
                      {(() => {
                        const vals = distribucionMotivoDeBaja.map(d => d.KM_PROMEDIO);
                        const min = Math.min(...vals), max = Math.max(...vals);
                        return distribucionMotivoDeBaja.map(entry => (
                          <Cell key={entry.TIPO_BAJA} fill={rojoPorValor(entry.KM_PROMEDIO, min, max)} />
                        ));
                      })()}
                      <LabelList
                        dataKey="KM_PROMEDIO"
                        position="top"
                        style={{ fontSize: 13, fontWeight: 700, fill: theme.palette.text.primary as string }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )
        }
      </div>


      {/* ------------ Modal: Tipo de terreno ----------- */}
      <Dialog open={openModalTipoTerreno} onOpenChange={setOpenModalTipoTerreno}>
        <DialogContent
          forceMount={undefined}
          className="flex flex-col w-full max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] xl:max-h-[80vh] h-fit overflow-hidden border-none"
        >
          <div className="h-2 w-full bg-blue-900 shrink-0 absolute top-0 left-0" />

          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold text-[#002141]">
              Neumáticos dados de baja en el terreno: {capitalizeCustomString(selectedTipoTerreno.TIPO_TERRENO)}
            </DialogTitle>
            <DialogDescription>
              Lista de los neumáticos dados de baja que pertenezcan al terreno: {capitalizeCustomString(selectedTipoTerreno.TIPO_TERRENO)}.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-full overflow-auto">
            {openModalTipoTerreno && selectedTipoTerreno && (
              <NeumaticosTerrenoDialog
                data={selectedTipoTerreno}
                talleresSeleccionados={talleresSeleccionados}
                disenos={disenos}
                marcas={marcas}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
              />
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                className="cursor-pointer"
              >
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------ Modal: Tipo de baja ----------- */}
      <Dialog open={openModalTipoBaja} onOpenChange={setOpenModalTipoBaja}>
        <DialogContent
          forceMount={undefined}
          className="flex flex-col w-full max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] xl:max-h-[80vh] h-fit overflow-hidden border-none"
        >
          <div className="h-2 w-full bg-blue-900 shrink-0 absolute top-0 left-0" />

          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold text-[#002141]">
              Neumáticos dados de baja por: {capitalizeCustomString(selectedTipoBaja.TIPO_BAJA)}
            </DialogTitle>
            <DialogDescription>
              Lista de los neumáticos dados de baja por: {capitalizeCustomString(selectedTipoBaja.TIPO_BAJA)}.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-full overflow-auto">
            {openModalTipoBaja && selectedTipoBaja && (
              <NeumaticosBajaDialog
                data={selectedTipoBaja}
                talleresSeleccionados={talleresSeleccionados}
                disenos={disenos}
                marcas={marcas}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
              />
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                className="cursor-pointer"
              >
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
