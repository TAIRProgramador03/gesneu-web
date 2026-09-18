'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Box, Card, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { BanknoteArrowUp, ChevronLeft, ChevronRight, PackageSearch, RotateCw, Search, SquareCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button as ButtonCustom } from '@/components/ui/button'
import { LoadingButton2 } from '@/components/ui/loading-button2'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { LinearProgressItem } from '@/components/ui/LinearProgress'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NeumaticoParaVenta, obtenerNeumaticosDisponiblesParaVenta, registrarVentaNeumaticos } from '@/api/Neumaticos'

const formatCosto = (costo: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(costo ?? 0)

const NEUMATICOS_POR_PAGINA = 50

interface ModalVentaNeumaticoProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void
}

const NeumaticoRow = React.memo(function NeumaticoRow({
  neu,
  isSelected,
  onToggle,
}: {
  neu: NeumaticoParaVenta
  isSelected: boolean
  onToggle: (neu: NeumaticoParaVenta) => void
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
          ? "border-rose-500 bg-rose-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <Checkbox checked={isSelected} onCheckedChange={() => onToggle(neu)} onClick={(e) => e.stopPropagation()} aria-label={`Seleccionar ${neu.CODIGO}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm text-slate-800 truncate">{neu.CODIGO}</span>
          <TipoMovimientoBadge tipoMovimiento={neu.TIPO_MOVIMIENTO} />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {neu.MARCA} · {neu.MEDIDA} · {neu.DISEÑO} · {neu.PROYECTO}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-center shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vida útil</span>
        <LinearProgressItem estado={neu.ESTADO} width="70px" />
      </div>

      <div className="text-right shrink-0 w-20">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Costo</span>
        <span className="text-sm font-bold text-slate-700">{formatCosto(neu.COSTO)}</span>
      </div>
    </div>
  )
})

