import React, { useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { convertToDateHuman } from '@/lib/utils';
import { obtenerRangosMedicion } from '@/utils/configuraciones-neumaticos';
import { Button as ButtonCustom } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { CalendarDays, CircleAlert, Gauge, Ruler, Settings2, TriangleAlert, Wrench } from 'lucide-react';

interface ModalInputsNeuProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }) => void;
    initialRemanente?: number;
    initialOdometro?: number;
    initialPresionAire?: number;
    initialTorqueAplicado?: number;
    initialFechaAsignacion?: string; // Pre-llenar fecha al editar
    fechaRegistroNeumatico: string; // Fecha de registro del neumático (YYYY-MM-DD)
    esRecuperado?: boolean
    fechaRecuperado?: string | null
    position?: string | null
    /** Cantidad de neumáticos del vehículo: define los rangos válidos de la medición. */
    cantidadNeumaticos?: number | string | null
    /**
     * Fecha impuesta por el flujo (YYYY-MM-DD). Si llega, no se puede elegir: se muestra
     * como dato y se envía tal cual. Lo usa la desasignación, donde todos los reemplazos
     * deben compartir la fecha de la última inspección de la placa.
     */
    fechaFija?: string | null
}

/** yyyy-mm-dd en hora local (no UTC, para que no se corra un día). */
const dateToISOLocal = (date: Date): string => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
};

