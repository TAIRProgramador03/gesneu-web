import React, { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogActions, Typography, Box, IconButton } from '@mui/material';
import {
  Ban,
  ChevronDown,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Info,
  ListChecks,
  RotateCw,
  Sheet,
  SquareCheck,
  TrendingUp,
  TriangleAlert,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { Button as ButtonCustom } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import XLSXStyle from 'xlsx-js-style';
import { confirmarAsignacionMasiva, NeumaticoAsignacion, ResultadoProcesamiento, validarAsignacionMasiva } from "@/api/Neumaticos";

interface ModalAsignacionMasivaNeumaticoProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void
}

type Posicion = NeumaticoAsignacion['posicion']

type NeumaticoMasivo = NeumaticoAsignacion

const formatFechaCorta = (fecha: string) => dayjs(fecha).format('DD/MM/YYYY');

const PosicionBadge = ({ posicion }: { posicion: Posicion }) => {
  const esRepuesto = posicion === 'RES01';
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap",
      esRepuesto ? "bg-purple-50 text-purple-700 ring-purple-200" : "bg-blue-50 text-blue-700 ring-blue-200"
    )}>
      {posicion}
    </span>
  );
};

const MotivoFila = ({ motivo }: { motivo?: string }) => (
  motivo ? (
    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
      <CircleAlert size={12} className="shrink-0" />
      {motivo}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Ban size={12} className="shrink-0" />
      Bloqueado por otra fila de esta placa
    </span>
  )
);

/**
 * Regla de negocio: POSICION solo condiciona el campo TORQUE.
 * - POS01-POS04: TORQUE obligatorio, rango 110-160 Nm.
 * - RES01 (repuesto): TORQUE deshabilitado, forzado a 0, sin validación de rango.
 * REMANENTE, PRESION y FECHA_ASIGNACION son obligatorios y se validan igual en ambos casos.
 */
const TorqueCell = ({ neu, dense }: { neu: NeumaticoMasivo; dense?: boolean }) => {
  const esRepuesto = neu.posicion === 'RES01';
  if (esRepuesto) {
    return (
      <span
        title="RES01: torque deshabilitado, forzado a 0 y sin validación de rango."
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-400 ring-1 ring-inset ring-slate-200",
          dense ? "text-[11px]" : "text-[10px]"
        )}
      >
        No aplica
      </span>
    );
  }
  return <span className="text-slate-600">{neu.torque ?? '-'} Nm</span>;
};

