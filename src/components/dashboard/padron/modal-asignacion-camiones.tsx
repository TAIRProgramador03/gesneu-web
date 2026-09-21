'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Box, Card, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { ChevronLeft, ChevronRight, PackageSearch, RotateCw, Search, SquareCheck, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button as ButtonCustom } from '@/components/ui/button'
import { LoadingButton2 } from '@/components/ui/loading-button2'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { LinearProgressItem } from '@/components/ui/LinearProgress'
import { MultiSearchSelect } from '@/components/ui/multiple-select'
import { DatePicker } from '@/components/ui/DatePicker'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { asignarNeumatico, Camioneta, obtenerNeumaticosDisponibles, obtenerVehiculosDeCamionetas } from '@/api/Neumaticos'

// Posición reservada para esta asignación especial: neumáticos que quedan
// "en placa" sin posición real en el diagrama, hasta que el camión se
// resuelva desde Movimientos (ahí recién se reemplaza esta reserva).
const POSICION_RESERVA = 'POS00'
const NEUMATICOS_POR_PAGINA = 50

interface NeumaticoDisponibleCamion {
  ID_NEUMATICO?: string | number
  CODIGO: string
  MARCA: string
  MEDIDA: string
  DISEÑO?: string
  REMANENTE: number | string
  PRESION_AIRE?: number | string
  TORQUE_APLICADO?: number | string
  ESTADO: number
  TIPO_MOVIMIENTO?: string
  FECHA_ASIGNACION?: string
  FECHA_REGISTRO?: string
}

interface ModalAsignacionCamionesProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const hoyLocal = () => {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10)
}

// Rango válido de fecha de asignación: hoy y los 3 días anteriores (4 días activos)
const fechaMinAsignacion = () => {
  const d = new Date()
  d.setDate(d.getDate() - 3)
  return d
}

const numero = (valor: number | string | undefined) =>
  typeof valor === 'string' ? parseFloat(valor) || 0 : valor ?? 0

const NeumaticoRow = React.memo(function NeumaticoRow({
  neu,
  isSelected,
  onToggle,
}: {
  neu: NeumaticoDisponibleCamion
  isSelected: boolean
  onToggle: (neu: NeumaticoDisponibleCamion) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(neu)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle(neu)}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer border-2 transition-all duration-150",
        isSelected
          ? "border-amber-500 bg-amber-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <Checkbox checked={isSelected} onCheckedChange={() => onToggle(neu)} onClick={(e) => e.stopPropagation()} aria-label={`Seleccionar ${neu.CODIGO}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm text-slate-800 truncate">{neu.CODIGO}</span>
          {neu.TIPO_MOVIMIENTO && <TipoMovimientoBadge tipoMovimiento={neu.TIPO_MOVIMIENTO} />}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {neu.MARCA} · {neu.MEDIDA}{neu.DISEÑO ? ` · ${neu.DISEÑO}` : ''}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-center shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vida útil</span>
        <LinearProgressItem estado={neu.ESTADO} width="70px" />
      </div>
    </div>
  )
})

