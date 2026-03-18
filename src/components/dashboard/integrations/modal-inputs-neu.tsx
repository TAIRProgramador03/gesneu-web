import React, { useState } from 'react';
import { Dialog, DialogContent, TextField, Button, Stack, DialogTitle, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';

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
}

const ModalInputsNeu: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit, initialRemanente = 0, initialOdometro = 0, initialPresionAire = 0, initialTorqueAplicado = 0, initialFechaAsignacion = '', fechaRegistroNeumatico, esRecuperado, fechaRecuperado = null }) => {

    console.log({
        hduwd231231kn: {
            initialFechaAsignacion,// puede ser ""
            fechaRegistroNeumatico // si o si habrá
        }
    })

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

    const fechaLimiteMin = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
    }, []);

    // Fecha mínima efectiva:
    // - si esRecuperado: max(hoy-3, fechaRecuperado)
    // - sino: max(hoy-3, fechaRegistroNeumatico)

    console.log({ wdihahidhiawhidaw8o22: fechaRegistroNeumatico })
    console.log({ esRecuperado })


    const fechaMinEfectiva = React.useMemo(() => {
        let min = fechaLimiteMin;
        if (esRecuperado && fechaRecuperado) {
            const fechaRec = new Date(fechaRecuperado).toISOString().slice(0, 10);
            if (fechaRec > min) min = fechaRec;
        } else if (fechaRegistroNeumatico) {
            const fechaReg = fechaRegistroNeumatico;
            if (fechaReg > min) min = fechaReg;
        }
        return min;
    }, [fechaLimiteMin, fechaRegistroNeumatico, esRecuperado, fechaRecuperado]);

    // Validar fecha de asignación según reglas de negocio
    const validarFechaAsignacion = React.useCallback((value: string): string | null => {
        if (!value) return null;

        if (value > hoy) {
            return `No puede ser posterior a hoy (${convertToDateHuman(hoy)})`;
        }

        if (esRecuperado && fechaRecuperado) {
            const fechaRec = new Date(fechaRecuperado).toISOString().slice(0, 10);
            if (value < fechaRec) {
                return `Debe ser mayor o igual a la fecha de recupero: ${convertToDateHuman(fechaRec)}`;
            }
            if (value < fechaLimiteMin) {
                return `No puede ser anterior a ${convertToDateHuman(fechaLimiteMin)} (intervalo de 4 días)`;
            }
        } else {
            const fechaReg = fechaRegistroNeumatico ? fechaRegistroNeumatico : null;
            if (value < fechaLimiteMin) {
                return `No puede ser anterior a ${convertToDateHuman(fechaLimiteMin)} (intervalo de 4 días)`;
            }
            if (fechaReg && value < fechaReg) {
                return `Debe ser mayor o igual a la fecha de registro: ${convertToDateHuman(fechaReg)}`;
            }
        }

        return null;
    }, [hoy, fechaLimiteMin, fechaRegistroNeumatico, esRecuperado, fechaRecuperado]);

    React.useEffect(() => {
        if (open) {
            console.log('[ModalInputsNeu] fechaRegistroNeumatico recibido:', fechaRegistroNeumatico);
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

        console.log(Remanente)


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

        if (fechaAsignacion.trim() === '') {
            setFechaError('Debe seleccionar una fecha de asignación');
            return;
        }

        // Validación de formato de fecha
        if (!validarFormatoFecha(fechaAsignacion)) {
            setFechaFormatoError(true);
            return;
        }
        setFechaFormatoError(false);

        // Safety-net: validar reglas de fecha antes de enviar
        const errorFecha = validarFechaAsignacion(fechaAsignacion);
        if (errorFecha) {
            setFechaError(errorFecha);
            return;
        }

        setFechaError(null);
        onSubmit({ Odometro, Remanente, PresionAire, TorqueAplicado, FechaAsignacion: fechaAsignacion });
        onClose();
    };

    const esRecuperadoTexto = 0;

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
                            helperText={torqueError ? 'Debe estar entre 110 y 150 Nm (Toyo' : 'Recomendado: 110-150 Nm'}
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
                        <div className='flex flex-col w-100'>
                            <TextField
                                label="Fecha de Asignación"
                                type="date"
                                value={fechaAsignacion}
                                onChange={e => {
                                    const value = e.target.value;
                                    setFechaAsignacion(value);
                                    setFechaFormatoError(value ? !validarFormatoFecha(value) : false);
                                    setFechaError(validarFechaAsignacion(value));
                                }}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: fechaMinEfectiva,
                                    max: hoy,
                                }}
                                error={!!fechaError || fechaFormatoError}
                                helperText={
                                    fechaFormatoError
                                        ? 'Formato inválido (YYYY-MM-DD)'
                                        : fechaError
                                            ? fechaError
                                            : `Rango válido: ${convertToDateHuman(fechaMinEfectiva)} a ${convertToDateHuman(hoy)}`
                                }
                            />
                            {
                                esRecuperado ? (
                                    <span className='text-sky-600 ml-3.5 font-normal italic text-xs mt-0.75'>
                                        {`F. Recuperación: ${convertToDateHuman(fechaRecuperado ?? '')}`}
                                    </span>
                                ) : (
                                    <span className='text-teal-600 ml-3.5 font-normal italic text-xs mt-0.75'>
                                        {`F. Envio: ${convertToDateHuman(fechaRegistroNeumatico ?? '')}`}
                                    </span>
                                )
                            }
                        </div>
                    </Stack>
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

export default ModalInputsNeu;
