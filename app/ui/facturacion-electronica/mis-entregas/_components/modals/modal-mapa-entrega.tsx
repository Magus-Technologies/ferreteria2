'use client'

import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

// Importar el mapa dinámicamente para evitar problemas con SSR
const MapaEntrega = dynamic(
  () => import('./mapa-entrega'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px]">
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

          {/* Mapa */}
          <div className="border rounded-lg overflow-hidden">
            <MapaEntrega direccion={infoEntrega.direccion} />
          </div>

          {/* Instrucciones */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p className="font-semibold mb-1">💡 Instrucciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>El marcador muestra la ubicación aproximada basada en la dirección</li>
              <li>Puedes hacer zoom con la rueda del mouse o los botones +/-</li>
              <li>Arrastra el mapa para explorar el área</li>
              <li>Haz clic en "Ver en Google Maps" para abrir la navegación</li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}
