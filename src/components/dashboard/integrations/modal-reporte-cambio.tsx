'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, CalendarDays, Download, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

import {
    obtenerReporteCambio,
    obtenerReportesCambioPorPlaca,
    type ReporteCambioS60,
} from '@/api/Neumaticos';
import { Button as ButtonCustom } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { descargarReporteCambio, type VehiculoReporte } from '@/utils/reporte-cambio-pdf';

interface ModalReporteCambioProps {
    open: boolean;
    onClose: () => void;
    placa: string;
    vehiculo?: VehiculoReporte;
}

/**
 * Reporte de cambio de neumáticos.
 *
 * Lista las S60 ya regularizadas de la placa y baja un PDF por cada una.
 * Son todas, no sólo la última: el caso real es reimprimir un cambio viejo
 * porque se perdió el papel.
 *
 * Sólo lee. No aplica la cola de S60 ni cambia nada, por eso el menú lo
 * ofrece aunque la placa esté bloqueada por una S60 pendiente.
 */
export function ModalReporteCambio({ open, onClose, placa, vehiculo }: ModalReporteCambioProps): React.JSX.Element {
    const theme = useTheme();
    const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'));
    const [descargando, setDescargando] = React.useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['reportes-cambio-s60', placa],
        queryFn: () => obtenerReportesCambioPorPlaca(placa),
        enabled: open && placa.trim() !== '',
    });

    const reportes = data?.reportes ?? [];

    const bajar = async (reporte: ReporteCambioS60) => {
        setDescargando(reporte.clave);
        try {
            // El listado no trae `montados` (el juego completo que quedó
            // montado): esa reconstrucción cuesta una consulta por S60, así
            // que se pide sólo del que se va a imprimir. Si falla, se imprime
            // igual con lo que ya hay en la lista.
            let completo = reporte;
            try {
                completo = await obtenerReporteCambio(placa, reporte.almacen, reporte.comprobante);
            } catch (error) {
                console.warn('[ModalReporteCambio] Sin el detalle, se usa el del listado:', error);
            }

            const nombre = await descargarReporteCambio(completo, { ...vehiculo, PLACA: placa });
            toast.success(`Reporte descargado: ${nombre}`);
        } catch (error) {
            console.error('[ModalReporteCambio] No se pudo generar el PDF:', error);
            toast.error('No se pudo generar el PDF del reporte.');
        } finally {
            setDescargando(null);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={esPantallaChica}
            PaperProps={{ sx: { borderRadius: esPantallaChica ? 0 : 3 } }}
        >
            <DialogTitle
                sx={{
                    pb: 1.5,
                    pt: 2,
                    px: { xs: 2, md: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        Reporte de cambio de neumáticos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--texto-apagado)' }}>
                        Placa <strong>{placa}</strong> · un reporte por cada S60 regularizada
                    </Typography>
                </div>
                <ButtonCustom variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                </ButtonCustom>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, px: { xs: 1.5, md: 3 }, bgcolor: 'var(--superficie-1)' }}>
                {isLoading ? (
                    <Stack spacing={1.5} sx={{ pt: 1 }}>
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} variant="rounded" height={86} sx={{ borderRadius: 2.5 }} />
                        ))}
                    </Stack>
                ) : isError ? (
                    <EmptyState
                        icon={FileText}
                        title="No se pudo cargar"
                        description="Hubo un problema al traer las S60 regularizadas de esta placa."
                    />
                ) : reportes.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Sin cambios registrados"
                        description="Esta placa todavía no tiene ninguna S60 regularizada. El reporte se genera a partir de un cambio ya registrado."
                    />
                ) : (
                    <div className="flex flex-col gap-2.5 py-1">
                        {reportes.map((reporte) => (
                            <div
                                key={reporte.clave}
                                className="flex shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                                            S60 {reporte.almacen}-{reporte.comprobante}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-texto-apagado">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {reporte.fechaTexto} · {reporte.horaTexto}
                                        </span>
                                        {reporte.taller ? (
                                            <span className="text-xs text-texto-apagado">{reporte.taller}</span>
                                        ) : null}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                            <ArrowDownUp className="h-3.5 w-3.5 text-texto-apagado" />
                                            {reporte.lineas.length}{' '}
                                            {reporte.lineas.length === 1 ? 'neumático cambiado' : 'neumáticos cambiados'}
                                        </span>
                                        <span className="font-mono text-texto-apagado">
                                            {reporte.lineas
                                                .slice(0, 4)
                                                .map((l) => `${l.sale.codigo}→${l.entra.codigo}`)
                                                .join('  ·  ')}
                                            {reporte.lineas.length > 4 ? '  …' : ''}
                                        </span>
                                    </div>
                                </div>

                                <ButtonCustom
                                    variant="primary"
                                    className="w-full shrink-0 sm:w-auto"
                                    disabled={descargando !== null}
                                    onClick={() => void bajar(reporte)}
                                >
                                    <Download className="h-4 w-4" />
                                    {descargando === reporte.clave ? 'Generando…' : 'Descargar PDF'}
                                </ButtonCustom>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    px: { xs: 2, md: 3 },
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    '& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' },
                }}
            >
                <ButtonCustom variant="outline" onClick={onClose}>
                    Cerrar
                </ButtonCustom>
            </DialogActions>
        </Dialog>
    );
}

export default ModalReporteCambio;
