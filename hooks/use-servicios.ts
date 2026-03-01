import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  servicioApi,
  type ServicioFilters,
  type CreateServicioRequest,
  type UpdateServicioRequest,
} from '~/lib/api/servicios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { message } from 'antd'

export function useServicios(filters?: ServicioFilters) {
  return useQuery({
    queryKey: [QueryKeys.SERVICIOS, 'list', filters],
    queryFn: async () => {
      const response = await servicioApi.list(filters)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data
    },
  })
}

export function useCreateServicio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateServicioRequest) => {
      const response = await servicioApi.create(data)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERVICIOS, 'list'] })
      message.success(data?.message || 'Servicio creado exitosamente')
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear servicio')
    },
  })
}

export function useUpdateServicio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateServicioRequest }) => {
      const response = await servicioApi.update(id, data)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERVICIOS, 'list'] })
      message.success('Servicio actualizado exitosamente')
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al actualizar servicio')
    },
  })
}

export function useDeleteServicio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await servicioApi.delete(id)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERVICIOS, 'list'] })
      message.success('Servicio eliminado exitosamente')
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al eliminar servicio')
    },
  })
}
