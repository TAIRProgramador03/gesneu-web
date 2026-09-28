import React, { memo } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';
import ModalAviso from '@/components/core/modal-aviso';

interface ModalInspeccionAnteriorProps {
  open: boolean;
  onClose: () => void;
  onRegistrarInspeccion: () => void;
  diffDias: number,
  fechaInspeccion: string,
  onContinuarReubicar: () => void
}

const ModalInspeccionAnterior: React.FC<ModalInspeccionAnteriorProps> = memo(({ open, onClose, onRegistrarInspeccion, diffDias, fechaInspeccion, onContinuarReubicar }) => (
  <ModalAviso
    open={open}
    onClose={onClose}
    tono="azul"
    icono={<CalendarCheck2 className="h-5 w-5 sm:h-6 sm:w-6" />}
    titulo="INSPECCIÓN USABLE"
    mensaje={`La última inspección (${convertToDateHuman(fechaInspeccion)}) de este vehículo está dentro de los 4 días. ¿Deseas usar la misma o realizar una nueva inspección?`}
    imagen="/assets/inspeccionVehiculo.png"
    acciones={
      <>
        <ButtonCustom onClick={onClose}>Cerrar</ButtonCustom>
        <ButtonCustom variant="teal" onClick={onRegistrarInspeccion}>
          Registrar nueva inspección
        </ButtonCustom>
        <ButtonCustom variant="primary" onClick={onContinuarReubicar}>
          Continuar con la anterior inspección
        </ButtonCustom>
      </>
    }
  />
));

export default ModalInspeccionAnterior;
