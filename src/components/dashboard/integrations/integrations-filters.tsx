"use client";

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Car } from '@phosphor-icons/react/dist/ssr/Car';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ModalTodasPlacas from './modal-todasPlacas';

interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectName: string;
  operationName?: string;
  autosDisponiblesCount?: number;
  onVehiculoSeleccionado?: (vehiculo: any) => void;
}

export function CompaniesFilters({
  onSearchChange,
  projectName,
  operationName,
  autosDisponiblesCount,
  onVehiculoSeleccionado,
}: CompaniesFiltersProps): React.JSX.Element {
  const [openModal, setOpenModal] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [placaSeleccionada, setPlacaSeleccionada] = React.useState('');

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setCheckboxChecked(checked);
    if (checked) {
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCheckboxChecked(false); // Desactivar el checkbox al cerrar el modal
    setInputValue(''); // Limpiar el input al cerrar el modal
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); // Solo letras, números y guiones
    
    // Limitar a 7 caracteres (sin contar el guion)
    const valueWithoutDash = value.replace(/-/g, '');
    if (valueWithoutDash.length > 7) {
      value = valueWithoutDash.substring(0, 7);
    }
    
    // Agregar guion después del 3er carácter si no existe
    if (valueWithoutDash.length > 3 && !value.includes('-')) {
      value = valueWithoutDash.substring(0, 3) + '-' + valueWithoutDash.substring(3);
    } else if (valueWithoutDash.length <= 3) {
      // Si tiene 3 o menos caracteres, quitar el guion si existe
      value = valueWithoutDash;
    } else if (value.includes('-')) {
      // Si ya tiene guion, asegurar que esté en la posición correcta
      const parts = value.split('-');
      if (parts[0].length > 3) {
        value = parts[0].substring(0, 3) + '-' + (parts[0].substring(3) + (parts[1] || '')).substring(0, 4);
      } else if (parts[0].length < 3 && parts[1]) {
        // Si el guion está antes del 3er carácter, moverlo
        const combined = parts.join('');
        if (combined.length > 3) {
          value = combined.substring(0, 3) + '-' + combined.substring(3);
        } else {
          value = combined;
        }
      }
    }
    
    setInputValue(value);
    setPlacaSeleccionada(''); // Limpiar placa seleccionada si escribe
    // NO ejecutar búsqueda aquí, solo actualizar el valor local
    if (value.trim() !== '') {
      setCheckboxChecked(false);
    }
  };

  const handleBuscar = () => {
    // Ejecutar búsqueda solo cuando se presiona el botón
    if (inputValue.trim()) {
      const syntheticEvent = {
        target: { value: inputValue.trim() }
      } as React.ChangeEvent<HTMLInputElement>;
      onSearchChange(syntheticEvent);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir búsqueda con Enter
    if (event.key === 'Enter') {
      handleBuscar();
    }
  };

  const handleVehiculoSeleccionado = (vehiculo: any) => {
    // Solo dispara la consulta si la placa es diferente a la actual
    if ((vehiculo?.PLACA || '').toUpperCase() !== inputValue.toUpperCase()) {
      if (onVehiculoSeleccionado) onVehiculoSeleccionado(vehiculo);
    }
    setOpenModal(false);
    setCheckboxChecked(false);
    setInputValue(vehiculo?.PLACA || '');
    setPlacaSeleccionada(vehiculo?.PLACA || '');
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack 
        direction="row" 
        spacing={3} 
        alignItems="center"
        sx={{ 
          width: '100%',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {/* Input de búsqueda con botón integrado */}
        <OutlinedInput
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          value={inputValue}
          fullWidth
          placeholder="Buscar por Placa"
          inputProps={{
            maxLength: 8, // 3 caracteres + guion + 4 caracteres = 8 total
          }}
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Button
                onClick={handleBuscar}
                disabled={checkboxChecked || !inputValue.trim()}
                variant="text"
                sx={{
                  minWidth: 'auto',
                  padding: '6px 16px',
                  marginRight: '-12px',
                  color: 'text.primary',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '4px',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&:active:not(:disabled)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:disabled': {
                    color: 'action.disabled',
                  }
                }}
              >
                Buscar
              </Button>
            </InputAdornment>
          }
          disabled={checkboxChecked}
          sx={{ maxWidth: '450px', flex: '1 1 auto', minWidth: '300px' }}
        />
        <FormControlLabel
          control={<Checkbox onChange={handleCheckboxChange} checked={checkboxChecked} disabled={inputValue.trim() !== ''} />}
          label="Transito"
        />
        {/* Información agrupada - Ubicación, Operación y Vehículos */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            padding: '10px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
            flex: '0 0 auto',
            ml: 'auto'
          }}
        >
          {/* Ubicación - Proyecto */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={18} weight="bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <Box component="span" sx={{ fontWeight: 'bold' }}>Ubicación:</Box> {projectName}
            </Typography>
          </Box>
          {/* Operación */}
          {operationName && operationName !== '—' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={18} weight="bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <Box component="span" sx={{ fontWeight: 'bold' }}>Operación:</Box> {operationName}
              </Typography>
            </Box>
          )}
          {/* Vehículos disponibles */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Car size={18} weight="bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <Box component="span" sx={{ fontWeight: 'bold' }}>Vehiculos:</Box> {autosDisponiblesCount}
            </Typography>
          </Box>
        </Box>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Box
              component="img"
              src="/assets/placa.png"
              alt="Placa"
              sx={{
                width: 170,
                height: 70,
                ml: 1,
                display: 'block',
              }}
            />
            {(inputValue.trim() !== '' || placaSeleccionada) && (
              <Typography
                variant="h6"
                sx={{
                  position: 'absolute',
                  top: '55%',
                  left: '52%',
                  transform: 'translate(-50%, -50%)',
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: 33,
                  textShadow: '0 2px 8px #fff, 0 1px 0 #fff',
                  fontFamily: 'Arial, sans-serif',  
                  pointerEvents: 'none',
                  width: '100%',
                  textAlign: 'center',
                  letterSpacing: 2,
                }}
              >
                {(inputValue.trim() || placaSeleccionada).toUpperCase()}
              </Typography>
            )}
          </Box>
      </Stack>
      {/* Modal para todas las placas */}
      <ModalTodasPlacas open={openModal} onClose={handleCloseModal} onVehiculoSeleccionado={handleVehiculoSeleccionado} />

    </Card>
  );
}

export default CompaniesFilters;
