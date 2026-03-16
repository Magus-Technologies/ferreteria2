'use client'

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { App } from 'antd'
import { getValesAplicables } from '~/lib/api/vales-compra'
import type { ValeCompra } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

/**
 * Componente invisible que detecta automáticamente vales aplicables
 * según los productos en el carrito y muestra notificaciones flotantes.
 */
export default function InputCodigoVale() {
  const { notification } = App.useApp()

  // Ref para rastrear los IDs de vales ya notificados (evitar notificaciones repetidas)
  const valesNotificados = useRef<Set<number>>(new Set())

  // Leer productos del store
  const productosVenta = useStoreProductoAgregadoVenta(store => store.productos)

  // Extraer IDs de productos del carrito
  const productoIds = useMemo(() => {
    return productosVenta
      .map(p => p.producto_id)
      .filter((id): id is number => !!id)
  }, [productosVenta])

  // Calcular cantidad total
  const cantidadTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => {
      const cantidad = Number(p.cantidad ?? 0)
      const factor = Number(p.unidad_derivada_factor ?? 1)
      return sum + (cantidad * factor)
    }, 0)
  }, [productosVenta])

  // Descripción del beneficio del vale
  const getBeneficio = useCallback((vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor) {
      return `${vale.descuento_valor}% DSCTO`
    }
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor) {
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    }
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }, [])

  // Consultar vales aplicables cuando cambian los productos
  const consultarVales = useCallback(async () => {
    if (productoIds.length === 0 || cantidadTotal <= 0) return

    try {
      const res = await getValesAplicables({
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
      })
      if (res.data?.data) {
        const valesUnicos = res.data.data.filter(
          (vale, idx, arr) => arr.findIndex(v => v.id === vale.id) === idx
        )

        for (const vale of valesUnicos) {
          if (!valesNotificados.current.has(vale.id)) {
            valesNotificados.current.add(vale.id)
            notification.success({
              message: 'Promoción disponible',
              description: `${vale.nombre} (${getBeneficio(vale)}) — Se aplicará automáticamente al crear la venta`,
              duration: 6,
              placement: 'bottomRight',
            })
          }
        }
      }
    } catch {
      // Silencioso
    }
  }, [productoIds, cantidadTotal, getBeneficio, notification])

  // Debounce: consultar vales 500ms después del último cambio
  useEffect(() => {
    const timer = setTimeout(consultarVales, 500)
    return () => clearTimeout(timer)
  }, [consultarVales])

  // Limpiar notificados cuando se vacía el carrito
  useEffect(() => {
    if (productosVenta.length === 0) {
      valesNotificados.current.clear()
    }
  }, [productosVenta.length])

  return null
}
