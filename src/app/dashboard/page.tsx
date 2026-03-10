"use client";

import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Budget } from '@/components/dashboard/overview/cantidadNeu';
import { Sales } from '@/components/dashboard/overview/inspeccionNeu';
import { TasksProgress } from '@/components/dashboard/overview/cantidadNeuAsig';
import { TotalCustomers } from '@/components/dashboard/overview/cantidadNeuDisp';
import { BajaDefinitiva } from '@/components/dashboard/overview/cantidadNeuBaja';
import { Recuperados } from '@/components/dashboard/overview/cantidadNeuRecuperados';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { useNeuStats } from '@/hooks/use-neu-stats';

export default function Page(): React.JSX.Element {

  const { allQtyNeu, avaibleQtyNeu, assignedQtyNeu, dropQtyNeu, recoverQtyNeu, assignedCostNeu } = useNeuStats();

  return (
    <Grid container spacing={3}>
      {/* Primera fila - 4 tarjetas principales */}
      <Grid lg={3} sm={6} xs={12}>
        <Budget diff={12} trend="up" sx={{ height: '100%' }} value={allQtyNeu.data ?? 0} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value={avaibleQtyNeu.data ?? 0} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TasksProgress sx={{ height: '100%' }} value={Number(assignedQtyNeu.data ?? 0)} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TotalProfit sx={{ height: '100%' }} value={`$${assignedCostNeu.data ?? 0}`} />
      </Grid>

      {/* Segunda fila - Nuevas tarjetas del Módulo I */}
      <Grid lg={6} sm={6} xs={12}>
        <BajaDefinitiva diff={0} trend="down" sx={{ height: '100%' }} value={dropQtyNeu.data ?? 0} />
      </Grid>
      <Grid lg={6} sm={6} xs={12}>
        <Recuperados diff={0} trend="up" sx={{ height: '100%' }} value={recoverQtyNeu.data ?? 0} />
      </Grid>

      {/* Gráfico de inspecciones */}
      <Grid lg={12} xs={12}>
        <Sales sx={{ height: '100%' }} />
      </Grid>
    </Grid>
  );
}
