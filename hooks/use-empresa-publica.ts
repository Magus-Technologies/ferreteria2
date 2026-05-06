import { useQuery } from '@tanstack/react-query'
import type { DireccionEmpresa } from '~/lib/api/empresa'

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
  /**
   * Direcciones adicionales registradas para la empresa. Útil para
   * selectores como "Punto de Partida" en guías de remisión donde el
   * usuario elige entre las primeras N direcciones (D1, D2, D3, D4).
   */
  direcciones: DireccionEmpresa[]
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL
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

const LOGO_CACHE_KEY = 'empresa_logo_url'

/**
 * Guarda la URL del logo en localStorage para evitar flash en recargas
 */
function cacheLogoUrl(url: string | null) {
  if (typeof window === 'undefined') return
  if (url) localStorage.setItem(LOGO_CACHE_KEY, url)
  else localStorage.removeItem(LOGO_CACHE_KEY)
}

/**
 * Obtiene la URL del logo cacheada en localStorage
 */
export function getCachedLogoUrl(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LOGO_CACHE_KEY)
}

/**
 * Limpia el cache del logo (llamar al cerrar sesión)
 */
export function clearLogoCache() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOGO_CACHE_KEY)
}

/**
 * Hook con logo URL ya parseada
 * Cachea el logo en localStorage para carga instantánea entre recargas
 */
export function useEmpresaPublicaConLogo() {
  const { data, ...rest } = useEmpresaPublica()

  const logoUrl = data ? getLogoUrl(data.logo) : null

  // Cachear cuando llega del servidor
  if (logoUrl) cacheLogoUrl(logoUrl)

  return {
    ...rest,
    data: data ? {
      ...data,
      logoUrl,
    } : undefined,
    cachedLogoUrl: getCachedLogoUrl(),
  }
}
