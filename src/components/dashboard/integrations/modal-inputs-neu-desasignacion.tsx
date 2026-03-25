import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, TextField, Button, Stack, DialogTitle, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';

interface ModalInputsNeuProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }) => void;
    initialRemanente?: number;
    initialOdometro?: number;
    initialPresionAire?: number;
    initialTorqueAplicado?: number;
    initialFechaAsignacion?: string; // Nueva prop para pre-llenar fecha al editar
    fechaRegistroNeumatico: string; // Fecha de registro del neumático (YYYY-MM-DD)
    esRecuperado?: boolean
    fechaRecuperado?: string | null
    fechaInspeccion: string
}

const ModalInputsNeuDesasignacion: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit, initialRemanente = 0, initialOdometro = 0, initialPresionAire = 0, initialTorqueAplicado = 0, initialFechaAsignacion = '', fechaRegistroNeumatico, esRecuperado, fechaRecuperado = null, fechaInspeccion = '' }) => {

    const [Odometro, setOdometro] = React.useState<number>(initialOdometro);
    const [Remanente, setRemanente] = React.useState<number>(initialRemanente);
    const [PresionAire, setPresionAire] = React.useState<number>(initialPresionAire);
    const [TorqueAplicado, setTorqueAplicado] = React.useState<number>(initialTorqueAplicado);
    const [kmError, setKmError] = React.useState(false); // Estado para el error del kilometraje
    const [presionError, setPresionError] = React.useState(false);
    const [torqueError, setTorqueError] = React.useState(false);
    const [fechaAsignacion, setFechaAsignacion] = React.useState<string>('');
    const [fechaError, setFechaError] = React.useState<string | null>(null);
    const [fechaFormatoError, setFechaFormatoError] = React.useState(false); // Error para el formato de la fecha
    const [remanenteError, setRemanenteError] = useState(false)

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Rango válido para fecha de asignación: hoy-3 a hoy (inclusive, 4 días contando hoy)
    const hoy = React.useMemo(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
    }, []);


    // la fecha q se envia es la fecha de la ultima inspección
    const validarFechaAsignacion = useCallback((value: string): string | null => {
        if (!value) return null;

        if (value > hoy) {
            return `No puede ser posterior a hoy (${convertToDateHuman(hoy)})`;
        }

        if (esRecuperado && fechaRecuperado) {
            const fechaRec = new Date(fechaRecuperado).toISOString().slice(0, 10);
            if (value < fechaRec) {
                return `Fecha inspección debe ser mayor o igual a la fecha de recupero.`;
            }
        } else {
            if (fechaRegistroNeumatico && value < fechaRegistroNeumatico) {
                return `Fecha de inspección debe ser mayor o igual a la fecha de envio.`;
            }
        }

        return null;
    }, [hoy, fechaRegistroNeumatico, esRecuperado, fechaRecuperado]);

    React.useEffect(() => {
        if (open) {
            setOdometro(initialOdometro);
            setRemanente(initialRemanente);
            setPresionAire(initialPresionAire);
            setTorqueAplicado(initialTorqueAplicado);
            setFechaAsignacion(initialFechaAsignacion || ''); // Pre-llenar fecha si existe
            setKmError(false);
            setPresionError(false);
            setTorqueError(false);
            setFechaError(null);
        }
    }, [open, initialRemanente, initialOdometro, initialPresionAire, initialTorqueAplicado, initialFechaAsignacion, fechaRegistroNeumatico]);

    const validarFormatoFecha = (fecha: string) => {
        // Espera formato YYYY-MM-DD
        if (!fecha) return false;
        const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return false;
        const [_, year, month, day] = match;
        return year.length === 4 && month.length === 2 && day.length === 2;
    };

    const handleSubmit = () => {

        if (Remanente > 25 || Remanente < 0) {
            setRemanenteError(true);
            return;
        }

        if (Odometro < initialOdometro) {
            setKmError(true);
            return;
        }
        if (PresionAire < 25 || PresionAire > 50) {
            setPresionError(true);
            return;
        }
        if (TorqueAplicado < 110 || TorqueAplicado > 150) {
            setTorqueError(true);
            return;
        }

        const errorFecha = validarFechaAsignacion(fechaInspeccion);
        if (errorFecha) {
            setFechaError(errorFecha);
            return;
        }

        setFechaError(null);
        onSubmit({ Odometro, Remanente, PresionAire, TorqueAplicado, FechaAsignacion: fechaInspeccion });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
            {/* <DialogTitle>Ingresar datos</DialogTitle> */}
            <DialogContent>
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

                        {/* TODO: */}
                        <div className='flex flex-col w-100'>
                            <TextField
                                label="Remanente"
                                type="number"
                                disabled={esRecuperado}
                                value={Remanente === 0 ? '' : Remanente}
                                onChange={e => {

                                    if (esRecuperado) return;

                                    let value = e.target.value.replace(/,/g, '.');
                                    if (!/^\d*(\.?\d{0,2})?$/.test(value)) return;
                                    let remanente = parseFloat(value)

                                    if (remanente > 25 || remanente < 0) {
                                        setRemanenteError(true);
                                    } else setRemanenteError(false);

                                    setRemanente(value === '' ? 0 : remanente);
                                }}
                                fullWidth
                                error={remanenteError}
                                helperText={!esRecuperado ? (remanenteError ? 'Debe estar entre 0 y 25' : 'Rango permitido: 0-25') : ''}
                                inputProps={{ min: 0, step: '0.01', inputMode: 'decimal', pattern: "^\\d*(\\.\\d{0,2})?$", max: 25 }}
                                InputProps={{
                                    inputProps: { min: 0, max: 25 },
                                    sx: {
                                        'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                        'input[type=number]': {
                                            MozAppearance: 'textfield',
                                        },
                                    },
                                }}
                            />

                            {
                                esRecuperado && (
                                    <span className='text-green-600 ml-3.5 font-normal italic text-xs mt-0.75'>
                                        {`Neúmatico recuperado`}
                                    </span>
                                )
                            }
                        </div>

                        <TextField
                            label="Presión de Aire"
                            type="number"
                            value={PresionAire === 0 ? '' : PresionAire}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setPresionAire(value);
                                if (value < 25 || value > 50) {
                                    setPresionError(true);
                                } else {
                                    setPresionError(false);
                                }
                            }}
                            fullWidth
                            error={presionError}
                            helperText={presionError ? 'Debe estar entre 25 y 50 psi' : 'Rango permitido: 25-50 psi'}
                            InputProps={{
                                inputProps: { min: 25, max: 50 },
                                sx: {
                                    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                    'input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                },
                            }}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Torque"
                            type="number"
                            value={TorqueAplicado === 0 ? '' : TorqueAplicado}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setTorqueAplicado(value);
                                if (value < 110 || value > 150) {
                                    setTorqueError(true);
                                } else {
                                    setTorqueError(false);
                                }
                            }}
                            fullWidth
                            error={torqueError}
                            helperText={torqueError ? 'Debe estar entre 110 y 150 Nm' : 'Recomendado: 110-150 Nm'}
                            InputProps={{
                                inputProps: { min: 110, max: 150 },
                                sx: {
                                    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                    'input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                },
                            }}
                        />
                    </Stack>

                    {fechaError && (
                        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2'>
                            <TriangleAlert className='h-3.5 w-3.5 shrink-0' />
                            {fechaError}
                        </div>
                    )}

                    <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800'>
                        <p className='font-semibold mb-1.5 flex items-center gap-1.5'>
                            <TriangleAlert className='h-3.5 w-3.5 shrink-0' />
                            Nota importante
                        </p>
                        <ul className='list-disc list-inside space-y-1 text-amber-700'>
                            <li>La <b>fecha de asignación</b> se tomará de la última inspección registrada.</li>
                            <li>Para usar otra fecha, realice una nueva inspección antes de continuar.</li>
                            <li>Si es un neumático recién enviado, la inspección debe ser igual o posterior a la del envio.</li>
                            <li>Si asigna un neumático recuperado, la inspección debe ser igual o posterior a su fecha de recupero.</li>
                        </ul>
                        <div className='mt-2.5 pt-2 border-t border-amber-200 flex flex-wrap gap-x-4 gap-y-1'>
                            <span className='text-amber-800'>
                                Última inspección: <span className='font-semibold'>{convertToDateHuman(fechaInspeccion)}</span>
                            </span>
                            {
                                esRecuperado ? (
                                    <span className='text-sky-700'>
                                        F. Recuperación: <span className='font-semibold'>{convertToDateHuman(fechaRecuperado ?? '')}</span>
                                    </span>
                                ) : (
                                    <span className='text-teal-700'>
                                        F. Envío: <span className='font-semibold'>{convertToDateHuman(fechaRegistroNeumatico ?? '')}</span>
                                    </span>
                                )
                            }
                        </div>
                    </div>

                    <ButtonCustom
                        onClick={handleSubmit}
                        variant={'primary'}
                    >
                        Guardar
                    </ButtonCustom>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default ModalInputsNeuDesasignacion;
