import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';

export type TonoAviso = 'ambar' | 'azul' | 'rojo';

const TONOS: Record<TonoAviso, { barra: string; fondo: string; circulo: string; sombra: string; titulo: string }> = {
    ambar: {
        barra: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
        fondo: '#fffbeb',
        circulo: 'from-amber-400 to-orange-500',
        sombra: 'shadow-amber-200',
        titulo: 'text-amber-700',
    },
    azul: {
        barra: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
        fondo: '#eff6ff',
        circulo: 'from-blue-500 to-indigo-600',
        sombra: 'shadow-blue-200',
        titulo: 'text-blue-700',
    },
    rojo: {
        barra: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
        fondo: '#fef2f2',
        circulo: 'from-rose-500 to-red-600',
        sombra: 'shadow-rose-200',
        titulo: 'text-rose-700',
    },
};

interface ModalAvisoProps {
    open: boolean;
    onClose?: () => void;
    tono?: TonoAviso;
    icono: React.ReactNode;
    titulo: string;
    mensaje: React.ReactNode;
    /** Línea secundaria opcional (ej. "Acción: Reubicar neumático"). */
    detalle?: React.ReactNode;
    /** Ilustración lateral; se oculta en pantallas angostas para dejar respirar al texto. */
    imagen?: string;
    /** Botones de acción. En móvil se apilan a todo el ancho, con el último arriba. */
    acciones: React.ReactNode;
    /** Impide cerrar con clic fuera o Escape (avisos que exigen una decisión). */
    bloquearCierre?: boolean;
}

/**
 * Base común de los modales de aviso (advertencias previas a inspección/reubicación).
 * Centraliza el layout responsive para que no haya anchos fijos que se salgan en móvil.
 */
export const ModalAviso: React.FC<ModalAvisoProps> = ({
    open,
    onClose,
    tono = 'ambar',
    icono,
    titulo,
    mensaje,
    detalle,
    imagen,
    acciones,
    bloquearCierre = false,
}) => {
    const t = TONOS[tono];

    return (
        <Dialog
            open={open}
            onClose={bloquearCierre ? () => { } : onClose}
            disableEscapeKeyDown={bloquearCierre}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    m: { xs: 2, sm: 4 },
                    width: 'calc(100% - 32px)',
                    maxWidth: { xs: '100%', sm: 640 },
                },
            }}
        >
            <Box sx={{ height: 4, background: t.barra }} />

            <DialogContent sx={{ bgcolor: t.fondo, p: { xs: 2.5, sm: 3 } }}>
                <div className="flex items-start gap-3 sm:gap-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${t.circulo} text-white shadow-md ${t.sombra} sm:h-12 sm:w-12`}>
                        {icono}
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className={`text-base font-extrabold tracking-wide ${t.titulo} sm:text-lg`}>{titulo}</p>
                        <div className="mt-1 text-sm text-slate-700 sm:text-base">{mensaje}</div>
                        {detalle && <div className="mt-1.5 text-xs text-slate-500 sm:text-sm">{detalle}</div>}
                    </div>

                    {imagen && (
                        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
                            <img src={imagen} alt="" style={{ width: 68, height: 68, borderRadius: 8 }} />
                        </Box>
                    )}
                </div>
            </DialogContent>

            <DialogActions
                sx={{
                    bgcolor: t.fondo,
                    px: { xs: 2.5, sm: 3 },
                    pb: { xs: 2.5, sm: 3 },
                    pt: 0,
                    gap: 1.5,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    '& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' },
                }}
            >
                {acciones}
            </DialogActions>
        </Dialog>
    );
};

export default ModalAviso;
