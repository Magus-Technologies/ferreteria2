'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet-fix.css'
import { useEffect, useState } from 'react'

interface MapaEntregaProps {
  direccion: string
}

// Coordenadas por defecto (Arequipa, Perú)
const DEFAULT_COORDS = {
  lat: -16.409047,
  lng: -71.537451,
}

export default function MapaEntrega({ direccion }: MapaEntregaProps) {
  const [coords, setCoords] = useState(DEFAULT_COORDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Geocodificar la dirección usando Nominatim (OpenStreetMap)
  useEffect(() => {
    if (!direccion) {
      setLoading(false)
      return
    }

    const geocodificar = async () => {
      try {
        setLoading(true)
        setError(null)

        // Agregar "Arequipa, Perú" a la búsqueda para mejorar precisión
        const query = `${direccion}, Arequipa, Perú`
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Ferreteria App',
          },
        })

        if (!response.ok) {
          throw new Error('Error al geocodificar dirección')
        }

        const data = await response.json()

        if (data && data.length > 0) {
          setCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          })
        } else {
          setError('No se pudo encontrar la ubicación exacta. Mostrando ubicación aproximada.')
        }
      } catch (err) {
        console.error('Error al geocodificar:', err)
        setError('Error al cargar la ubicación. Mostrando ubicación por defecto.')
      } finally {
        setLoading(false)
      }
    }

    geocodificar()
  }, [direccion])

  // Crear icono personalizado para el marcador
  const customIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100">
        <div className="text-gray-600">Cargando ubicación...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg text-sm">
          ⚠️ {error}
        </div>
      )}
      
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={16}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold mb-2">📍 Punto de Entrega</p>
              <p className="text-sm mb-2">{direccion}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🗺️ Abrir en Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
