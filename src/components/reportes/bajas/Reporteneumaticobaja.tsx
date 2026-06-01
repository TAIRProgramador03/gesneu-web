"use client";

import { obtenerMovimientosDeNeumaticosEnBaja } from "@/api/Neumaticos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useState, useMemo, useCallback } from "react";

// ============================================
// TYPES
// ============================================
interface MovimientoBaja {
  ID_MOVIMIENTO: number;
  ID_NEUMATICO: number;
  CODIGO_NEUMATICO: string;
  MARCA_NEUMATICO: string;
  MEDIDA_NEUMATICO: string;
  DISENO_NEUMATICO: string;
  COSTO_NEUMATICO: number;
  PLACA_MOVIMIENTO: string;
  PROYECTO_MOVIMIENTO: string;
  KM_RECORRIDOS_MOVIMIENTO: number;
  TERRENO: string;
  CONDICION: string;
  TIPO_BAJA: string;
  FECHA_BAJA: string;
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
// DEMO DATA — reemplazar con fetch a tu API
// GET /api/ges-neu/movimientos-baja
// ============================================
const DEMO_DATA: MovimientoBaja[] = [
  // Marshall - SEVERO
  ...Array.from({ length: 12 }, (_, i) => ({
    ID_MOVIMIENTO: 100 + i, ID_NEUMATICO: 764 + i, CODIGO_NEUMATICO: `11128${3 + i}`,
    MARCA_NEUMATICO: "MARSHALL", MEDIDA_NEUMATICO: "265/65 R17", DISENO_NEUMATICO: "M/T",
    COSTO_NEUMATICO: 127.00, PLACA_MOVIMIENTO: "CEN-827", PROYECTO_MOVIMIENTO: "ANDAYCHAGUA",
    KM_RECORRIDOS_MOVIMIENTO: [3068, 1, 3068, 1, 3068, 1, 2500, 1, 2900, 1, 3100, 1][i],
    TERRENO: "SEVERO", CONDICION: "SEVERO", TIPO_BAJA: "DESGASTE NATURAL", FECHA_BAJA: "2026-05-08",
  })),
  // Marshall - SOCAVÓN
  ...Array.from({ length: 18 }, (_, i) => ({
    ID_MOVIMIENTO: 200 + i, ID_NEUMATICO: 773 + i, CODIGO_NEUMATICO: `11129${2 + i}`,
    MARCA_NEUMATICO: "MARSHALL", MEDIDA_NEUMATICO: "265/65 R17", DISENO_NEUMATICO: "M/T",
    COSTO_NEUMATICO: 127.00, PLACA_MOVIMIENTO: "CFF-856", PROYECTO_MOVIMIENTO: "ANDAYCHAGUA",
    KM_RECORRIDOS_MOVIMIENTO: [2134, 1, 2134, 1, 1047, 228, 1047, 228, 2000, 1, 1800, 1, 2200, 1, 1900, 1, 2100, 1][i],
    TERRENO: "SOCAVÓN", CONDICION: "SOCAVÓN", TIPO_BAJA: "DESGASTE NATURAL", FECHA_BAJA: "2026-05-11",
  })),
  // Pirelli - SEVERO
  ...Array.from({ length: 10 }, (_, i) => ({
    ID_MOVIMIENTO: 300 + i, ID_NEUMATICO: 900 + i, CODIGO_NEUMATICO: `PIR00${i}`,
    MARCA_NEUMATICO: "PIRELLI", MEDIDA_NEUMATICO: "265/65 R17", DISENO_NEUMATICO: "M/T",
    COSTO_NEUMATICO: 134.44, PLACA_MOVIMIENTO: "CHK-822", PROYECTO_MOVIMIENTO: "ANDAYCHAGUA",
    KM_RECORRIDOS_MOVIMIENTO: [18000, 500, 17500, 300, 19000, 400, 18500, 200, 17000, 600][i],
    TERRENO: "SEVERO", CONDICION: "SEVERO", TIPO_BAJA: "DESGASTE NATURAL", FECHA_BAJA: "2026-04-15",
  })),
  // Hankook - SEVERO
  ...Array.from({ length: 4 }, (_, i) => ({
    ID_MOVIMIENTO: 400 + i, ID_NEUMATICO: 1000 + i, CODIGO_NEUMATICO: `HAN00${i}`,
    MARCA_NEUMATICO: "HANKOOK", MEDIDA_NEUMATICO: "265/65 R17", DISENO_NEUMATICO: "M/T",
    COSTO_NEUMATICO: 129.18, PLACA_MOVIMIENTO: "CFF-807", PROYECTO_MOVIMIENTO: "ANDAYCHAGUA",
    KM_RECORRIDOS_MOVIMIENTO: [15000, 500, 16000, 400][i],
    TERRENO: "SEVERO", CONDICION: "SEVERO", TIPO_BAJA: "DESGASTE NATURAL", FECHA_BAJA: "2026-04-05",
  })),
  // BFGoodrich - TAIR PRUEBAS
  ...Array.from({ length: 6 }, (_, i) => ({
    ID_MOVIMIENTO: 500 + i, ID_NEUMATICO: 902 + (i < 3 ? 0 : 8), CODIGO_NEUMATICO: `PR0000${i < 3 ? 3 : 11}`,
    MARCA_NEUMATICO: "BFGOODRICH", MEDIDA_NEUMATICO: "265/65 R17", DISENO_NEUMATICO: "M/T",
    COSTO_NEUMATICO: 184.20, PLACA_MOVIMIENTO: i < 3 ? "TAIR-002" : "TAIR-001", PROYECTO_MOVIMIENTO: "TAIR PRUEBAS",
    KM_RECORRIDOS_MOVIMIENTO: [1, 1, 1, 0, 0, 0][i],
    TERRENO: i < 3 ? "SEVERO" : "SUPERFICIE", CONDICION: i < 3 ? "SEVERO" : "SUPERFICIE", TIPO_BAJA: "RECOBRO", FECHA_BAJA: "2026-04-13",
  })),
];

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

function exportCSV(rows: FilaCK[], filtros: Record<string, string>) {
  const header = "Marca,KM Promedio,Precio ($),C.K,Cantidad";
  const body = rows.map(r =>
    `${r.marca},${Math.round(r.kmPromedio)},${r.costo.toFixed(2)},${r.ck.toFixed(5)},${r.cantidad}`
  ).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-bajas-${Object.values(filtros).filter(Boolean).join("-") || "todos"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// COMPONENT
// ============================================
export default function ReporteNeumaticoBaja() {
  const API_URL = "/api/ges-neu/movimientos-baja";

  // ---- Estado de filtros ----
  const [talleresSeleccionados, setTalleresSeleccionados] = useState<string[]>([]);
  const [condicion, setCondicion] = useState<string>("");
  const [medida, setMedida] = useState<string>("");
  const [diseno, setDiseno] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [tipoBaja, setTipoBaja] = useState<string>("");


  const { data = [] } = useQuery({
    queryKey: ['analisis-neumaticos-en-baja'],
    queryFn: obtenerMovimientosDeNeumaticosEnBaja
  })

  // ---- Usar DEMO_DATA (reemplazar con fetch real) ----
  // const data: MovimientoBaja[] = DEMO_DATA;

  console.log({ verificaaaaaaar: data })


  // ---- Opciones únicas para filtros ----


  // * talleres
  const talleres = useMemo(() =>
    [...new Set(data.map(d => d.PROYECTO_MOVIMIENTO.trim()))].sort((a, b) => a.localeCompare(b)), [data]);
  // * medidas
  const medidas = useMemo(() =>
    [...new Set(data.map(d => d.MEDIDA_NEUMATICO.trim()))].sort((a, b) => a.localeCompare(b)), [data]);
  // * diseños
  const disenos = useMemo(() =>
    [...new Set(data.map(d => d.DISENO_NEUMATICO.trim()))].sort((a, b) => a.localeCompare(b)), [data]);

  const condiciones = useMemo(() =>
    [...new Set(data.map(d => d.CONDICION.trim()))].sort((a, b) => a.localeCompare(b)), [data]);
  const tiposBaja = useMemo(() =>
    [...new Set(data.map(d => d.TIPO_BAJA.trim()))].sort((a, b) => a.localeCompare(b)), [data]);

  // ---- Datos filtrados ----
  const filtrado = useMemo(() => {
    return data.filter(d => {
      if (talleresSeleccionados.length > 0 && !talleresSeleccionados.includes(d.PROYECTO_MOVIMIENTO.trim())) return false;
      if (condicion && d.CONDICION.trim() !== condicion) return false;
      if (medida && d.MEDIDA_NEUMATICO.trim() !== medida) return false;
      if (diseno && d.DISENO_NEUMATICO.trim() !== diseno) return false;
      if (tipoBaja && d.TIPO_BAJA.trim() !== tipoBaja) return false;
      if (fechaInicio && d.FECHA_BAJA < fechaInicio) return false;
      if (fechaFin && d.FECHA_BAJA > fechaFin) return false;
      return true;
    });
  }, [data, talleresSeleccionados, condicion, medida, diseno, tipoBaja, fechaInicio, fechaFin]);

  // ---- Calcular KM total por neumático (suma de etapas) ----
  const kmPorNeumatico = useMemo(() => {
    const map = new Map<number, { kmTotal: number; marca: string; zona: string; costos: number[] }>();
    for (const row of filtrado) {
      const id = row.ID_NEUMATICO;
      if (!map.has(id)) {
        map.set(id, { kmTotal: 0, marca: row.MARCA_NEUMATICO.trim(), zona: row.CONDICION.trim(), costos: [] });
      }
      const entry = map.get(id)!;
      entry.kmTotal += row.KM_RECORRIDOS_MOVIMIENTO;
      entry.costos.push(row.COSTO_NEUMATICO);
    }
    return map;
  }, [filtrado]);

  // ---- Tabla PIVOT: Marca × Zona ----
  const tablaPivot = useMemo(() => {
    const grupos = new Map<string, { kmSumas: number[]; costos: number[] }>();
    for (const [, neu] of kmPorNeumatico) {
      const key = `${neu.marca}|||${neu.zona}`;
      if (!grupos.has(key)) grupos.set(key, { kmSumas: [], costos: [] });
      const g = grupos.get(key)!;
      g.kmSumas.push(neu.kmTotal);
      g.costos.push(...neu.costos);
    }
    const filas: FilaReporte[] = [];
    for (const [key, g] of grupos) {
      const [marca, zona] = key.split("|||");
      const kmPromedio = g.kmSumas.reduce((a, b) => a + b, 0) / g.kmSumas.length;
      const costo = moda(g.costos);
      filas.push({ marca, zona, kmPromedio, cantidad: g.kmSumas.length, costo, ck: kmPromedio > 0 ? costo / kmPromedio : 0 });
    }
    return filas.sort((a, b) => a.marca.localeCompare(b.marca) || a.zona.localeCompare(b.zona));
  }, [kmPorNeumatico]);

  // ---- Zonas únicas presentes ----
  const zonasPresentes = useMemo(() =>
    [...new Set(tablaPivot.map(r => r.zona))].sort(), [tablaPivot]);

  // ---- Marcas únicas presentes ----
  const marcasPresentes = useMemo(() =>
    [...new Set(tablaPivot.map(r => r.marca))].sort(), [tablaPivot]);

  // ---- Tabla C.K (resumen total por marca) ----
  const tablaCK = useMemo((): FilaCK[] => {
    const grupos = new Map<string, { kmSumas: number[]; costos: number[] }>();
    for (const [, neu] of kmPorNeumatico) {
      if (!grupos.has(neu.marca)) grupos.set(neu.marca, { kmSumas: [], costos: [] });
      const g = grupos.get(neu.marca)!;
      g.kmSumas.push(neu.kmTotal);
      g.costos.push(...neu.costos);
    }
    return [...grupos.entries()].map(([marca, g]) => {
      const kmPromedio = g.kmSumas.reduce((a, b) => a + b, 0) / g.kmSumas.length;
      const costo = moda(g.costos);
      return { marca, kmPromedio, costo, ck: kmPromedio > 0 ? costo / kmPromedio : 0, cantidad: g.kmSumas.length };
    }).sort((a, b) => a.ck - b.ck);
  }, [kmPorNeumatico]);

  // ---- Totales generales ----
  const totalKmGeneral = useMemo(() => {
    if (tablaCK.length === 0) return 0;
    const totalNeus = tablaCK.reduce((a, b) => a + b.cantidad, 0);
    return tablaCK.reduce((a, b) => a + b.kmPromedio * b.cantidad, 0) / totalNeus;
  }, [tablaCK]);
  const totalCantGeneral = useMemo(() => tablaCK.reduce((a, b) => a + b.cantidad, 0), [tablaCK]);

  // ---- Toggle taller ----
  const toggleTaller = useCallback((taller: string) => {
    setTalleresSeleccionados(prev =>
      prev.includes(taller) ? prev.filter(t => t !== taller) : [...prev, taller]
    );
  }, []);

  const limpiarFiltros = () => {
    setTalleresSeleccionados([]);
    setCondicion("");
    setMedida("");
    setDiseno("");
    setTipoBaja("");
    setFechaInicio("");
    setFechaFin("");
  };

  const hayFiltrosActivos = talleresSeleccionados.length > 0 || condicion || medida || diseno || tipoBaja || fechaInicio || fechaFin;

  // ---- Lookup pivot ----
  const pivotLookup = useMemo(() => {
    const map = new Map<string, FilaReporte>();
    for (const row of tablaPivot) map.set(`${row.marca}|||${row.zona}`, row);
    return map;
  }, [tablaPivot]);

  const pivotTotalMarca = useMemo(() => {
    const map = new Map<string, { kmTotal: number; cant: number }>();
    for (const ck of tablaCK) map.set(ck.marca, { kmTotal: ck.kmPromedio, cant: ck.cantidad });
    return map;
  }, [tablaCK]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{
      background: "#f8fafc", minHeight: "100vh", padding: "28px 32px", color: "#1e293b",
    }}>

      {/* ---- HEADER ---- */}
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
          </p>
        </div>
        {/* <button
          onClick={() => exportCSV(tablaCK, { condicion, medida, diseno, tipoBaja })}
          disabled={tablaCK.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 20px", borderRadius: 10, border: "none",
            background: tablaCK.length === 0 ? "#e2e8f0" : "#0f172a",
            color: tablaCK.length === 0 ? "#94a3b8" : "#fff",
            fontSize: 13, fontWeight: 500, cursor: tablaCK.length === 0 ? "default" : "pointer", transition: "all .15s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Exportar CSV
        </button> */}
      </div>

      {/* ---- FILTROS ---- */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
        padding: "20px 24px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Filtros</span>
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} style={{
              fontSize: 12, color: "#ef4444", background: "none", border: "none",
              cursor: "pointer", fontWeight: 500,
            }}>
              Limpiar todo
            </button>
          )}
        </div>

        {/* Talleres (multi-select con chips) */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Taller
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {talleres.map(t => (
              <button
                key={t}
                onClick={() => toggleTaller(t)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                  borderColor: talleresSeleccionados.includes(t) ? "#3b82f6" : "#e2e8f0",
                  background: talleresSeleccionados.includes(t) ? "#eff6ff" : "#fff",
                  color: talleresSeleccionados.includes(t) ? "#1d4ed8" : "#64748b",
                  fontSize: 12, fontWeight: talleresSeleccionados.includes(t) ? 600 : 400,
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros en grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { label: "Condición", value: condicion, setter: setCondicion, options: condiciones },
            { label: "Medida", value: medida, setter: setMedida, options: medidas },
            { label: "Diseño", value: diseno, setter: setDiseno, options: disenos },
            { label: "Tipo de baja", value: tipoBaja, setter: setTipoBaja, options: tiposBaja },
          ].map(({ label, value, setter, options }) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                {label}
              </p>
              <Select
                value={value || "all"}
                onValueChange={v => setter(v === "all" ? "" : v)}
              >
                <SelectTrigger className={value ? "border-blue-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha desde</p>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${fechaInicio ? "#3b82f6" : "#e2e8f0"}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Fecha hasta</p>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${fechaFin ? "#3b82f6" : "#e2e8f0"}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {filtrado.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 16, margin: "0 0 4px" }}>Sin resultados</p>
          <p style={{ fontSize: 13 }}>Ajusta los filtros para ver datos</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* ============ TABLA PIVOT ============ */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>Rendimiento por marca y zona</p>
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

          {/* ============ TABLA C.K ============ */}
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
                    <th style={{ ...thStyle }}>Precio ($)</th>
                    <th style={{ ...thStyle }}>C.K</th>
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
                        <td style={{ ...tdStyle }}>$ {fmtCosto(row.costo)}</td>
                        <td style={{ ...tdStyle }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            <div style={{ width: 50, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${(1 - pct) * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontWeight: 700, color, fontSize: 11 }}>
                              {fmtCK(row.ck)}
                            </span>
                          </div>
                        </td>
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
                    <td style={{ ...tdStyle }}>—</td>
                    <td style={{ ...tdStyle }}>—</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 11 }}>
                        {totalCantGeneral}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mini chart C.K */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 14px" }}>Comparativa C.K por marca</p>
              {tablaCK.map(row => {
                const mejor = tablaCK[0].ck;
                const peor = tablaCK[tablaCK.length - 1].ck;
                const rango = peor - mejor;
                const pct = rango > 0 ? (row.ck - mejor) / rango : 0;
                const color = pct < 0.33 ? "#22c55e" : pct < 0.66 ? "#f59e0b" : "#ef4444";
                const barWidth = 10 + ((row.ck / (peor || 1)) * 70);
                return (
                  <div key={row.marca} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{row.marca}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>
                        {fmtCK(row.ck)}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${barWidth}%`, height: "100%", borderRadius: 4,
                        background: color, transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: 10, color: "#94a3b8", margin: "10px 0 0" }}>
                Verde = menor costo por km (mejor rendimiento) · Rojo = mayor costo por km
              </p>
            </div>
          </div>
        </div>
      )
      }

      {/* ---- INFO METODOLOGÍA ---- */}
      <div style={{
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
      </div>
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