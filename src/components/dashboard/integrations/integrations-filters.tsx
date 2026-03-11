"use client";

import * as React from 'react';
import { memo } from 'react';
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
import ModalTodasPlacas from './modal-todas-placas';
import Image from 'next/image';

interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // projectName: string;
  operationName?: string;
  autosDisponiblesCount?: number;
  onVehiculoSeleccionado?: (vehiculo: any) => void;
}

export const CompaniesFilters = memo(({ onSearchChange, operationName, autosDisponiblesCount, onVehiculoSeleccionado }: CompaniesFiltersProps): React.JSX.Element => {
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
    setCheckboxChecked(false);
    setInputValue('');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    const valueWithoutDash = value.replace(/-/g, '');
    if (valueWithoutDash.length > 7) {
      value = valueWithoutDash.substring(0, 7);
    }

    setInputValue(value);
    setPlacaSeleccionada('');
    if (value.trim() !== '') {
      setCheckboxChecked(false);
    }
  };

  const handleBuscar = () => {
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
        {/* TODO: Desabilitado para transito */}
        {/* <FormControlLabel
          control={<Checkbox onChange={handleCheckboxChange} checked={checkboxChecked} disabled={inputValue.trim() !== ''} />}
          label="Transito"
        /> */}
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
          {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={18} weight="bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <Box component="span" sx={{ fontWeight: 'bold' }}>Ubicación:</Box> {projectName}
            </Typography>
          </Box> */}
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
            component="div"
            sx={{
              width: 170,
              ml: 1,
              display: 'block',
            }}
          >
            <Image src='/assets/placa.png' alt='Placa' width={170} height={40} />
          </Box >
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

    </Card >
  );
})

