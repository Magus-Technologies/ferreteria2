import type { Modalidad, TipoPromocion } from "~/lib/api/vales-compra";

// === Modelo desacoplado para el formulario ============================
// El backend usa un único enum `tipo_promocion` con 5 valores que mezclan
// "cuándo se aplica" y "qué obtiene el cliente". En el formulario se
// descompone en dos preguntas (momento + beneficio) y al enviar se
// deriva el valor final de `tipo_promocion` con derivarTipoPromocion().

export type MomentoAplicacion = "MISMA_COMPRA" | "PROXIMA_COMPRA";
export type TipoBeneficio = "DESCUENTO" | "PRODUCTO_GRATIS" | "DOS_POR_UNO" | "SORTEO";

export const MOMENTO_APLICACION_OPTIONS: { label: string; value: MomentoAplicacion; description: string }[] = [
  {
    label: "Esta misma compra",
    value: "MISMA_COMPRA",
    description: "El beneficio se aplica automáticamente al cumplirse las condiciones.",
  },
  {
    label: "Una próxima compra",
    value: "PROXIMA_COMPRA",
    description: "Se genera un vale con código para canjearse en una venta posterior.",
  },
];

export const TIPO_BENEFICIO_OPTIONS: { label: string; value: TipoBeneficio; description: string }[] = [
  { label: "💰 Descuento (% o S/)", value: "DESCUENTO", description: "Reduce en % o S/ según el PASO 3: toda la venta, solo ciertos productos o una categoría." },
  { label: "🎉 Producto Gratis", value: "PRODUCTO_GRATIS", description: "Regalar un producto específico al cumplirse las condiciones." },
  { label: "🔄 2x1 (Mismo Producto)", value: "DOS_POR_UNO", description: "Al comprar X unidades, algunas salen gratis (se descuenta la más barata)." },
  { label: "🎁 Sorteo", value: "SORTEO", description: "Genera un código de participación para un sorteo." },
];

export const MODALIDAD_FORM_OPTIONS: { label: string; value: Modalidad; description?: string }[] = [
  { label: "🛒 Todos los productos", value: "CANTIDAD_MINIMA", description: "Aplica a cualquier producto de la venta que cumpla el umbral" },
  { label: "📁 Por Categoría", value: "POR_CATEGORIA", description: "Aplica solo a productos de categorías específicas" },
  { label: "🏷️ Por Producto", value: "POR_PRODUCTOS", description: "Aplica solo a productos específicos seleccionados" },
];

export const DESCUENTO_TIPO_OPTIONS = [
  { label: "% Porcentaje", value: "PORCENTAJE" },
  { label: "S/ Monto Fijo", value: "MONTO_FIJO" },
];

// === Helpers de derivación ===========================================

/**
 * Convierte (momento + beneficio) → tipo_promocion del backend.
 * Solo DESCUENTO admite ambos momentos; el resto siempre es MISMA_COMPRA.
 */
export function derivarTipoPromocion(
  momento: MomentoAplicacion,
  beneficio: TipoBeneficio,
): TipoPromocion {
  if (beneficio === "DESCUENTO") {
    return momento === "PROXIMA_COMPRA" ? "DESCUENTO_PROXIMA_COMPRA" : "DESCUENTO_MISMA_COMPRA";
  }
  if (beneficio === "PRODUCTO_GRATIS") return "PRODUCTO_GRATIS";
  if (beneficio === "DOS_POR_UNO") return "DOS_POR_UNO";
  return "SORTEO";
}

/**
 * Convierte tipo_promocion del backend → (momento + beneficio) para hidratar
 * el formulario al editar un vale existente.
 */
export function descomponerTipoPromocion(
  tipo: TipoPromocion,
): { momento: MomentoAplicacion; beneficio: TipoBeneficio } {
  switch (tipo) {
    case "DESCUENTO_MISMA_COMPRA":
      return { momento: "MISMA_COMPRA", beneficio: "DESCUENTO" };
    case "DESCUENTO_PROXIMA_COMPRA":
      return { momento: "PROXIMA_COMPRA", beneficio: "DESCUENTO" };
    case "PRODUCTO_GRATIS":
      return { momento: "MISMA_COMPRA", beneficio: "PRODUCTO_GRATIS" };
    case "DOS_POR_UNO":
      return { momento: "MISMA_COMPRA", beneficio: "DOS_POR_UNO" };
    case "SORTEO":
    default:
      return { momento: "MISMA_COMPRA", beneficio: "SORTEO" };
  }
}

/**
 * Beneficios válidos para un momento dado.
 * - MISMA_COMPRA: admite los 4 beneficios.
 * - PROXIMA_COMPRA: NO admite SORTEO. El vale de próxima compra ya identifica al
 *   cliente que lo ganó y genera un código (VCC-) que se canjea después; el sorteo
 *   (código de participación genérico) no aplica a este flujo.
 */
export function beneficiosValidosParaMomento(momento: MomentoAplicacion): TipoBeneficio[] {
  if (momento === "PROXIMA_COMPRA") {
    return ["DESCUENTO", "PRODUCTO_GRATIS", "DOS_POR_UNO"];
  }
  return ["DESCUENTO", "PRODUCTO_GRATIS", "DOS_POR_UNO", "SORTEO"];
}