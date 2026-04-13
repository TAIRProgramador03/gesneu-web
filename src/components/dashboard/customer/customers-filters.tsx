import * as React from 'react';
import { memo } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CountUp from 'react-countup';

export interface CustomersFiltersProps {
  projectCount: number;
  disponiblesCount: number;
  asignadosCount: number;
  autosDisponiblesCount?: number;
  bajaDefinitivaCount: number;
  recuperadosCount: number;
}

export const CustomersFilters = memo(({ projectCount, disponiblesCount, asignadosCount, autosDisponiblesCount, bajaDefinitivaCount, recuperadosCount }: CustomersFiltersProps): React.JSX.Element => {

  return (
    <Card sx={{ p: 2 }}>
      <Grid container spacing={2} justifyContent="center" alignItems="center" wrap="wrap" sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-sky-100 border-4 border-sky-600 rounded-xl'
          >
            <CountUp end={projectCount ?? 0} duration={.8} />
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Total neumáticos
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-green-100 border-4 border-green-600 rounded-xl'
          >
            <CountUp end={disponiblesCount ?? 0} duration={.8} />
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Disponibles
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-yellow-100 border-4 border-yellow-600 rounded-xl'
          >
            <CountUp end={asignadosCount ?? 0} duration={.8} />
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Asignados
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-stone-100 border-4 border-stone-600 rounded-xl'
          >
            <CountUp end={autosDisponiblesCount ?? 0} duration={.8} />
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Vehiculos Disponibles
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-red-100 border-4 border-red-600 rounded-xl'
          >
            <span style={{ marginRight: 4, fontSize: 20 }}>
              <WarningAmberIcon />
            </span>
            <div>
              <CountUp end={bajaDefinitivaCount ?? 0} duration={.8} />
            </div>
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Baja Definitiva
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <div
            className='w-full min-w-30 h-20 mb-2 flex items-center justify-center text-4xl font-bold text-slate-800 relative bg-lime-100 border-4 border-lime-600 rounded-xl'
          >
            <span style={{ marginRight: 4, fontSize: 20 }}>
              <RecyclingIcon />
            </span>
            <div>
              <CountUp end={recuperadosCount ?? 0} duration={.8} />
            </div>
          </div>
          <Typography align="center" variant="body2" color="text.secondary">
            Recuperados
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
})