'use client'

import { Card, Dialog, DialogContent, DialogTitle, Typography, Box, Chip } from '@mui/material';
import { Stack } from '@mui/system';
import React, { useMemo, useRef, useState } from 'react'
import DialogActions from '@mui/material/DialogActions';
import { Button as ButtonCustom } from '@/components/ui/button';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';
import { LinearProgressItem } from '@/components/ui/LinearProgress';
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge';
import { ArrowBigRightDash, CheckCircle2, ChevronsLeft, ChevronsRight, CircleChevronRight, RotateCw, SquareCheck } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { listarNeumaticosParaReubicar, listarProyectos, reubicarNeumaticosPorProyecto } from '@/api/Neumaticos';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Neumatico {
  id: string;
  codigo: string;
  proyecto: string;
  esRecuperado: boolean;
  tipoMovimiento: string;
  vida: number;
}

export interface NeumaticoFetch {
  ID_NEUMATICO: string
  CODIGO: string
  PROYECTO_ACTUAL: string
  RECUPERADO: boolean
  CODIGO_INTERNO: string
  PORCENTAJE_VIDA: number
}

interface ModalReubicarNeumaticoProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void
}

export const ModalReubicarNeumatico = ({ open, onClose, onSuccess }: ModalReubicarNeumaticoProps) => {

  const [neumaticoSeleccionados, setNeumaticosSeleccionados] = useState<Neumatico[]>([]);
  const [neumaticosTrasladados, setNeumaticosTrasladados] = useState<Neumatico[]>([]);
  const [neumaticoSeleccionadosTrasladados, setNeumaticosSeleccionadosTrasladados] = useState<Neumatico[]>([]);
  const [proyectoOrigen, setProyectoOrigen] = useState<string>('');
  const [proyectoDestino, setProyectoDestino] = useState<string>('');
  const codigoNeuRef = useRef('')

  const { data: neumaticosParaReubicar = [], refetch: refetchNeumaticosParaUbicar } = useQuery({
    queryKey: ['neumaticos-recuperados-para-reubicar', { proyectoOrigen }],
    queryFn: () => listarNeumaticosParaReubicar(proyectoOrigen, codigoNeuRef.current),
    enabled: proyectoOrigen.length !== 0
  })

  const { data: proyectosEnTotal = [] } = useQuery({
    queryKey: ['proyectos-en-total'],
    queryFn: () => listarProyectos(),
  })

  const handleClickOnNeumatico = ({ neumatico }: { neumatico: NeumaticoFetch }) => {
    const isFound = neumaticoSeleccionados?.find((ne) => ne.id === neumatico.ID_NEUMATICO)
    if (!isFound) {
      const newNeumaticos = [
        ...neumaticoSeleccionados || [],
        {
          id: neumatico.ID_NEUMATICO,
          codigo: neumatico.CODIGO,
          proyecto: neumatico.PROYECTO_ACTUAL,
          esRecuperado: neumatico.RECUPERADO,
          tipoMovimiento: neumatico.CODIGO_INTERNO,
          vida: neumatico.PORCENTAJE_VIDA
        }
      ]
      setNeumaticosSeleccionados(newNeumaticos)
    } else {
      const newNeumaticos = [
        ...neumaticoSeleccionados?.filter(neu => neu.id !== neumatico.ID_NEUMATICO) || []
      ]
      setNeumaticosSeleccionados(newNeumaticos)
    }
  }

  const handleClickOnNeumaticoTrasladado = ({ neumatico }: { neumatico: Neumatico }) => {

    const isFound = neumaticoSeleccionadosTrasladados?.find((ne) => ne.id === neumatico.id)

    if (!isFound) {
      const newNeumaticos = [
        ...neumaticoSeleccionadosTrasladados || [],
        neumatico
      ]
      setNeumaticosSeleccionadosTrasladados(newNeumaticos)
    } else {
      const newNeumaticos = [
        ...neumaticoSeleccionadosTrasladados?.filter(neu => neu.id !== neumatico.id) || []
      ]
      setNeumaticosSeleccionadosTrasladados(newNeumaticos)
    }
  }

  const handleTrasladarNeumaticos = () => {
    const neuSelec = [...neumaticoSeleccionados || []]
    setNeumaticosTrasladados((prev) => [
      ...prev || [],
      ...neuSelec
    ])
    setNeumaticosSeleccionados([])
    setProyectoDestino('')
  }

  const handleTrasladarNeumaticosTemp = () => {
    const neuSelec = [...neumaticosTrasladados?.filter(n => !neumaticoSeleccionadosTrasladados?.some(eliminar => eliminar.id === n.id)) || []]
    setNeumaticosTrasladados(neuSelec)
    setNeumaticosSeleccionadosTrasladados([])
  }

  const handleReset = () => {
    setProyectoDestino('')
    setProyectoOrigen('')
    setNeumaticosSeleccionadosTrasladados([])
    setNeumaticosTrasladados([])
    setNeumaticosSeleccionados([])
    codigoNeuRef.current = ''
  }

  const proyectosNoSeleccionados = useMemo(() => {
    const proyectosSeleccionados = new Set(neumaticosTrasladados.map((neu) => neu.proyecto))
    return proyectosEnTotal.filter(item => !proyectosSeleccionados.has(item.DESCRIPCION))
  }, [neumaticosTrasladados])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Franja superior */}
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
        }}>
          <CircleChevronRight size={20} className="text-blue-600" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Reubicar Neumáticos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mueve neumáticos de un proyecto origen a un proyecto destino
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, bgcolor: '#f8fafc' }}>


        <Stack direction="row" spacing={3} alignItems="flex-start">

          {/* Panel izquierdo — lista de neumáticos */}
          <Card sx={{ flex: 1, p: 2.5, minWidth: 340, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '10px' }} elevation={0} className='relative'>
            <span className="inline-flex items-center gap-1 mb-3 px-2 py-0.5 rounded-full bg-blue-100 text-blue-500 text-sm font-medium">
              Origen
            </span>

            {
              <ButtonCustom
                size={'icon'}
                className='absolute right-5 rounded-full'
                variant={'life'}
                disabled={neumaticoSeleccionados?.length <= 0}
                onClick={handleTrasladarNeumaticos}
              >
                <ChevronsRight />
              </ButtonCustom>
            }

            <Select value={proyectoOrigen} onValueChange={setProyectoOrigen} >
              <SelectTrigger className="w-full max-w-64">
                <SelectValue placeholder="Selecciona un proyecto origen" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectGroup>
                  <SelectLabel>Proyectos</SelectLabel>
                  {
                    proyectosEnTotal.map(proyecto => (
                      <SelectItem key={proyecto.ID} value={proyecto.DESCRIPCION}> {proyecto.DESCRIPCION} </SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>

            <br />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Neumáticos:
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Haz clic en uno o varios neumáticos para seleccionarlos
            </Typography>

            <Field className='mt-2 mb-2 w-50'>
              <Input className='size-8 text-xs' id="input-codigo-neu" type="text" placeholder="Buscar por código"
                onChange={(e) => {
                  const newValue = e.target.value.trim()
                  codigoNeuRef.current = e.target.value.trim()
                  if (newValue.length === 0) refetchNeumaticosParaUbicar()
                }}
                onKeyDown={(e) => e.key === 'Enter' && refetchNeumaticosParaUbicar()}
              />
            </Field>

            {/* Header de columnas */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-3 mt-3 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Código</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Proy.</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Recup.</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Vida útil</span>
            </div>

            <div className="flex flex-col gap-2 max-h-95 overflow-y-auto pr-1">
              {
                neumaticosParaReubicar.length === 0 ? (
                  <p className='text-center text-sm mt-2 italic'>Sin resultados.</p>
                ) :

                  neumaticosParaReubicar.map((neu) => {
                    const isSelected = neumaticoSeleccionados?.find(n => n.id === neu.ID_NEUMATICO)
                    const isMoved = neumaticosTrasladados?.find(n => n.id === neu.ID_NEUMATICO)

                    if (isMoved) return

                    return (
                      <div
                        key={neu.ID_NEUMATICO}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleClickOnNeumatico({ neumatico: neu })}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClickOnNeumatico({ neumatico: neu })}
                        className={`
                      relative grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 select-none
                      rounded-xl px-3 py-2.5 cursor-pointer border-2 transition-all duration-150
                      ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }
                    `}
                      >
                        {/* Código + badge estado */}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-normal text-sm text-slate-800 truncate">
                            {neu.CODIGO}
                          </span>
                        </div>

                        {/* Proyecto */}
                        <div className="flex flex-col items-center">
                          <span className="font-light italic text-sm  text-slate-700  truncate">{neu.PROYECTO_ACTUAL}</span>
                        </div>

                        {/* Recuperado */}
                        <div className="flex items-center justify-center">
                          <EsRecuperadoBadge esRecuperado={neu.RECUPERADO} />
                        </div>

                        {/* Vida útil */}
                        <div className="flex items-center justify-center">
                          <LinearProgressItem estado={neu.PORCENTAJE_VIDA} />
                        </div>
                      </div>
                    );
                  })
              }
            </div>
            {
              (!!neumaticoSeleccionados && neumaticoSeleccionados.length >= 1) &&
              (
                <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium">
                  Seleccionado(s): <span >{neumaticoSeleccionados.map((n, i) => i === (neumaticoSeleccionados.length - 1) ? n.codigo : `${n.codigo}, `)}</span>
                </div>
              )
            }
          </Card>

          {/* Conector entre paneles */}
          <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'center', color: '#94a3b8', flexShrink: 0 }}>
            <ChevronsRight size={28} />
          </Box>

          {/* Panel derecho */}
          <Card sx={{
            flex: 1, p: 2.5,
            minWidth: 320,
            borderRadius: 2.5,
            border: '2px solid #fef08a',
            marginTop: '10px',
            background: neumaticosTrasladados.length === 0 ? 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)' : '#fff',
            transition: 'background 0.3s ease',
          }} elevation={0}
          >

            <div className='flex justify-between items-start'>
              {
                <ButtonCustom
                  size={'icon'}
                  className='mb-6 rounded-full'
                  variant={'warning'}
                  disabled={neumaticoSeleccionadosTrasladados.length <= 0}
                  onClick={handleTrasladarNeumaticosTemp}
                >
                  <ChevronsLeft />
                </ButtonCustom>
              }
              <span className="inline-flex items-center gap-1 mb-3 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 text-sm font-medium">
                Destino — Neumáticos a reubicar
              </span>
            </div>


            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Proyecto destino:
            </Typography>

            <Select value={proyectoDestino} onValueChange={setProyectoDestino} disabled={neumaticosTrasladados.length === 0}>
              <SelectTrigger className="w-full max-w-60">
                <SelectValue placeholder="Selecciona un nuevo Proyecto" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectGroup>
                  <SelectLabel>Proyectos</SelectLabel>
                  {
                    proyectosNoSeleccionados.map(proyecto => {
                      return (
                        <SelectItem key={proyecto.ID} value={proyecto.DESCRIPCION}> {proyecto.DESCRIPCION} </SelectItem>
                      )
                    })
                  }
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-3 mt-3 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Código</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Proy.</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Recup.</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Vida útil</span>
            </div>

            <div className="flex flex-col gap-2 max-h-95 overflow-y-auto pr-1">
              {

                !neumaticosTrasladados || neumaticosTrasladados?.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 2 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} className="animate-pulse">
                      <ChevronsRight size={26} className="text-yellow-500" />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">Sin neumáticos para reubicar</Typography>
                      <Typography variant="caption" color="text.disabled">Selecciona y mueve neumáticos desde el panel izquierdo</Typography>
                    </Box>
                  </Box>
                ) :
                  !!neumaticosTrasladados && neumaticosTrasladados.map((neu) => {

                    const isSelected = neumaticoSeleccionadosTrasladados?.find(n => n.id === neu.id)

                    return (
                      <div
                        key={neu.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleClickOnNeumaticoTrasladado({ neumatico: neu })}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClickOnNeumaticoTrasladado({ neumatico: neu })}
                        className={`
                      relative grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 select-none
                      rounded-xl px-3 py-2.5 cursor-pointer border-2 transition-all duration-150
                      ${isSelected
                            ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }
                    `}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-normal text-sm text-slate-800 truncate">
                            {neu.codigo}
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="font-light italic text-sm  text-slate-700  truncate">{neu.proyecto}</span>
                        </div>

                        <div className="flex items-center justify-center">
                          <EsRecuperadoBadge esRecuperado={neu.esRecuperado} />
                        </div>

                        <div className="flex items-center justify-center">
                          <LinearProgressItem estado={neu.vida} />
                        </div>
                      </div>
                    );
                  })
              }
            </div>
            {
              (!!neumaticoSeleccionadosTrasladados && neumaticoSeleccionadosTrasladados.length >= 1) &&
              (
                <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 font-medium">
                  Seleccionado(s): <span >{neumaticoSeleccionadosTrasladados.map((n, i) => i === (neumaticoSeleccionadosTrasladados.length - 1) ? n.codigo : `${n.codigo}, `)}</span>
                </div>
              )
            }
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ButtonCustom onClick={onClose}>
          Cerrar
        </ButtonCustom>
        <ButtonCustom size={'icon'} variant={'warning'} onClick={handleReset} >
          <RotateCw />
        </ButtonCustom>
        <LoadingButton2
          variant={'primary'}
          icon={<SquareCheck />}
          disabled={proyectoDestino.length === 0 || neumaticosTrasladados.length === 0}
          onClick={async () => {
            await reubicarNeumaticosPorProyecto({ neumaticosTrasladados, proyectoDestino })
            onSuccess()
            handleReset()
            toast.success("Reubicación registrada exitosamente.", {
              position: 'top-right'
            })
          }}
        >
          Guardar Reubicación
        </LoadingButton2>
      </DialogActions>
    </Dialog >
  )
}
