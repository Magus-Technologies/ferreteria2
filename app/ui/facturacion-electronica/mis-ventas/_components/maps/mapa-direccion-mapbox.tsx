'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'

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
  geocodificarDesdeDireccion?: boolean
}

export default function MapaDireccionMapbox({
  direccion,
  clienteNombre,
  onCoordenadaChange,
  coordenadasIniciales,
  editable = true,
  geocodificarDesdeDireccion = true,
}: MapaDireccionMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const resizeTimeoutsRef = useRef<number[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(coordenadasIniciales || null)
  const [expanded, setExpanded] = useState(false)

  const forzarResize = useCallback(() => {
    const safeResize = () => {
      const mapInstance = map.current as any
      const container = mapContainer.current
      if (!mapInstance || !container || !container.isConnected) return
      if (!mapInstance._canvas || !mapInstance._container) return
      try {
        mapInstance.resize()
      } catch {
        // Ignorar resizes tardíos mientras el mapa se desmonta o se recrea
      }
    }

    safeResize()
    window.requestAnimationFrame(safeResize)
    resizeTimeoutsRef.current.push(window.setTimeout(safeResize, 120))
    resizeTimeoutsRef.current.push(window.setTimeout(safeResize, 320))
  }, [])

  // Cuando cambia el modo expandido, redimensionar el mapa para que se reajuste al contenedor
  useEffect(() => {
    if (!map.current) return
    const id = window.setTimeout(() => forzarResize(), 200)
    return () => window.clearTimeout(id)
  }, [expanded, forzarResize])

  // Si el contenedor cambia de tamaño al abrir/cerrar modales o colapsables,
  // forzar resize para evitar el lienzo blanco de Mapbox.
  useEffect(() => {
    if (!mapContainer.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (map.current) forzarResize()
    })
    observer.observe(mapContainer.current)
    return () => observer.disconnect()
  }, [forzarResize])

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const actualizarMarcador = useCallback(async (
    lngLat: { lng: number; lat: number },
    emitirCambio = true,
  ) => {
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

    setCoordenadas((prev) => {
      if (prev?.lat === lngLat.lat && prev?.lng === lngLat.lng) return prev
      return { lat: lngLat.lat, lng: lngLat.lng }
    })
    if (!emitirCambio) return
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

    const coordenadasDefault: [number, number] = [-79.063692, -8.033405] // Trujillo - El Milagro [lng, lat] (fallback)

    // Función para inicializar el mapa con un centro dado
    const inicializarMapa = (centro: [number, number]) => {
      if (!mapContainer.current) return

      if (!mapboxgl.supported()) {
        setError('El navegador no soporta WebGL. Activa la aceleracion por hardware para ver el mapa.')
        setCargando(false)
        return
      }

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: centro,
          zoom: 15,
        })
      } catch (err) {
        console.error('Error inicializando Mapbox:', err)
        setError('No se pudo cargar el mapa. Verifica WebGL o la aceleracion por hardware del navegador.')
        setCargando(false)
        return
      }

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false,
      })
      map.current.addControl(geolocateControl, 'top-right')

      if (editable) {
        map.current.on('click', (e) => {
          actualizarMarcador({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        })
      }

      map.current.on('load', () => {
        setCargando(false)
        forzarResize()

        if (coordenadasIniciales) {
          actualizarMarcador({ lng: coordenadasIniciales.lng, lat: coordenadasIniciales.lat }, false)
          return
        }

        if (direccion && geocodificarDesdeDireccion) {
          geocodificarDireccion(direccion)
        }
      })
    }

    // Si ya hay coordenadas iniciales o dirección, arrancar directo
    if (coordenadasIniciales) {
      inicializarMapa([coordenadasIniciales.lng, coordenadasIniciales.lat])
    } else if (direccion) {
      inicializarMapa(coordenadasDefault)
    } else {
      // Sin coordenadas ni dirección: intentar obtener GPS antes de crear el mapa
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          inicializarMapa([pos.coords.longitude, pos.coords.latitude])
        },
        () => {
          // GPS no disponible o denegado: usar fallback
          inicializarMapa(coordenadasDefault)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    return () => {
      resizeTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
      resizeTimeoutsRef.current = []
      marker.current?.remove()
      marker.current = null
      map.current?.remove()
      map.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const geocodificarDireccion = async (dir: string) => {
    try {
      const query = encodeURIComponent(`${dir}, Peru`)
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
    if (!map.current) return

    forzarResize()

    if (coordenadasIniciales) {
      setCoordenadas(coordenadasIniciales)
      actualizarMarcador({
        lng: coordenadasIniciales.lng,
        lat: coordenadasIniciales.lat,
      }, false)
      return
    }

    if (geocodificarDesdeDireccion && direccion && !coordenadas) {
      geocodificarDireccion(direccion)
    }
  }, [actualizarMarcador, coordenadas, coordenadasIniciales, direccion, forzarResize, geocodificarDesdeDireccion])

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
    <div
      className={
        expanded
          ? 'fixed inset-0 z-[10000] bg-black/40 p-2 sm:p-4 flex items-center justify-center'
          : 'w-full h-full'
      }
    >
    <div className={
      expanded
        ? 'w-full h-full relative rounded-lg overflow-hidden border border-gray-300 bg-white shadow-2xl'
        : 'w-full h-full relative rounded-lg overflow-hidden border border-gray-300'
    }>
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

      {/* Botón maximizar / minimizar */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        title={expanded ? 'Minimizar mapa' : 'Maximizar mapa'}
        aria-label={expanded ? 'Minimizar mapa' : 'Maximizar mapa'}
        className="absolute top-2 left-2 z-20 bg-white hover:bg-gray-100 text-gray-700 rounded-md w-8 h-8 flex items-center justify-center shadow-md border border-gray-300 transition-colors cursor-pointer"
      >
        {expanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      </button>
    </div>
    </div>
  )
}
