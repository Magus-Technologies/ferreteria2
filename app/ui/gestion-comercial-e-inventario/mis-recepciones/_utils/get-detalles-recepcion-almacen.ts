import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'

export function getDetallesRecepcionAlmacen({
  data,
}: {
  data: RecepcionAlmacenResponse | undefined
}) {
  return (
    data?.productos_por_almacen?.flatMap(ppa =>
      ppa.unidades_derivadas.map(ud => ({
        ...ud,
        costo: ppa.costo,
        producto_almacen: ppa.producto_almacen,
      }))
    ) ?? []
  )
}