const ModalInputsNeu: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit, initialRemanente = 0, initialOdometro = 0, initialPresionAire = 0, initialTorqueAplicado = 0, initialFechaAsignacion = '', fechaRegistroNeumatico, esRecuperado, fechaRecuperado = null, position = null, fechaFija = null, cantidadNeumaticos = null }) => {

    const [Remanente, setRemanente] = React.useState<number>(initialRemanente);
    const [PresionAire, setPresionAire] = React.useState<number>(initialPresionAire);
    const [TorqueAplicado, setTorqueAplicado] = React.useState<number>(initialTorqueAplicado);
    const [presionError, setPresionError] = React.useState(false);
    const [torqueError, setTorqueError] = React.useState(false);
    const [fechaAsignacion, setFechaAsignacion] = React.useState<string>('');
    const [fechaError, setFechaError] = React.useState<string | null>(null);
    const [remanenteError, setRemanenteError] = useState(false);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const esRepuesto = position === 'RES01';
    const fechaImpuesta = Boolean(fechaFija);

    // Los rangos salen del tipo de vehículo: una moto no usa el mismo torque ni la misma
    // profundidad de banda que un camión.
    const rangos = React.useMemo(() => obtenerRangosMedicion(cantidadNeumaticos), [cantidadNeumaticos]);
    const REMANENTE_MIN = rangos.remanente.min;
    const REMANENTE_MAX = rangos.remanente.max;
    const PRESION_MIN = rangos.presion.min;
    const PRESION_MAX = rangos.presion.max;
    const TORQUE_MIN = rangos.torque.min;
    const TORQUE_MAX = rangos.torque.max;

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
            setRemanente(initialRemanente);
            setPresionAire(initialPresionAire);
            setTorqueAplicado(initialTorqueAplicado);
            setFechaAsignacion(fechaFija || initialFechaAsignacion || '');
            setRemanenteError(false);
            setPresionError(false);
            setTorqueError(false);
            setFechaError(null);
        }
    }, [open, initialRemanente, initialOdometro, initialPresionAire, initialTorqueAplicado, initialFechaAsignacion, fechaRegistroNeumatico, fechaFija]);

    const handleSubmit = () => {
        // Marcar todos los errores de una vez para que el usuario vea todo lo que falta
        const remanenteInvalido = Remanente > REMANENTE_MAX || Remanente < REMANENTE_MIN;
        const presionInvalida = PresionAire < PRESION_MIN || PresionAire > PRESION_MAX;
        const torqueInvalido = !esRepuesto && (TorqueAplicado < TORQUE_MIN || TorqueAplicado > TORQUE_MAX);
        // Con fecha impuesta no hay nada que elegir, pero igual se valida contra las mismas reglas.
        const fechaAUsar = fechaFija || fechaAsignacion;
        const errorFecha = fechaAUsar.trim() === ''
            ? 'Debe seleccionar una fecha de asignación'
            : validarFechaAsignacion(fechaAUsar);

        setRemanenteError(remanenteInvalido);
        setPresionError(presionInvalida);
        setTorqueError(torqueInvalido);
        setFechaError(errorFecha);

        if (remanenteInvalido || presionInvalida || torqueInvalido || errorFecha) return;

        onSubmit({
            Odometro: initialOdometro,
            Remanente,
            PresionAire,
            TorqueAplicado,
            FechaAsignacion: fechaAUsar,
        });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            fullScreen={fullScreen}
            disableEnforceFocus
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            <Box sx={{ height: 4, background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)' }} />

            <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shadow-sm shadow-violet-200">
                    <Settings2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold leading-tight text-slate-900">Datos de instalación</p>
                    <p className="mt-0.5 text-xs text-slate-500">Completa los valores medidos al montar el neumático.</p>
                </div>
                {position && (
                    <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-xs font-bold tracking-wide text-white">
                        {position}
                    </span>
                )}
            </DialogTitle>

            <DialogContent sx={{ pt: 2.5 }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
                    {/* Remanente */}
                    <Field>
                        <FieldLabel htmlFor="remanente-instalacion">Remanente</FieldLabel>
                        <InputGroup className={esRecuperado ? 'opacity-60' : ''}>
                            <InputGroupAddon>
                                <Ruler className="h-4 w-4 text-slate-400" />
                            </InputGroupAddon>
                            <InputGroupInput
                                id="remanente-instalacion"
                                type="number"
                                inputMode="decimal"
                                disabled={esRecuperado}
                                value={Remanente === 0 ? '' : Remanente}
                                placeholder="0.00"
                                onChange={(e) => {
                                    if (esRecuperado) return;
                                    const value = e.target.value.replace(/,/g, '.');
                                    if (!/^\d*(\.?\d{0,2})?$/.test(value)) return;
                                    const remanente = parseFloat(value);
                                    setRemanenteError(remanente > REMANENTE_MAX || remanente < REMANENTE_MIN);
                                    setRemanente(value === '' ? 0 : remanente);
                                }}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>mm</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        {esRecuperado ? (
                            <FieldDescription className="text-emerald-600">Neumático recuperado — remanente fijo</FieldDescription>
                        ) : (
                            <FieldDescription className={remanenteError ? 'font-semibold text-rose-600' : ''}>
                                {remanenteError
                                    ? `Debe estar entre ${REMANENTE_MIN} y ${REMANENTE_MAX}`
                                    : `Rango permitido: ${REMANENTE_MIN}-${REMANENTE_MAX} mm`}
                            </FieldDescription>
                        )}
                    </Field>

                    {/* Presión de aire */}
                    <Field>
                        <FieldLabel htmlFor="presion-instalacion">Presión de aire</FieldLabel>
                        <InputGroup>
                            <InputGroupAddon>
                                <Gauge className="h-4 w-4 text-slate-400" />
                            </InputGroupAddon>
                            <InputGroupInput
                                id="presion-instalacion"
                                type="number"
                                value={PresionAire === 0 ? '' : PresionAire}
                                placeholder="0"
                                min={PRESION_MIN}
                                max={PRESION_MAX}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setPresionAire(value);
                                    setPresionError(value < PRESION_MIN || value > PRESION_MAX);
                                }}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>psi</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription className={presionError ? 'font-semibold text-rose-600' : ''}>
                            {presionError
                                ? `Debe estar entre ${PRESION_MIN} y ${PRESION_MAX} psi`
                                : `Rango permitido: ${PRESION_MIN}-${PRESION_MAX} psi`}
                        </FieldDescription>
                    </Field>

                    {/* Torque */}
                    <Field>
                        <FieldLabel htmlFor="torque-instalacion">Torque aplicado</FieldLabel>
                        <InputGroup className={esRepuesto ? 'opacity-60' : ''}>
                            <InputGroupAddon>
                                <Wrench className="h-4 w-4 text-slate-400" />
                            </InputGroupAddon>
                            <InputGroupInput
                                id="torque-instalacion"
                                type="number"
                                disabled={esRepuesto}
                                value={TorqueAplicado === 0 ? '' : TorqueAplicado}
                                placeholder="0"
                                min={TORQUE_MIN}
                                max={TORQUE_MAX}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setTorqueAplicado(value);
                                    setTorqueError(value < TORQUE_MIN || value > TORQUE_MAX);
                                }}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>Nm</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        {esRepuesto ? (
                            <FieldDescription className="text-amber-600">No se aplica torque al repuesto</FieldDescription>
                        ) : (
                            <FieldDescription className={torqueError ? 'font-semibold text-rose-600' : ''}>
                                {torqueError
                                    ? `Debe estar entre ${TORQUE_MIN} y ${TORQUE_MAX} Nm`
                                    : `Recomendado: ${TORQUE_MIN}-${TORQUE_MAX} Nm`}
                            </FieldDescription>
                        )}
                    </Field>

                    {/* Fecha de asignación: elegible, o impuesta por el flujo (desasignación) */}
                    <Field>
                        <FieldLabel htmlFor="fecha-instalacion">Fecha de asignación</FieldLabel>
                        {fechaImpuesta ? (
                            <>
                                <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        {convertToDateHuman(fechaFija ?? '') || '—'}
                                    </span>
                                </div>
                                <FieldDescription className={fechaError ? 'font-semibold text-rose-600' : ''}>
                                    {fechaError ?? 'Se usa la fecha de la última inspección de la placa'}
                                </FieldDescription>
                            </>
                        ) : (
                            <>
                                <DatePicker
                                    value={fechaAsignacion ? new Date(`${fechaAsignacion}T00:00:00`) : undefined}
                                    onChange={(date) => {
                                        const value = date ? dateToISOLocal(date) : '';
                                        setFechaAsignacion(value);
                                        setFechaError(value ? validarFechaAsignacion(value) : 'Debe seleccionar una fecha de asignación');
                                    }}
                                    minDate={new Date(`${fechaMinEfectiva}T00:00:00`)}
                                    maxDate={new Date(`${hoy}T00:00:00`)}
                                    className="w-full"
                                />
                                <FieldDescription className={fechaError ? 'font-semibold text-rose-600' : ''}>
                                    {fechaError ?? `Rango válido: ${convertToDateHuman(fechaMinEfectiva)} a ${convertToDateHuman(hoy)}`}
                                </FieldDescription>
                            </>
                        )}
                    </Field>
                </div>

                {fechaImpuesta ? (
                    /* Con fecha impuesta hay que explicar de dónde sale y qué condiciones debe cumplir */
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                        <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
                            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                            Nota importante
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-amber-700">
                            <li>La <b>fecha de asignación</b> se tomará de la última inspección registrada.</li>
                            <li>Para usar otra fecha, realice una nueva inspección antes de continuar.</li>
                            <li>Si es un neumático recién enviado, la inspección debe ser igual o posterior a la del envío.</li>
                            <li>Si asigna un neumático recuperado, la inspección debe ser igual o posterior a su fecha de recupero.</li>
                        </ul>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-amber-200 pt-2">
                            <span className="text-amber-800">
                                Última inspección: <span className="font-semibold">{convertToDateHuman(fechaFija ?? '') || '—'}</span>
                            </span>
                            {esRecuperado ? (
                                <span className="text-sky-700">
                                    F. Recuperación: <span className="font-semibold">{convertToDateHuman(fechaRecuperado ?? '') || '—'}</span>
                                </span>
                            ) : (
                                <span className="text-teal-700">
                                    F. Envío: <span className="font-semibold">{convertToDateHuman(fechaRegistroNeumatico ?? '') || '—'}</span>
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Referencia de origen del neumático */
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <p className="text-xs text-slate-500">
                            {esRecuperado
                                ? `Fecha de recuperación: ${convertToDateHuman(fechaRecuperado ?? '') || '—'}`
                                : `Fecha de envío: ${convertToDateHuman(fechaRegistroNeumatico ?? '') || '—'}`}
                        </p>
                    </div>
                )}

                {(remanenteError || presionError || torqueError || fechaError) && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                        <p className="text-xs text-rose-700">
                            Revisa los campos marcados en rojo antes de guardar.
                        </p>
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <ButtonCustom variant="ghost" onClick={onClose}>
                        Cancelar
                    </ButtonCustom>
                    <ButtonCustom variant="primary" onClick={handleSubmit}>
                        Guardar
                    </ButtonCustom>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModalInputsNeu;
