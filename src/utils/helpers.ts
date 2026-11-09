/*
 * Semáforo de vida útil.
 *
 * Los colores ya no se escriben aquí: salen de los tokens --vida-ok /
 * --vida-alerta / --vida-critico de `src/styles/tailwind.css`, que se
 * redefinen en `.dark`. En claro valen exactamente los mismos green-500 /
 * yellow-500 / red-500 de siempre, así que nada cambia de aspecto.
 *
 * El significado NO se invierte entre modos: rojo sigue siendo crítico.
 * Lo único que cambia en oscuro es la luminosidad, para que contraste
 * contra el fondo en vez de contra el blanco.
 */

export function vidaColor(pct: number) {
  if (pct < 39) return "text-vida-critico"
  if (pct < 79) return "text-vida-alerta"
  return "text-vida-ok"
}

export function borderColor(pct: number) {
  if (pct < 39) return "border-vida-critico"
  if (pct < 79) return "border-vida-alerta"
  return "border-vida-ok"
}

export function vidaBgBar(pct: number) {
  if (pct < 39) return "bg-vida-critico"
  if (pct < 79) return "bg-vida-alerta"
  return "bg-vida-ok"
}

/* Este se queda con los colores literales a propósito: son barras rellenas
   de dos tonos (rojo→rosa, verde azulado→esmeralda) que se leen bien sobre
   los dos fondos. Pasarlas a un token de un solo color les quitaría el
   degradado, que es justamente lo que son. */
export function vidaBgGradient(pct: number) {
  if (pct < 39) return "from-red-500 to-rose-400"
  if (pct < 79) return "from-yellow-500 to-amber-400"
  return "from-teal-500 to-emerald-400"
}

export function vidaRingColor(pct: number) {
  if (pct < 39) return "stroke-vida-critico"
  if (pct < 79) return "stroke-vida-alerta"
  return "stroke-vida-ok"
}

/* La pista del anillo (el fondo sobre el que se dibuja el progreso) era un
   tono 100, pensado para fondo blanco: en oscuro quedaba como un aro casi
   blanco más visible que el propio dato. En oscuro el token pasa a ser el
   mismo color con 18 % de opacidad. */
export function vidaTrackColor(pct: number) {
  if (pct < 39) return "stroke-vida-critico-suave"
  if (pct < 79) return "stroke-vida-alerta-suave"
  return "stroke-vida-ok-suave"
}

/*
 * Colores por tipo de movimiento (línea de tiempo).
 *
 * Estos NO van por tokens: son una paleta categórica de 9 colores que sólo
 * sirve para distinguir un tipo de otro, no una escala de dominio como la de
 * vida útil. Llevan variantes `dark:` escritas al lado, así el modo claro
 * queda intacto y se ve exactamente qué se corrigió para el oscuro.
 *
 * La regla aplicada: los tonos 50/100/200 (fondos y bordes pensados para
 * papel blanco) pasan en oscuro al mismo color con poca opacidad, y el texto
 * sube de 500/600 a 300/400 para que contraste contra el fondo oscuro.
 */

export function timelineDotColor(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-500 dark:bg-green-400"
    case "DISPONIBLE": return "bg-sky-500 dark:bg-sky-400"
    case "BAJA": return "bg-red-500 dark:bg-red-400"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-500 dark:bg-indigo-400"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-yellow-500 dark:bg-yellow-400"
    case "REGISTRO": return "bg-gray-400 dark:bg-gray-500"
    default: return "bg-gray-400 dark:bg-gray-500"
  }
}

