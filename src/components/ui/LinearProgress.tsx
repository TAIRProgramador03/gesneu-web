import React from 'react'
import Box from '@mui/material/Box';
import { LinearProgress, Typography } from '@mui/material';


export const LinearProgressItem = ({ estado, width = '180px' }: { estado: number, width?: string }) => {
  return (
    <Box sx={{ position: 'relative', width }}>
      <LinearProgress
        variant="determinate"
        value={estado}
        sx={{
          height: 16,
          borderRadius: 5,
          border: `.5px solid #8e8e8e`,
          padding: '10px',
          backgroundColor: '#eee',
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
          color: (estado < 79) ? '#000' : '#fff',
          fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5,
          textShadow: '0 1px 2px rgba(255,255,255,0.15)'
        }}
      >
        {estado}%
      </Typography>
    </Box>
  )
}
