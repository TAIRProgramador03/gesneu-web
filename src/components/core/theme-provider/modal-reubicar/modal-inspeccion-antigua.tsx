import React, { memo } from 'react';
import { CalendarX2 } from 'lucide-react';
import { Button as ButtonCustom } from '@/components/ui/button';
import ModalAviso from '@/components/core/modal-aviso';

interface ModalInspeccionAntiguaProps {
  open: boolean;
  onClose: () => void;
  onRegistrarInspeccion: () => void;
  diffDias: number,
  fechaInspeccion: string
}

const ModalInspeccionAntigua: React.FC<ModalInspeccionAntiguaProps> = memo(({ open, onClose, onRegistrarInspeccion, diffDias, fechaInspeccion }) => (
  <ModalAviso
    open={open}
    onClose={onClose}
    tono="azul"
    icono={<CalendarX2 className="h-5 w-5 sm:h-6 sm:w-6" />}
    titulo="INSPECCIÓN ANTIGUA"
    mensaje={`La última inspección (${fechaInspeccion}) de este vehículo es muy antigua. Debe realizar una nueva inspección antes de reubicar.`}
    detalle="Acción: Reubicar neumático"
    imagen="/assets/inspeccionVehiculo.png"
    acciones={
      <>
        <ButtonCustom onClick={onClose}>Cerrar</ButtonCustom>
        <ButtonCustom variant="teal" onClick={onRegistrarInspeccion}>
          Registrar nueva inspección
        </ButtonCustom>
      </>
    }
  />
));

export default ModalInspeccionAntigua;
