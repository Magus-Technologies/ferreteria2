"use client"

import { usePreviewContext } from "./preview/_shared/use-preview-context"
import TicketCotizacion from "./preview/_ticket/ticket-cotizacion"
import TicketEntrega from "./preview/_ticket/ticket-entrega"
import TicketGuia from "./preview/_ticket/ticket-guia"
import TicketIngresoSalida from "./preview/_ticket/ticket-ingreso-salida"
import TicketNotaCredito from "./preview/_ticket/ticket-nota-credito"
import TicketNotaDebito from "./preview/_ticket/ticket-nota-debito"
import TicketOrdenCompra from "./preview/_ticket/ticket-orden-compra"
import TicketRequerimientoCompra from "./preview/_ticket/ticket-requerimiento-compra"
import TicketRequerimientoServicio from "./preview/_ticket/ticket-requerimiento-servicio"
import TicketRecepcionAlmacen from "./preview/_ticket/ticket-recepcion-almacen"
import TicketTransferenciaStock from "./preview/_ticket/ticket-transferencia-stock"
import TicketVenta from "./preview/_ticket/ticket-venta"
import A4Cotizacion from "./preview/_a4/a4-cotizacion"
import A4Entrega from "./preview/_a4/a4-entrega"
import A4Guia from "./preview/_a4/a4-guia"
import A4IngresoSalida from "./preview/_a4/a4-ingreso-salida"
import A4NotaCredito from "./preview/_a4/a4-nota-credito"
import A4NotaDebito from "./preview/_a4/a4-nota-debito"
import A4OrdenCompra from "./preview/_a4/a4-orden-compra"
import A4RequerimientoCompra from "./preview/_a4/a4-requerimiento-compra"
import A4RequerimientoServicio from "./preview/_a4/a4-requerimiento-servicio"
import A4RecepcionAlmacen from "./preview/_a4/a4-recepcion-almacen"
import A4TransferenciaStock from "./preview/_a4/a4-transferencia-stock"
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
    if (props.comprobante === "nota-credito") return <TicketNotaCredito ctx={ctx} />
    if (props.comprobante === "nota-debito") return <TicketNotaDebito ctx={ctx} />
    if (props.comprobante === "orden-compra") return <TicketOrdenCompra ctx={ctx} />
    if (props.comprobante === "ingreso-salida") return <TicketIngresoSalida ctx={ctx} />
    if (props.comprobante === "requerimiento-compra") return <TicketRequerimientoCompra ctx={ctx} />
    if (props.comprobante === "requerimiento-servicio") return <TicketRequerimientoServicio ctx={ctx} />
    if (props.comprobante === "recepcion-almacen") return <TicketRecepcionAlmacen ctx={ctx} />
    if (props.comprobante === "transferencia-stock") return <TicketTransferenciaStock ctx={ctx} />
    return <TicketVenta ctx={ctx} />
  }

  if (props.comprobante === "cotizacion") return <A4Cotizacion ctx={ctx} />
  if (props.comprobante === "entrega") return <A4Entrega ctx={ctx} />
  if (props.comprobante === "guia") return <A4Guia ctx={ctx} />
  if (props.comprobante === "nota-credito") return <A4NotaCredito ctx={ctx} />
  if (props.comprobante === "nota-debito") return <A4NotaDebito ctx={ctx} />
  if (props.comprobante === "orden-compra") return <A4OrdenCompra ctx={ctx} />
  if (props.comprobante === "ingreso-salida") return <A4IngresoSalida ctx={ctx} />
  if (props.comprobante === "requerimiento-compra") return <A4RequerimientoCompra ctx={ctx} />
  if (props.comprobante === "requerimiento-servicio") return <A4RequerimientoServicio ctx={ctx} />
  if (props.comprobante === "recepcion-almacen") return <A4RecepcionAlmacen ctx={ctx} />
  if (props.comprobante === "transferencia-stock") return <A4TransferenciaStock ctx={ctx} />
  return <A4Venta ctx={ctx} />
}