const TablaNeumaticosPlaca = ({ neumaticos, mostrarMotivo }: { neumaticos: NeumaticoMasivo[]; mostrarMotivo: boolean }) => (
  <div className="border-t border-slate-100">
    {/* Tabla (desktop) */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 uppercase tracking-wide text-[10px]">
            <th className="text-left font-semibold px-3 py-2">Código</th>
            <th className="text-left font-semibold px-3 py-2">Posición</th>
            <th className="text-left font-semibold px-3 py-2">Remanente</th>
            <th className="text-left font-semibold px-3 py-2">Presión</th>
            <th className="text-left font-semibold px-3 py-2">
              <span
                className="inline-flex items-center gap-1"
                title="Obligatorio y validado (110-160 Nm) solo en POS01-POS04. En RES01 se deshabilita y se guarda como 0."
              >
                Torque
                <Info size={11} className="text-slate-300" />
              </span>
            </th>
            <th className="text-left font-semibold px-3 py-2">F. Asignación</th>
            {mostrarMotivo && <th className="text-left font-semibold px-3 py-2">Motivo</th>}
          </tr>
        </thead>
        <tbody>
          {neumaticos.map(neu => (
            <tr key={neu.codigo} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono font-medium text-slate-700">{neu.codigo}</td>
              <td className="px-3 py-2"><PosicionBadge posicion={neu.posicion} /></td>
              <td className="px-3 py-2 text-slate-600">{neu.remanente} mm</td>
              <td className="px-3 py-2 text-slate-600">{neu.presion} psi</td>
              <td className="px-3 py-2"><TorqueCell neu={neu} /></td>
              <td className="px-3 py-2 text-slate-600">{formatFechaCorta(neu.fechaAsignacion)}</td>
              {mostrarMotivo && (
                <td className="px-3 py-2"><MotivoFila motivo={neu.error} /></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Cards (mobile) */}
    <div className="md:hidden flex flex-col gap-2 p-3">
      {neumaticos.map(neu => (
        <div key={neu.codigo} className="rounded-md border border-slate-100 bg-slate-50 p-2.5 text-xs">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            <div>
              <div className="text-[10px] uppercase text-slate-400">Código</div>
              <div className="font-mono font-medium text-slate-700">{neu.codigo}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Posición</div>
              <PosicionBadge posicion={neu.posicion} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Remanente</div>
              <div className="text-slate-600">{neu.remanente} mm</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Presión</div>
              <div className="text-slate-600">{neu.presion} psi</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Torque</div>
              <TorqueCell neu={neu} dense />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">F. Asignación</div>
              <div className="text-slate-600">{formatFechaCorta(neu.fechaAsignacion)}</div>
            </div>
          </div>
          {mostrarMotivo && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <MotivoFila motivo={neu.error} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

type PasoModal = 'carga' | 'procesando' | 'resultado'
type TabResultado = 'aprobadas' | 'rechazadas'

const PLANTILLA_HEADERS = ['PLACA', 'KILOMETRAJE', 'CODIGO', 'POSICION', 'REMANENTE', 'PRESION', 'TORQUE', 'FECHA_ASIGNACION'];

const descargarPlantilla = () => {
  const wb = XLSXStyle.utils.book_new();
  const ws: XLSXStyle.WorkSheet = {};

  PLANTILLA_HEADERS.forEach((header, colIdx) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: colIdx });
    ws[cellRef] = {
      v: header,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A3276' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      },
    };
  });

  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: PLANTILLA_HEADERS.length - 1 } });
  ws['!cols'] = PLANTILLA_HEADERS.map(() => ({ wch: 16 }));

  XLSXStyle.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSXStyle.writeFile(wb, 'GESNEU_PLANTILLA-ASIGNACION-MASIVA.xlsx');
};

const descargarReporte = (resultado: ResultadoProcesamiento) => {
  const wb = XLSXStyle.utils.book_new();
  const ws: XLSXStyle.WorkSheet = {};
  const headers = ['PLACA', 'KILOMETRAJE', 'CODIGO', 'POSICION', 'REMANENTE', 'PRESION', 'TORQUE', 'FECHA_ASIGNACION', 'ESTADO', 'MOTIVO'];

  headers.forEach((header, colIdx) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: colIdx });
    ws[cellRef] = {
      v: header,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A3276' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      },
    };
  });

  const filas: (string | number)[][] = [];
  resultado.aprobadas.forEach(fila => {
    fila.neumaticos.forEach(neu => {
      filas.push([fila.placa, fila.kilometraje, neu.codigo, neu.posicion, neu.remanente, neu.presion, neu.torque ?? '', formatFechaCorta(neu.fechaAsignacion), 'Aprobada', '']);
    });
  });
  resultado.rechazadas.forEach(fila => {
    fila.neumaticos.forEach(neu => {
      const motivoFila = neu.error ?? 'Bloqueado por otra fila de esta placa';
      filas.push([fila.placa, fila.kilometraje, neu.codigo, neu.posicion, neu.remanente, neu.presion, neu.torque ?? '', formatFechaCorta(neu.fechaAsignacion), 'Rechazada', motivoFila]);
    });
  });

  filas.forEach((fila, rowIdx) => {
    fila.forEach((value, colIdx) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      ws[cellRef] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
    });
  });

  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: headers.length - 1 } });
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  XLSXStyle.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSXStyle.writeFile(wb, 'GESNEU_REPORTE-ASIGNACION-MASIVA.xlsx');
};

