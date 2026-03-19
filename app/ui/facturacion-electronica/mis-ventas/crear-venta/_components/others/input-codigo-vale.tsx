'use client'

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { App, Form, FormInstance } from 'antd'
import { getValesAplicables, getValesPendientesCliente } from '~/lib/api/vales-compra'
import type { ValeCompra } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

/**
 * Componente invisible que:
 * 1. Detecta automáticamente vales aplicables por productos en carrito (notificaciones)
 * 2. Detecta automáticamente vales pendientes del cliente (DESCUENTO_PROXIMA_COMPRA)
 *    y setea codigo_vale en el form para que se canjee al crear la venta
 *
 * No renderiza UI visible — toda la lógica es automática.
 */
export default function InputCodigoVale({ form }: { form: FormInstance }) {
  const { notification } = App.useApp()

  // --- Detección automática de vales por productos ---
  const valesNotificados = useRef<Set<number>>(new Set())
  const productosVenta = useStoreProductoAgregadoVenta(store => store.productos)
  const setValesAplicables = useStoreProductoAgregadoVenta(store => store.setValesAplicables)

  const clienteId = Form.useWatch('cliente_id', form)

  const productoIds = useMemo(() => {
    return productosVenta
      .map(p => p.producto_id)
      .filter((id): id is number => !!id)
  }, [productosVenta])

  const cantidadTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => {
      const cantidad = Number(p.cantidad ?? 0)
      const factor = Number(p.unidad_derivada_factor ?? 1)
      return sum + (cantidad * factor)
    }, 0)
  }, [productosVenta])

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

  // Consultar vales aplicables automáticos (por productos en carrito)
  const consultarVales = useCallback(async () => {
    if (productoIds.length === 0 || cantidadTotal <= 0) return
    try {
      const res = await getValesAplicables({
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
        cliente_id: clienteId || undefined,
      })
      if (res.data?.data) {
        const valesUnicos = res.data.data.filter(
          (vale, idx, arr) => arr.findIndex(v => v.id === vale.id) === idx
        )
        // Guardar vales en el store para mostrarlos en la tabla
        setValesAplicables(valesUnicos)
        for (const vale of valesUnicos) {
          if (!valesNotificados.current.has(vale.id)) {
            valesNotificados.current.add(vale.id)
            notification.success({
              message: 'Promocion disponible',
              description: `${vale.nombre} (${getBeneficio(vale)}) — Se aplicara automaticamente al crear la venta`,
              duration: 6,
              placement: 'bottomRight',
            })
          }
        }
      }
    } catch {
      // Silencioso
    }
  }, [productoIds, cantidadTotal, clienteId, getBeneficio, notification, setValesAplicables])

  useEffect(() => {
    const timer = setTimeout(consultarVales, 500)
    return () => clearTimeout(timer)
  }, [consultarVales])

  useEffect(() => {
    if (productosVenta.length === 0) {
      valesNotificados.current.clear()
      setValesAplicables([])
    }
  }, [productosVenta.length, setValesAplicables])

  // --- Detección automática de vales pendientes del cliente (DESCUENTO_PROXIMA_COMPRA) ---
  const valePendienteNotificado = useRef<number | null>(null)

  useEffect(() => {
    if (!clienteId) {
      // Limpiar cuando no hay cliente
      form.setFieldValue('codigo_vale', undefined)
      valePendienteNotificado.current = null
      return
    }

    let cancelled = false

    const buscarValesPendientes = async () => {
      try {
        const res = await getValesPendientesCliente(clienteId)
        if (cancelled) return

        if (res.data?.data && res.data.data.length > 0) {
          // Tomar el primer vale pendiente (el más próximo a vencer)
          const valePendiente = res.data.data[0]

          if (valePendiente.codigo_vale_generado) {
            // Setear automáticamente en el form
            form.setFieldValue('codigo_vale', valePendiente.codigo_vale_generado)

            // Notificar solo una vez por vale
            if (valePendienteNotificado.current !== valePendiente.id) {
              valePendienteNotificado.current = valePendiente.id

              const descTipo = valePendiente.descuento_tipo || valePendiente.vale_compra?.descuento_tipo
              const descValor = valePendiente.descuento_aplicado || valePendiente.vale_compra?.descuento_valor
              let beneficio = ''
              if (descTipo === 'PORCENTAJE' && descValor) beneficio = `${descValor}% DSCTO`
              else if (descTipo === 'MONTO_FIJO' && descValor) beneficio = `S/ ${Number(descValor).toFixed(2)} DSCTO`

              const nombreVale = valePendiente.vale_compra?.nombre || 'Vale de descuento'

              notification.success({
                message: 'Vale de proxima compra detectado',
                description: `${nombreVale}${beneficio ? ` (${beneficio})` : ''} — Se aplicara automaticamente al crear la venta`,
                duration: 8,
                placement: 'bottomRight',
              })
            }
          }
        } else {
          // No hay vales pendientes para este cliente
          form.setFieldValue('codigo_vale', undefined)
          valePendienteNotificado.current = null
        }
      } catch {
        // Silencioso
      }
    }

    buscarValesPendientes()

    return () => { cancelled = true }
  }, [clienteId, form, notification])

  // No renderiza nada visible — solo el campo oculto del form
  return (
    <Form.Item name="codigo_vale" hidden>
      <input type="hidden" />
    </Form.Item>
  )
}