export const ModalAsignacionCamiones = ({ open, onClose, onSuccess }: ModalAsignacionCamionesProps) => {
  const [placaSeleccionada, setPlacaSeleccionada] = useState('')
  const [odometro, setOdometro] = useState('')
  const [fechaAsignacion, setFechaAsignacion] = useState<Date | undefined>(new Date())
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [seleccionados, setSeleccionados] = useState<NeumaticoDisponibleCamion[]>([])

  const queryClient = useQueryClient()

  const { data: camionetas = [], isLoading: isLoadingCamionetas } = useQuery<Camioneta[]>({
    queryKey: ['vehiculos-de-camionetas'],
    queryFn: () => obtenerVehiculosDeCamionetas(),
  })

  const PLACA_OPTIONS = useMemo(
    () => camionetas.map(c => ({ value: c.PLACA, label: c.PLACA })),
    [camionetas]
  )

  const placaInfo = useMemo(
    () => camionetas.find(c => c.PLACA === placaSeleccionada) ?? null,
    [camionetas, placaSeleccionada]
  )

  const handleCambiarPlaca = (valores: string[]) => {
    setPlacaSeleccionada(valores.length > 0 ? valores[valores.length - 1] : '')
    setOdometro('')
    setSeleccionados([])
  }

  const { data: neumaticosDisponibles = [], isLoading } = useQuery<NeumaticoDisponibleCamion[]>({
    queryKey: ['neumaticos-disponibles'],
    queryFn: () => obtenerNeumaticosDisponibles(),
  })

  const neumaticosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toUpperCase()
    if (!termino) return neumaticosDisponibles
    return neumaticosDisponibles.filter(neu => neu.CODIGO?.toUpperCase().includes(termino))
  }, [neumaticosDisponibles, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(neumaticosFiltrados.length / NEUMATICOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const neumaticosPagina = useMemo(
    () => neumaticosFiltrados.slice(
      paginaActual * NEUMATICOS_POR_PAGINA,
      (paginaActual + 1) * NEUMATICOS_POR_PAGINA
    ),
    [neumaticosFiltrados, paginaActual]
  )

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value)
    setPagina(0)
  }

  const cantidadRequerida = placaInfo?.CANTIDAD_NEUMATICOS ?? 0
  const kilometrajeMinimo = placaInfo?.KILOMETRAJE ?? 0

  const toggleSeleccion = useCallback((neu: NeumaticoDisponibleCamion) => {
    setSeleccionados(prev => {
      const yaSeleccionado = prev.some(n => n.CODIGO === neu.CODIGO)
      if (yaSeleccionado) return prev.filter(n => n.CODIGO !== neu.CODIGO)
      if (prev.length >= cantidadRequerida) {
        toast.warning(`Esta placa requiere exactamente ${cantidadRequerida} neumático(s). Quita alguno antes de agregar otro.`)
        return prev
      }
      return [...prev, neu]
    })
  }, [cantidadRequerida])

  const todosVisiblesSeleccionados = neumaticosPagina.length > 0 &&
    neumaticosPagina.every(neu => seleccionados.some(n => n.CODIGO === neu.CODIGO))

  const toggleSeleccionarTodosVisibles = () => {
    if (todosVisiblesSeleccionados) {
      setSeleccionados(prev => prev.filter(n => !neumaticosPagina.some(neu => neu.CODIGO === n.CODIGO)))
    } else {
      setSeleccionados(prev => {
        const disponiblesParaAgregar = neumaticosPagina.filter(neu => !prev.some(n => n.CODIGO === neu.CODIGO))
        const cupo = cantidadRequerida - prev.length
        if (cupo <= 0) {
          toast.warning(`Esta placa requiere exactamente ${cantidadRequerida} neumático(s).`)
          return prev
        }
        if (disponiblesParaAgregar.length > cupo) {
          toast.warning(`Solo se agregaron ${cupo} neumático(s): esta placa requiere exactamente ${cantidadRequerida}.`)
        }
        return [...prev, ...disponiblesParaAgregar.slice(0, cupo)]
      })
    }
  }

  const handleReset = () => {
    setPlacaSeleccionada('')
    setOdometro('')
    setFechaAsignacion(new Date())
    setBusqueda('')
    setPagina(0)
    setSeleccionados([])
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const odometroValido = odometro.trim().length > 0 && Number(odometro) >= kilometrajeMinimo
  const cantidadValida = cantidadRequerida > 0 && seleccionados.length === cantidadRequerida
  const puedeRegistrar = !!placaInfo && odometroValido && cantidadValida

  const handleConfirmarAsignacion = async () => {
    if (!puedeRegistrar || !placaInfo) return
    try {
      const payload = seleccionados.map(neu => ({
        CodigoNeumatico: neu.CODIGO,
        Remanente: numero(neu.REMANENTE),
        PresionAire: 25,
        TorqueAplicado: 110,
        Placa: placaInfo.PLACA,
        Posicion: POSICION_RESERVA,
        Odometro: Number(odometro),
        ID_OPERACION: placaInfo.ID_OPERACION !== undefined ? Number(placaInfo.ID_OPERACION) : undefined,
        COD_SUPERVISOR: placaInfo.ID_SUPERVISOR,
        FechaAsignacion: fechaAsignacion ? format(fechaAsignacion, 'yyyy-MM-dd') : (neu.FECHA_ASIGNACION || neu.FECHA_REGISTRO || hoyLocal()),
        EnTransito: false,
        Taller: placaInfo.TALLER,
      }))

      const response = await asignarNeumatico(payload)
      const resultados: Array<{ index: number; error?: string; detalle?: string }> = response?.resultados ?? []
      const errores = resultados.filter(r => r.error)

      queryClient.invalidateQueries({ queryKey: ['neumaticos-disponibles'] })
      onSuccess()

      if (errores.length > 0) {
        const codigosFallidos = errores.map(e => seleccionados[e.index]?.CODIGO ?? `#${e.index}`).join(', ')
        toast.error(
          `Se reservaron ${seleccionados.length - errores.length} de ${seleccionados.length} neumático(s) para ${placaInfo.PLACA}. Fallaron: ${codigosFallidos}.`,
          { position: 'top-right', duration: 10000 }
        )
        const indicesFallidos = new Set(errores.map(e => e.index))
        setSeleccionados(prev => prev.filter((_, i) => indicesFallidos.has(i)))
        return
      }

      toast.success(
        `${seleccionados.length} neumático(s) reservado(s) para la placa ${placaInfo.PLACA}.`,
        { position: 'top-right' }
      )
      handleClose()
    } catch (error) {
      toast.error('No se pudo registrar la asignación. Inténtalo nuevamente.', { position: 'top-right' })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        }}>
          <Truck size={20} className="text-amber-600" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Asignar Neumáticos a Placa (camiones)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Para placas que aún no están en el diagrama de vehículo. Se reservan sin posición hasta resolverse en Movimientos.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, bgcolor: '#f8fafc' }}>
        <Stack spacing={2.5}>
          <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '8px' }} elevation={0}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Datos de la placa
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <div className="flex-1">
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Placa <span className="text-amber-600">*</span>
                </p>
                <MultiSearchSelect
                  options={PLACA_OPTIONS}
                  value={placaSeleccionada ? [placaSeleccionada] : []}
                  onChange={handleCambiarPlaca}
                  placeholder={isLoadingCamionetas ? 'Cargando placas...' : 'Seleccionar placa'}
                  searchPlaceholder="Buscar placa..."
                  disabled={isLoadingCamionetas}
                />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Kilometraje actual <span className="text-amber-600">*</span>
                </p>
                <Input
                  type="number"
                  value={odometro}
                  onChange={(e) => setOdometro(e.target.value)}
                  placeholder={placaInfo ? `Mín: ${kilometrajeMinimo}` : 'Elige una placa primero'}
                  disabled={!placaInfo}
                />
                {placaInfo && (
                  <p className={cn(
                    "text-xs mt-1",
                    odometroValido ? "text-slate-500" : "text-rose-600"
                  )}>
                    Debe ser mayor o igual que {kilometrajeMinimo.toLocaleString('es-PE')} km
                  </p>
                )}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Fecha de asignación
                </p>
                <DatePicker
                  value={fechaAsignacion}
                  onChange={setFechaAsignacion}
                  minDate={fechaMinAsignacion()}
                  maxDate={new Date()}
                  className="w-full"
                />
              </div>
            </Stack>
          </Card>

          <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', opacity: placaInfo ? 1 : 0.5, pointerEvents: placaInfo ? 'auto' : 'none' }} elevation={0}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Neumáticos disponibles</Typography>
              {placaInfo ? (
                <Typography variant="caption" className={cn(cantidadValida ? "text-emerald-600" : "text-amber-700")} sx={{ fontWeight: 700 }}>
                  {seleccionados.length} de {cantidadRequerida} requeridos
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled">Elige una placa para ver los neumáticos disponibles</Typography>
              )}
            </div>

            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={busqueda}
                onChange={(e) => cambiarBusqueda(e.target.value)}
                placeholder="Buscar por código"
                className="h-9 pl-9 pr-8"
              />
              {busqueda.length > 0 && (
                <button
                  type="button"
                  onClick={() => cambiarBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* {neumaticosFiltrados.length > 0 && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <Checkbox
                  checked={todosVisiblesSeleccionados}
                  onCheckedChange={toggleSeleccionarTodosVisibles}
                  aria-label="Seleccionar todos los visibles"
                />
                <span className="text-xs text-slate-500">
                  Seleccionar todos los visibles de esta página ({neumaticosPagina.length} de {neumaticosFiltrados.length})
                </span>
              </div>
            )} */}

            <div className="max-h-64 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-15 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : neumaticosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                  <PackageSearch size={28} strokeWidth={1.5} />
                  <p className="text-sm italic">
                    {busqueda ? `Sin resultados para "${busqueda}".` : 'No hay neumáticos disponibles.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {neumaticosPagina.map((neu) => (
                    <NeumaticoRow
                      key={neu.CODIGO}
                      neu={neu}
                      isSelected={seleccionados.some(n => n.CODIGO === neu.CODIGO)}
                      onToggle={toggleSeleccion}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && neumaticosFiltrados.length > NEUMATICOS_POR_PAGINA && (
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs text-slate-500">
                  Página {paginaActual + 1} de {totalPaginas}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPagina(p => Math.max(0, p - 1))}
                    disabled={paginaActual === 0}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                    disabled={paginaActual >= totalPaginas - 1}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {seleccionados.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-amber-700 font-semibold">
                    {seleccionados.length} neumático(s) seleccionado(s)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {seleccionados.map(n => (
                    <span
                      key={n.CODIGO}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 pl-2 pr-1 py-0.5 text-xs font-medium text-amber-700 font-mono"
                    >
                      {n.CODIGO}
                      <button
                        type="button"
                        onClick={() => toggleSeleccion(n)}
                        className="rounded-full hover:bg-amber-100 p-0.5"
                        aria-label={`Quitar ${n.CODIGO}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ButtonCustom onClick={handleClose}>
          Cerrar
        </ButtonCustom>
        <ButtonCustom size="icon" variant="warning" onClick={handleReset}>
          <RotateCw />
        </ButtonCustom>
        <LoadingButton2
          variant="rose"
          icon={<SquareCheck />}
          disabled={!puedeRegistrar}
          onClick={handleConfirmarAsignacion}
        >
          Asignar a Placa
        </LoadingButton2>
      </DialogActions>
    </Dialog>
  )
}
