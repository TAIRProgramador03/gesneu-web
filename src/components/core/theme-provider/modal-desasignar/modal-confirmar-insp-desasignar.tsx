import React, { memo } from 'react';
import { CalendarCheck, CircleCheck, TriangleAlert } from 'lucide-react';
import ModalAviso, { type TonoAviso } from '@/components/core/modal-aviso';
import { Button as ButtonCustom } from '@/components/ui/button';

interface ModalConfirmarInspDesasignarProps {
    open: boolean;
    fechaUltimaInspeccion: string;
    diasDiferencia?: number;
    onClose: () => void;
    onRegistrarInspeccion: () => void;
    onContinuarDesasignacion: () => void;
}

const ModalConfirmarInspDesasignar: React.FC<ModalConfirmarInspDesasignarProps> = memo(({
    open,
    fechaUltimaInspeccion,
    diasDiferencia = 0,
    onClose,
    onRegistrarInspeccion,
    onContinuarDesasignacion,
}) => {
    // Regla del sistema: vale hoy y los 3 días anteriores. Desde el 4º día hay que reinspeccionar.
    // Mismo umbral que usa el flujo de reubicación (diffDias >= 4).
    const esMuyAntigua = diasDiferencia >= 4;
    const esHoy = diasDiferencia === 0;

    let fechaFormateada = fechaUltimaInspeccion;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaUltimaInspeccion)) {
        const [y, m, d] = fechaUltimaInspeccion.split('-');
        fechaFormateada = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    let titulo = 'CONFIRMAR INSPECCIÓN';
    let mensaje = `La última inspección fue el ${fechaFormateada}. ¿Desea continuar con esa fecha o realizar una nueva inspección?`;
    let tono: TonoAviso = 'ambar';
    let icono = <CalendarCheck className="h-5 w-5" />;

    if (esMuyAntigua) {
        titulo = 'INSPECCIÓN REQUERIDA';
        mensaje = `La última inspección (${fechaFormateada}) es demasiado antigua. Debe registrar una nueva inspección para continuar.`;
        tono = 'rojo';
        icono = <TriangleAlert className="h-5 w-5" />;
    } else if (esHoy) {
        titulo = 'INSPECCIÓN RECIENTE';
        mensaje = `Ya se realizó una inspección hoy (${fechaFormateada}). ¿Desea continuar con la desasignación?`;
        tono = 'azul';
        icono = <CircleCheck className="h-5 w-5" />;
    }

    return (
        <ModalAviso
            open={open}
            onClose={onClose}
            tono={tono}
            icono={icono}
            titulo={titulo}
            mensaje={mensaje}
            detalle="Acción: Desasignar neumático"
            imagen="/assets/inspeccionVehiculo.png"
            acciones={
                <>
                    <ButtonCustom onClick={onClose}>
                        Cerrar
                    </ButtonCustom>
                    <ButtonCustom variant="teal" onClick={onRegistrarInspeccion}>
                        Registrar nueva inspección
                    </ButtonCustom>
                    {!esMuyAntigua && (
                        <ButtonCustom variant="primary" onClick={onContinuarDesasignacion}>
                            Continuar desasignación
                        </ButtonCustom>
                    )}
                </>
            }
        />
    );
});

ModalConfirmarInspDesasignar.displayName = 'ModalConfirmarInspDesasignar';

export default ModalConfirmarInspDesasignar;