export const ModalVentaNeumatico = ({ open, onClose, onSuccess }: ModalVentaNeumaticoProps) => {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [seleccionados, setSeleccionados] = useState<NeumaticoParaVenta[]>([])
  const [numeroCotizacion, setNumeroCotizacion] = useState('')
  const [comentarios, setComentarios] = useState('')

  const queryClient = useQueryClient()

  const { data: neumaticosDisponiblesParaVenta = [], isLoading, isFetching } = useQuery({
    queryKey: ['neumaticos-propios', { busqueda }],
    queryFn: () => obtenerNeumaticosDisponiblesParaVenta(busqueda)
  })

  const totalPaginas = Math.max(1, Math.ceil(neumaticosDisponiblesParaVenta.length / NEUMATICOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const neumaticosPagina = useMemo(
    () => neumaticosDisponiblesParaVenta.slice(
      paginaActual * NEUMATICOS_POR_PAGINA,
      (paginaActual + 1) * NEUMATICOS_POR_PAGINA
    ),
    [neumaticosDisponiblesParaVenta, paginaActual]
  )

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value)
    setPagina(0)
  }

  const toggleSeleccion = useCallback((neu: NeumaticoParaVenta) => {
    setSeleccionados(prev =>
      prev.some(n => n.ID_NEUMATICO === neu.ID_NEUMATICO)
        ? prev.filter(n => n.ID_NEUMATICO !== neu.ID_NEUMATICO)
        : [...prev, neu]
    )
  }, [])

  const todosVisiblesSeleccionados = neumaticosPagina.length > 0 &&
    neumaticosPagina.every(neu => seleccionados.some(n => n.ID_NEUMATICO === neu.ID_NEUMATICO))

  const toggleSeleccionarTodosVisibles = () => {
    if (todosVisiblesSeleccionados) {
      setSeleccionados(prev => prev.filter(n => !neumaticosPagina.some(neu => neu.ID_NEUMATICO === n.ID_NEUMATICO)))
    } else {
      setSeleccionados(prev => [
        ...prev,
        ...neumaticosPagina.filter(neu => !prev.some(n => n.ID_NEUMATICO === neu.ID_NEUMATICO))
      ])
    }
  }

  const costoTotalSeleccionados = useMemo(
    () => seleccionados.reduce((total, neu) => total + (neu.COSTO ?? 0), 0),
    [seleccionados]
  )

  const handleReset = () => {
    setSeleccionados([])
    setNumeroCotizacion('')
    setComentarios('')
    setBusqueda('')
    setPagina(0)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const puedeRegistrar = seleccionados.length > 0 && numeroCotizacion.trim().length > 0

  const handleConfirmarVenta = async () => {
    if (!puedeRegistrar) return
    try {
      await registrarVentaNeumaticos({
        numeroCotizacion,
        comentarios: comentarios.trim() || undefined,
        neumaticos: seleccionados.map(neu => ({
          idNeumatico: neu.ID_NEUMATICO,
          costoVenta: neu.COSTO,
          remanenteAlVender: neu.REMANENTE,
          estadoAlVender: neu.ESTADO,
        })),
      })
      toast.success(
        `Venta registrada: ${seleccionados.length} neumático(s) — Cotización N° ${numeroCotizacion}.`,
        { position: 'top-right' }
      )
      queryClient.invalidateQueries({ queryKey: ['neumaticos-propios'] });
      onSuccess()
      handleClose()
    } catch (error) {
      toast.error('No se pudo registrar la venta. Inténtalo nuevamente.', { position: 'top-right' })
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
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)' }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
        }}>
          <BanknoteArrowUp size={20} className="text-rose-600" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Vender Neumático(s)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona uno o varios neumáticos y registra la cotización de venta
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, bgcolor: '#f8fafc' }}>

        <Stack spacing={2.5}>
          <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '8px' }} elevation={0}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Neumáticos disponibles</Typography>
              <Typography variant="caption" color="text.disabled">Haz clic en uno o varios para seleccionarlos</Typography>
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

            {neumaticosDisponiblesParaVenta.length > 0 && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <Checkbox
                  checked={todosVisiblesSeleccionados}
                  onCheckedChange={toggleSeleccionarTodosVisibles}
                  aria-label="Seleccionar todos los visibles"
                />
                <span className="text-xs text-slate-500">
                  Seleccionar todos los visibles de esta página ({neumaticosPagina.length} de {neumaticosDisponiblesParaVenta.length})
                </span>
                {isFetching && !isLoading && <Spinner className="size-3.5 text-slate-400" />}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-15 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : neumaticosDisponiblesParaVenta.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                  <PackageSearch size={28} strokeWidth={1.5} />
                  <p className="text-sm italic">
                    {busqueda ? `Sin resultados para "${busqueda}".` : 'No hay neumáticos disponibles para venta.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {neumaticosPagina.map((neu) => (
                    <NeumaticoRow
                      key={neu.ID_NEUMATICO}
                      neu={neu}
                      isSelected={seleccionados.some(n => n.ID_NEUMATICO === neu.ID_NEUMATICO)}
                      onToggle={toggleSeleccion}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && neumaticosDisponiblesParaVenta.length > NEUMATICOS_POR_PAGINA && (
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
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-rose-700 font-semibold">
                    {seleccionados.length} neumático(s) seleccionado(s)
                  </span>
                  <span className="text-sm text-rose-700 font-bold">
                    Total: {formatCosto(costoTotalSeleccionados)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {seleccionados.map(n => (
                    <span
                      key={n.ID_NEUMATICO}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 pl-2 pr-1 py-0.5 text-xs font-medium text-rose-700 font-mono"
                    >
                      {n.CODIGO}
                      <button
                        type="button"
                        onClick={() => toggleSeleccion(n)}
                        className="rounded-full hover:bg-rose-100 p-0.5"
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

          <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Datos de la venta
            </Typography>
            <Stack spacing={2}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Número de cotización <span className="text-rose-600">*</span>
                </p>
                <Input
                  value={numeroCotizacion}
                  onChange={(e) => setNumeroCotizacion(e.target.value)}
                  placeholder="Ej: COT-2026-0456"
                />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Comentarios (opcional)
                </p>
                <Textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={3}
                  placeholder="Observaciones sobre la venta..."
                />
              </div>
            </Stack>
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
          onClick={handleConfirmarVenta}
        >
          Registrar Venta
        </LoadingButton2>
      </DialogActions>
    </Dialog>
  )
}
