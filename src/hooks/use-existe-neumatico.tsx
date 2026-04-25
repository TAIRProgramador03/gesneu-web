'use client'

import { verificarNeumatico } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'

export const useExisteNeumatico = ({ codigo }: { codigo: string }) => {

  const { data } = useQuery({
    queryKey: ['informacion-neumatico', { codigo }],
    queryFn: () => verificarNeumatico(codigo)
  })

  return {
    data
  }
}
