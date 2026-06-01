'use client'

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { App, Form, FormInstance } from 'antd'
import { getValesAplicables, getValesPendientesCliente } from '~/lib/api/vales-compra'
import type { ValeCompra } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import { subscribeModelChanged } from '~/lib/realtime-bus'

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
  const setValesAplicables = useStoreProductoAgregadoVenta(store => store.setValesAplicables)

  const clienteId = Form.useWatch('cliente_id', form)

  // Fuente de verdad = el campo `productos` del formulario (la tabla de venta).
  // Así la detección reacciona a agregar, quitar y EDITAR la cantidad en la celda,
  // a diferencia del store que solo se llenaba al agregar un producto nuevo.
  const formProductos = (Form.useWatch('productos', form) || []) as any[]

  // Excluir filas que no son productos vendibles: filas de vale y cabecera de paquete.
  const productosReales = useMemo(
    () => formProductos.filter(
      (p) => p?._tipo_fila !== 'vale_promocional' && p?._tipo_fila !== 'paquete_cabecera'
    ),
    [formProductos]
  )

  const productoIds = useMemo(() => {
    return productosReales
      .map(p => p?.producto_id)
      .filter((id): id is number => !!id)
  }, [productosReales])

  // Suma del MONTO TOTAL de la venta (precio_venta * cantidad por línea).
  // Se usa cuando el vale tiene umbral por PRECIO (S/).
  const precioTotal = useMemo(() => {
    return productosReales.reduce((sum, p) => {
      const cantidad = Number(p?.cantidad ?? 0)
      const precio = Number(p?.precio_venta ?? 0)
      return sum + (cantidad * precio)
    }, 0)
  }, [productosReales])

  // Suma de UNIDADES de la venta. Se usa cuando el vale tiene umbral por UNIDADES
  // (PRODUCTO_GRATIS, DOS_POR_UNO, o modalidad POR_PRODUCTOS / MIXTO).
  const cantidadTotal = useMemo(() => {
    return productosReales.reduce((sum, p) => sum + Number(p?.cantidad ?? 0), 0)
  }, [productosReales])

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
    // Requerir cliente seleccionado (DNI/RUC) para mostrar vales automáticos.
    if (!clienteId) return
    if (productoIds.length === 0 || precioTotal <= 0) return
    try {
      const res = await getValesAplicables({
        precio_total: precioTotal,
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
        cliente_id: clienteId || undefined,
      })
      // Guard anti-carrera: si el carrito se vació (o quedó sin productos reales)
      // MIENTRAS la consulta estaba en vuelo, no aplicar ni notificar. Evita que el
      // vale reaparezca "solo" tras borrar el producto.
      const productosActuales = (form.getFieldValue('productos') || []) as any[]
      const hayProductosReales = productosActuales.some(
        (p) => p?._tipo_fila !== 'vale_promocional' && p?._tipo_fila !== 'paquete_cabecera' && p?.producto_id
      )
      if (!hayProductosReales) return
      if (res.data?.data) {
        const valesExcluidos = useStoreProductoAgregadoVenta.getState().valesExcluidos
        const valesUnicos = res.data.data.filter(
          (vale, idx, arr) => arr.findIndex(v => v.id === vale.id) === idx
        )
          .filter(v => v.momento_aplicacion !== 'PROXIMA_COMPRA')
          .filter(v => !valesExcluidos.includes(v.id))
        // Preservar vales aplicados manualmente. Dos casos:
        // 1) Código regular tecleado (VC-...): coincide con codigo_vale del form.
        // 2) Código de próxima compra canjeado (VCC-...): el form guarda el código
        //    generado, pero el vale en el store tiene su código original (VC-...), así
        //    que no coinciden. Estos vales son siempre PROXIMA_COMPRA (la auto-detección
        //    nunca los devuelve), por lo que se preservan por su momento_aplicacion.
        const codigoManual = form.getFieldValue('codigo_vale') as string | undefined
        const valesActuales = useStoreProductoAgregadoVenta.getState().valesAplicables
        const valesManuales = valesActuales.filter(
          v => (codigoManual && v.codigo === codigoManual) || v.momento_aplicacion === 'PROXIMA_COMPRA'
        )
        // Fusionar: auto-detectados + manuales (sin duplicados)
        const idsAuto = new Set(valesUnicos.map(v => v.id))
        const fusionados = [
          ...valesUnicos,
          ...valesManuales.filter(v => !idsAuto.has(v.id)),
        ]
        setValesAplicables(fusionados)
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

  // Realtime: si otro usuario crea/edita/elimina o cambia el estado de un vale,
  // volver a consultar los vales aplicables para reflejar el cambio en vivo.
  // (Esta pantalla usa Zustand + POST manual, no React Query, así que la
  //  invalidación de queries de use-realtime no la cubre.)
  useEffect(() => {
    const unsubscribe = subscribeModelChanged((event) => {
      if (event.module !== 'vales-compra') return
      // Olvidar las notificaciones ya mostradas para que un vale nuevo o
      // reactivado vuelva a anunciarse tras el refresco.
      valesNotificados.current.clear()
      consultarVales()
    })
    return unsubscribe
  }, [consultarVales])

  // Limpiar vales auto-detectados si se quita el cliente
  useEffect(() => {
    if (!clienteId) {
      valesNotificados.current.clear()
      useStoreProductoAgregadoVenta.getState().limpiarValesExcluidos()
      const codigoManual = form.getFieldValue('codigo_vale') as string | undefined
      if (!codigoManual) setValesAplicables([])
    }
  }, [clienteId, form, setValesAplicables])

  useEffect(() => {
    if (productosReales.length === 0) {
      valesNotificados.current.clear()
      // Carrito vacío = empezar de cero: olvidar los vales que el vendedor excluyó,
      // para que al volver a agregar el producto el vale pueda reaparecer.
      useStoreProductoAgregadoVenta.getState().limpiarValesExcluidos()
      // Preservar vales manuales si hay código aplicado
      const codigoManual = form.getFieldValue('codigo_vale') as string | undefined
      if (!codigoManual) {
        setValesAplicables([])
      }
    }
  }, [productosReales.length, form, setValesAplicables])

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

            // Agregar el vale al store para que se vea en la tabla de venta y el
            // preview calcule el descuento (scopeado por su destino). El backend lo
            // canjea con el codigo_vale; esto es solo la vista previa.
            const vc = valePendiente.vale_compra
            if (vc) {
              const actuales = useStoreProductoAgregadoVenta.getState().valesAplicables
              if (!actuales.some(v => v.id === vc.id)) {
                const valeParaStore = {
                  id: vc.id,
                  codigo: vc.codigo,
                  nombre: vc.nombre,
                  descripcion: null,
                  tipo_promocion: vc.tipo_promocion,
                  momento_aplicacion: 'PROXIMA_COMPRA',
                  modalidad: 'CANTIDAD_MINIMA',
                  cantidad_minima: 0,
                  tipo_umbral: null,
                  max_vales_por_venta: null,
                  descuento_tipo: vc.descuento_tipo ?? null,
                  descuento_valor: vc.descuento_valor ?? null,
                  descuento_alcance: vc.descuento_alcance ?? null,
                  descuento_producto_ids: vc.descuento_producto_ids ?? null,
                  descuento_categoria_ids: vc.descuento_categoria_ids ?? null,
                  producto_gratis_id: null,
                  cantidad_producto_gratis: 0,
                  fecha_inicio: '',
                  fecha_fin: null,
                  fecha_validez_vale: null,
                  dias_validez_vale: null,
                  usa_limite_por_cliente: false,
                  limite_usos_cliente: null,
                  usa_limite_stock: false,
                  stock_disponible: null,
                  aplica_precio_publico: true,
                  aplica_precio_especial: true,
                  aplica_precio_minimo: true,
                  aplica_precio_ultimo: true,
                  estado: 'ACTIVO',
                  created_by: null,
                  updated_by: null,
                  created_at: '',
                  updated_at: '',
                  producto_gratis: null,
                  categorias: [],
                  productos: [],
                } as unknown as ValeCompra
                setValesAplicables([...actuales, valeParaStore])
              }
            }

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
