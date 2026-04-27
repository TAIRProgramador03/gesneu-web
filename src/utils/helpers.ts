export function vidaColor(pct: number) {
  if (pct < 39) return "text-red-500"
  if (pct < 79) return "text-yellow-500"
  return "text-green-500"
}

export function vidaBgBar(pct: number) {
  if (pct < 39) return "bg-red-500"
  if (pct < 79) return "bg-yellow-500"
  return "bg-green-500"
}

export function vidaBgGradient(pct: number) {
  if (pct < 39) return "from-red-500 to-rose-400"
  if (pct < 79) return "from-yellow-500 to-amber-400"
  return "from-teal-500 to-emerald-400"
}

export function vidaRingColor(pct: number) {
  if (pct < 39) return "stroke-red-500"
  if (pct < 79) return "stroke-yellow-500"
  return "stroke-green-500"
}

export function vidaTrackColor(pct: number) {
  if (pct < 39) return "stroke-red-100"
  if (pct < 79) return "stroke-yellow-100"
  return "stroke-green-100"
}

export function timelineDotColor(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-500"
    case "DISPONIBLE": return "bg-sky-500"
    case "BAJA": return "bg-red-500"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-500"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-yellow-500"
    case "REGISTRO": return "bg-gray-400"
    default: return "bg-gray-400"
  }
}

export function timelineIconBg(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-100 text-green-600 border-green-200"
    case "DISPONIBLE": return "bg-sky-100 text-sky-600 border-sky-200"
    case "BAJA": return "bg-red-100 text-red-600 border-red-200"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-100 text-indigo-600 border-indigo-200"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-amber-100 text-amber-600 border-amber-200"
    case "REGISTRO": return "bg-gray-100 text-gray-500 border-gray-200"
    default: return "bg-gray-100 text-gray-500 border-gray-200"
  }
}

// export function timelineIcon(tipo: string) {
//   const cls = "size-4"
//   switch (tipo) {
//     case "ASIGNADO": return <Truck className={ cls } />
//     case "DISPONIBLE": return <PackagePlus className={ cls } />
//     case "BAJA": return <PackageMinus className={ cls } />
//     case "ROTACIÓN":
//     case "ROTACION": return <RefreshCw className={ cls } />
//     case "INSPECCIÓN":
//     case "INSPECCION": return <Search className={ cls } />
//     case "REGISTRO": return <CircleDot className={ cls } />
//     default: return <CircleDot className={ cls } />
//   }
// }

export function timelineLineColor(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "from-green-300 to-green-100"
    case "DISPONIBLE": return "from-sky-300 to-sky-100"
    case "BAJA": return "from-red-300 to-red-100"
    case "ROTACIÓN":
    case "ROTACION": return "from-indigo-300 to-indigo-100"
    case "INSPECCIÓN":
    case "INSPECCION RUTINARIA": return "from-amber-300 to-amber-100"
    default: return "from-gray-300 to-gray-100"
  }
}

/** Color accents per movement type */
export function timelineCardAccent(tipo: string) {
  const base: Record<string, { stripe: string; ring: string; chip: string }> = {
    ASIGNADO: { stripe: "bg-green-400", ring: "ring-green-100 border-green-200", chip: "bg-green-50 text-green-600" },
    DISPONIBLE: { stripe: "bg-sky-400", ring: "ring-sky-100 border-sky-200", chip: "bg-sky-50 text-sky-600" },
    BAJA: { stripe: "bg-red-400", ring: "ring-red-100 border-red-200", chip: "bg-red-50 text-red-600" },
    ROTACIÓN: { stripe: "bg-indigo-400", ring: "ring-indigo-100 border-indigo-200", chip: "bg-indigo-50 text-indigo-600" },
    ROTACION: { stripe: "bg-indigo-400", ring: "ring-indigo-100 border-indigo-200", chip: "bg-indigo-50 text-indigo-600" },
    INSPECCIÓN: { stripe: "bg-amber-400", ring: "ring-amber-100 border-amber-200", chip: "bg-amber-50 text-amber-600" },
    "INSPECCION RUTINARIA": { stripe: "bg-amber-400", ring: "ring-amber-100 border-amber-200", chip: "bg-amber-50 text-amber-600" },
    REGISTRO: { stripe: "bg-gray-300", ring: "ring-gray-100 border-gray-200", chip: "bg-gray-50 text-gray-500" },
    TEMPORAL: { stripe: "bg-cyan-400", ring: "ring-cyan-100 border-cyan-200", chip: "bg-cyan-50 text-cyan-600" },
    REQUERIDO: { stripe: "bg-rose-400", ring: "ring-rose-100 border-rose-200", chip: "bg-rose-50 text-rose-600" },
  }
  return base[tipo] ?? base.REGISTRO
}
