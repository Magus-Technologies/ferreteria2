import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ConfiguracionCampo,
  TipoDocumento,
  useStoreConfiguracionImpresion,
} from '~/store/store-configuracion-impresion'
import { apiRequest } from '~/lib/api'

interface UseConfiguracionImpresionProps {
  tipoDocumento: TipoDocumento
  enabled?: boolean
}

interface ConfiguracionImpresionResponse {
  tipo_documento: string
  campos_disponibles: Record<string, string>
  configuraciones: Record<string, ConfiguracionCampo & { campo: string }>
}

export function useConfiguracionImpresion({
  tipoDocumento,
  enabled = true,
}: UseConfiguracionImpresionProps) {
  const {
    setConfiguracionCampo,
    getConfiguracionCampo,
    setConfiguracionesCompletas,
    resetConfiguracionCampo: resetCampoStore,
    resetConfiguracionesCompletas: resetAllStore,
  } = useStoreConfiguracionImpresion()

  // Obtener todas las configuraciones desde el servidor usando useQuery directamente
  const queryResult = useQuery({
    queryKey: ['configuracion-impresion', tipoDocumento],
    queryFn: async () => {
      const response = await apiRequest<ConfiguracionImpresionResponse>(
        `/configuracion-impresion/${tipoDocumento}`
      )
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response.data!
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const { data, isLoading, refetch, error, isFetching } = queryResult

  // Procesar y actualizar store cuando llega data del servidor
  // Usar useEffect con data como dependencia
  useEffect(() => {
    if (!data) {
      return
    }

    const configs: Record<string, ConfiguracionCampo> = {}
    
    if (data.configuraciones && typeof data.configuraciones === 'object') {
      const entries = Object.entries(data.configuraciones)
      
      entries.forEach(([key, config]) => {
        configs[config.campo] = {
          font_family: config.font_family,
          font_size: config.font_size,
          font_weight: config.font_weight,
        }
      })
    }
    
    // IMPORTANTE: Siempre actualizar el store, incluso si configs está vacío
    // Esto limpia el localStorage cuando se resetean todas las configuraciones
    setConfiguracionesCompletas(tipoDocumento, configs)
  }, [data, tipoDocumento, setConfiguracionesCompletas])

  // Mutation para actualizar configuración de un campo usando useMutation
  const updateCampoMutation = useMutation({
    mutationFn: async (variables: { campo: string } & ConfiguracionCampo) => {
      const response = await apiRequest<ConfiguracionCampo>(
        `/configuracion-impresion/${tipoDocumento}/${variables.campo}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            font_family: variables.font_family,
            font_size: variables.font_size,
            font_weight: variables.font_weight,
          }),
        }
      )
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return { data: response.data!, campo: variables.campo }
    },
    onSuccess: ({ data: responseData, campo }) => {
      setConfiguracionCampo(tipoDocumento, campo, {
        font_family: responseData.font_family,
        font_size: responseData.font_size,
        font_weight: responseData.font_weight,
      })
      refetch()
    },
  })

  // Mutation para resetear un campo específico
  const resetCampoMutation = useMutation({
    mutationFn: async (campo: string) => {
      const response = await apiRequest<void>(
        `/configuracion-impresion/${tipoDocumento}/${campo}/reset`,
        {
          method: 'POST',
        }
      )
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return campo
    },
    onSuccess: (campo) => {
      resetCampoStore(tipoDocumento, campo)
      refetch()
    },
  })

  // Mutation para resetear todas las configuraciones
  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<void>(
        `/configuracion-impresion/${tipoDocumento}/reset-all`,
        {
          method: 'POST',
        }
      )
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response.data
    },
    onSuccess: () => {
      resetAllStore(tipoDocumento)
      refetch()
    },
  })

  return {
    camposDisponibles: data?.campos_disponibles || {},
    getConfiguracionCampo: (campo: string) => getConfiguracionCampo(tipoDocumento, campo),
    isLoading,
    updateConfiguracionCampo: (campo: string, config: ConfiguracionCampo) =>
      updateCampoMutation.mutate({ campo, ...config }),
    resetConfiguracionCampo: (campo: string) => resetCampoMutation.mutate(campo),
    resetConfiguracionesCompletas: () => resetAllMutation.mutate(),
    isUpdating: updateCampoMutation.isPending,
    isResetting: resetAllMutation.isPending || resetCampoMutation.isPending,
  }
}
