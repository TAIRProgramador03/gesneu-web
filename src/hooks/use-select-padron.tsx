import React from 'react'
import { obtenerLosTalleresDelUsuario, obtenerTodasLasMarcas, obtenerTodasLasMedidas, obtenerTodosLosDisenos } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'

export const useSelectPadron = () => {

  const { data: DISEÑO_OPTIONS = [], isLoading: isLoadingSelectDiseno } = useQuery({
    queryKey: ['select-diseños'],
    queryFn: obtenerTodosLosDisenos
  })

  const { data: MEDIDA_OPTIONS = [], isLoading: isLoadingSelectMedida } = useQuery({
    queryKey: ['select-medidas'],
    queryFn: obtenerTodasLasMedidas
  })

  const { data: MARCA_OPTIONS = [], isLoading: isLoadingSelectMarca } = useQuery({
    queryKey: ['select-marcas'],
    queryFn: obtenerTodasLasMarcas
  })

  const { data: TALLER_OPTIONS = [], isLoading: isLoadingSelectTaller } = useQuery({
    queryKey: ['talleres-del-usuario'],
    queryFn: obtenerLosTalleresDelUsuario,
  });


  return {
    DISEÑO_OPTIONS,
    MEDIDA_OPTIONS,
    MARCA_OPTIONS,
    TALLER_OPTIONS,
    isLoadingSelectDiseno,
    isLoadingSelectMarca,
    isLoadingSelectMedida,
    isLoadingSelectTaller
  }
}
