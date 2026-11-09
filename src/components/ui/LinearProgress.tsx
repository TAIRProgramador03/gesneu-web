import React from 'react'
import Box from '@mui/material/Box';
import { LinearProgress, Typography } from '@mui/material';


export const LinearProgressItem = ({ estado, width = '180px' }: { estado: number, width?: string }) => {
  return (
    <Box sx={{ position: 'relative', width, margin: '0 auto' }} >
      <LinearProgress
        variant="determinate"
        value={estado}
        sx={{
          height: 16,
          borderRadius: 5,
          // El borde y la pista eran grises fijos pensados para fondo blanco.
          // Los colores de la barra en sí no se tocan: son el semáforo sobre
          // el que va el porcentaje, y se leen igual en los dos modos.
          border: `.5px solid var(--border)`,
          padding: '10px',
          backgroundColor: 'var(--superficie-3)',
          '& .MuiLinearProgress-bar': {
            backgroundColor:
              (estado) < 39
                ? '#d32f2f'
                : (estado) < 79
                  ? '#FFEB3B'
                  : '#2e7d32',
            borderRadius: 5,
          },
        }}
      />
      <Typography
        variant="caption"
        fontWeight="bold"
        sx={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // El número va centrado sobre la barra. Si el relleno no llega al
          // centro (menos de 50 %), lo que hay debajo es la pista, no el
          // color: ahí el negro fijo se perdía contra la pista oscura.
          // Por eso debajo del 50 % el texto sigue al tema, y de ahí para
          // arriba se decide contra el color de la barra como siempre.
          color: estado < 50 ? 'var(--foreground)' : estado < 79 ? '#000' : '#fff',
          fontWeight: 'bold', fontSize: '0.875rem', letterSpacing: 0.5,
          textShadow: '0 1px 2px rgba(255,255,255,0.15)'
        }}
      >
        {estado}%
      </Typography>
    </Box>
  )
}
