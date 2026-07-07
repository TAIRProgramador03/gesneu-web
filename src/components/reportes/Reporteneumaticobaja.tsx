"use client";

import { obtenerCondicionesConNeumaticosEnBaja, obtenerDisenosConNeumaticosEnBaja, obtenerDistribucionMotivoDeBaja, obtenerDistribucionPorTerrenoBajas, obtenerMarcasConNeumaticosEnBaja, obtenerMovimientosDeNeumaticosEnBaja, obtenerTalleresConNeumaticosEnBaja, obtenerVehiculosPorTerreno, type MotivosDeBajaEnBaja, type TiposDeTerrenoEnBaja } from "@/api/Neumaticos";
import { Combobox } from "@/components/ui/combobox";
import { BarChartSkeleton } from "@/components/ui/bar-chart-skeleton";
import { DonutChartSkeleton } from "@/components/ui/donut-chart-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useState, useMemo, useCallback } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from '@mui/material/styles';
import { BarChart2, CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import { es } from "date-fns/locale/es";
import { CollapsibleCard } from "../dashboard/CollapsibleCard";
import { FlotaDonut } from "../dashboard/overview/FlotaDonut";
import { MultiSearchSelect } from "../ui/multiple-select";
import { SearchSelect } from "../ui/search-select";

// ============================================
// TYPES
// ============================================

const PALETA_DONUT_TERRENO = ["#1d4ed8", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#06b6d4"];

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

interface FilaReporte {
  marca: string;
  zona: string;
  kmPromedio: number;
  cantidad: number;
  costo: number;
  ck: number;
}

interface FilaCK {
  marca: string;
  kmPromedio: number;
  costo: number;
  ck: number;
  cantidad: number;
}

// ============================================
// UTILS
// ============================================
function moda(valores: number[]): number {
  const freq: Record<number, number> = {};
  let maxFreq = 0;
  let modaVal = valores[0];
  for (const v of valores) {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > maxFreq) { maxFreq = freq[v]; modaVal = v; }
  }
  return modaVal;
}

function fmtKm(n: number): string {
  return Math.round(n).toLocaleString("es-PE");
}

function fmtCosto(n: number): string {
  return n.toFixed(2);
}

function fmtCK(n: number): string {
  return n.toFixed(5);
}

// ============================================
// GRAFICO TIPO TERRENO
// ============================================
// escala celeste (menos km) -> azul fuerte (mas km)
const TERRENO_CELESTE = "#8ec5ff"; // blue-300
const TERRENO_AZUL = "#1e40af";    // blue-800

function lerpColor(a: string, b: string, t: number): string {
  const ah = a.replace("#", ""), bh = b.replace("#", "");
  const ar = parseInt(ah.slice(0, 2), 16), ag = parseInt(ah.slice(2, 4), 16), ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16), bg = parseInt(bh.slice(2, 4), 16), bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

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
  return (
    <div
      className="group flex items-stretch gap-3 rounded-xl border border-slate-100 bg-white pl-1 pr-4 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
      style={{ minWidth: 104 }}
    >
      <span className="w-1 rounded-full" style={{ background: accent }} />
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-xl font-extrabold leading-tight tabular-nums" style={{ color: muted ? "#0f172a" : accent }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function TerrenoTooltip({ active, payload }: { active?: boolean; payload?: { payload: TiposDeTerrenoEnBaja }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#fff", color: "#0f172a", borderRadius: 10, padding: "10px 14px",
      fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{d.TIPO_TERRENO}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: "#94a3b8" }}>Neumáticos</span><span style={{ fontWeight: 600 }}>{d.QTY_NEUMATICOS_BAJA}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: "#94a3b8" }}>KM total</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_TOTAL)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: "#94a3b8" }}>KM prom.</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_PROMEDIO)}</span>
      </div>
    </div>
  );
}

