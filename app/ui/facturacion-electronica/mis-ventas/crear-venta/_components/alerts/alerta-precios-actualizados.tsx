'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, App, Button } from 'antd'
import { MdRefresh } from 'react-icons/md'
import type { FormInstance } from 'antd'
import { subscribeModelChanged } from '~/lib/realtime-bus'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import { useStoreAlmacen } from '~/store/store-almacen'
import { productosApiV2 } from '~/lib/api/producto'
import { DescuentoTipo } from '~/lib/api/venta'
import { calcularSubtotalVenta } from '../tables/columns-vender'
import type { Producto, ProductoAlmacenUnidadDerivada } from '~/app/_types/producto'
import type { FormCreateVenta } from '../others/body-vender'

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

/**
 * Banner que avisa al vendedor cuando otro usuario (o él mismo en otra
 * pestaña) editó precios de productos. No cambia nada automáticamente:
 * expone un botón "Actualizar precios" que el vendedor decide cuándo usar.
 *
 * Comportamiento:
 * - Sólo aparece si ya hay productos agregados a la venta.
 * - Se oculta al aplicar, al vaciar la tabla o al terminar la venta.
 * - Refresca precio_venta + comisión + subtotal respetando el tipo_precio
 *   que el vendedor eligió en cada fila.
 */
export default function AlertaPreciosActualizados({
  form,
}: {
  form: FormInstance<FormCreateVenta>
}) {
  const { notification } = App.useApp()
  const [visible, setVisible] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  // Ignorar eventos producidos antes del montaje
  const montadoEnRef = useRef<number>(Date.now())

  const almacen_id = useStoreAlmacen((s) => s.almacen_id)
  const productosStore = useStoreProductoAgregadoVenta((s) => s.productos)
  const setProductosStore = useStoreProductoAgregadoVenta((s) => s.setProductos)

  useEffect(() => {
    const unsubscribe = subscribeModelChanged((event) => {
      if (event.module !== 'productos') return
      if (event.action !== 'updated') return
      // Timestamp anterior al montaje: es eco de una acción previa
      const ts = Date.parse(event.timestamp)
      if (Number.isFinite(ts) && ts < montadoEnRef.current) return

      const hayProductos =
        (form.getFieldValue('productos') || []).length > 0
      if (!hayProductos) return

      setVisible(true)
    })
    return unsubscribe
  }, [form])

  const aplicarRefresh = async () => {
    const productosForm = (form.getFieldValue('productos') ||
      []) as FormCreateVenta['productos']
    if (!productosForm.length || !almacen_id) {
      setVisible(false)
      return
    }

    setAplicando(true)
    try {
      const idsUnicos = Array.from(
        new Set(
          productosForm
            .map((p) => p.producto_id)
            .filter((id): id is number => !!id),
        ),
      )

      const fetched = await Promise.all(
        idsUnicos.map(async (id) => {
          const res = await productosApiV2.getById(id)
          return { id, producto: res.data as Producto | undefined }
        }),
      )

      const byId = new Map<number, Producto>()
      for (const { id, producto } of fetched) {
        if (producto) byId.set(id, producto)
      }

      // Nueva lista para setFieldValue
      const nuevos = productosForm.map((row) => {
        if (!row?.producto_id) return row
        const prod = byId.get(row.producto_id)
        if (!prod) return row

        const productoAlmacen = prod.producto_en_almacenes?.find(
          (pa) => pa.almacen_id === almacen_id,
        )
        if (!productoAlmacen) return row

        const ud = productoAlmacen.unidades_derivadas?.find(
          (u) => u.unidad_derivada_id === row.unidad_derivada_id,
        )
        if (!ud) return row

        const tipo: TipoPrecio =
          (row.tipo_precio as TipoPrecio) || 'publico'
        const { precio, comision } = preciosDesdeUd(ud, tipo)

        const subtotal = calcularSubtotalVenta({
          precio_venta: precio,
          recargo: Number(row.recargo ?? 0),
          descuento_tipo:
            (row.descuento_tipo as DescuentoTipo) ?? DescuentoTipo.MONTO,
          descuento: Number(row.descuento ?? 0),
          cantidad: Number(row.cantidad ?? 0),
        })

        return {
          ...row,
          precio_venta: precio,
          comision,
          subtotal,
        }
      })

      form.setFieldValue('productos', nuevos)

      // Refrescar también los `unidades_derivadas_disponibles` del store,
      // para que SelectTipoPrecioVenta muestre activadores/precios frescos.
      setProductosStore((prev) =>
        prev.map((p) => {
          if (!p.producto_id) return p
          const prod = byId.get(p.producto_id)
          if (!prod) return p
          const productoAlmacen = prod.producto_en_almacenes?.find(
            (pa) => pa.almacen_id === almacen_id,
          )
          if (!productoAlmacen) return p
          return {
            ...p,
            unidades_derivadas_disponibles: productoAlmacen.unidades_derivadas,
          }
        }),
      )

      notification.success({
        message: 'Precios actualizados',
        description: 'Se aplicaron los precios vigentes a los productos de la venta.',
        placement: 'topRight',
      })
      setVisible(false)
    } catch (e: any) {
      notification.error({
        message: 'No se pudieron actualizar los precios',
        description: e?.message || 'Revisa la conexión e intenta de nuevo.',
        placement: 'topRight',
      })
    } finally {
      setAplicando(false)
    }
  }

  if (!visible) return null

  return (
    <Alert
      type='warning'
      showIcon
      className='mb-3'
      message='Los precios de uno o más productos cambiaron'
      description='Otro usuario actualizó precios. Los productos ya agregados siguen mostrando los precios anteriores.'
      action={
        <div className='flex gap-2'>
          <Button size='small' onClick={() => setVisible(false)}>
            Ignorar
          </Button>
          <Button
            size='small'
            type='primary'
            icon={<MdRefresh />}
            loading={aplicando}
            onClick={aplicarRefresh}
          >
            Actualizar precios
          </Button>
        </div>
      }
    />
  )
}

function preciosDesdeUd(
  ud: ProductoAlmacenUnidadDerivada,
  tipo: TipoPrecio,
): { precio: number; comision: number } {
  switch (tipo) {
    case 'especial':
      return {
        precio: Number(ud.precio_especial ?? 0),
        comision: Number(ud.comision_especial ?? 0),
      }
    case 'minimo':
      return {
        precio: Number(ud.precio_minimo ?? 0),
        comision: Number(ud.comision_minimo ?? 0),
      }
    case 'ultimo':
      return {
        precio: Number(ud.precio_ultimo ?? 0),
        comision: Number(ud.comision_ultimo ?? 0),
      }
    case 'publico':
    default:
      return {
        precio: Number(ud.precio_publico ?? 0),
        comision: Number(ud.comision_publico ?? 0),
      }
  }
}
