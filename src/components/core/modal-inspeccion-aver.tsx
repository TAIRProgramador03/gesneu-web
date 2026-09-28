import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import { CalendarCheck2, TriangleAlert } from 'lucide-react';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';

interface ModalInspeccionAverProps {
    open: boolean;
    ultimaInspeccionFecha?: string; // Fecha de la última inspección
    esInspeccionHoy?: boolean; // Si la última inspección fue hoy
    onClose: () => void;
    onContinue: () => void;
    onCloseMain?: () => void; // Para cerrar el modal principal de inspección
    advertenciaCantidadNeumaticos?: number; // Advertencia de cantidad de neumáticos
    onAbrirAsignacion?: () => void; // Para abrir el modal de asignación
}

const ModalInspeccionAver: React.FC<ModalInspeccionAverProps> = ({
    open,
    ultimaInspeccionFecha,
    esInspeccionHoy,
    onClose,
    onContinue,
    onCloseMain,
    advertenciaCantidadNeumaticos,
    onAbrirAsignacion,
}) => {
    const handleIrAsignacion = () => {
        if (onAbrirAsignacion) onAbrirAsignacion();
    };

    const esAdvertenciaCantidad = advertenciaCantidadNeumaticos !== undefined;
    const tieneContenido = esAdvertenciaCantidad || Boolean(ultimaInspeccionFecha);

    const titulo = esAdvertenciaCantidad
        ? 'ADVERTENCIA'
        : esInspeccionHoy
            ? 'INSPECCIÓN YA REALIZADA'
            : 'ADVERTENCIA';

    const mensaje = esAdvertenciaCantidad
        ? `Faltan ${advertenciaCantidadNeumaticos} neumáticos asignados para poder inspeccionar.`
        : `La última inspección fue el ${convertToDateHuman(ultimaInspeccionFecha ?? '')}.`;

    const cerrarTodo = () => {
        onClose();
        onCloseMain?.();
    };

    return (
        <Dialog
            open={open}
            onClose={() => { }} // Desactivar cierre por clic afuera
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    m: { xs: 2, sm: 4 },
                    width: 'calc(100% - 32px)',
                    maxWidth: { xs: '100%', sm: 620 },
                },
            }}
        >
            <Box sx={{ height: 4, background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)' }} />

            <DialogContent sx={{ bgcolor: '#fffbeb', p: { xs: 2.5, sm: 3 } }}>
                {tieneContenido && (
                    <div className="flex items-start gap-3 sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200 sm:h-12 sm:w-12">
                            {esInspeccionHoy && !esAdvertenciaCantidad
                                ? <CalendarCheck2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                : <TriangleAlert className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="text-base font-extrabold tracking-wide text-amber-700 sm:text-lg">
                                {titulo}
                            </p>
                            <p className="mt-1 text-sm text-slate-700 sm:text-base">
                                {mensaje}
                            </p>
                        </div>

                        {/* Ilustración: sólo cuando hay espacio de sobra */}
                        {!esAdvertenciaCantidad && (
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
                                <img src="/assets/inpeccion_tire.png" alt="" style={{ width: 68, height: 68 }} />
                            </Box>
                        )}
                    </div>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    bgcolor: '#fffbeb',
                    px: { xs: 2.5, sm: 3 },
                    pb: { xs: 2.5, sm: 3 },
                    pt: 0,
                    gap: 1.5,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'flex-end',
                    '& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' },
                }}
            >
                {esAdvertenciaCantidad ? (
                    <>
                        <ButtonCustom onClick={onClose}>Cerrar</ButtonCustom>
                        {onAbrirAsignacion && (
                            <ButtonCustom variant="primary" onClick={handleIrAsignacion}>
                                Ir a asignar neumáticos
                            </ButtonCustom>
                        )}
                    </>
                ) : esInspeccionHoy === true ? (
                    <ButtonCustom onClick={cerrarTodo}>Cerrar</ButtonCustom>
                ) : esInspeccionHoy === false ? (
                    <>
                        <ButtonCustom onClick={cerrarTodo}>Cerrar</ButtonCustom>
                        <ButtonCustom onClick={onContinue} variant="warning">
                            Registrar nueva inspección
                        </ButtonCustom>
                    </>
                ) : null}
            </DialogActions>
        </Dialog>
    );
};

export default ModalInspeccionAver;
