import { useQuery } from '@tanstack/react-query'

// ============= INTERFACES =============

export interface EmpresaPublica {
  id: number
  ruc: string
  razon_social: string
  nombre_comercial: string | null
  direccion: string
  departamento: string | null
  provincia: string | null
  distrito: string | null
  telefono: string
  celular: string | null
  email: string
  logo: string | null
}

// ============= HOOK =============

/**
 * Hook para obtener los datos públicos de la empresa
 * NO requiere autenticación - endpoint público
 */
export function useEmpresaPublica() {
  return useQuery({
    queryKey: ['empresa-publica'],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
      const response = await fetch(`${API_URL}/api/empresa/datos-publicos`)

      if (!response.ok) {
        throw new Error('Error al cargar datos de empresa')
      }

      const json = await response.json()
      return json.data as EmpresaPublica
    },
    staleTime: 1000 * 60 * 60, // 1 hora - los datos de empresa casi nunca cambian
    gcTime: 1000 * 60 * 60 * 24, // 24 horas (gcTime reemplaza a cacheTime en React Query v5)
    retry: 3,
    retryDelay: 1000,
  })
}

// ============= HELPERS =============

/**
 * Convierte el path relativo del logo a URL completa
 * @param logoPath Path relativo del logo (ej: "logos/abc123.png")
 * @returns URL completa o null si no hay logo
 *
 * @example
 * getLogoUrl("logos/1Q3Sa9mMe7WNgaA1mhADu5HoW4stzjQinbzQGALT.png")
 * // Returns: "http://localhost:8000/storage/logos/1Q3Sa9mMe7WNgaA1mhADu5HoW4stzjQinbzQGALT.png"
 */
export function getLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  return `${API_URL}/storage/${logoPath}`
}

/**
 * Hook con logo URL ya parseada
 * Útil para componentes que necesitan directamente la URL completa
 */
export function useEmpresaPublicaConLogo() {
  const { data, ...rest } = useEmpresaPublica()

  return {
    ...rest,
    data: data ? {
      ...data,
      logoUrl: getLogoUrl(data.logo),
    } : undefined,
  }
}
