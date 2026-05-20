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

export default function useInitGuia({
  guia,
  form,
}: {
  guia?: any
  form: FormInstance
}) {
  const searchParams = useSearchParams()
  const ventaId = searchParams.get('venta_id')
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
    } else if (venta && !isLoading) {
      // Inicializar formulario con datos de la venta
      const cliente = venta.cliente

      // Preparar productos desde la venta
      const productos = venta.productos_por_almacen?.flatMap((almacen: any) =>
        almacen.unidades_derivadas?.map((unidad: any) => {
          const cantidadTotal = Number(unidad.cantidad) || 0
          const cantidadGuiada = Number(unidad.cantidad_guiada) || 0
          const cantidad = Math.max(0, cantidadTotal - cantidadGuiada)
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


      // Dirección del cliente — el modelo Cliente ya no tiene `direccion` /
      // `direccion_2` / `direccion_3` / `direccion_4` planos: usa
      // `direcciones[]` con tipo D1/D2/D3/D4. La D1 (principal) se toma
      // como punto de llegada por defecto.
      const direccionD1 = cliente?.direcciones?.find((d: any) => d.tipo === TipoDireccion.D1)?.direccion || ''

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
        punto_llegada: direccionD1,
        direccion_seleccionada: 'D1',
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
        ...(vehiculoPlacaParam ? { vehiculo_placa: vehiculoPlacaParam } : {}),
        // Pre-llenar user_chofer_id (despachador interno) si viene de mis-entregas.
        // En transporte PRIVADO los datos del chofer salen de la tabla `user`.
        ...(userChoferIdParam ? {
          user_chofer_id: userChoferIdParam,
          user_chofer_nombre: userChoferNombreParam || '',
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
      transferenciaStore &&
      !isLoadingMotivos &&
      !isLoadingAlmacenes &&
      motivosList &&
      almacenesData
    ) {
      // Inicializar formulario desde una transferencia de stock
      transferenciaInitializedRef.current = true

      const motivo08 = motivosList.find((m: any) => m.codigo === '08')
      const almacenOrigen = almacenesData.find((a: Almacen) => a.id === transferenciaStore.almacen_origen_id)
      const almacenDestino = almacenesData.find((a: Almacen) => a.id === transferenciaStore.almacen_destino_id)
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
        ...(motivo08 ? { motivo_traslado: motivo08.id } : {}),
        almacen_origen_id: transferenciaStore.almacen_origen_id,
        almacen_destino_id: transferenciaStore.almacen_destino_id,
        punto_partida: almacenOrigen?.direccion || primerSlot?.direccion?.direccion || '',
        empresa_direccion_seleccionada: primerSlot?.tipo || 'D1',
        punto_llegada: almacenDestino?.direccion || '',
        referencia: `TS${String(transferenciaStore.serie).padStart(4, '0')}-${String(transferenciaStore.numero).padStart(8, '0')}`,
        productos: transferenciaStore.productos.map((p) => ({
          producto_id: p.producto_almacen_origen?.producto?.id || 0,
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

      // Liberar el store — los datos ya están en el form
      clearTransferencia(null)
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
    form,
    empresa,
    vehiculoPlacaParam,
    userChoferIdParam,
    userChoferNombreParam,
    hasTransferencia,
    transferenciaStore,
    isLoadingMotivos,
    isLoadingAlmacenes,
    motivosList,
    almacenesData,
    clearTransferencia,
  ])

  return { venta, isLoading }
}