function MotivoTooltip({ active, payload }: { active?: boolean; payload?: { payload: MotivosDeBajaEnBaja }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#fff", color: "#0f172a", borderRadius: 10, padding: "10px 14px",
      fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{d.TIPO_BAJA}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: "#94a3b8" }}>Neumáticos</span><span style={{ fontWeight: 600 }}>{d.QTY_NEUMATICOS_BAJA}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: "#94a3b8" }}>KM total</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_TOTAL)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: "#94a3b8" }}>KM prom.</span><span style={{ fontWeight: 600 }}>{fmtKm(d.KM_PROMEDIO)}</span>
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
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;
  const activo = Boolean(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8,
            border: `1.5px solid ${activo ? "#3b82f6" : "#e2e8f0"}`,
            fontSize: 13, background: "#fff", cursor: "pointer", textAlign: "left",
            color: activo ? "#1e293b" : "#94a3b8", boxSizing: "border-box",
          }}
        >
          <CalendarIcon size={15} color={activo ? "#3b82f6" : "#94a3b8"} />
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

  // ---- Estado de filtros ----
  const [talleresSeleccionados, setTalleresSeleccionados] = useState<string[]>([]);
  const [condicion, setCondicion] = useState<string>("");
  const [medida, setMedida] = useState<string>("");
  const [diseno, setDiseno] = useState<string>("");
  const [marcaF, setMarcaF] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [tipoBaja, setTipoBaja] = useState<string>("");

  // const { data = [] } = useQuery({
  //   queryKey: ['analisis-neumaticos-en-baja'],
  //   queryFn: obtenerMovimientosDeNeumaticosEnBaja
  // })

  // * marcas
  const { data: marcasConNeumaticosEnBaja = [] } = useQuery({
    queryKey: ['marcas-con-neumaticos-en-baja'],
    queryFn: obtenerMarcasConNeumaticosEnBaja
  })

  // * talleres
  const { data: talleresConNeumaticosEnBaja = [] } = useQuery({
    queryKey: ['talleres-con-neumaticos-en-baja'],
    queryFn: obtenerTalleresConNeumaticosEnBaja
  })

  // * condiciones
  // const { data: condicionesConNeumaticosEnBaja = [] } = useQuery({
  //   queryKey: ['condiciones-con-neumaticos-en-baja'],
  //   queryFn: obtenerCondicionesConNeumaticosEnBaja
  // })

  // * diseños
  const { data: disenosConNeumaticosEnBaja = [] } = useQuery({
    queryKey: ['disenos-con-neumaticos-en-baja'],
    queryFn: obtenerDisenosConNeumaticosEnBaja
  })

  // * distribución de tipo de terreno en baja
  const { data: distirbucionTipoTerrenoEnBaja = [], isLoading: isLoadingDistribucionTipoTerrenoEnBaja } = useQuery({
    queryKey: ['distribucion-tipos-de-terrenos-en-baja', { talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin }],
    queryFn: () => obtenerDistribucionPorTerrenoBajas(talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin)
  })

  // * distribución de motivo de baja
  const { data: distribucionMotivoDeBaja = [] } = useQuery({
    queryKey: ['distribucion-motivo-de-baja', { talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin }],
    queryFn: () => obtenerDistribucionMotivoDeBaja(talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin)
  })

  // * vehiculos por tipo de terreno en bajas
  const { data: distribucionVehicularPorTerreno = [], isLoading: isLoadingDistribucionVehicularPorTerreno } = useQuery({
    queryKey: ['distribucion-vehicular-por-terreno', { talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin }],
    queryFn: () => obtenerVehiculosPorTerreno(talleresSeleccionados, diseno, marcaF, fechaInicio, fechaFin)
  })

  // ---- Datos filtrados ----
  // const filtrado = useMemo(() => {
  //   return data.filter(d => {
  //     if (talleresSeleccionados.length > 0 && !talleresSeleccionados.includes(d.PROYECTO_MOVIMIENTO.trim())) return false;
  //     if (condicion && d.CONDICION.trim() !== condicion) return false;
  //     if (medida && d.MEDIDA_NEUMATICO.trim() !== medida) return false;
  //     if (diseno && d.DISENO_NEUMATICO.trim() !== diseno) return false;
  //     if (tipoBaja && d.TIPO_BAJA.trim() !== tipoBaja) return false;
  //     if (fechaInicio && d.FECHA_BAJA < fechaInicio) return false;
  //     if (fechaFin && d.FECHA_BAJA > fechaFin) return false;
  //     return true;
  //   });
  // }, [data, talleresSeleccionados, condicion, medida, diseno, tipoBaja, fechaInicio, fechaFin]);

  // ---- Calcular KM total por neumático (suma de etapas) ----
  // const kmPorNeumatico = useMemo(() => {
  //   const map = new Map<number, { kmTotal: number; marca: string; zona: string; costos: number[] }>();
  //   for (const row of filtrado) {
  //     const id = row.ID_NEUMATICO;
  //     if (!map.has(id)) {
  //       map.set(id, { kmTotal: 0, marca: row.MARCA_NEUMATICO.trim(), zona: row.CONDICION.trim(), costos: [] });
  //     }
  //     const entry = map.get(id)!;
  //     entry.kmTotal += row.KM_RECORRIDOS_MOVIMIENTO;
  //     entry.costos.push(row.COSTO_NEUMATICO);
  //   }
  //   return map;
  // }, [filtrado]);

  // ---- Tabla PIVOT: Marca × Zona ----
  // const tablaPivot = useMemo(() => {
  //   const grupos = new Map<string, { kmSumas: number[]; costos: number[] }>();
  //   for (const [, neu] of kmPorNeumatico) {
  //     const key = `${neu.marca}|||${neu.zona}`;
  //     if (!grupos.has(key)) grupos.set(key, { kmSumas: [], costos: [] });
  //     const g = grupos.get(key)!;
  //     g.kmSumas.push(neu.kmTotal);
  //     g.costos.push(...neu.costos);
  //   }
  //   const filas: FilaReporte[] = [];
  //   for (const [key, g] of grupos) {
  //     const [marca, zona] = key.split("|||");
  //     const kmPromedio = g.kmSumas.reduce((a, b) => a + b, 0) / g.kmSumas.length;
  //     const costo = moda(g.costos);
  //     filas.push({ marca, zona, kmPromedio, cantidad: g.kmSumas.length, costo, ck: kmPromedio > 0 ? costo / kmPromedio : 0 });
  //   }
  //   return filas.sort((a, b) => a.marca.localeCompare(b.marca) || a.zona.localeCompare(b.zona));
  // }, [kmPorNeumatico]);

  // ---- Zonas únicas presentes ----
  // const zonasPresentes = useMemo(() =>
  //   [...new Set(tablaPivot.map(r => r.zona))].sort(), [tablaPivot]);

  // ---- Marcas únicas presentes ----
  // const marcasPresentes = useMemo(() =>
  //   [...new Set(tablaPivot.map(r => r.marca))].sort(), [tablaPivot]);

  // ---- Tabla C.K (resumen total por marca) ----
  // const tablaCK = useMemo((): FilaCK[] => {
  //   const grupos = new Map<string, { kmSumas: number[]; costos: number[] }>();
  //   for (const [, neu] of kmPorNeumatico) {
  //     if (!grupos.has(neu.marca)) grupos.set(neu.marca, { kmSumas: [], costos: [] });
  //     const g = grupos.get(neu.marca)!;
  //     g.kmSumas.push(neu.kmTotal);
  //     g.costos.push(...neu.costos);
  //   }
  //   return [...grupos.entries()].map(([marca, g]) => {
  //     const kmPromedio = g.kmSumas.reduce((a, b) => a + b, 0) / g.kmSumas.length;
  //     const costo = moda(g.costos);
  //     return { marca, kmPromedio, costo, ck: kmPromedio > 0 ? costo / kmPromedio : 0, cantidad: g.kmSumas.length };
  //   }).sort((a, b) => a.ck - b.ck);
  // }, [kmPorNeumatico]);

  // ---- Totales generales ----
  // const totalKmGeneral = useMemo(() => {
  //   if (tablaCK.length === 0) return 0;
  //   const totalNeus = tablaCK.reduce((a, b) => a + b.cantidad, 0);
  //   return tablaCK.reduce((a, b) => a + b.kmPromedio * b.cantidad, 0) / totalNeus;
  // }, [tablaCK]);
  // const totalCantGeneral = useMemo(() => tablaCK.reduce((a, b) => a + b.cantidad, 0), [tablaCK]);

  // ---- Toggle taller ----
  // const toggleTaller = useCallback((taller: string) => {
  //   setTalleresSeleccionados(prev =>
  //     prev.includes(taller) ? prev.filter(t => t !== taller) : [...prev, taller]
  //   );
  // }, []);

  const limpiarFiltros = () => {
    setTalleresSeleccionados([]);
    setCondicion("");
    setMarcaF("");
    setMedida("");
    setDiseno("");
    setTipoBaja("");
    setFechaInicio("");
    setFechaFin("");
  };

  const hayFiltrosActivos = talleresSeleccionados.length > 0 || condicion || medida || marcaF || diseno || tipoBaja || fechaInicio || fechaFin;

  // ---- Lookup pivot ----
  // const pivotLookup = useMemo(() => {
  //   const map = new Map<string, FilaReporte>();
  //   for (const row of tablaPivot) map.set(`${row.marca}|||${row.zona}`, row);
  //   return map;
  // }, [tablaPivot]);

  // const pivotTotalMarca = useMemo(() => {
  //   const map = new Map<string, { kmTotal: number; cant: number }>();
  //   for (const ck of tablaCK) map.set(ck.marca, { kmTotal: ck.kmPromedio, cant: ck.cantidad });
  //   return map;
  // }, [tablaCK]);

  // ---- Datos para el gráfico de barras C.K ----
  // const chartCK = useMemo(() => {
  //   if (tablaCK.length === 0) return [];
  //   const mejor = tablaCK[0].ck;
  //   const peor = tablaCK[tablaCK.length - 1].ck;
  //   const rango = peor - mejor;
  //   return tablaCK.map(row => {
  //     const pct = rango > 0 ? (row.ck - mejor) / rango : 0;
  //     const color = pct < 0.33 ? "#22c55e" : pct < 0.66 ? "#f59e0b" : "#ef4444";
  //     return { marca: row.marca, ck: row.ck, color };
  //   });
  // }, [tablaCK]);

  return (
    <div style={{
      background: "#f8fafc", minHeight: "100vh", padding: "28px 32px", color: "#1e293b",
    }}>

      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Reporte de neumáticos en baja
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Análisis de rendimiento y costo por kilómetro (C.K) de neumáticos retirados
            del sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
        padding: "20px 24px", marginBottom: 24,
      }}
      // className="sticky z-999 top-0"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Filtros:</span>
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
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Taller(es)
          </p>
          <MultiSearchSelect
            options={talleresConNeumaticosEnBaja}
            onChange={(values) => setTalleresSeleccionados(values)}
            value={talleresSeleccionados}
            className="w-102.5"
            placeholder="Seleccionar taller(es)"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Marca
            </p>
            <SearchSelect
              options={marcasConNeumaticosEnBaja}
              value={marcaF}
              onChange={(value) => setMarcaF(value)}
              placeholder="Seleccionar marca"
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Diseño
            </p>
            <SearchSelect
              options={disenosConNeumaticosEnBaja}
              value={diseno}
              onChange={(value) => setDiseno(value)}
              placeholder="Seleccionar diseño"
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha desde</p>
            <DatePicker value={fechaInicio} onChange={setFechaInicio} placeholder="Todas" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha hasta</p>
            <DatePicker value={fechaFin} onChange={setFechaFin} placeholder="Todas" />
          </div>
        </div>
      </div>


      {/* Fila: distribución vehicular + distribución por tipo de terreno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Gráfico para la distrución vehicular */}
        <div
          className="rounded-2xl border border-slate-200 border-t-[5px] border-t-emerald-600 shadow-sm transition-shadow hover:shadow-md"
          style={{ background: "#fff", padding: "20px 24px" }}
        >
          {/* Header + stats */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Distribución vehicular</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Vehículos con neumáticos dados de baja según terreno de operación</p>
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
                  <div style={{ position: 'relative', height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionVehicularPorTerreno as unknown as Record<string, unknown>[]}
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={98}
                          paddingAngle={3}
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
          className="rounded-2xl border border-slate-200 border-t-[5px] border-t-blue-600 shadow-sm transition-shadow hover:shadow-md"
          style={{ background: "#fff", padding: "20px 24px" }}
        >
          {/* Header + stats */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Distribución por tipo de terreno</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Neumáticos dados de baja según terreno de operación</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(() => {
                const totalNeu = distirbucionTipoTerrenoEnBaja.reduce((a, b) => a + b.QTY_NEUMATICOS_BAJA, 0);
                const totalKm = distirbucionTipoTerrenoEnBaja.reduce((a, b) => a + b.KM_TOTAL, 0);
                return (
                  <>
                    <StatPill label="Tipos de terreno" value={distirbucionTipoTerrenoEnBaja.length.toString()} accent="#1d4ed8" />
                    <StatPill label="Neumáticos" value={totalNeu.toString()} accent="#1d4ed8" />
                    <StatPill label="KM total" value={fmtKm(totalKm)} accent="#1d4ed8" muted />
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
                        <Bar dataKey="KM_PROMEDIO" radius={[8, 8, 0, 0]} maxBarSize={90}>
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
        className="rounded-2xl border border-slate-200 border-t-[5px] border-t-red-700 shadow-sm transition-shadow hover:shadow-md"
        style={{ background: "#fff", padding: "20px 24px", marginBottom: 24 }}
      >
        {/* Header + stats */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Distribución por motivo de baja</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Neumáticos dados de baja según motivo</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(() => {
              const totalNeu = distribucionMotivoDeBaja.reduce((a, b) => a + b.QTY_NEUMATICOS_BAJA, 0);
              const totalKm = distribucionMotivoDeBaja.reduce((a, b) => a + b.KM_TOTAL, 0);
              return (
                <>
                  <StatPill label="Motivos de baja" value={distribucionMotivoDeBaja.length.toString()} accent="#b91c1c" />
                  <StatPill label="Neumáticos" value={totalNeu.toString()} accent="#b91c1c" />
                  <StatPill label="KM total" value={fmtKm(totalKm)} accent="#b91c1c" muted />
                </>
              );
            })()}
          </div>
        </div>

        {
          isLoadingDistribucionVehicularPorTerreno ?
            (
              <BarChartSkeleton bars={4} height={340} className="px-1" />
            ) : distribucionVehicularPorTerreno.length === 0 ? (
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
                    <Bar dataKey="KM_PROMEDIO" radius={[8, 8, 0, 0]} maxBarSize={90}>
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













      {/* {filtrado.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 16, margin: "0 0 4px" }}>Sin resultados</p>
          <p style={{ fontSize: 13 }}>Ajusta los filtros para ver datos</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="items-start">

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>Rendimiento por marca y condición</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>KM promedio total por neumático</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Marca</th>
                    {zonasPresentes.map(z => (
                      <th key={z} colSpan={2} style={{ ...thStyle, textAlign: "center", borderLeft: "2px solid #e2e8f0" }}>
                        {z}
                      </th>
                    ))}
                    <th colSpan={2} style={{ ...thStyle, textAlign: "center", borderLeft: "2px solid #e2e8f0", background: "#f1f5f9" }}>
                      TOTAL
                    </th>
                  </tr>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}></th>
                    {zonasPresentes.map(z => (
                      <>
                        <th key={`${z}-km`} style={{ ...thStyle, borderLeft: "2px solid #e2e8f0" }}>KM PROM.</th>
                        <th key={`${z}-cant`} style={thStyle}>CANT.</th>
                      </>
                    ))}
                    <th style={{ ...thStyle, borderLeft: "2px solid #e2e8f0", background: "#f1f5f9", textAlign: 'center' }}>KM PROM.</th>
                    <th style={{ ...thStyle, background: "#f1f5f9" }}>CANT.</th>
                  </tr>
                </thead>
                <tbody>
                  {marcasPresentes.map((marca, mi) => {
                    const total = pivotTotalMarca.get(marca);
                    return (
                      <tr key={marca} style={{ background: mi % 2 === 0 ? "#fff" : "#fafafa" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = mi % 2 === 0 ? "#fff" : "#fafafa")}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#0f172a" }}>{marca}</td>
                        {zonasPresentes.map(zona => {
                          const row = pivotLookup.get(`${marca}|||${zona}`);
                          return (
                            <>
                              <td key={`${marca}-${zona}-km`} style={{ ...tdStyle, borderLeft: "2px solid #f1f5f9" }}>
                                {row ? fmtKm(row.kmPromedio) : "—"}
                              </td>
                              <td key={`${marca}-${zona}-cant`} style={{ ...tdStyle }}>
                                {row ? (
                                  <span style={{
                                    display: "inline-block", padding: "1px 8px", borderRadius: 10,
                                    background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, fontSize: 11,
                                  }}>{row.cantidad}</span>
                                ) : "—"}
                              </td>
                            </>
                          );
                        })}
                        <td style={{ ...tdStyle, fontWeight: 700, borderLeft: "2px solid #e2e8f0", background: "#f8fafc", color: "#0f172a" }}>
                          {total ? fmtKm(total.kmTotal) : "—"}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, background: "#f8fafc" }}>
                          {total ? (
                            <span style={{
                              display: "inline-block", padding: "1px 8px", borderRadius: 10,
                              background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 11,
                            }}>{total.cant}</span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a" }}>Total general</td>
                    {zonasPresentes.map(zona => {
                      const filaZona = tablaPivot.filter(r => r.zona === zona);
                      const totalNeus = filaZona.reduce((a, b) => a + b.cantidad, 0);
                      const kmProm = totalNeus > 0
                        ? filaZona.reduce((a, b) => a + b.kmPromedio * b.cantidad, 0) / totalNeus
                        : 0;
                      return (
                        <>
                          <td key={`total-${zona}-km`} style={{ ...tdStyle, fontWeight: 700, borderLeft: "2px solid #e2e8f0", color: "#0f172a" }}>
                            {totalNeus > 0 ? fmtKm(kmProm) : "—"}
                          </td >
                          <td key={`total-${zona}-cant`} style={{ ...tdStyle, fontWeight: 700 }}>
                            {totalNeus > 0 ? (
                              <span style={{
                                display: "inline-block", padding: "1px 8px", borderRadius: 10,
                                background: "#334155", color: "#fff", fontWeight: 600, fontSize: 11,
                              }}>{totalNeus}</span>
                            ) : "—"}
                          </td>
                        </>
                      );
                    })}
                    <td style={{ ...tdStyle, fontWeight: 700, borderLeft: "2px solid #e2e8f0", color: "#0f172a" }}>
                      {fmtKm(totalKmGeneral)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                      <span style={{
                        display: "inline-block", padding: "1px 8px", borderRadius: 10,
                        background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 11,
                      }}>{totalCantGeneral}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>Costo por kilómetro (C.K)</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
                  C.K = precio modal / km promedio — menor es mejor
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Marca</th>
                    <th style={{ ...thStyle }}>KM Prom.</th>
                    <th style={{ ...thStyle }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {tablaCK.map((row, i) => {
                    const mejor = tablaCK[0].ck;
                    const peor = tablaCK[tablaCK.length - 1].ck;
                    const rango = peor - mejor;
                    const pct = rango > 0 ? (row.ck - mejor) / rango : 0;
                    const color = pct < 0.33 ? "#22c55e" : pct < 0.66 ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={row.marca} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                            {i === 0 && <span style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>MEJOR</span>}
                            {row.marca}
                          </div>
                        </td>
                        <td style={{ ...tdStyle }}>{fmtKm(row.kmPromedio)}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span style={{
                            display: "inline-block", padding: "1px 8px", borderRadius: 10,
                            background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, fontSize: 11,
                          }}>{row.cantidad}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>Total general</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtKm(totalKmGeneral)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 11 }}>
                        {totalCantGeneral}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 14px" }}>Comparativa C.K por marca</p>

              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={chartCK}
                  barSize={80}
                  margin={{ top: 40, right: 12, bottom: 0, left: -24 }}
                >
                  <XAxis
                    dataKey="marca"
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary as string, fontWeight: 600 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmtCK(v as number)}
                  />
                  <Tooltip
                    formatter={(v) => [fmtCK(v as number), "C.K"]}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="ck" radius={[6, 6, 0, 0]}>
                    {chartCK.map((entry) => (
                      <Cell key={entry.marca} fill={entry.color} fillOpacity={0.82} />
                    ))}
                    <LabelList
                      dataKey="ck"
                      position="top"
                      formatter={(v) => fmtCK(Number(v))}
                      style={{ fontSize: 11, fontWeight: 700, fill: theme.palette.text.primary as string }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p style={{ fontSize: 10, color: "#94a3b8", margin: "10px 0 0" }}>
                Verde = menor costo por km (mejor rendimiento) · Rojo = mayor costo por km
              </p>
            </div>
          </div>
        </div>
      )
      } */}

      {/* ---- INFO METODOLOGÍA ---- */}
      {/* <div style={{
        marginTop: 20, padding: "12px 18px", background: "#fffbeb", borderRadius: 10,
        border: "1px solid #fde68a", display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" /><path d="M12 8h.01M12 12v4" />
        </svg>
        <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
          <strong>Metodología:</strong> KM promedio = suma de todos los km de etapa por neumático, luego promedio por marca. &nbsp;
          Precio = moda del costo registrado en la marca para el período filtrado. &nbsp;
          C.K = precio / km promedio (costo por kilómetro recorrido).
        </p>
      </div> */}
    </div >
  );
}

// ---- Estilos de tabla ----
const thStyle: React.CSSProperties = {
  padding: "9px 12px", textAlign: "center", fontSize: 10, fontWeight: 600,
  color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em",
  borderBottom: "2px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "9px 12px", borderBottom: "1px solid #f1f5f9", color: "#475569", textAlign: "center"
};