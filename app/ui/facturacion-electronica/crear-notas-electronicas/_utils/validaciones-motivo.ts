/**
 * Utilidades para validaciones de Notas de Crédito y Débito según SUNAT
 */

/**
 * Valida que el monto de una Nota de Crédito cumpla con las reglas SUNAT
 */
export const validateMontoNC = (
  montoNC: number,
  montoOriginal: number,
  motivoCodigo?: string
): { valid: boolean; message?: string; type?: 'error' | 'warning' } => {
  if (!montoNC || !montoOriginal) {
    return { valid: true };
  }

  // 1. NC NO PUEDE AUMENTAR EL MONTO
  if (montoNC > montoOriginal) {
    return {
      valid: false,
      message: '❌ Una Nota de Crédito NO puede aumentar el monto original',
      type: 'error',
    };
  }

  // 2. CÓDIGOS QUE REQUIEREN ANULACIÓN TOTAL
  const codigosAnulacionTotal = ['01', '02', '06'];
  if (motivoCodigo && codigosAnulacionTotal.includes(motivoCodigo)) {
    const diferencia = Math.abs(montoNC - montoOriginal);
    if (diferencia > 0.01) {
      // Tolerancia de 1 céntimo
      return {
        valid: false,
        message: `⚠️ El motivo ${motivoCodigo} requiere anulación TOTAL del comprobante (monto debe ser igual al original)`,
        type: 'error',
      };
    }
  }

  // 3. ADVERTENCIA PARA MONTOS ALTOS
  const porcentaje = (montoNC / montoOriginal) * 100;
  if (porcentaje > 80 && !codigosAnulacionTotal.includes(motivoCodigo || '')) {
    return {
      valid: true,
      message: `⚠️ Está anulando el ${porcentaje.toFixed(1)}% del comprobante. ¿Está seguro?`,
      type: 'warning',
    };
  }

  return { valid: true };
};

/**
 * Valida que el monto de una Nota de Débito cumpla con las reglas SUNAT
 */
export const validateMontoND = (
  montoND: number
): { valid: boolean; message?: string; type?: 'error' | 'warning' } => {
  if (!montoND) {
    return { valid: true };
  }

  // ND DEBE SER POSITIVO (INCREMENTO)
  if (montoND <= 0) {
    return {
      valid: false,
      message: '❌ Una Nota de Débito debe tener un monto POSITIVO (incremento)',
      type: 'error',
    };
  }

  return { valid: true };
};

/**
 * Valida que la descripción cumpla con los requisitos del código 10
 */
export const validateDescripcionCodigo10 = (
  descripcion: string,
  motivoCodigo?: string
): { valid: boolean; message?: string; type?: 'error' | 'warning' } => {
  if (motivoCodigo !== '10') {
    return { valid: true };
  }

  if (!descripcion || descripcion.trim().length < 20) {
    return {
      valid: false,
      message: '📋 El motivo "Otros conceptos" requiere descripción detallada (mínimo 20 caracteres)',
      type: 'error',
    };
  }

  return { valid: true };
};

/**
 * Obtiene el código SUNAT de un motivo por su ID
 * (Requiere que los motivos estén cargados)
 */
export const getCodigoSunatPorId = (
  motivoId: number,
  motivos: Array<{ id: number; codigo_sunat: string }>
): string | undefined => {
  return motivos.find((m) => m.id === motivoId)?.codigo_sunat;
};

/**
 * Verifica si un motivo requiere anulación total
 */
export const requiereAnulacionTotal = (motivoCodigo?: string): boolean => {
  return ['01', '02', '06'].includes(motivoCodigo || '');
};

/**
 * Verifica si un motivo requiere descripción detallada
 */
export const requiereDescripcionDetallada = (motivoCodigo?: string): boolean => {
  return motivoCodigo === '10';
};

/**
 * Calcula el porcentaje que representa el monto de la nota respecto al original
 */
export const calcularPorcentajeNota = (
  montoNota: number,
  montoOriginal: number
): number => {
  if (!montoOriginal || montoOriginal === 0) return 0;
  return (montoNota / montoOriginal) * 100;
};

/**
 * Formatea un mensaje de efecto económico
 */
export const formatearEfectoEconomico = (
  tipo: 'NC' | 'ND',
  monto: number,
  montoOriginal?: number
): string => {
  if (tipo === 'NC' && montoOriginal) {
    const porcentaje = calcularPorcentajeNota(monto, montoOriginal);
    const diferencia = montoOriginal - monto;
    return `↓ Disminuye ${porcentaje.toFixed(1)}% (S/ ${diferencia.toFixed(2)})`;
  } else if (tipo === 'ND') {
    return `↑ Aumenta S/ ${monto.toFixed(2)}`;
  }
  return '';
};
