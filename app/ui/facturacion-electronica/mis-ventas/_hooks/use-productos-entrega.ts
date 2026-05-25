import { useState, useEffect } from 'react'
import type { getVentaResponseProps } from '~/lib/api/venta'

export type ProductoEntrega = {
  id: number
  producto: string
  ubicacion: string
  total: number
  recibido?: number
  programado?: number
  entregado: number
  pendiente: number
  entregar: number
  entregar_programado: number
  unidad_derivada_venta_id: number
  detalle_entrega_producto_id?: number
}

export function useProductosEntrega(venta?: getVentaResponseProps, open?: boolean) {
  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([])

  useEffect(() => {
    if (open && venta) {
      const productos: ProductoEntrega[] = []

      if (venta.productos_por_almacen && Array.isArray(venta.productos_por_almacen)) {
        venta.productos_por_almacen.forEach((productoAlmacen: any) => {
          if (
            productoAlmacen.unidades_derivadas &&
            Array.isArray(productoAlmacen.unidades_derivadas)
          ) {
            productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
              const total = Number(unidad.cantidad)
              const cantidadPendienteRaw = Number(unidad.cantidad_pendiente)
              const pendiente = cantidadPendienteRaw > 0 ? cantidadPendienteRaw : total
              const entregado = total - pendiente

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
                  entregar_programado: 0,
                  unidad_derivada_venta_id: unidad.id,
                })
              }
            })
          }
        })
      }

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
