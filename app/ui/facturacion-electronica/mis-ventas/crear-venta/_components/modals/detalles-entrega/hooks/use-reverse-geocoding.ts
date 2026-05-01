import { useCallback } from 'react'

/**
 * Reverse geocoding contra Mapbox — convierte coordenadas (lat,lng) en una
 * dirección humana (place_name).
 *
 * Devuelve un callback estable: pasa la dirección obtenida al `onAddress`
 * que le des. No depende de Domicilio o Resto — el caller decide a qué
 * setter del context llevar el resultado.
 *
 * Falla silenciosamente si el token no está configurado.
 */
export function useReverseGeocoding(onAddress: (place: string) => void) {
  return useCallback(
    async (lat: number, lng: number) => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=es`,
        )
        const data = await res.json()
        const place = data.features?.[0]?.place_name
        if (place) onAddress(place)
      } catch (err) {
        console.error('Error en geocodificación inversa:', err)
      }
    },
    [onAddress],
  )
}
