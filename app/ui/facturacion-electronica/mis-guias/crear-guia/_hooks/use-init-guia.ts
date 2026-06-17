import { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { setDireccionesClienteToForm } from '~/lib/utils/cliente-direcciones-form'
import { TipoDireccion } from '~/lib/api/cliente'
import { buildSlotsDireccionEmpresa } from '~/lib/utils/empresa-direcciones-form'
import { useStoreTransferenciaParaGuia } from '~/app/ui/facturacion-electronica/mis-guias/store/store-transferencia-para-guia'
import { motivoTrasladoApi } from '~/lib/api/motivo-traslado'
import { almacenesApi } from '~/lib/api/almacen'
import type { Almacen } from '~/app/_types/almacen'
import { transferenciaStockApi, type TransferenciaStock } from '~/lib/api/transferencia-stock'
import { entregasNuevasApi } from '~/lib/api/entregas'

export default function useInitGuia({
  guia,
  form,
}: {
  guia?: any
  form: FormInstance
}) {
  const searchParams = useSearchParams()
  const ventaId = searchParams.get('venta_id')
  // entrega_id: cuando se crea la guía desde una entrega puntual de mis-entregas,
  // las cantidades deben salir de ESA entrega, no del total de la venta.
  const entregaIdParam = searchParams.get('entrega_id')
  const transferenciaIdParam = searchParams.get('transferencia_id')
  const vehiculoPlacaParam = searchParams.get('vehiculo_placa')
  // user_chofer_id viene cuando se "convierte a guía" desde mis-entregas:
  // el `entrega.chofer_id` apunta al USER (despachador interno) y se
  // mapea aquí como chofer privado de la guía.
  const userChoferIdParam = searchParams.get('user_chofer_id')
  const userChoferNombreParam = searchParams.get('user_chofer_nombre')
  // from_transferencia indica que el usuario navega desde Mis Transferencias
  const fromTransferencia = searchParams.get('from_transferencia') === 'true'
  const { data: empresa } = useEmpresaPublica()

  const transferenciaStore = useStoreTransferenciaParaGuia((s) => s.transferencia)
  const clearTransferencia = useStoreTransferenciaParaGuia((s) => s.setTransferencia)
  // Guard: solo inicializar una vez aunque el store cambie tras limpiarlo
  const transferenciaInitializedRef = useRef(false)

  // hasTransferencia se basa en el URL param (persiste aunque limpiemos el store)
  const hasTransferencia = fromTransferencia && !guia && !ventaId

  // Si el store tiene datos de OTRA transferencia (ej. volver atrás con navegación),
  // limpiarlo para que el fetch por ID se active con los datos correctos.
  useEffect(() => {
    if (transferenciaStore && Number(transferenciaIdParam) !== transferenciaStore.id) {
      clearTransferencia(null)
    }
  }, [transferenciaIdParam, transferenciaStore, clearTransferencia])

  // Fetch de la transferencia por ID cuando el store está vacío (ej. al refrescar)
  const { data: transferenciaApiData, isLoading: isLoadingTransferenciaApi } = useQuery({
    queryKey: [QueryKeys.TRANSFERENCIAS_STOCK, transferenciaIdParam],
    queryFn: async () => {
      const res = await transferenciaStockApi.getById(Number(transferenciaIdParam))
      if (res.error) throw new Error(res.error.message)
      return res.data as TransferenciaStock
    },
    enabled: hasTransferencia && !!transferenciaIdParam && !transferenciaStore,
  })

  // Obtener datos de la venta si viene el parámetro
  const { data: ventaResponse, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS, ventaId],
    queryFn: async () => {
      if (!ventaId) return null
      const response = await ventaApi.getById(ventaId)
      return response.data
    },
    enabled: !!ventaId && !guia, // Solo si hay venta_id y no es edición
  })

  const venta = ventaResponse?.data as VentaCompleta | undefined

  // Entregas de la venta — solo cuando se crea la guía desde una entrega puntual.
  // Reusa el mismo query key que useEntregasDeVenta (cache compartido).
  const { data: entregasVentaList, isLoading: isLoadingEntregasVenta } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId],
    queryFn: () => entregasNuevasApi.porVenta(ventaId!),
    enabled: !!ventaId && !!entregaIdParam && !guia,
    // La respuesta es { data: { data: [...] } } — mismo select que useEntregasDeVenta.
    select: (res) => ((res.data as any)?.data ?? []) as any[],
  })

  // Motivos de traslado — solo cuando viene de transferencia
  const { data: motivosList, isLoading: isLoadingMotivos } = useQuery({
    queryKey: [QueryKeys.MOTIVOS_TRASLADO],
    queryFn: async () => {
      const res = await motivoTrasladoApi.getAll({ activo: true })
      return res.data?.data || []
    },
    enabled: hasTransferencia,
  })

  // Almacenes — solo cuando viene de transferencia (para obtener las direcciones)
  const { data: almacenesData, isLoading: isLoadingAlmacenes } = useQuery({
    queryKey: [QueryKeys.ALMACENES],
    queryFn: async () => {
      const res = await almacenesApi.getAll()
      if (res.error) throw new Error(res.error.message)
      return res.data?.data || []
    },
    enabled: hasTransferencia,
  })

  useEffect(() => {
    if (guia) {
      // Inicializar formulario con datos de guía existente (edición)
      form.setFieldsValue({
        ...guia,
        fecha_emision: dayjs(guia.fecha_emision),
        fecha_traslado: dayjs(guia.fecha_traslado),
      })
    } else if (venta && !isLoading && (!entregaIdParam || !isLoadingEntregasVenta)) {
      // Inicializar formulario con datos de la venta
      const cliente = venta.cliente

      // Si venimos de una entrega puntual, armar un mapa
      // unidad_derivada_venta_id → RESTANTE por guiar de ESA entrega
      // (cantidad de la entrega − lo ya guiado de esa entrega). Así, si se guió
      // 1 de 2, la próxima vez sale 1.
      let entregaDetalleMap: Map<number, number> | null = null
      let entregaSeleccionada: any = null
      if (entregaIdParam) {
        const entregasList = (entregasVentaList ?? []) as any[]
        entregaSeleccionada = entregasList.find((e) => String(e.id) === String(entregaIdParam))
        if (entregaSeleccionada) {
          entregaDetalleMap = new Map<number, number>()
          for (const d of entregaSeleccionada.detalles ?? []) {
            const cant = Number(d.cantidad) || 0
            const guiada = Number(d.cantidad_guiada) || 0
            entregaDetalleMap.set(Number(d.unidad_derivada_venta_id), Math.max(0, cant - guiada))
          }
        }
      }

      // Preparar productos desde la venta
      const productosTodos = venta.productos_por_almacen?.flatMap((almacen: any) =>
        almacen.unidades_derivadas?.map((unidad: any) => {
          const cantidadTotal = Number(unidad.cantidad) || 0
          const cantidadGuiada = Number(unidad.cantidad_guiada) || 0
          const restanteGuiar = Math.max(0, cantidadTotal - cantidadGuiada)
          // Desde una entrega: cantidad = la de la entrega, tope lo que falta guiar.
          // Sin entrega: el restante por guiar de toda la venta (comportamiento previo).
          const cantidad = entregaDetalleMap
            ? Math.min(entregaDetalleMap.get(Number(unidad.id)) ?? 0, restanteGuiar)
            : restanteGuiar
          // Buscar la unidad derivada actual del producto (configuración vigente)
          // para obtener el peso. La unidad de la venta es "inmutable" (snapshot
          // del nombre al momento de vender), pero el peso vive en la config
          // actual de productoalmacenunidadderivada.
          const unidadActual = almacen.producto_almacen?.unidades_derivadas?.find(
            (ua: any) =>
              ua.unidad_derivada?.name === unidad.unidad_derivada_inmutable?.name,
          )
          const pesoUnit = Number(unidadActual?.peso ?? 0)
          const peso_total = pesoUnit > 0 ? Number((pesoUnit * cantidad).toFixed(3)) : 0
          return {
            producto_id: almacen.producto_almacen?.producto_id || almacen.producto_id,
            producto_name: almacen.producto_almacen?.producto?.name || '',
            producto_codigo: almacen.producto_almacen?.producto?.cod_producto || '',
            marca_name: almacen.producto_almacen?.producto?.marca?.name || '',
            unidad_derivada_id: unidad.unidad_derivada_inmutable_id,
            unidad_derivada_name: unidad.unidad_derivada_inmutable?.name || '',
            unidad_derivada_factor: Number(unidad.factor) || 1,
            cantidad,
            costo: Number(unidad.precio) || 0,
            precio_venta: Number(unidad.precio) || 0,
            peso_total,
            unidad_derivada_venta_id: unidad.id, // ID de unidadderivadainmutableventa para rastrear cantidad_guiada
          }
        })
      ) || []

      // Desde una entrega puntual: solo las líneas de esa entrega con cantidad > 0.
      // Sin entrega: todas las líneas de la venta.
      const productos = entregaDetalleMap
        ? productosTodos.filter(
            (p: any) => entregaDetalleMap!.has(Number(p.unidad_derivada_venta_id)) && p.cantidad > 0,
          )
        : productosTodos

      // Dirección del cliente — el modelo Cliente ya no tiene `direccion` /
      // `direccion_2` / `direccion_3` / `direccion_4` planos: usa
      // `direcciones[]` con tipo D1/D2/D3/D4. La D1 (principal) se toma
      // como punto de llegada por defecto.
      const direccionD1 = cliente?.direcciones?.find((d: any) => d.tipo === TipoDireccion.D1)?.direccion || ''
      const puntoLlegada = entregaSeleccionada?.direccion_entrega || direccionD1
      const direccionSeleccionada = cliente?.direcciones?.find(
        (d: any) => d.direccion === entregaSeleccionada?.direccion_entrega,
      )?.tipo || 'D1'
      const choferId = entregaSeleccionada?.chofer_id || userChoferIdParam
      const choferNombre = entregaSeleccionada?.chofer_name || userChoferNombreParam || ''
      const vehiculoId = entregaSeleccionada?.vehiculo_id
      const vehiculoPlaca = entregaSeleccionada?.vehiculo_placa || vehiculoPlacaParam

      const empresaSlots = buildSlotsDireccionEmpresa(empresa?.direcciones)
      const primerSlot = empresaSlots.find((s) => s.direccion)

      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
        modalidad_transporte: 'PRIVADO',
        motivo_traslado: 1, // 01 - Venta
        // Datos del cliente - Guardar el ID pero el SelectClientes mostrará el documento
        cliente_id: cliente?.id,
        cliente_nombre: cliente?.razon_social || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim(),
        punto_partida: primerSlot?.direccion?.direccion || '',
        empresa_direccion_seleccionada: primerSlot?.tipo || 'D1',
        punto_llegada: puntoLlegada,
        direccion_seleccionada: direccionSeleccionada,
        // Referencia a la venta — mostrar número de comprobante electrónico si existe
        referencia: (() => {
          const comp = (venta as any).comprobante_electronico
          if (comp?.tipo_comprobante && comp?.serie && comp?.correlativo) {
            const tipo = comp.tipo_comprobante === 'FACTURA' ? 'Factura' : comp.tipo_comprobante === 'BOLETA' ? 'Boleta' : comp.tipo_comprobante
            return `${tipo} ${comp.serie}-${comp.correlativo}`
          }
          return `Venta ${venta.serie}-${venta.numero}`
        })(),
        // Pre-llenar placa si viene por URL (desde mis-entregas)
        ...(vehiculoId ? { vehiculo_id_interno: vehiculoId } : {}),
        ...(vehiculoPlaca ? { vehiculo_placa: vehiculoPlaca } : {}),
        // Pre-llenar user_chofer_id (despachador interno) si viene de mis-entregas.
        // En transporte PRIVADO los datos del chofer salen de la tabla `user`.
        ...(choferId ? {
          user_chofer_id: choferId,
          user_chofer_nombre: choferNombre,
        } : {}),
        // Productos
        productos,
      })
      // Setea los `_cliente_direccion_*` desde el array.
      setDireccionesClienteToForm(form, cliente)

      // Forzar actualización del SelectClientes después de un pequeño delay
      // para que muestre el documento en lugar del ID
      setTimeout(() => {
        if (cliente?.numero_documento) {
          // Trigger onChange del SelectClientes para que actualice su display
          form.setFieldValue('cliente_id', cliente.id)
        }
      }, 100)
    } else if (
      hasTransferencia &&
      !transferenciaInitializedRef.current &&
      !isLoadingMotivos &&
      !isLoadingAlmacenes &&
      motivosList &&
      almacenesData &&
      (transferenciaStore || (!isLoadingTransferenciaApi && transferenciaApiData))
    ) {
      // Inicializar formulario desde una transferencia de stock
      // Prioriza el store (navegación normal); usa la API como fallback (refresh)
      transferenciaInitializedRef.current = true

      const transferencia = transferenciaStore ?? transferenciaApiData!
      const motivo08 = motivosList.find((m: any) => m.codigo === '08')
      const almacenOrigen = almacenesData.find((a: Almacen) => a.id === transferencia.almacen_origen_id)
      const almacenDestino = almacenesData.find((a: Almacen) => a.id === transferencia.almacen_destino_id)
      const empresaSlots = buildSlotsDireccionEmpresa(empresa?.direcciones)
      const primerSlot = empresaSlots.find((s) => s.direccion)

      // Resuelve la dirección de un almacén: prioriza el slot de empresa asignado
      const resolveAlmacenAddress = (almacen: Almacen | undefined) => {
        if (!almacen) return ''
        if (almacen.empresa_dir_slot) {
          const slot = empresaSlots.find((s) => s.tipo === almacen.empresa_dir_slot)
          if (slot?.direccion?.direccion) return slot.direccion.direccion
        }
        return almacen.direccion || ''
      }

      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
        modalidad_transporte: 'PRIVADO',
        ...(motivo08 ? { motivo_traslado: motivo08.id } : {}),
        almacen_origen_id: transferencia.almacen_origen_id,
        almacen_destino_id: transferencia.almacen_destino_id,
        punto_partida: resolveAlmacenAddress(almacenOrigen) || primerSlot?.direccion?.direccion || '',
        empresa_direccion_seleccionada: almacenOrigen?.empresa_dir_slot || primerSlot?.tipo || 'D1',
        punto_llegada: resolveAlmacenAddress(almacenDestino),
        referencia: `TS${String(transferencia.serie).padStart(4, '0')}-${String(transferencia.numero).padStart(8, '0')}`,
        productos: transferencia.productos.map((p) => ({
          producto_id: p.producto_almacen_origen?.producto?.id || 0,
          producto_almacen_id: p.producto_almacen_origen_id || p.producto_almacen_origen?.id || 0,
          producto_name: p.producto_almacen_origen?.producto?.name || '',
          producto_codigo: p.producto_almacen_origen?.producto?.cod_producto || '',
          marca_name: '',
          unidad_derivada_id: p.unidad_derivada_inmutable_id || p.unidad_derivada_id || 0,
          unidad_derivada_name: p.unidad_derivada_inmutable?.name || '',
          unidad_derivada_factor: Number(p.factor) || 1,
          cantidad: Number(p.cantidad),
          costo: Number(p.costo) || 0,
          precio_venta: Number(p.costo) || 0,
          peso_total: 0,
        })),
      })

    } else if (!venta && !guia && !hasTransferencia) {
      // Valores por defecto para nueva guía sin venta ni transferencia
      const empresaSlots = buildSlotsDireccionEmpresa(empresa?.direcciones)
      const primerSlot = empresaSlots.find((s) => s.direccion)
      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
        punto_partida: primerSlot?.direccion?.direccion || '',
        empresa_direccion_seleccionada: primerSlot?.tipo || 'D1',
        productos: [],
      })
    }
  }, [
    guia,
    venta,
    isLoading,
    entregaIdParam,
    entregasVentaList,
    isLoadingEntregasVenta,
    form,
    empresa,
    vehiculoPlacaParam,
    userChoferIdParam,
    userChoferNombreParam,
    hasTransferencia,
    transferenciaStore,
    transferenciaApiData,
    isLoadingTransferenciaApi,
    isLoadingMotivos,
    isLoadingAlmacenes,
    motivosList,
    almacenesData,
  ])

  return { venta, isLoading }
}
