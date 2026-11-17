"use client"
import React from "react"
import { flexRender, type Cell, type Row } from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/** Cuántos datos se ven de entrada en la tarjeta; el resto queda tras «Ver más». */
const DATOS_VISIBLES = 6

interface FilaComoTarjetaProps<TData> {
  row: Row<TData>
}

interface MetaTarjeta {
  exportLabel?: string
  tarjeta?: "ancho" | "insignia"
}

/**
 * Una fila de la tabla dibujada como tarjeta (para teléfono). Se arma sola con
 * las columnas visibles, usando el mismo `cell` que la tabla:
 * - la primera es el título;
 * - una columna con `meta.tarjeta: "insignia"` va al lado del título (p. ej. la situación);
 * - una con `meta.tarjeta: "ancho"` ocupa toda la fila (p. ej. la barra de vida) y siempre se ve;
 * - las demás van como etiqueta y valor: las primeras 6 a la vista y el resto en «Ver más»;
 * - la columna `select` pasa a ser el checkbox.
 */
export function FilaComoTarjeta<TData>({ row }: FilaComoTarjetaProps<TData>) {
  const [abierto, setAbierto] = React.useState(false)

  const celdas = row.getVisibleCells()
  const meta = (c: Cell<TData, unknown>) => c.column.columnDef.meta as MetaTarjeta | undefined

  const seleccion = celdas.find((c) => c.column.id === "select")
  const datos = celdas.filter((c) => c.column.id !== "select")
  const insignia = datos.find((c) => meta(c)?.tarjeta === "insignia")
  const [titulo, ...resto] = datos.filter((c) => c !== insignia)

  const etiqueta = (c: Cell<TData, unknown>): string => {
    const header = c.column.columnDef.header
    return meta(c)?.exportLabel ?? (typeof header === "string" ? header : c.column.id)
  }

  // Las celdas anchas no cuentan para el límite: son lo más importante de la tarjeta.
  let normales = 0
  const visibles: Cell<TData, unknown>[] = []
  const extras: Cell<TData, unknown>[] = []
  for (const c of resto) {
    if (meta(c)?.tarjeta === "ancho" || normales < DATOS_VISIBLES) {
      visibles.push(c)
      if (meta(c)?.tarjeta !== "ancho") normales++
    } else {
      extras.push(c)
    }
  }

  const dato = (c: Cell<TData, unknown>) => (
    <div key={c.id} className={cn("min-w-0", meta(c)?.tarjeta === "ancho" && "col-span-2 [&>dd>div]:w-full!")}>
      <dt className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta(c)}</dt>
      <dd className="wrap-break-word text-sm font-medium">{flexRender(c.column.columnDef.cell, c.getContext())}</dd>
    </div>
  )

  return (
    <article
      className={cn(
        "flex shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 transition-colors",
        row.getIsSelected() && "border-sky-700 bg-sky-50 dark:border-sky-400 dark:bg-sky-500/10"
      )}
    >
      {titulo && (
        <div className="flex items-center gap-3">
          {seleccion && flexRender(seleccion.column.columnDef.cell, seleccion.getContext())}
          <div className="min-w-0 flex-1 truncate text-base font-bold text-sky-800 dark:text-sky-300">
            {flexRender(titulo.column.columnDef.cell, titulo.getContext())}
          </div>
          {insignia && (
            <div className="shrink-0">{flexRender(insignia.column.columnDef.cell, insignia.getContext())}</div>
          )}
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {visibles.map(dato)}
        {abierto && extras.map(dato)}
      </dl>
      {extras.length > 0 && (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="flex items-center justify-center gap-1 border-t pt-2 text-xs font-semibold text-sky-800 dark:text-sky-300"
        >
          {abierto ? "Ver menos" : `Ver ${extras.length} más`}
          <ChevronDown className={cn("size-4 transition-transform", abierto && "rotate-180")} />
        </button>
      )}
    </article>
  )
}
