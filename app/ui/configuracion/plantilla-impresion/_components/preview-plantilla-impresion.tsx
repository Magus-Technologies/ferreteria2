"use client"

import { usePreviewContext } from "./preview/_shared/use-preview-context"
import TicketCotizacion from "./preview/_ticket/ticket-cotizacion"
import TicketEntrega from "./preview/_ticket/ticket-entrega"
import TicketGuia from "./preview/_ticket/ticket-guia"
import TicketOrdenCompra from "./preview/_ticket/ticket-orden-compra"
import TicketVenta from "./preview/_ticket/ticket-venta"
import A4Cotizacion from "./preview/_a4/a4-cotizacion"
import A4Entrega from "./preview/_a4/a4-entrega"
import A4Guia from "./preview/_a4/a4-guia"
import A4OrdenCompra from "./preview/_a4/a4-orden-compra"
import A4Venta from "./preview/_a4/a4-venta"
import type { PreviewProps } from "./preview/_shared/types"

/**
 * Componente raíz del preview. Decide qué variante renderizar según formato +
 * comprobante. Cada variante vive en su propio archivo en `./preview/_ticket`
 * o `./preview/_a4` y recibe un `ctx` común con estilos + datos de empresa.
 *
 * Para agregar una nueva variante:
 *   1. Crear `./preview/_ticket/ticket-X.tsx` y/o `./preview/_a4/a4-X.tsx`
 *   2. Añadir el branch correspondiente abajo.
 *   3. Si el título/número de demo necesita cambiar, editar `./preview/_shared/titulo-comprobante.ts`.
 */
export default function PreviewPlantillaImpresion(props: PreviewProps) {
  const ctx = usePreviewContext(props)

  if (props.formato === "Ticket") {
    if (props.comprobante === "cotizacion") return <TicketCotizacion ctx={ctx} />
    if (props.comprobante === "entrega") return <TicketEntrega ctx={ctx} />
    if (props.comprobante === "guia") return <TicketGuia ctx={ctx} />
    if (props.comprobante === "orden-compra") return <TicketOrdenCompra ctx={ctx} />
    return <TicketVenta ctx={ctx} />
  }

  if (props.comprobante === "cotizacion") return <A4Cotizacion ctx={ctx} />
  if (props.comprobante === "entrega") return <A4Entrega ctx={ctx} />
  if (props.comprobante === "guia") return <A4Guia ctx={ctx} />
  if (props.comprobante === "orden-compra") return <A4OrdenCompra ctx={ctx} />
  return <A4Venta ctx={ctx} />
}
