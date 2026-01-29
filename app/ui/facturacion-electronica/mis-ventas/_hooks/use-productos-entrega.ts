import { useState, useEffect } from 'react'
import type { getVentaResponseProps } from '~/lib/api/venta'

export type ProductoEntrega = {
  id: number
  producto: string
  ubicacion: string
  total: number
  entregado: number
  pendiente: number
  entregar: number
  unidad_derivada_venta_id: number
}

export function useProductosEntrega(venta?: getVentaResponseProps, open?: boolean) {
  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([])

  useEffect(() => {
    if (open && venta) {
      console.log('Venta recibida:', venta)
      console.log('Productos por almacen:', venta.productos_por_almacen)
      const productos: ProductoEntrega[] = []

      if (venta.productos_por_almacen && Array.isArray(venta.productos_por_almacen)) {
        venta.productos_por_almacen.forEach((productoAlmacen: any) => {
          console.log('Producto almacen:', productoAlmacen)
          if (
            productoAlmacen.unidades_derivadas &&
            Array.isArray(productoAlmacen.unidades_derivadas)
          ) {
            productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
              console.log('Unidad derivada:', unidad)
              const total = Number(unidad.cantidad)
              const cantidadPendienteRaw = Number(unidad.cantidad_pendiente)
              const pendiente = cantidadPendienteRaw > 0 ? cantidadPendienteRaw : total
              const entregado = total - pendiente

              console.log(
                `Producto: ${productoAlmacen.producto_almacen?.producto?.name}, Total: ${total}, Pendiente: ${pendiente}`
              )

              if (pendiente > 0) {
                productos.push({
                  id: productos.length + 1,
                  producto:
                    productoAlmacen.producto_almacen?.producto?.name || 'Sin nombre',
                  ubicacion: '',
                  total,
                  entregado,
                  pendiente,
                  entregar: pendiente,
                  unidad_derivada_venta_id: unidad.id,
                })
              }
            })
          }
        })
      }

      console.log('Productos finales:', productos)
      setProductosEntrega(productos)
    } else if (!open) {
      setProductosEntrega([])
    }
  }, [open, venta])

  return {
    productosEntrega,
    setProductosEntrega,
  }
}
