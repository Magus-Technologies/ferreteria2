import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entregaProductoApi, CreateEntregaProductoRequest } from '~/lib/api/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { message } from 'antd'

export default function useCreateEntrega({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateEntregaProductoRequest) => {
      console.log('📤 Enviando entrega a API:', data);
      return entregaProductoApi.create(data);
    },
    onSuccess: (response) => {
      console.log('✅ Entrega creada exitosamente:', response);
      message.success(response.data?.message || 'Entrega registrada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('❌ Error al crear entrega:', error);
      message.error(error.message || 'Error al registrar la entrega')
    },
  })

  return {
    crearEntrega: mutate,
    loading: isPending,
  }
}
