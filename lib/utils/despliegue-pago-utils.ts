/**
 * Extrae el ID de despliegue de pago del formato "subCajaId-desplieguePagoId"
 * o devuelve el ID directamente si ya está en formato correcto
 * 
 * @param value - Valor del select que puede ser "subCajaId-desplieguePagoId" o un ID directo
 * @returns El ID del despliegue de pago (puede ser número o string ULID)
 */
export function extractDesplieguePagoId(value: string | number | null | undefined): string | number | null {
  if (!value) return null
  
  const valueStr = String(value)
  const parts = valueStr.split('-')
  
  // Si tiene el formato "subCajaId-desplieguePagoId", extraer la segunda parte
  // Nota: Los ULIDs tienen guiones internos, así que necesitamos unir todo después del primer guion
  if (parts.length >= 2) {
    // El primer elemento es el subCajaId, el resto es el desplieguePagoId
    const desplieguePagoId = parts.slice(1).join('-')
    
    // Si es un número, devolverlo como número
    const asNumber = parseInt(desplieguePagoId)
    if (!isNaN(asNumber) && asNumber.toString() === desplieguePagoId) {
      return asNumber
    }
    
    // Si es un ULID u otro string, devolverlo como string
    return desplieguePagoId
  }
  
  // Si es un número directo, devolverlo
  const asNumber = parseInt(valueStr)
  if (!isNaN(asNumber) && asNumber.toString() === valueStr) {
    return asNumber
  }
  
  // Si es un string directo (ULID), devolverlo
  return valueStr
}

/**
 * Extrae el ID de sub-caja del formato "subCajaId-desplieguePagoId"
 * 
 * @param value - Valor del select en formato "subCajaId-desplieguePagoId"
 * @returns El ID de la sub-caja
 */
export function extractSubCajaId(value: string | number | null | undefined): number | null {
  if (!value) return null
  
  const valueStr = String(value)
  const parts = valueStr.split('-')
  
  // Si tiene el formato "subCajaId-desplieguePagoId", extraer la primera parte
  if (parts.length >= 2) {
    const id = parseInt(parts[0])
    return isNaN(id) ? null : id
  }
  
  return null
}
