import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { usuariosApi } from '~/lib/api/usuarios'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
  email: string
  celular: string | null
}

interface UseSearchDespachadoresProps {
  value: string
}

export default function useSearchDespachadores({
  value,
}: UseSearchDespachadoresProps) {
  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.USUARIOS, value, 'DESPACHADOR'],
    queryFn: async () => {
      const result = await usuariosApi.getAll({
        search: value || '',
        rol_sistema: 'DESPACHADOR',
        estado: true,
      })
      
      // La API devuelve { data: { data: [...] } }
      // Necesitamos acceder a result.data.data
      let finalData: Usuario[] = []
      
      if (result.data && typeof result.data === 'object') {
        // Si result.data tiene una propiedad data, usarla
        if ('data' in result.data && Array.isArray(result.data.data)) {
          finalData = result.data.data as Usuario[]
        }
        // Si result.data es directamente un array
        else if (Array.isArray(result.data)) {
          finalData = result.data as Usuario[]
        }
      }
      
      return finalData
    },
    // Siempre habilitado para mostrar todos los despachadores al abrir el modal
    enabled: true,
  })

  return {
    response: response as Usuario[] | undefined,
    loading,
  }
}
