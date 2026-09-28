import React, { memo } from 'react';
import { Ban } from 'lucide-react';
import { Button as ButtonCustom } from '@/components/ui/button';
import ModalAviso from '@/components/core/modal-aviso';

interface ModalAdvertenciaReubicacionProps {
    open: boolean;
    onClose: () => void;
    onAsignarNeumatico?: () => void;
    bloqueoReubicacion?: boolean;
    mensajeBloqueo?: string;
    tituloBloqueo?: string;
}

const ModalAdvertenciaReubicacion: React.FC<ModalAdvertenciaReubicacionProps> = memo(({
    open,
    onClose,
    onAsignarNeumatico,
    bloqueoReubicacion = false,
    mensajeBloqueo,
    tituloBloqueo
}) => {
    const titulo = bloqueoReubicacion
        ? (tituloBloqueo || 'REUBICACIÓN BLOQUEADA')
        : 'SIN NEUMÁTICOS PARA REUBICAR';

    const mensaje = bloqueoReubicacion
        ? (mensajeBloqueo || 'Ya realizaste una reubicación con fecha desconocida. Debes realizar una nueva inspección para poder reubicar nuevamente.')
        : 'No hay neumáticos asignados para realizar la reubicación. Debe hacer una asignación primero.';

    return (
        <ModalAviso
            open={open}
            onClose={onClose}
            tono={bloqueoReubicacion ? 'ambar' : 'rojo'}
            icono={<Ban className="h-5 w-5 sm:h-6 sm:w-6" />}
            titulo={titulo}
            mensaje={mensaje}
            acciones={
                <>
                    <ButtonCustom onClick={onClose}>Cerrar</ButtonCustom>
                    {!bloqueoReubicacion && onAsignarNeumatico && (
                        <ButtonCustom variant="primary" onClick={onAsignarNeumatico}>
                            Asignar Neumático
                        </ButtonCustom>
                    )}
                </>
            }
        />
    );
});

export default ModalAdvertenciaReubicacion;
