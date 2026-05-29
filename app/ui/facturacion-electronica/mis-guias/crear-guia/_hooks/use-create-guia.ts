import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, FormInstance } from 'antd'
import { useRouter } from 'next/navigation'
import { guiaRemisionApi, type CreateGuiaRemisionRequest, type GuiaRemisionResponse } from '~/lib/api/guia-remision'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { fechaSubmit } from '~/utils/fechas'
import type { FormCreateGuia } from '../_components/others/body-crear-guia'

export default function useCreateGuia(form: FormInstance<FormCreateGuia>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (data: CreateGuiaRemisionRequest) => {
      
      const response = await guiaRemisionApi.create(data)

      if (response.error) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: (data) => {
      
      message.success('Guía de remisión creada exitosamente')

      // Invalidar caché de guías
      queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })
      // Invalidar la venta y las entregas: crear una guía incrementa
      // `cantidad_guiada` en la línea de venta. Sin esto, el staleTime global
      // (5 min) devuelve la venta cacheada con la cantidad vieja, y al volver a
      // crear guía aparece la cantidad total en vez de la pendiente por guiar.
      // También refresca el bloqueo del dropdown "Crear Guía" en mis-entregas.
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })

      // Redirigir a Mis Guías
      router.push('/ui/facturacion-electronica/mis-guias')
    },
    onError: (error: Error) => {
      console.error('❌ Error al crear guía:', error)
      message.error(error.message || 'Error al crear guía de remisión')
    },
  })

  const handleSubmit = async (values: FormCreateGuia) => {
    // Guard anti doble-submit: si ya hay una creación en curso, ignorar
    // clicks adicionales. Sin esto, clicks rápidos disparaban varias
    // mutaciones y se creaban guías duplicadas.
    if (mutation.isPending) return

    // Obtener user_id del localStorage o contexto
    const userId = localStorage.getItem('user_id') || 'cmj8o0pf70001uk0o4d3tbyyx'
    
    // Transformar los datos del formulario al formato de la API
    const data: CreateGuiaRemisionRequest = {
      venta_id: values.venta_id,
      fecha_emision: values.fecha_emision ? fechaSubmit(values.fecha_emision) : '',
      fecha_traslado: values.fecha_traslado?.format('YYYY-MM-DD') || '',
      serie: values.serie,
      numero: values.numero,
      tipo_guia: values.tipo_guia as any,
      modalidad_transporte: values.modalidad_transporte as any,
      motivo_traslado_id: Number(values.motivo_traslado) || 1,
      punto_partida: values.punto_partida || '',
      punto_llegada: values.punto_llegada || '',
      cliente_id: values.cliente_id,
      comprador_id: values.comprador_id || undefined,
      remitente_id: values.remitente_id || undefined,
      almacen_origen_id: values.almacen_origen_id || 1,
      almacen_destino_id: values.almacen_destino_id || undefined,
      chofer_id: values.chofer_id,
      user_chofer_id: values.user_chofer_id || undefined,
      vehiculo_placa: values.vehiculo_placa,
      referencia: values.referencia,
      afecta_stock: false,
      user_id: userId,
      detalles: values.productos?.map((p) => ({
        producto_id: p.producto_id,
        producto_almacen_id: p.producto_almacen_id || p.producto_id,
        unidad_derivada_inmutable_id: p.unidad_derivada_id,
        unidad_derivada_inmutable_name: p.unidad_derivada_name,
        factor: p.unidad_derivada_factor || 1,
        cantidad: p.cantidad,
        peso_total: p.peso_total,
        unidad_derivada_venta_id: p.unidad_derivada_venta_id ?? undefined,
      })) || [],
    }

    mutation.mutate(data)
  }

  return {
    handleSubmit,
    createGuia: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  }
}
