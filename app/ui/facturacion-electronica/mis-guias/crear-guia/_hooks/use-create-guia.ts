import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, FormInstance } from 'antd'
import { useRouter } from 'next/navigation'
import { guiaRemisionApi, type CreateGuiaRemisionRequest, type GuiaRemisionResponse } from '~/lib/api/guia-remision'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { FormCreateGuia } from '../_components/others/body-crear-guia'

export default function useCreateGuia(form: FormInstance<FormCreateGuia>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (data: CreateGuiaRemisionRequest) => {
      console.log('📦 Creando guía de remisión:', data)
      
      const response = await guiaRemisionApi.create(data)

      if (response.error) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: (data) => {
      console.log('✅ Guía creada exitosamente:', data)
      
      message.success('Guía de remisión creada exitosamente')
      
      // Invalidar caché de guías
      queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })
      
      // Redirigir a Mis Guías
      router.push('/ui/facturacion-electronica/mis-guias')
    },
    onError: (error: Error) => {
      console.error('❌ Error al crear guía:', error)
      message.error(error.message || 'Error al crear guía de remisión')
    },
  })

  const handleSubmit = async (values: FormCreateGuia) => {
    console.log('📝 Valores del formulario:', values)
    
    // Obtener user_id del localStorage o contexto
    const userId = localStorage.getItem('user_id') || 'cmj8o0pf70001uk0o4d3tbyyx'
    
    // Transformar los datos del formulario al formato de la API
    const data: CreateGuiaRemisionRequest = {
      venta_id: values.venta_id,
      fecha_emision: values.fecha_emision?.format('YYYY-MM-DD') || '',
      fecha_traslado: values.fecha_traslado?.format('YYYY-MM-DD') || '',
      serie: values.serie,
      numero: values.numero,
      tipo_guia: values.tipo_guia as any,
      modalidad_transporte: values.modalidad_transporte as any,
      motivo_traslado_id: Number(values.motivo_traslado) || 1,
      punto_partida: values.punto_partida || '',
      punto_llegada: values.punto_llegada || '',
      cliente_id: values.cliente_id,
      almacen_origen_id: 1, // TODO: Obtener del contexto o formulario
      almacen_destino_id: values.destino_id,
      chofer_id: values.chofer_id,
      vehiculo_placa: values.vehiculo_placa,
      referencia: values.referencia,
      afecta_stock: values.afecta_stock === 'true' || values.afecta_stock === true,
      user_id: userId,
      detalles: values.productos?.map((p) => ({
        producto_id: p.producto_id,
        producto_almacen_id: p.producto_almacen_id || p.producto_id,
        unidad_derivada_inmutable_id: p.unidad_derivada_id,
        unidad_derivada_inmutable_name: p.unidad_derivada_name,
        factor: p.unidad_derivada_factor || 1,
        cantidad: p.cantidad,
        peso_total: p.peso_total,
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