const POSICIONES: Posicion[] = ['POS01', 'POS02', 'POS03', 'POS04', 'RES01'];

export const ModalAsignacionMasivaNeumatico = ({ open, onClose, onSuccess }: ModalAsignacionMasivaNeumaticoProps) => {
  const [paso, setPaso] = useState<PasoModal>('carga');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcesamiento | null>(null);
  const [tabActiva, setTabActiva] = useState<TabResultado>('aprobadas');
  const [placasExpandidas, setPlacasExpandidas] = useState<Set<string>>(new Set());
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPaso('carga');
      setArchivo(null);
      setResultado(null);
      setTabActiva('aprobadas');
      setPlacasExpandidas(new Set());
      setConfirmandoCierre(false);
      setRegistrando(false);
    }
  }, [open]);

  const handleTogglePlaca = (placa: string) => {
    setPlacasExpandidas(prev => {
      const next = new Set(prev);
      if (next.has(placa)) next.delete(placa);
      else next.add(placa);
      return next;
    });
  };

  const handleIntentarCerrar = () => {
    if (paso === 'procesando') {
      setConfirmandoCierre(true);
      return;
    }
    onClose();
  };

  const handleConfirmarCancelacion = () => {
    setConfirmandoCierre(false);
    setPaso('carga');
    setArchivo(null);
    onClose();
  };

  const handleSeleccionarArchivo = (file: File | null) => {
    if (!file) return;
    const esExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!esExcel) {
      toast.error('El archivo debe ser un Excel (.xlsx o .xls).', { position: 'top-right' });
      return;
    }
    setArchivo(file);
  };

  const handleProcesarArchivo = async () => {
    if (!archivo) return;
    setPaso('procesando');
    try {
      const data = await validarAsignacionMasiva(archivo);
      setResultado(data);
      setPaso('resultado');
    } catch (error) {
      toast.error('No se pudo procesar el archivo. Inténtalo nuevamente.', { position: 'top-right' });
      setPaso('carga');
    }
  };

  const handleConfirmarRegistro = async () => {
    if (!resultado || resultado.aprobadas.length === 0) return;
    setRegistrando(true);
    try {
      const resumen = await confirmarAsignacionMasiva(resultado.batchId);
      toast.success(
        `Se registraron ${resumen.neumaticosRegistrados} neumáticos en ${resumen.placasRegistradas} placa(s).`,
        { position: 'top-right' }
      );
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('No se pudo registrar la asignación. Inténtalo nuevamente.', { position: 'top-right' });
    } finally {
      setRegistrando(false);
    }
  };

  const handleCorregirYVolver = () => {
    setPaso('carga');
    setArchivo(null);
    setResultado(null);
    setPlacasExpandidas(new Set());
    setTabActiva('aprobadas');
  };

  const subtitulo = paso === 'carga'
    ? 'Paso 1: Cargar archivo'
    : paso === 'procesando'
      ? 'Procesando archivo'
      : 'Resultado del procesamiento';

  return (
    <Dialog
      open={open}
      onClose={handleIntentarCerrar}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '85vh', display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', flexShrink: 0 }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
        }}>
          <Sheet size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Asignación Masiva de Neumáticos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitulo}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleIntentarCerrar}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc', flex: 1, overflowY: 'auto', position: 'relative' }}>

        {confirmandoCierre && (
          <Box sx={{
            position: 'absolute', inset: 0, zIndex: 10, bgcolor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3,
          }}>
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, maxWidth: 380, textAlign: 'center', boxShadow: 6 }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TriangleAlert size={26} className="text-yellow-600" />
              </Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                ¿Cancelar el procesamiento?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                El archivo se está procesando. Si cierras ahora, se perderá el progreso.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                <ButtonCustom variant="outline" onClick={() => setConfirmandoCierre(false)}>
                  Continuar procesando
                </ButtonCustom>
                <ButtonCustom variant="destructive" onClick={handleConfirmarCancelacion}>
                  Sí, cancelar
                </ButtonCustom>
              </Box>
            </Box>
          </Box>
        )}

        {paso === 'carga' && (
          <Box>
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleSeleccionarArchivo(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-colors mt-4",
                dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleSeleccionarArchivo(e.target.files?.[0] ?? null)}
              />
              {archivo ? (
                <>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  }}>
                    <FileSpreadsheet size={22} className="text-green-600" />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{archivo.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Haz clic para elegir otro archivo</Typography>
                </>
              ) : (
                <>
                  <UploadCloud size={30} className="text-slate-400" />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Arrastra el archivo Excel aquí o haz clic para seleccionarlo
                  </Typography>
                  <Typography variant="caption" color="text.disabled">Formatos admitidos: .xlsx, .xls</Typography>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <button
                type="button"
                onClick={descargarPlantilla}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Download size={13} />
                Descargar plantilla
              </button>
            </Box>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Antes de subir el archivo, ten en cuenta:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  <li>Cada placa debe tener exactamente todos sus neumáticos.</li>
                  <li>Los códigos de neumático deben existir y estar disponibles.</li>
                  <li>El KILOMETRAJE es único por placa: repite el mismo valor en todas sus filas.</li>
                  <li>Si una fila de la placa falla, las demás filas del mismo lote quedan bloqueadas.</li>
                </ul>
              </div>
            </div>
          </Box>
        )}

        {paso === 'procesando' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 2 }}>
            <Spinner className="size-10 text-blue-600" />
            <Typography variant="body1" fontWeight={600}>Procesando archivo...</Typography>
            <Typography variant="body2" color="text.secondary">Esto puede demorar unos segundos.</Typography>
          </Box>
        )}

        {paso === 'resultado' && resultado && (
          <Box>
            {(() => {
              const totalPlacas = resultado.aprobadas.length + resultado.rechazadas.length;
              const porcentajeExito = totalPlacas > 0 ? Math.round((resultado.aprobadas.length / totalPlacas) * 100) : 0;
              const exitoTono = porcentajeExito >= 80
                ? { grad: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
                : porcentajeExito >= 50
                  ? { grad: 'from-amber-500 to-amber-600', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
                  : { grad: 'from-red-500 to-red-600', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };

              return (
                <div className="grid grid-cols-4 gap-3 mb-4 mt-4">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-3 flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-indigo-500 to-blue-600 shrink-0">
                      <ListChecks size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold text-indigo-700 leading-tight">{totalPlacas}</div>
                      <div className="text-[11px] font-medium text-indigo-500/80 leading-tight">Total procesadas</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-emerald-500 to-green-600 shrink-0">
                      <SquareCheck size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold text-emerald-700 leading-tight">{resultado.aprobadas.length}</div>
                      <div className="text-[11px] font-medium text-emerald-600/80 leading-tight">Aprobadas</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-3 flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-red-500 to-rose-600 shrink-0">
                      <XCircle size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold text-red-700 leading-tight">{resultado.rechazadas.length}</div>
                      <div className="text-[11px] font-medium text-red-500/80 leading-tight">Rechazadas</div>
                    </div>
                  </div>

                  <div className={cn("rounded-xl px-3 py-3 flex items-center gap-2.5 border", exitoTono.bg, exitoTono.border)}>
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br shrink-0", exitoTono.grad)}>
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className={cn("text-xl font-bold leading-tight", exitoTono.text)}>{porcentajeExito}%</div>
                      <div className={cn("text-[11px] font-medium leading-tight opacity-80", exitoTono.text)}>Éxito</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-1 border-b border-slate-200 mb-3">
              <button
                type="button"
                onClick={() => setTabActiva('aprobadas')}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tabActiva === 'aprobadas' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                Aprobadas ({resultado.aprobadas.length})
              </button>
              <button
                type="button"
                onClick={() => setTabActiva('rechazadas')}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tabActiva === 'rechazadas' ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                Rechazadas ({resultado.rechazadas.length})
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {tabActiva === 'aprobadas' && (
                resultado.aprobadas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No hay placas aprobadas.
                  </Typography>
                ) : resultado.aprobadas.map(fila => {
                  const expandida = placasExpandidas.has(fila.placa);
                  return (
                    <div key={fila.placa} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleTogglePlaca(fila.placa)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{fila.placa}</span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            {fila.kilometraje.toLocaleString('es-PE')} km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{fila.neumaticos.length} neumáticos</span>
                          <ChevronDown size={16} className={cn("text-slate-400 transition-transform", expandida && "rotate-180")} />
                        </div>
                      </button>
                      {expandida && (
                        <TablaNeumaticosPlaca neumaticos={fila.neumaticos} mostrarMotivo={false} />
                      )}
                    </div>
                  );
                })
              )}

              {tabActiva === 'rechazadas' && (
                resultado.rechazadas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No hay placas rechazadas.
                  </Typography>
                ) : resultado.rechazadas.map(fila => {
                  const expandida = placasExpandidas.has(fila.placa);
                  return (
                    <div
                      key={fila.placa}
                      className={cn(
                        "rounded-lg border overflow-hidden",
                        fila.arrastrada ? "border-slate-200 bg-slate-50" : "border-red-200 bg-white"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleTogglePlaca(fila.placa)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-100/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", fila.arrastrada ? "text-slate-600" : "text-slate-800")}>
                            {fila.placa}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            {fila.kilometraje.toLocaleString('es-PE')} km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{fila.neumaticos.length} neumáticos</span>
                          <ChevronDown size={16} className={cn("text-slate-400 transition-transform", expandida && "rotate-180")} />
                        </div>
                      </button>
                      <div className="px-3 pb-2.5 pt-0 -mt-1">
                        {fila.arrastrada ? (
                          <p className="text-xs text-slate-500 italic">Bloqueada por otra fila del mismo lote: {fila.motivo}</p>
                        ) : (
                          <p className="text-xs text-red-600 font-medium">{fila.motivo}</p>
                        )}
                      </div>
                      {expandida && (
                        <TablaNeumaticosPlaca neumaticos={fila.neumaticos} mostrarMotivo />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        {paso === 'carga' && (
          <>
            <ButtonCustom onClick={handleIntentarCerrar}>
              Cancelar
            </ButtonCustom>
            <LoadingButton2
              variant="primary"
              icon={<SquareCheck />}
              disabled={!archivo}
              onClick={handleProcesarArchivo}
            >
              Procesar archivo
            </LoadingButton2>
          </>
        )}

        {paso === 'procesando' && (
          <>
            <ButtonCustom disabled>Cancelar</ButtonCustom>
            <ButtonCustom variant="primary" disabled>Procesar archivo</ButtonCustom>
          </>
        )}

        {paso === 'resultado' && (
          <>
            <ButtonCustom onClick={handleIntentarCerrar} disabled={registrando}>
              Cerrar
            </ButtonCustom>
            <ButtonCustom variant="outline" onClick={() => resultado && descargarReporte(resultado)} disabled={registrando}>
              <Download size={16} />
              Descargar reporte
            </ButtonCustom>
            <ButtonCustom variant="warning" onClick={handleCorregirYVolver} disabled={registrando}>
              <RotateCw size={16} />
              Corregir y volver a subir
            </ButtonCustom>
            <LoadingButton2
              variant="primary"
              icon={<SquareCheck />}
              disabled={!resultado || resultado.aprobadas.length === 0}
              onClick={handleConfirmarRegistro}
            >
              Confirmar y registrar
            </LoadingButton2>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
