"use client";

import { obtenerDespachoDeNeumaticosPorTaller, obtenerLosTalleresDelUsuario, obtenerTodasLasMarcas, obtenerTodosLosDisenos, ResponseDespachoDeNeumaticos } from "@/api/Neumaticos";
import { BarChartSkeleton } from "@/components/ui/bar-chart-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from '@mui/material/styles';
import { PackageSearch, CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import { es } from "date-fns/locale/es";
import { MultiSearchSelect } from "../ui/multiple-select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { capitalizeCustomString } from "@/lib/utils";
import { NeumaticosDespachadosDialog } from "./NeumaticosDespachadosDialog";


// ============================================
// GRAFICO TIPO TERRENO
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

// escala teal claro (menos neumáticos) -> teal intenso (mas neumáticos) — paleta de marca "kepple"
const DESPACHO_TEAL_CLARO = "#9af5e1"; // kepple-200
const DESPACHO_TEAL = "#115e56";       // kepple-800

function tealPorValor(v: number, min: number, max: number): string {
  const t = max > min ? (v - min) / (max - min) : 1;
  return lerpColor(DESPACHO_TEAL_CLARO, DESPACHO_TEAL, t);
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

function DespachoTooltip({ active, payload }: { active?: boolean; payload?: { payload: ResponseDespachoDeNeumaticos }[] }) {
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
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{d.TALLER}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: theme.palette.text.secondary as string }}>Neumáticos</span><span style={{ fontWeight: 600 }}>{d.QTY_NEUMATICOS_DESPACHADOS}</span>
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
  const acento = "#0c87da";

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
export default function ReporteConsumos() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ---- Estado de filtros ----
  const [talleresSeleccionados, setTalleresSeleccionados] = useState<string[]>([]);
  const [disenos, setDisenos] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [openModalDespacho, setOpenModalDespacho] = useState(false)
  const [selectedDespacho, setSelectedDespacho] = useState({
    TALLER: '',
    QTY_NEUMATICOS_DESPACHADOS: 0,
  })

  // * marcas
  const { data: marcasSelectUsuario = [], isLoading: isLoadingSelectMarca } = useQuery({
    queryKey: ['select-marcas'],
    queryFn: obtenerTodasLasMarcas
  })

  // * talleres
  const { data: talleresSelectUsuario = [], isLoading: isLoadingSelectTaller } = useQuery({
    queryKey: ['talleres-del-usuario'],
    queryFn: obtenerLosTalleresDelUsuario,
  });

  // * diseños
  const { data: disenosSelectUsuario = [], isLoading: isLoadingSelectDiseno } = useQuery({
    queryKey: ['select-diseños'],
    queryFn: obtenerTodosLosDisenos
  })

  // * neumáticos por despacho según taller(es)
  const { data: despachoNeumaticoPorTaller = [], isLoading: isLoadingDespachoNeumaticosPorTaller } = useQuery({
    queryKey: ['despacho-neumatico-por-taller', { talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin }],
    queryFn: () => obtenerDespachoDeNeumaticosPorTaller(talleresSeleccionados, disenos, marcas, fechaInicio, fechaFin)
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
              background: "linear-gradient(135deg, #0c87da, #00538a)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <PackageSearch size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, margin: 0, letterSpacing: "-0.4px" }}>
              Análisis por consumos
            </h1>
          </div>
          <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>
            Análisis por consumos de neumáticos que se generan a través del SIALOG.
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
              fontSize: 12, color: "#0c87da", background: "none", border: "none",
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
            options={talleresSelectUsuario}
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
              options={marcasSelectUsuario}
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
              options={disenosSelectUsuario}
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


      {/* Gráfico para la distribución de consumos de salidas de S60 de neumáticos */}
      <div
        className="rounded-2xl border border-t-[5px] shadow-sm transition-shadow hover:shadow-md"
        style={{
          background: isDark ? '#1e293b' : '#fff', padding: "20px 24px", marginBottom: 24,
          borderColor: isDark ? '#334155' : '#e2e8f0', borderTopColor: "#107569",
        }}
      >
        {/* Header + stats */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Consumos de neumáticos</p>
            <p style={{ fontSize: 12, color: theme.palette.text.secondary, margin: "2px 0 0" }}>Entradas de neumático según taller</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(() => {
              const cantidades = despachoNeumaticoPorTaller.map(b => b.QTY_NEUMATICOS_DESPACHADOS);
              const totalNeu = cantidades.reduce((a, b) => a + b, 0);
              const promedio = cantidades.length > 0 ? Math.round(totalNeu / cantidades.length) : 0;
              return (
                <>
                  <StatPill label="Talleres" value={despachoNeumaticoPorTaller.length.toString()} accent="#107569" />
                  <StatPill label="Neumáticos" value={totalNeu.toString()} accent="#107569" />
                  <StatPill label="Promedio/taller" value={promedio.toString()} accent="#107569" muted />
                </>
              );
            })()}
          </div>
        </div>

        {
          isLoadingDespachoNeumaticosPorTaller ?
            (
              <BarChartSkeleton bars={4} height={340} className="px-1" />
            ) : despachoNeumaticoPorTaller.length === 0 ? (
              <EmptyState
                title="No hay datos de despacho de neumáticos"
                description="No se encontraron despacho de los neumáticos con los parámetros seleccionados."
                height={340}
              />
            ) : (
              <>
                {/* Chart */}
                <ResponsiveContainer width="100%" height={Math.max(340, despachoNeumaticoPorTaller.length * 44)}>
                  <BarChart
                    data={despachoNeumaticoPorTaller}
                    layout="vertical"
                    margin={{ top: 4, right: 36, bottom: 4, left: 12 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="TALLER"
                      type="category"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary as string, fontWeight: 600 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                      width={110}
                    />
                    <Tooltip content={<DespachoTooltip />} cursor={{ fill: "rgb(129, 227, 210, 0.06)" }} />
                    <Bar dataKey="QTY_NEUMATICOS_DESPACHADOS" radius={[0, 8, 8, 0]} maxBarSize={28}
                      onClick={(data) => {
                        setSelectedDespacho(data.payload)
                        setOpenModalDespacho(prev => !prev)
                      }}
                      className="cursor-pointer">
                      {(() => {
                        const vals = despachoNeumaticoPorTaller.map(d => d.QTY_NEUMATICOS_DESPACHADOS);
                        const min = Math.min(...vals), max = Math.max(...vals);
                        return despachoNeumaticoPorTaller.map(entry => (
                          <Cell key={entry.TALLER} fill={tealPorValor(entry.QTY_NEUMATICOS_DESPACHADOS, min, max)} />
                        ));
                      })()}
                      <LabelList
                        dataKey="QTY_NEUMATICOS_DESPACHADOS"
                        position="right"
                        style={{ fontSize: 13, fontWeight: 700, fill: theme.palette.text.primary as string }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )
        }
      </div>


      {/* ------------ Modal: Despacho por taller ----------- */}
      <Dialog open={openModalDespacho} onOpenChange={setOpenModalDespacho}>
        <DialogContent
          forceMount={undefined}
          className="flex flex-col w-full max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] xl:max-h-[80vh] h-fit overflow-hidden border-none"
        >
          <div className="h-2 w-full bg-[#115e56] shrink-0 absolute top-0 left-0" />

          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold text-[#002141]">
              Neumáticos consumidos del taller: {capitalizeCustomString(selectedDespacho.TALLER)}
            </DialogTitle>
            <DialogDescription>
              Lista de los neumáticos consumidos en el taller: {capitalizeCustomString(selectedDespacho.TALLER)}.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-full overflow-auto">
            {openModalDespacho && selectedDespacho && (
              <NeumaticosDespachadosDialog
                data={selectedDespacho}
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
    </div >
  );
}