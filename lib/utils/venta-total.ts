/**
 * Total de una venta, calculado igual que el backend.
 *
 * Existe porque esta cuenta estaba copiada en siete lugares (la página de Ventas
 * por Cobrar, sus cards, su tabla, el modal de cobro, el de cobro múltiple, la
 * alerta de deuda del cliente y el hook `use-clientes-con-deuda`) y las siete
 * copias se habían quedado sin el RECARGO: mostraban `precio × cantidad −
 * descuento`. Una venta de S/20 con S/5 de recargo salía en S/25 al crearla y en
 * S/20 en cuentas por cobrar, así que el cobro se autocompletaba corto, el
 * cliente pagaba de menos y la venta nunca terminaba de cancelarse.
 *
 * El espejo del lado servidor es `VentaController::getTotalVenta()`, que es
 * quien valida el monto al registrar un cobro. Si se toca uno hay que tocar el
 * otro, o vuelve el mismo desfase.
 *
 * Reglas:
 * - El recargo es POR LÍNEA de producto: se suma una vez, no se multiplica por
 *   la cantidad. Con 3 productos distintos se suman los 3 recargos.
 * - El descuento se aplica DESPUÉS del recargo, sobre el subtotal ya recargado.
 * - `descuento_tipo === 'porcentaje'` lo trata como %; cualquier otro valor lo
 *   trata como monto fijo.
 * - Las bonificaciones no suman: son producto regalado.
 */
export function calcularTotalVenta(venta: any): number {
  const total = (venta?.productos_por_almacen || []).reduce((acc: number, item: any) => {
    for (const u of item?.unidades_derivadas ?? []) {
      if (Boolean(u?.bonificacion)) continue

      const precio = Number(u?.precio ?? 0)
      const cantidad = Number(u?.cantidad ?? 0)
      const recargo = Number(u?.recargo ?? 0)
      const descuento = Number(u?.descuento ?? 0)

      const subtotalConRecargo = precio * cantidad + recargo

      acc += u?.descuento_tipo === 'porcentaje'
        ? subtotalConRecargo - (subtotalConRecargo * descuento) / 100
        : subtotalConRecargo - descuento
    }
    return acc
  }, 0)

  return Math.round(total * 100) / 100
}
