import { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'

export default function useInitGuia({
  guia,
  form,
}: {
  guia?: any
  form: FormInstance
}) {
  const searchParams = useSearchParams()
  const ventaId = searchParams.get('venta_id')
  const { data: empresa } = useEmpresaPublica()

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
        almacen.unidades_derivadas?.map((unidad: any) => ({
          producto_id: almacen.producto_almacen?.producto_id || almacen.producto_id,
          producto_name: almacen.producto_almacen?.producto?.name || '',
          producto_codigo: almacen.producto_almacen?.producto?.cod_producto || '',
          marca_name: almacen.producto_almacen?.producto?.marca?.name || '',
          unidad_derivada_id: unidad.unidad_derivada_inmutable_id,
          unidad_derivada_name: unidad.unidad_derivada_inmutable?.name || '',
          unidad_derivada_factor: Number(unidad.factor) || 1,
          cantidad: Number(unidad.cantidad),
          costo: Number(unidad.precio) || 0,
          precio_venta: Number(unidad.precio) || 0,
        }))
      ) || []

      console.log('🔍 Productos mapeados:', productos)
      console.log('👤 Cliente:', cliente)

      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
        modalidad_transporte: 'PRIVADO',
        // Datos del cliente - Guardar el ID pero el SelectClientes mostrará el documento
        cliente_id: cliente?.id,
        cliente_nombre: cliente?.razon_social || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim(),
        punto_partida: empresa?.direccion || '',
        punto_llegada: cliente?.direccion || '',
        // Guardar direcciones del cliente
        _cliente_direccion_1: cliente?.direccion || '',
        _cliente_direccion_2: cliente?.direccion_2 || '',
        _cliente_direccion_3: cliente?.direccion_3 || '',
        _cliente_direccion_4: cliente?.direccion_4 || '',
        direccion_seleccionada: 'D1',
        // Referencia a la venta
        referencia: `Venta ${venta.serie}-${venta.numero}`,
        // Productos
        productos,
      })

      // Forzar actualización del SelectClientes después de un pequeño delay
      // para que muestre el documento en lugar del ID
      setTimeout(() => {
        if (cliente?.numero_documento) {
          // Trigger onChange del SelectClientes para que actualice su display
          form.setFieldValue('cliente_id', cliente.id)
        }
      }, 100)
    } else if (!venta && !guia) {
      // Valores por defecto para nueva guía sin venta
      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
        punto_partida: empresa?.direccion || '',
        productos: [],
      })
    }
  }, [guia, venta, isLoading, form, empresa])

  return { venta, isLoading }
}
