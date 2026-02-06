'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from 'antd'
import { FaGoogle, FaMapMarkerAlt, FaRoute } from 'react-icons/fa'
import { SiWaze } from 'react-icons/si'

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface MapaEntregaMapboxProps {
  direccion: string
  latitud?: number | null
  longitud?: number | null
  clienteNombre?: string
}

export default function MapaEntregaMapbox({
  direccion,
  latitud,
  longitud,
  clienteNombre,
}: MapaEntregaMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitud && longitud ? { lat: latitud, lng: longitud } : null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Coordenadas por defecto (Arequipa, Perú)
  const DEFAULT_COORDS = { lat: -16.409047, lng: -71.537451 }

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_ACCESS_TOKEN) {
      setError('Mapbox no configurado')
      setLoading(false)
      return
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    const initialCoords = coords || DEFAULT_COORDS

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCoords.lng, initialCoords.lat],
      zoom: 16,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    map.current.on('load', () => {
      setLoading(false)

      // Si ya tenemos coordenadas guardadas, usarlas directamente
      if (latitud && longitud) {
        addMarker(longitud, latitud)
        setCoords({ lat: latitud, lng: longitud })
      } else if (direccion) {
        // Si no, geocodificar la dirección
        geocodificarDireccion(direccion)
      }
    })

    return () => {
      marker.current?.remove()
      map.current?.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMarker = (lng: number, lat: number) => {
    if (!map.current) return

    if (marker.current) {
      marker.current.setLngLat([lng, lat])
    } else {
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; max-width: 200px;">
              <strong style="font-size: 14px;">📍 ${clienteNombre || 'Punto de Entrega'}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">${direccion}</span>
            </div>
          `)
        )
        .addTo(map.current)
    }

    map.current.flyTo({ center: [lng, lat], zoom: 17 })
  }

  const geocodificarDireccion = async (dir: string) => {
    try {
      const query = encodeURIComponent(`${dir}, Arequipa, Peru`)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=PE`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        addMarker(lng, lat)
        setCoords({ lat, lng })
      } else {
        setError('No se encontró la dirección exacta. Mostrando ubicación aproximada.')
      }
    } catch (err) {
      console.error('Error geocodificando:', err)
      setError('Error al buscar dirección')
    }
  }

  const abrirGoogleMaps = () => {
    if (coords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
        '_blank'
      )
    }
  }

  const abrirWaze = () => {
    if (coords) {
      window.open(
        `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`,
        '_blank'
      )
    }
  }

  const abrirMapas = () => {
    if (coords) {
      // Detectar si es iOS o Android
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        window.open(`maps://maps.apple.com/?daddr=${coords.lat},${coords.lng}`, '_blank')
      } else {
        window.open(`geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}`, '_blank')
      }
    }
  }

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
        <div className="text-center text-red-600">
          <FaMapMarkerAlt size={40} className="mx-auto mb-2 opacity-50" />
          <p>Mapbox no configurado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Botones de navegación */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="primary"
          icon={<FaGoogle />}
          onClick={abrirGoogleMaps}
          disabled={!coords}
          className="flex items-center gap-2"
        >
          Navegar con Google Maps
        </Button>
        <Button
          icon={<SiWaze />}
          onClick={abrirWaze}
          disabled={!coords}
          className="flex items-center gap-2 bg-[#33ccff] text-white hover:bg-[#29a3cc]"
        >
          Navegar con Waze
        </Button>
        <Button
          icon={<FaRoute />}
          onClick={abrirMapas}
          disabled={!coords}
          className="flex items-center gap-2"
        >
          Abrir en Mapas
        </Button>
      </div>

      {/* Mapa */}
      <div className="relative rounded-lg overflow-hidden border border-gray-300">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Cargando mapa...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded-md px-3 py-2 z-10">
            <p className="text-yellow-800 text-xs">⚠️ {error}</p>
          </div>
        )}

        <div ref={mapContainer} className="w-full h-[400px]" />

        {coords && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-md px-3 py-2 shadow-md z-10">
            <p className="text-xs text-gray-600 font-mono">
              📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        <p className="font-semibold mb-1">💡 Instrucciones:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Usa los botones de navegación para abrir la ruta en tu app favorita</li>
          <li>El botón azul de ubicación muestra tu posición actual</li>
          <li>Haz clic en el marcador rojo para ver detalles del cliente</li>
        </ul>
      </div>
    </div>
  )
}
