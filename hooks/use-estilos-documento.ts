import { useMemo } from 'react'
import { TipoDocumento } from '~/store/store-configuracion-impresion'
import { useConfiguracionImpresion } from './use-configuracion-impresion'

interface UseEstilosDocumentoProps {
  tipoDocumento: TipoDocumento
}

/**
 * Hook para obtener los estilos configurados de cada campo del documento
 * Retorna una función que dado un campo, devuelve el estilo CSS correspondiente
 */
export function useEstilosDocumento({ tipoDocumento }: UseEstilosDocumentoProps) {
  const { getConfiguracionCampo } = useConfiguracionImpresion({ tipoDocumento })

  const getEstiloCampo = useMemo(() => {
    return (campo: string) => {
      const config = getConfiguracionCampo(campo)
      return {
        fontFamily: config.font_family,
        fontSize: config.font_size,
        fontWeight: config.font_weight,
      }
    }
  }, [getConfiguracionCampo])

  return { getEstiloCampo }
}
