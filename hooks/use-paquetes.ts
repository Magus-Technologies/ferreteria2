/**
 * Hooks personalizados para gestionar Paquetes con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  paqueteApi, 
  type PaqueteFilters, 
  type CreatePaqueteRequest, 
  type UpdatePaqueteRequest 
} from '~/lib/api/paquete';
import { QueryKeys } from '~/app/_lib/queryKeys';
import { message } from 'antd';

// ============= QUERY HOOKS =============

/**
 * Hook para listar paquetes con filtros
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = usePaquetes({ search: 'kit', activo: true });
 * ```
 */
export function usePaquetes(filters?: PaqueteFilters) {
  return useQuery({
    queryKey: [QueryKeys.PAQUETES, 'list', filters],
    queryFn: async () => {
      const response = await paqueteApi.list(filters);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

/**
 * Hook para obtener un paquete por ID
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = usePaquete(1);
 * ```
 */
export function usePaquete(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: [QueryKeys.PAQUETES, 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await paqueteApi.getById(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data;
    },
    enabled: enabled && !!id,
  });
}

// ============= MUTATION HOOKS =============

/**
 * Hook para crear un paquete
 * 
 * @example
 * ```typescript
 * const { mutate, isPending } = useCreatePaquete();
 * 
 * mutate({
 *   nombre: 'Kit Construcción',
 *   productos: [...]
 * });
 * ```
 */
export function useCreatePaquete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaqueteRequest) => {
      const response = await paqueteApi.create(data);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar cache de lista de paquetes
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAQUETES, 'list'] });
      message.success(data?.message || 'Paquete creado exitosamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear paquete');
    },
  });
}

/**
 * Hook para actualizar un paquete
 * 
 * @example
 * ```typescript
 * const { mutate, isPending } = useUpdatePaquete();
 * 
 * mutate({
 *   id: 1,
 *   data: { nombre: 'Nuevo nombre' }
 * });
 * ```
 */
export function useUpdatePaquete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePaqueteRequest }) => {
      const response = await paqueteApi.update(id, data);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de lista y detalle
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAQUETES, 'list'] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAQUETES, 'detail', variables.id] });
      message.success(data?.message || 'Paquete actualizado exitosamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al actualizar paquete');
    },
  });
}

/**
 * Hook para eliminar un paquete
 * 
 * @example
 * ```typescript
 * const { mutate, isPending } = useDeletePaquete();
 * 
 * mutate(1); // ID del paquete
 * ```
 */
export function useDeletePaquete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await paqueteApi.delete(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar cache de lista
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAQUETES, 'list'] });
      message.success(data?.message || 'Paquete eliminado exitosamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al eliminar paquete');
    },
  });
}

