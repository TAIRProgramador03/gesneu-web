import React, { memo } from 'react';
import { Ban, TriangleAlert } from 'lucide-react';
import ModalAviso from '@/components/core/modal-aviso';
import { Button as ButtonCustom } from '@/components/ui/button';

interface ModalAdvertenciaDesasignacionProps {
    open: boolean;
    onClose: () => void;
    onDesasignarNeumatico?: () => void;
    bloqueoDesasignacion?: boolean;
    mensajeBloqueo?: string;
    tituloBloqueo?: string;
}

const ModalAdvertenciaDesasignacion: React.FC<ModalAdvertenciaDesasignacionProps> = memo(({
    open,
    onClose,
    onDesasignarNeumatico,
    bloqueoDesasignacion = false,
    mensajeBloqueo,
    tituloBloqueo,
}) => {
    const titulo = bloqueoDesasignacion
        ? (tituloBloqueo || 'DESASIGNACIÓN BLOQUEADA')
        : 'NO SE PUEDE DESASIGNAR';

    const mensaje = bloqueoDesasignacion
        ? (mensajeBloqueo || 'Ya realizaste una desasignación con fecha desconocida. Debes realizar una nueva inspección para poder reubicar nuevamente.')
        : 'No hay neumáticos asignados para realizar la desasignación.\nDebe hacer una asignación primero.';

    return (
        <ModalAviso
            open={open}
            onClose={onClose}
            tono={bloqueoDesasignacion ? 'ambar' : 'rojo'}
            icono={bloqueoDesasignacion ? <TriangleAlert className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            titulo={titulo}
            mensaje={mensaje.split('\n').map((linea, i) => (
                <p key={linea} className={i > 0 ? 'mt-1' : undefined}>{linea}</p>
            ))}
            acciones={
                <>
                    <ButtonCustom variant="outline" onClick={onClose}>
                        Cerrar
                    </ButtonCustom>
                    {!bloqueoDesasignacion && onDesasignarNeumatico && (
                        <ButtonCustom variant="primary" onClick={onDesasignarNeumatico}>
                            Asignar Neumático
                        </ButtonCustom>
                    )}
                </>
            }
        />
    );
});

ModalAdvertenciaDesasignacion.displayName = 'ModalAdvertenciaDesasignacion';

export default ModalAdvertenciaDesasignacion;
