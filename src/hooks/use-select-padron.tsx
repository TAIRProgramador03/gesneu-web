import React from 'react'
import { obtenerTodasLasMarcas, obtenerTodasLasMedidas, obtenerTodosLosDisenos } from '@/api/Neumaticos'
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

  return {
    DISEÑO_OPTIONS,
    MEDIDA_OPTIONS,
    MARCA_OPTIONS,
    isLoadingSelectDiseno,
    isLoadingSelectMarca,
    isLoadingSelectMedida
  }
}
