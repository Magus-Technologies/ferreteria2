/**
 * Mapeo de tipo de comprobante a título y número de ejemplo visible en el preview.
 * El PDF real usa el número del documento real; aquí solo es muestra.
 */
export function tituloComprobante(comprobante?: string): { titulo: string; numero: string } {
  switch (comprobante) {
    case "cotizacion":             return { titulo: "PROFORMA ELECTRÓNICA", numero: "COT-00000123" }
    case "compra":                 return { titulo: "COMPRA", numero: "COM-00000045" }
    case "guia":                   return { titulo: "GUÍA DE REMISIÓN REMITENTE\nELECTRÓNICA", numero: "T001-00000087" }
    case "orden-compra":           return { titulo: "ORDEN DE COMPRA", numero: "OC-00000056" }
    case "entrega":                return { titulo: "ENTREGA DE PRODUCTOS", numero: "EN-00000128" }
    case "ingreso-salida":         return { titulo: "INGRESO / SALIDA", numero: "IS-00000034" }
    case "nota-credito":           return { titulo: "NOTA DE CRÉDITO", numero: "BC01-00000012" }
    case "nota-debito":            return { titulo: "NOTA DE DÉBITO", numero: "BD01-00000007" }
    case "prestamo":               return { titulo: "PRÉSTAMO", numero: "PR-00000019" }
    case "recepcion-almacen":      return { titulo: "RECEPCIÓN DE ALMACÉN", numero: "RA-00000022" }
    case "transferencia-stock":    return { titulo: "TRANSFERENCIA DE STOCK", numero: "TS-00000041" }
    case "requerimiento-compra":   return { titulo: "ORDEN DE COMPRA", numero: "REQ-2026-014" }
    case "requerimiento-servicio": return { titulo: "ORDEN DE SERVICIO", numero: "REQ-2026-015" }
    case "cierre-caja":            return { titulo: "CIERRE DE CAJA", numero: "CC-00000003" }
    case "apertura-caja":          return { titulo: "APERTURA DE CAJA", numero: "AC-00000003" }
    case "cobro-venta":            return { titulo: "COBRO DE VENTA", numero: "CV-00000118" }
    case "cobro-venta-masivo":     return { titulo: "COBRO DE VENTA MASIVO", numero: "CVM-00000005" }
    case "pago-compra":            return { titulo: "PAGO DE COMPRA", numero: "PG-00000014" }
    case "vale-compra":            return { titulo: "VALE DE COMPRA", numero: "VC-00000027" }
    case "vale-generado":          return { titulo: "VALE GENERADO", numero: "VG-00000027" }
    case "ventas-por-cobrar":      return { titulo: "VENTAS POR COBRAR", numero: "—" }
    case "venta":
    default:                       return { titulo: "BOLETA DE VENTA", numero: "B001-00000327" }
  }
}
