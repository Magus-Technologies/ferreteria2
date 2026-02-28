'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface Coordenadas {
  lat: number
  lng: number
}

interface MapaDireccionMapboxProps {
  direccion: string
  clienteNombre?: string
  onCoordenadaChange?: (coordenadas: Coordenadas, direccion?: string) => void
  coordenadasIniciales?: Coordenadas | null
  editable?: boolean
}

export default function MapaDireccionMapbox({
  direccion,
  clienteNombre,
  onCoordenadaChange,
  coordenadasIniciales,
  editable = true,
}: MapaDireccionMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(coordenadasIniciales || null)

  const actualizarMarcador = useCallback(async (lngLat: { lng: number; lat: number }) => {
    if (!map.current) return

    if (marker.current) {
      marker.current.setLngLat([lngLat.lng, lngLat.lat])
    } else {
      marker.current = new mapboxgl.Marker({
        color: '#ef4444',
        draggable: editable,
      })
        .setLngLat([lngLat.lng, lngLat.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="font-size: 14px;">${clienteNombre || 'Ubicación de entrega'}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">${direccion}</span>
              <br/>
              <span style="font-size: 11px; color: #999;">
                📍 ${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}
              </span>
            </div>
          `)
        )
        .addTo(map.current)

      if (editable) {
        marker.current.on('dragend', async () => {
          const newLngLat = marker.current?.getLngLat()
          if (newLngLat) {
            const nuevasCoordenadas = { lat: newLngLat.lat, lng: newLngLat.lng }
            setCoordenadas(nuevasCoordenadas)
            // Obtener dirección mediante geocodificación inversa
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(newLngLat.lng, newLngLat.lat)
            onCoordenadaChange?.(nuevasCoordenadas, direccionObtenida)
          }
        })
      }
    }

    setCoordenadas({ lat: lngLat.lat, lng: lngLat.lng })
    // Obtener dirección mediante geocodificación inversa
    const direccionObtenida = await obtenerDireccionDesdeCoordenadas(lngLat.lng, lngLat.lat)
    onCoordenadaChange?.({ lat: lngLat.lat, lng: lngLat.lng }, direccionObtenida)
  }, [clienteNombre, direccion, editable, onCoordenadaChange])

  const obtenerDireccionDesdeCoordenadas = async (lng: number, lat: number): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&language=es`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name
      }
    } catch (err) {
      console.error('Error en geocodificación inversa:', err)
    }
    return undefined
  }

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_ACCESS_TOKEN) {
      setError('Token de Mapbox no configurado')
      setCargando(false)
      return
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    const coordenadasDefault: [number, number] = [-77.0428, -12.0464] // Lima, Perú [lng, lat]

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordenadasIniciales 
        ? [coordenadasIniciales.lng, coordenadasIniciales.lat] 
        : coordenadasDefault,
      zoom: 15,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false,
      }),
      'top-right'
    )

    if (editable) {
      map.current.on('click', (e) => {
        actualizarMarcador({ lng: e.lngLat.lng, lat: e.lngLat.lat })
      })
    }

    map.current.on('load', () => {
      setCargando(false)
      
      if (coordenadasIniciales) {
        actualizarMarcador({ lng: coordenadasIniciales.lng, lat: coordenadasIniciales.lat })
        return
      }

      if (direccion) {
        geocodificarDireccion(direccion)
      }
    })

    return () => {
      marker.current?.remove()
      map.current?.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const geocodificarDireccion = async (dir: string) => {
    try {
      const query = encodeURIComponent(`${dir}, Lima, Peru`)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=PE`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        map.current?.flyTo({ center: [lng, lat], zoom: 16 })
        actualizarMarcador({ lng, lat })
      } else {
        setError('No se encontró la dirección. Haz clic en el mapa para marcar la ubicación.')
      }
    } catch (err) {
      console.error('Error geocodificando:', err)
      setError('Error al buscar dirección. Haz clic en el mapa para marcar.')
    }
  }

  useEffect(() => {
    if (map.current && direccion && !coordenadasIniciales) {
      geocodificarDireccion(direccion)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion])

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-red-600 px-4">
          <p className="text-sm font-medium">⚠️ Mapbox no configurado</p>
          <p className="text-xs mt-1">Configura NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN en .env</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-300">
      {cargando && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-xs">Cargando mapa...</p>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded-md px-3 py-2 z-10">
          <p className="text-yellow-800 text-xs">{error}</p>
        </div>
      )}
      
      {coordenadas && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-md px-3 py-2 shadow-md z-10">
          <p className="text-xs text-gray-600">
            📍 <span className="font-mono">{coordenadas.lat.toFixed(6)}, {coordenadas.lng.toFixed(6)}</span>
          </p>
        </div>
      )}
      
      {editable && (
        <div className="absolute top-2 right-12 bg-blue-600 text-white rounded-md px-3 py-1.5 shadow-md z-10">
          <p className="text-xs font-medium">🖱️ Clic para marcar ubicación</p>
        </div>
      )}
    </div>
  )
}
