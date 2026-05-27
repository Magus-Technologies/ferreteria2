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

  // Suma del MONTO TOTAL de la venta (precio_venta * cantidad por línea).
  // Se usa cuando el vale tiene umbral por PRECIO (S/).
  const precioTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => {
      const cantidad = Number(p.cantidad ?? 0)
      const precio = Number(p.precio_venta ?? 0)
      return sum + (cantidad * precio)
    }, 0)
  }, [productosVenta])

  // Suma de UNIDADES de la venta. Se usa cuando el vale tiene umbral por UNIDADES
  // (PRODUCTO_GRATIS, DOS_POR_UNO, o modalidad POR_PRODUCTOS / MIXTO).
  const cantidadTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => sum + Number(p.cantidad ?? 0), 0)
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
    if (productoIds.length === 0 || precioTotal <= 0) return
    try {
      const res = await getValesAplicables({
        precio_total: precioTotal,
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
  }, [productoIds, precioTotal, cantidadTotal, clienteId, getBeneficio, notification, setValesAplicables])

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
  // Solo auto-setea si NO hay un código ingresado manualmente vía el modal de canje.
  // Recordamos qué código fue puesto por auto-detect para poder limpiarlo al cambiar de
  // cliente sin pisar un código que el vendedor escribió a mano.
  const codigoAutoAplicado = useRef<string | null>(null)
  const valePendienteNotificado = useRef<number | null>(null)

  useEffect(() => {
    if (!clienteId) {
      // Si el código actual lo pusimos nosotros (auto), lo limpiamos.
      // Si fue manual, lo respetamos.
      const codigoActual = form.getFieldValue('codigo_vale') as string | undefined
      if (codigoActual && codigoActual === codigoAutoAplicado.current) {
        form.setFieldValue('codigo_vale', undefined)
      }
      codigoAutoAplicado.current = null
      valePendienteNotificado.current = null
      return
    }

    let cancelled = false

    const buscarValesPendientes = async () => {
      try {
        const res = await getValesPendientesCliente(clienteId)
        if (cancelled) return

        const codigoActual = form.getFieldValue('codigo_vale') as string | undefined
        // Si hay un código manual ya aplicado (no fue puesto por nosotros), no tocamos.
        const tieneCodigoManual = codigoActual && codigoActual !== codigoAutoAplicado.current
        if (tieneCodigoManual) return

        if (res.data?.data && res.data.data.length > 0) {
          // Tomar el primer vale pendiente (el más próximo a vencer)
          const valePendiente = res.data.data[0]

          if (valePendiente.codigo_vale_generado) {
            // Setear automáticamente en el form y registrar que fue auto.
            form.setFieldValue('codigo_vale', valePendiente.codigo_vale_generado)
            codigoAutoAplicado.current = valePendiente.codigo_vale_generado

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
          // No hay vales pendientes para este cliente. Si el código actual fue auto, limpiar.
          if (codigoActual && codigoActual === codigoAutoAplicado.current) {
            form.setFieldValue('codigo_vale', undefined)
          }
          codigoAutoAplicado.current = null
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
