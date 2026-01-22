'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix para los iconos de Leaflet en Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapaDireccionProps {
  direccion: string
  clienteNombre?: string
}

export default function MapaDireccion({
  direccion,
  clienteNombre,
}: MapaDireccionProps) {
  const [coordenadas, setCoordenadas] = useState<[number, number]>([-12.0464, -77.0428]) // Lima, Perú por defecto
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!direccion) {
      setCargando(false)
      return
    }

    // Geocodificar la dirección usando Nominatim (OpenStreetMap)
    const geocodificar = async () => {
      try {
        setCargando(true)
        setError(null)
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            direccion + ', Lima, Perú'
          )}&limit=1`
        )
        
        const data = await response.json()
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          setCoordenadas([parseFloat(lat), parseFloat(lon)])
        } else {
          setError('No se pudo encontrar la dirección en el mapa')
        }
      } catch (err) {
        setError('Error al buscar la dirección')
        console.error('Error geocodificando:', err)
      } finally {
        setCargando(false)
      }
    }

    geocodificar()
  }, [direccion])

  if (cargando) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-xs">Buscando ubicación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-gray-600 px-2">
          <p className="mb-1 text-xs">⚠️ {error}</p>
          <p className="text-xs">Mostrando ubicación aproximada de Lima</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={coordenadas}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordenadas}>
          <Popup>
            <div className="text-xs">
              <strong>{clienteNombre || 'Dirección de entrega'}</strong>
              <br />
              {direccion}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
