import * as React from 'react';
import { memo } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Gauge, PackageCheck, Truck, Car, XCircle, RefreshCcw } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/overview/KpiCard';

export interface CustomersFiltersProps {
  projectCount: number;
  disponiblesCount: number;
  asignadosCount: number;
  autosDisponiblesCount?: number;
  bajaDefinitivaCount: number;
  recuperadosCount: number;
  isLoading?: boolean;
}

export const CustomersFilters = memo(({
  projectCount,
  disponiblesCount,
  asignadosCount,
  autosDisponiblesCount,
  bajaDefinitivaCount,
  recuperadosCount,
  isLoading = false,
}: CustomersFiltersProps): React.JSX.Element => {
  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid lg={3} sm={6} xs={6}>
        <KpiCard
          label="Total Neumáticos"
          value={projectCount ?? 0}
          icon={<Gauge size={22} />}
          color="sky"
          description="En el taller actual"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={6}>
        <KpiCard
          label="Disponibles"
          value={disponiblesCount ?? 0}
          icon={<PackageCheck size={22} />}
          color="green"
          description="En almacén"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={6}>
        <KpiCard
          label="Asignados"
          value={asignadosCount ?? 0}
          icon={<Truck size={22} />}
          color="yellow"
          description="Montados en vehículos"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={6}>
        <KpiCard
          label="Vehículos Disponibles"
          value={autosDisponiblesCount ?? 0}
          icon={<Car size={22} />}
          color="stone"
          description="Sin neumático asignado"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={6} sm={6} xs={6}>
        <KpiCard
          label="Baja Definitiva"
          value={bajaDefinitivaCount ?? 0}
          icon={<XCircle size={22} />}
          color="red"
          description="Retirados del servicio"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={6} sm={6} xs={6}>
        <KpiCard
          label="Recuperados"
          value={recuperadosCount ?? 0}
          icon={<RefreshCcw size={22} />}
          color="lime"
          description="Reacondicionados"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
});
