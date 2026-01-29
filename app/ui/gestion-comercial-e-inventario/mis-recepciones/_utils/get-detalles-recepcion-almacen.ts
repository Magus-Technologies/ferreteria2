import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'

export function getDetallesRecepcionAlmacen({
  data,
}: {
  data: getRecepcionesAlmacenResponseProps | undefined
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
