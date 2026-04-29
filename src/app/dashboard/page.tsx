"use client";

import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Gauge, PackageCheck, Truck, CircleDollarSign,
  XCircle, RefreshCcw, PieChart, BarChart2,
  AlertTriangle, Clock, Award, Ruler, TrendingUp, Activity,
  Component,
} from 'lucide-react';

import { useNeuStats } from '@/hooks/use-neu-stats';
import { KpiCard } from '@/components/dashboard/overview/KpiCard';
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard';
import { Sales } from '@/components/dashboard/overview/inspeccion-neu';
import { FlotaDonut } from '@/components/dashboard/overview/FlotaDonut';
import { VidaUtilDistribucion } from '@/components/dashboard/overview/VidaUtilDistribucion';
import { TablaCriticos } from '@/components/dashboard/overview/TablaCriticos';
import { ProximosVencer } from '@/components/dashboard/overview/ProximosVencer';
import { MarcasDonut } from '@/components/dashboard/overview/MarcasDonut';
import { MedidasChart } from '@/components/dashboard/overview/MedidasChart';
import { DesgasteVehiculos } from '@/components/dashboard/overview/DesgasteVehiculos';
import { ActividadReciente } from '@/components/dashboard/overview/ActividadReciente';
import { DisenosDonut } from '@/components/dashboard/overview/DisenosDonut';
import { DesgasteNeumaticos } from '@/components/dashboard/overview/DesgasteNeumaticos';

export default function Page(): React.JSX.Element {
  const { allQtyNeu, avaibleQtyNeu, assignedQtyNeu, dropQtyNeu, recoverQtyNeu, assignedCostNeu, isLoading } = useNeuStats();

  return (
    <Grid container spacing={3} alignItems="flex-start">
      {/* Fila 1 — KPIs (4 por fila en desktop, 2 en tablet/móvil) */}
      <Grid lg={3} sm={6} xs={12}>
        <KpiCard
          label="Total Neumáticos"
          value={allQtyNeu.data ?? 0}
          icon={<Gauge size={22} />}
          color="sky"
          description="En el taller actual"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <KpiCard
          label="Disponibles"
          value={avaibleQtyNeu.data ?? 0}
          icon={<PackageCheck size={22} />}
          color="green"
          description="En almacén"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <KpiCard
          label="Asignados"
          value={Number(assignedQtyNeu.data ?? 0)}
          icon={<Truck size={22} />}
          color="yellow"
          description="Montados en vehículos"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <KpiCard
          label="Costo Asignado"
          value={assignedCostNeu.data ?? 0}
          icon={<CircleDollarSign size={22} />}
          color="amber"
          format="currency"
          description="Valor de neumáticos activos"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={6} sm={6} xs={12}>
        <KpiCard
          label="Baja Definitiva"
          value={dropQtyNeu.data ?? 0}
          icon={<XCircle size={22} />}
          color="red"
          description="Retirados del servicio"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={6} sm={6} xs={12}>
        <KpiCard
          label="Recuperados"
          value={recoverQtyNeu.data ?? 0}
          icon={<RefreshCcw size={22} />}
          color="lime"
          description="Reacondicionados"
          loading={isLoading}
          sx={{ height: '100%' }}
        />
      </Grid>

      {/* Fila 2 — Distribución de flota */}
      <Grid lg={4} md={6} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Estado de la Flota"
          subtitle="Asignados vs disponibles"
          icon={<PieChart size={16} />}
          iconColor="#0084d1"
          sx={{ height: '100%' }}
        >
          <FlotaDonut data={[
            { name: 'Asignados', value: assignedQtyNeu.data ?? 0, color: '#0084d1' },
            { name: 'Disponibles', value: avaibleQtyNeu.data ?? 0, color: '#00a63e' },
            { name: 'Baja definitiva', value: dropQtyNeu.data ?? 0, color: '#e7000b' },
            { name: 'Recuperados', value: recoverQtyNeu.data ?? 0, color: '#5ea500' },
          ]} />
        </CollapsibleCard>
      </Grid>

      <Grid lg={8} md={6} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Distribución Vida Útil"
          subtitle="Neumáticos por rango de desgaste"
          icon={<BarChart2 size={16} />}
          iconColor="#F59E0B"
          sx={{ height: '100%' }}
        >
          <VidaUtilDistribucion />
        </CollapsibleCard>
      </Grid>

      {/* Fila 3 — Alertas y planificación */}
      <Grid lg={8} md={7} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Top 10 neumáticos críticos"
          subtitle="Vida útil por debajo del 40% (asignados)"
          icon={<AlertTriangle size={16} />}
          iconColor="#EF4444"
          sx={{ height: '100%' }}
        >
          <TablaCriticos />
        </CollapsibleCard>
      </Grid>
      <Grid lg={4} md={5} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Distribución por Diseño"
          subtitle="Composición del taller"
          icon={<Component size={16} />}
          iconColor="#5caef6"
          sx={{ height: '100%' }}
        >
          <DisenosDonut />
        </CollapsibleCard>
      </Grid>

      {/* Fila 4 — Análisis de composición */}
      <Grid lg={4} md={5} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Distribución por Marca"
          subtitle="Composición del taller"
          icon={<Award size={16} />}
          iconColor="#8B5CF6"
          sx={{ height: '100%' }}
        >
          <MarcasDonut />
        </CollapsibleCard>
      </Grid>
      <Grid lg={8} md={7} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Distribución por Medida"
          subtitle="Asignados y disponibles por tamaño"
          icon={<Ruler size={16} />}
          iconColor="#3B82F6"
          sx={{ height: '100%' }}
        >
          <MedidasChart />
        </CollapsibleCard>
      </Grid>

      {/* Fila 5 — Operaciones y rendimiento */}
      <Grid lg={7} md={7} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Tasa de Desgaste por Neumático"
          subtitle="mm desgastados por cada 1,000 km"
          icon={<TrendingUp size={16} />}
          iconColor="#EF4444"
          sx={{ height: '100%' }}
        >
          <DesgasteNeumaticos />
        </CollapsibleCard>
      </Grid>
      <Grid lg={5} md={5} xs={12}>
        <CollapsibleCard
          loading={isLoading}
          title="Actividad Reciente"
          subtitle="Últimos movimientos del taller"
          icon={<Activity size={16} />}
          iconColor="#22C55E"
          sx={{ height: '100%' }}
        >
          <ActividadReciente />
        </CollapsibleCard>
      </Grid>

      {/* Fila 6 — Inspecciones por vehículo */}
      <Grid lg={12} xs={12}>
        <Sales sx={{ height: '100%' }} />
      </Grid>
    </Grid>
  );
}