export function timelineIconBg(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-100 text-green-600 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30"
    case "DISPONIBLE": return "bg-sky-100 text-sky-600 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
    case "BAJA": return "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
    case "REGISTRO": return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30"
    default: return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30"
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
    // La línea se desvanecía hacia un tono 100 (casi blanco): sobre fondo
    // oscuro parecía un trazo encendido. En oscuro se desvanece hacia la
    // transparencia, que es el efecto que se buscaba.
    case "ASIGNADO": return "from-green-300 to-green-100 dark:from-green-500/60 dark:to-green-500/5"
    case "DISPONIBLE": return "from-sky-300 to-sky-100 dark:from-sky-500/60 dark:to-sky-500/5"
    case "BAJA": return "from-red-300 to-red-100 dark:from-red-500/60 dark:to-red-500/5"
    case "ROTACIÓN":
    case "ROTACION": return "from-indigo-300 to-indigo-100 dark:from-indigo-500/60 dark:to-indigo-500/5"
    case "INSPECCIÓN":
    case "INSPECCION RUTINARIA": return "from-amber-300 to-amber-100 dark:from-amber-500/60 dark:to-amber-500/5"
    default: return "from-gray-300 to-gray-100 dark:from-gray-500/60 dark:to-gray-500/5"
  }
}

/** Color accents per movement type */
export function timelineCardAccent(tipo: string) {
  // Ojo: las clases van escritas completas, nunca armadas con plantillas
  // (`bg-${color}-400`). Tailwind detecta las clases leyendo el texto del
  // archivo; una clase construida en tiempo de ejecución no la ve y no
  // genera el CSS, así que el color simplemente no aparece.
  const base: Record<string, { stripe: string; ring: string; chip: string }> = {
    ASIGNADO: {
      stripe: "bg-green-400 dark:bg-green-500",
      ring: "ring-green-100 border-green-200 dark:ring-green-500/20 dark:border-green-500/30",
      chip: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300",
    },
    DISPONIBLE: {
      stripe: "bg-sky-400 dark:bg-sky-500",
      ring: "ring-sky-100 border-sky-200 dark:ring-sky-500/20 dark:border-sky-500/30",
      chip: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    },
    BAJA: {
      stripe: "bg-red-400 dark:bg-red-500",
      ring: "ring-red-100 border-red-200 dark:ring-red-500/20 dark:border-red-500/30",
      chip: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    },
    ROTACIÓN: {
      stripe: "bg-indigo-400 dark:bg-indigo-500",
      ring: "ring-indigo-100 border-indigo-200 dark:ring-indigo-500/20 dark:border-indigo-500/30",
      chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    ROTACION: {
      stripe: "bg-indigo-400 dark:bg-indigo-500",
      ring: "ring-indigo-100 border-indigo-200 dark:ring-indigo-500/20 dark:border-indigo-500/30",
      chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    INSPECCIÓN: {
      stripe: "bg-amber-400 dark:bg-amber-500",
      ring: "ring-amber-100 border-amber-200 dark:ring-amber-500/20 dark:border-amber-500/30",
      chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    },
    "INSPECCION RUTINARIA": {
      stripe: "bg-amber-400 dark:bg-amber-500",
      ring: "ring-amber-100 border-amber-200 dark:ring-amber-500/20 dark:border-amber-500/30",
      chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    },
    REGISTRO: {
      stripe: "bg-gray-300 dark:bg-gray-600",
      ring: "ring-gray-100 border-gray-200 dark:ring-gray-500/20 dark:border-gray-500/30",
      chip: "bg-gray-50 text-gray-500 dark:bg-gray-500/15 dark:text-gray-300",
    },
    TEMPORAL: {
      stripe: "bg-cyan-400 dark:bg-cyan-500",
      ring: "ring-cyan-100 border-cyan-200 dark:ring-cyan-500/20 dark:border-cyan-500/30",
      chip: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    },
    REQUERIDO: {
      stripe: "bg-rose-400 dark:bg-rose-500",
      ring: "ring-rose-100 border-rose-200 dark:ring-rose-500/20 dark:border-rose-500/30",
      chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    },
  }
  return base[tipo] ?? base.REGISTRO
}

/**
 * 
 * @param object 
 * @returns number days to difference
 */
export const getDifferenceDays = ({ anterior, actual }: { anterior: string, actual: string }): number => {
  const antes = Date.parse(anterior)
  const ahora = Date.parse(actual)
  return Math.max(0, Math.round((ahora - antes) / (1000 * 60 * 60 * 24)) + 1)
}