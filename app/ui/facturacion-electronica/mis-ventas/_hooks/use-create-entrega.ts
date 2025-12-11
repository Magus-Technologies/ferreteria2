import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntregaProducto } from '~/app/_actions/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { Prisma } from '@prisma/client'
import { message } from 'antd'

export default function useCreateEntrega({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Prisma.EntregaProductoCreateInput) =>
      createEntregaProducto(data),
    onSuccess: () => {
      message.success('Entrega registrada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al registrar la entrega')
    },
  })

  return {
    crearEntrega: mutate,
    loading: isPending,
  }
}
