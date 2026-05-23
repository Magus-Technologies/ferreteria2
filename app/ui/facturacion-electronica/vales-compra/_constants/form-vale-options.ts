import type { Modalidad, TipoPromocion } from "~/lib/api/vales-compra";

export const TIPO_PROMOCION_FORM_OPTIONS: { label: string; value: TipoPromocion }[] = [
  { label: "🎁 Sorteo", value: "SORTEO" },
  { label: "💰 Descuento en la Misma Compra", value: "DESCUENTO_MISMA_COMPRA" },
  { label: "🎟️ Vale para Próxima Compra", value: "DESCUENTO_PROXIMA_COMPRA" },
  { label: "🎉 Producto Gratis", value: "PRODUCTO_GRATIS" },
  { label: "🔄 2x1 (Mismo Producto)", value: "DOS_POR_UNO" },
];

export const MODALIDAD_FORM_OPTIONS: { label: string; value: Modalidad }[] = [
  { label: "💵 Solamente por Precio Mínimo", value: "CANTIDAD_MINIMA" },
  { label: "📁 Por Tipo de Familia (Categoría)", value: "POR_CATEGORIA" },
  { label: "🏷️ Por Productos Específicos", value: "POR_PRODUCTOS" },
  { label: "🔀 Mixto (Familia + Productos)", value: "MIXTO" },
];

export const DESCUENTO_TIPO_OPTIONS = [
  { label: "% Porcentaje", value: "PORCENTAJE" },
  { label: "S/ Monto Fijo", value: "MONTO_FIJO" },
];