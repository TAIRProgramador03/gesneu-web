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