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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lat = latitud != null ? Number(latitud) : null
  const lng = longitud != null ? Number(longitud) : null
  const tieneCoordenadas =
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  const forzarResize = () => {
    const currentMap = map.current
    if (!currentMap) return

    requestAnimationFrame(() => {
      try {
        currentMap.resize()
      } catch {}
    })

    setTimeout(() => {
      try {
        currentMap.resize()
      } catch {}
    }, 250)
  }

  const addMarker = (lngValue: number, latValue: number) => {
    if (!map.current) return

    if (marker.current) {
      marker.current.setLngLat([lngValue, latValue])
    } else {
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lngValue, latValue])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; max-width: 200px;">
              <strong style="font-size: 14px;">${clienteNombre || 'Punto de Entrega'}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">${direccion}</span>
            </div>
          `)
        )
        .addTo(map.current)
    }

    map.current.jumpTo({ center: [lngValue, latValue], zoom: 17 })
    forzarResize()
  }

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      setError('Mapbox no configurado')
      setLoading(false)
      return
    }

    if (!tieneCoordenadas || lat === null || lng === null) {
      setLoading(false)
      return
    }

    if (!mapContainer.current || map.current) {
      return
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
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
      addMarker(lng, lat)
      setCoords({ lat, lng })
      setError(null)
    })

    return () => {
      marker.current?.remove()
      map.current?.remove()
      marker.current = null
      map.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tieneCoordenadas, lat, lng])

  useEffect(() => {
    if (!map.current || !tieneCoordenadas || lat === null || lng === null) return

    addMarker(lng, lat)
    setCoords((prev) => (prev?.lat === lat && prev?.lng === lng ? prev : { lat, lng }))
    setError(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, direccion, clienteNombre, tieneCoordenadas])

  const abrirGoogleMaps = () => {
    if (!coords) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
      '_blank'
    )
  }

  const abrirWaze = () => {
    if (!coords) return
    window.open(
      `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`,
      '_blank'
    )
  }

  const abrirMapas = () => {
    if (!coords) return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${coords.lat},${coords.lng}`, '_blank')
    } else {
      window.open(`geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}`, '_blank')
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

      <div className="relative rounded-lg overflow-hidden border border-gray-300">
        {loading && tieneCoordenadas && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Cargando mapa...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded-md px-3 py-2 z-10">
            <p className="text-yellow-800 text-xs">{error}</p>
          </div>
        )}

        {!tieneCoordenadas ? (
          <div className="w-full h-[400px] bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-500 px-4">
              <FaMapMarkerAlt size={40} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">Ubicación GPS no disponible</p>
              <p className="text-xs mt-1">
                Esta entrega no tiene coordenadas guardadas. Edita la dirección del cliente y marca el punto GPS.
              </p>
            </div>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-[400px]" />
        )}

        {coords && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-md px-3 py-2 shadow-md z-10">
            <p className="text-xs text-gray-600 font-mono">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        <p className="font-semibold mb-1">Instrucciones:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Usa los botones de navegación para abrir la ruta en tu app favorita</li>
          <li>El botón azul de ubicación muestra tu posición actual</li>
          <li>Haz clic en el marcador rojo para ver detalles del cliente</li>
        </ul>
      </div>
    </div>
  )
}
