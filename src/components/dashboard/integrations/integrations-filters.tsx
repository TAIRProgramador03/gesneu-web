"use client";

import * as React from 'react';
import { memo } from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ModalTodasPlacas from './modal-todas-placas';
import Image from 'next/image';
import { CarFront, MapPinCheckInside, RotateCcw } from 'lucide-react';
import { Checkbox as CheckBoxCustom } from "@/components/ui/checkbox"


interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // projectName: string;
  operationName?: string;
  autosDisponiblesCount?: number;
  onVehiculoSeleccionado?: (vehiculo: any) => void;
  transitoChecked?: boolean;
  onTransitoChange?: (checked: boolean) => void;
  onReset?: () => void;
}

export const CompaniesFilters = memo(({ onSearchChange, operationName, autosDisponiblesCount, onVehiculoSeleccionado, transitoChecked = false, onTransitoChange, onReset }: CompaniesFiltersProps): React.JSX.Element => {
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
    } else {
      handleBuscar(value)
    }
  };

  const handleBuscar = (value: string | null = null) => {
    let newValue = value
    if (newValue !== null) {
      const syntheticEvent = {
        target: { value: newValue?.trim() }
      } as React.ChangeEvent<HTMLInputElement>;
      onSearchChange(syntheticEvent);
      return;
    }

    if (inputValue.trim()) {
      const syntheticEvent = {
        target: { value: inputValue.trim() }
      } as React.ChangeEvent<HTMLInputElement>;
      onSearchChange(syntheticEvent);
      return;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleBuscar(null);
    }
  };

  const handleReset = () => {
    setInputValue('');
    setPlacaSeleccionada('');
    setCheckboxChecked(false);
    onReset?.();
  };

  const mostrarReset = inputValue.trim() !== '' || placaSeleccionada !== '' || transitoChecked;

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
    <Card sx={{ p: 2, position: 'relative' }}>
      {/* Botón limpiar: esquina superior derecha */}
      {mostrarReset && (
        <Tooltip title="Limpiar filtros" arrow>
          <IconButton
            onClick={handleReset}
            size="small"
            aria-label="Limpiar filtros"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              '&:hover': {
                backgroundColor: '#fee2e2',
                borderColor: '#dc2626',
              },
            }}
          >
            <RotateCcw size={18} />
          </IconButton>
        </Tooltip>
      )}

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          pr: { xs: 0, lg: 5 },
        }}
      >
        {/* Grupo izquierdo: controles de filtro (búsqueda + tránsito) */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          useFlexGap
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            flex: '1 1 auto',
            flexWrap: 'wrap',
            minWidth: 0,
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
                  onClick={() => handleBuscar(null)}
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
            sx={{ flex: '1 1 auto', maxWidth: { xs: '100%', sm: '450px' }, minWidth: { xs: 'auto', sm: '260px' } }}
          />

          <div className='flex items-center gap-3 shrink-0'>
            <label
              htmlFor="placa-en-transito"
              className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              <CheckBoxCustom
                id="placa-en-transito"
                className='h-5 w-5'
                name="placa-en-transito"
                checked={transitoChecked}
                onCheckedChange={(checked) => onTransitoChange?.(checked === true)}
              />
              Tránsito
            </label>
          </div>

          {/* TODO: Desabilitado para transito */}
          {/* <FormControlLabel
            control={<Checkbox onChange={handleCheckboxChange} checked={checkboxChecked} disabled={inputValue.trim() !== ''} />}
            label="Tránsito"
          /> */}
        </Stack>

        {/* Grupo derecho: información (Operación/Vehículos) + placa */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          useFlexGap
          alignItems="center"
          sx={{
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', lg: 'flex-end' },
          }}
        >
          <div className='flex bg-linear-to-r from-gray-700 to-gray-600 p-3 gap-2 rounded-lg text-white flex-wrap'>
            {operationName && operationName !== '—' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapPinCheckInside />
                <Typography variant="body2" >
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Operación: </Box> {operationName}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CarFront />
              <Typography variant="body2" >
                <Box component="span" sx={{ fontWeight: 'bold' }}>Vehiculos: </Box> {autosDisponiblesCount}
              </Typography>
            </Box>
          </div>

          <Box sx={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
            <Box
              component="div"
              sx={{
                width: 170,
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
      </Stack>
      {/* Modal para todas las placas */}
      {/* <ModalTodasPlacas open={openModal} onClose={handleCloseModal} onVehiculoSeleccionado={handleVehiculoSeleccionado} /> */}

    </Card >
  );
})

