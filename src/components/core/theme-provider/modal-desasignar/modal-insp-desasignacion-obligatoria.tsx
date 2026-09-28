import React, { memo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import ModalAviso from '@/components/core/modal-aviso';
import { Button as ButtonCustom } from '@/components/ui/button';

interface ModalInspeccionObligatoriaDesasignarProps {
    open: boolean;
    onClose: () => void;
    onRegistrarInspeccion: () => void;
}

const ModalInsDesasignacionObligatoria: React.FC<ModalInspeccionObligatoriaDesasignarProps> = memo(({ open, onClose, onRegistrarInspeccion }) => (
    <ModalAviso
        open={open}
        onClose={onClose}
        tono="azul"
        icono={<ClipboardCheck className="h-5 w-5" />}
        titulo="INSPECCIÓN OBLIGATORIA"
        mensaje="Este vehículo nunca ha sido inspeccionado. Debe realizar una inspección antes de desasignar."
        detalle="Acción: Desasignar neumático"
        imagen="/assets/inspeccionVehiculo.png"
        acciones={
            <>
                <ButtonCustom onClick={onClose}>
                    Cerrar
                </ButtonCustom>
                <ButtonCustom variant="primary" onClick={onRegistrarInspeccion}>
                    Registrar nueva inspección
                </ButtonCustom>
            </>
        }
    />
));

ModalInsDesasignacionObligatoria.displayName = 'ModalInsDesasignacionObligatoria';

export default ModalInsDesasignacionObligatoria;
