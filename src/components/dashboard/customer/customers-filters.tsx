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
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#e3f2fd',
              borderRadius: '17px',
              border: '5px solid #90caf9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#333',
              position: 'relative',
            }}
          >
            <div>
              <CountUp end={projectCount ?? 0} />
            </div>
            {/* <Image src="/assets/llantas.png" alt="llantas" width={36} height={36} style={{ position: 'absolute', right: 8, bottom: 8, width: 36, height: 36 }} /> */}
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Total neumáticos
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#e8f5e9',
              borderRadius: '17px',
              border: '5px solid #81c784',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <div>
              <CountUp end={disponiblesCount ?? 0} />
            </div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Disponibles
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#fff3e0',
              borderRadius: '17px',
              border: '5px solid #ffb74d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <div>
              <CountUp end={asignadosCount ?? 0} />
            </div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Asignados
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#e3f2fd',
              borderRadius: '17px',
              border: '5px solid #90caf9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <div>
              <CountUp end={autosDisponiblesCount ?? 0} />
            </div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Vehiculos Disponibles
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#ffebee',
              borderRadius: '17px',
              border: '5px solid #ff6b35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333',
              position: 'relative',
            }}
          >
            <span style={{ marginRight: 4, fontSize: 20 }}>
              <WarningAmberIcon />
            </span>
            <div>
              <CountUp end={bajaDefinitivaCount ?? 0} />
            </div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Baja Definitiva
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2} md={2} lg={2}>
          <Box
            sx={{
              width: '100%',
              minWidth: 120,
              height: 80,
              bgcolor: '#e1f5fe',
              borderRadius: '17px',
              border: '5px solid #3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333',
              position: 'relative',
            }}
          >
            <span style={{ marginRight: 4, fontSize: 20 }}>
              <RecyclingIcon />
            </span>
            <div>
              <CountUp end={recuperadosCount ?? 0} />
            </div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Recuperados
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
})