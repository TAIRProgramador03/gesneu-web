/**
 * Utilidades centralizadas para el cálculo y manejo de desgaste de neumáticos
 * Todas las partes del sistema deben usar estas funciones para mantener consistencia
 */

export interface TireWearInfo {
  porcentajeDesgaste: number; // Porcentaje de vida útil restante (0-100)
  color: 'red' | 'yellow' | 'green' | 'lightgreen' | 'transparent';
  bgColor: string; // Color de fondo para el diagrama
}

/**
 * Calcula el porcentaje de desgaste (vida útil restante) desde REMANENTE
 * 
 * @param remanenteActual - REMANENTE actual del neumático (en mm)
 * @param remanenteOriginal - REMANENTE original del neumático (en mm) o referencia
 * @returns Porcentaje de vida útil restante (0-100), o null si no se puede calcular
 */
export function calcularPorcentajeDesgaste(
  remanenteActual: string | number | null | undefined,
  remanenteOriginal?: string | number | null | undefined
): number | null {
  // Convertir remanente actual a número
  let remanenteAct: number | null = null;
  if (remanenteActual !== null && remanenteActual !== undefined && remanenteActual !== '') {
    if (typeof remanenteActual === 'string') {
      remanenteAct = parseFloat(remanenteActual.replace('%', '').replace(',', '.'));
    } else {
      remanenteAct = Number(remanenteActual);
    }
  }

  // Si no hay remanente actual, no se puede calcular
  if (remanenteAct === null || isNaN(remanenteAct)) {
    return null;
  }

  // Si hay remanente original, calcular porcentaje
  if (remanenteOriginal !== null && remanenteOriginal !== undefined && remanenteOriginal !== '') {
    let remanenteOrig: number;
    if (typeof remanenteOriginal === 'string') {
      remanenteOrig = parseFloat(remanenteOriginal.replace('%', '').replace(',', '.'));
    } else {
      remanenteOrig = Number(remanenteOriginal);
    }

    if (!isNaN(remanenteOrig) && remanenteOrig > 0) {
      // Calcular porcentaje: (actual / original) * 100
      const porcentaje = Math.round((remanenteAct * 100) / remanenteOrig);
      return Math.max(0, Math.min(100, porcentaje)); // Asegurar que esté entre 0 y 100
    }
  }

  // Si no hay remanente original, asumir que REMANENTE ya es un porcentaje
  // (para compatibilidad con datos que ya vienen como porcentaje)
  if (remanenteAct >= 0 && remanenteAct <= 100) {
    return Math.round(remanenteAct);
  }

  // Si REMANENTE es mayor a 100, probablemente es en mm, no podemos calcular sin referencia
  return null;
}

/**
 * Obtiene información de desgaste completa para un neumático
 * 
 * NOTA: El backend ahora calcula ESTADO automáticamente desde REMANENTE y REMANENTE_ORIGINAL.
 * Esta función simplemente usa ESTADO si está disponible, o calcula como fallback.
 * 
 * PRIORIDAD:
 * 1. Si ESTADO viene como porcentaje (0-100), usarlo directamente (RECOMENDADO - viene del backend)
 * 2. Si no, calcular desde REMANENTE y REMANENTE_ORIGINAL (fallback para datos antiguos)
 * 
 * @param neumatico - Objeto del neumático con REMANENTE, REMANENTE_ORIGINAL y/o ESTADO
 * @returns Información de desgaste con porcentaje y color
 */
export function obtenerInfoDesgaste(neumatico: {
  REMANENTE?: string | number | null;
  REMANENTE_ORIGINAL?: string | number | null;
  ESTADO?: string | number | null; // Porcentaje de vida útil restante (0-100)
}): TireWearInfo {
  let porcentaje: number | null = null;

  // PRIORIDAD 1: Si ESTADO ya viene como porcentaje, usarlo directamente
  // (Este es el caso más común - la API ya calcula el porcentaje)
  if (neumatico.ESTADO !== null && neumatico.ESTADO !== undefined && neumatico.ESTADO !== '') {
    if (typeof neumatico.ESTADO === 'string') {
      const estadoStr = neumatico.ESTADO.replace('%', '').trim();
      const estadoNum = parseFloat(estadoStr);
      if (!isNaN(estadoNum) && estadoNum >= 0 && estadoNum <= 100) {
        porcentaje = Math.round(estadoNum);
      }
    } else {
      const estadoNum = Number(neumatico.ESTADO);
      if (!isNaN(estadoNum) && estadoNum >= 0 && estadoNum <= 100) {
        porcentaje = Math.round(estadoNum);
      }
    }
  }

  // PRIORIDAD 2: Si no tenemos ESTADO, calcular desde REMANENTE
  if (porcentaje === null && neumatico.REMANENTE !== null && neumatico.REMANENTE !== undefined) {
    // Si hay REMANENTE_ORIGINAL, calcular porcentaje
    if (neumatico.REMANENTE_ORIGINAL !== null && neumatico.REMANENTE_ORIGINAL !== undefined) {
      porcentaje = calcularPorcentajeDesgaste(
        neumatico.REMANENTE,
        neumatico.REMANENTE_ORIGINAL
      );
    } else {
      // Si no hay REMANENTE_ORIGINAL, verificar si REMANENTE ya es porcentaje (0-100)
      let remanenteNum: number | null = null;
      if (typeof neumatico.REMANENTE === 'string') {
        remanenteNum = parseFloat(neumatico.REMANENTE.replace('%', '').replace(',', '.'));
      } else {
        remanenteNum = Number(neumatico.REMANENTE);
      }
      
      if (!isNaN(remanenteNum) && remanenteNum >= 0 && remanenteNum <= 100) {
        // REMANENTE ya es un porcentaje
        porcentaje = Math.round(remanenteNum);
      }
      // Si REMANENTE > 100, probablemente es en mm y no podemos calcular sin referencia
    }
  }

  // Determinar color según porcentaje
  let color: TireWearInfo['color'] = 'transparent';
  let bgColor = 'transparent';

  if (porcentaje !== null && porcentaje >= 0) {
    if (porcentaje < 39) {
      color = 'red';
      bgColor = '#d32f2f'; // Rojo: menos de 39%
    } else if (porcentaje < 79) {
      color = 'yellow';
      bgColor = '#FFEB3B'; // Amarillo: 39-78%
    } else {
      color = 'green';
      bgColor = '#2e7d32'; // Verde: 79% o más
    }
  } else if (neumatico.REMANENTE !== null && neumatico.REMANENTE !== undefined) {
    // Si hay REMANENTE pero no podemos calcular porcentaje, mostrar verde claro
    color = 'lightgreen';
    bgColor = 'lightgreen';
  }

  return {
    porcentajeDesgaste: porcentaje ?? 0,
    color,
    bgColor
  };
}

