import { useQueries } from '@tanstack/react-query'
import {
  obtenerCantidadAutosDisponibles,
  obtenerCantidadNeumaticos,
  obtenerCantidadNeumaticosAsignados,
  obtenerCantidadNeumaticosBajaDefinitiva,
  obtenerCantidadNeumaticosDisponibles,
  obtenerCantidadNeumaticosRecuperados,
  obtenerCostoNeumaticosAsignados
} from '@/api/Neumaticos'

export const useNeuStats = () => {

  const { "0": allQtyNeu, "1": avaibleQtyNeu, "2": assignedQtyNeu, "3": dropQtyNeu, "4": recoverQtyNeu, "5": avaibleQtyAuto, "6": assignedCostNeu } = useQueries({
    queries: [
      { queryKey: ['allQtyNeu'], queryFn: obtenerCantidadNeumaticos },
      { queryKey: ['avaibleQtyNeu'], queryFn: obtenerCantidadNeumaticosDisponibles },
      { queryKey: ['assignedQtyNeu'], queryFn: obtenerCantidadNeumaticosAsignados },
      { queryKey: ['dropQtyNeu'], queryFn: obtenerCantidadNeumaticosBajaDefinitiva },
      { queryKey: ['recoverQtyNeu'], queryFn: obtenerCantidadNeumaticosRecuperados },
      { queryKey: ['avaibleQtyAuto'], queryFn: obtenerCantidadAutosDisponibles },
      { queryKey: ['assignedCostNeu'], queryFn: obtenerCostoNeumaticosAsignados },
    ]
  })

  const isLoading = [allQtyNeu, avaibleQtyNeu, assignedQtyNeu, dropQtyNeu, recoverQtyNeu, assignedCostNeu].some(q => q.isLoading);

  return {
    allQtyNeu,
    avaibleQtyNeu,
    assignedQtyNeu,
    dropQtyNeu,
    recoverQtyNeu,
    avaibleQtyAuto,
    assignedCostNeu,
    isLoading,
  }

}
