import * as React from 'react';
import { memo, useEffect, useRef } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RecyclingIcon from '@mui/icons-material/Recycling';

export interface CustomersFiltersProps {
  projectCount: number;
  disponiblesCount: number;
  asignadosCount: number;
  autosDisponiblesCount?: number;
  bajaDefinitivaCount: number;
  recuperadosCount: number;
}

export const CustomersFilters = memo(({ projectCount, disponiblesCount, asignadosCount, autosDisponiblesCount, bajaDefinitivaCount, recuperadosCount }: CustomersFiltersProps): React.JSX.Element => {

  const countRef = useRef<HTMLDivElement>(null);
  const disponiblesRef = useRef<HTMLDivElement>(null);
  const asignadosRef = useRef<HTMLDivElement>(null);
  const autosRef = useRef<HTMLDivElement>(null);
  const bajaRef = useRef<HTMLDivElement>(null);
  const recuperadosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = {
      count: { value: projectCount, ref: countRef },
      disponibles: { value: disponiblesCount, ref: disponiblesRef },
      asignados: { value: asignadosCount, ref: asignadosRef },
      autos: { value: autosDisponiblesCount ?? 0, ref: autosRef },
      baja: { value: bajaDefinitivaCount, ref: bajaRef },
      recuperados: { value: recuperadosCount, ref: recuperadosRef }
    };

    const starts: Record<string, number> = {
      count: 0,
      disponibles: 0,
      asignados: 0,
      autos: 0,
      baja: 0,
      recuperados: 0
    };

    let rafId: number;

    const animate = () => {
      let allComplete = true;

      Object.keys(targets).forEach((key) => {
        const { value: target, ref } = targets[key as keyof typeof targets];
        const current = starts[key];

        if (current < target) {
          allComplete = false;
          const increment = Math.ceil((target - current) / 20);
          starts[key] = Math.min(current + increment, target);

          if (ref.current) {
            ref.current.textContent = starts[key].toString();
          }
        } else {
          if (ref.current) {
            ref.current.textContent = target?.toString();
          }
        }
      });

      if (!allComplete) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [projectCount, disponiblesCount, asignadosCount, autosDisponiblesCount, bajaDefinitivaCount, recuperadosCount]);

  return (
    <Card sx={{ p: 2 }}>
      <Grid container spacing={2} justifyContent="center" alignItems="center" wrap="nowrap" sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
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
            <div ref={countRef}>0</div>
            <img src="/assets/llantas.png" alt="llantas" style={{ position: 'absolute', right: 8, bottom: 8, width: 36, height: 36 }} />
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
            <div ref={disponiblesRef}>0</div>
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
            <div ref={asignadosRef}>0</div>
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
            <div ref={autosRef}>0</div>
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
            <div ref={bajaRef}>0</div>
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
            <div ref={recuperadosRef}>0</div>
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Recuperados
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
})