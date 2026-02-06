'use client'

import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

// Importar el mapa de Mapbox dinámicamente para evitar problemas con SSR
const MapaEntregaMapbox = dynamic(
  () => import('./mapa-entrega-mapbox'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-gray-500">Cargando mapa...</div>
      </div>
    )
  }
)

interface ModalMapaEntregaProps {
  open: boolean
  onClose: () => void
  entrega?: any
}

export default function ModalMapaEntrega({ open, onClose, entrega }: ModalMapaEntregaProps) {
  // Extraer información de la entrega
  const infoEntrega = useMemo(() => {
    if (!entrega) return null

    const venta = entrega.venta
    const cliente = venta?.cliente
    const direccion = entrega.direccion_entrega || cliente?.direccion || ''
    
    const clienteNombre = cliente?.razon_social || 
      `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() || 
      'SIN CLIENTE'
    
    const ventaNumero = venta?.serie && venta?.numero 
      ? `${venta.serie}-${venta.numero}` 
      : 'S/N'

    return {
      ventaNumero,
      clienteNombre,
      direccion,
      telefono: cliente?.telefono || '',
      observaciones: entrega.observaciones || '',
      estado: entrega.estado_entrega,
      latitud: entrega.latitud ? Number(entrega.latitud) : null,
      longitud: entrega.longitud ? Number(entrega.longitud) : null,
    }
  }, [entrega])

  return (
    <Modal
      title={
        <div className="text-lg font-semibold">
          🗺️ Mapa de Entrega - {infoEntrega?.ventaNumero}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnClose
    >
      {infoEntrega && (
        <div className="space-y-4">
          {/* Información de la entrega */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-700">Cliente:</span>
                <p className="text-gray-900">{infoEntrega.clienteNombre}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Teléfono:</span>
                <p className="text-gray-900">{infoEntrega.telefono || 'No registrado'}</p>
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Dirección:</span>
              <p className="text-gray-900">{infoEntrega.direccion || 'No especificada'}</p>
            </div>
            {infoEntrega.observaciones && (
              <div>
                <span className="font-semibold text-gray-700">Observaciones:</span>
                <p className="text-gray-900">{infoEntrega.observaciones}</p>
              </div>
            )}
          </div>

          {/* Mapa con navegación */}
          <MapaEntregaMapbox
            direccion={infoEntrega.direccion}
            latitud={infoEntrega.latitud}
            longitud={infoEntrega.longitud}
            clienteNombre={infoEntrega.clienteNombre}
          />
        </div>
      )}
    </Modal>
  )
}
