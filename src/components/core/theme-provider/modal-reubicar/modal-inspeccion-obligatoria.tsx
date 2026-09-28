import React, { memo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button as ButtonCustom } from '@/components/ui/button';
import ModalAviso from '@/components/core/modal-aviso';

interface ModalInspeccionObligatoriaProps {
    open: boolean;
    onClose: () => void;
    onRegistrarInspeccion: () => void;
}

const ModalInspeccionObligatoria: React.FC<ModalInspeccionObligatoriaProps> = memo(({ open, onClose, onRegistrarInspeccion }) => (
    <ModalAviso
        open={open}
        onClose={onClose}
        tono="azul"
        icono={<ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />}
        titulo="INSPECCIÓN OBLIGATORIA"
        mensaje="Este vehículo nunca ha sido inspeccionado. Debe realizar una inspección antes de reubicar."
        detalle="Acción: Reubicar neumático"
        imagen="/assets/inspeccionVehiculo.png"
        acciones={
            <>
                <ButtonCustom onClick={onClose}>Cerrar</ButtonCustom>
                <ButtonCustom variant="primary" onClick={onRegistrarInspeccion}>
                    Registrar nueva inspección
                </ButtonCustom>
            </>
        }
    />
));

export default ModalInspeccionObligatoria;
