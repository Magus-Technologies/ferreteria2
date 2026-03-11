'use client'

import { useMemo } from 'react'
import { Modal, Button } from 'antd'
import dynamic from 'next/dynamic'
import { FaWhatsapp, FaCheck, FaMapMarkedAlt } from 'react-icons/fa'

const MapaEntregaMapbox = dynamic(
  () => import('./mapa-entrega-mapbox'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-gray-500">Cargando mapa...</div>
      </div>
    ),
  }
)

interface ModalPostDespachoProps {
  open: boolean
  onClose: () => void
  entrega?: any
}

export default function ModalPostDespacho({ open, onClose, entrega }: ModalPostDespachoProps) {
  const info = useMemo(() => {
    if (!entrega) return null
    const venta = entrega.venta
    const cliente = venta?.cliente

    const clienteNombre = cliente?.razon_social ||
      `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() || 'Cliente'

    const telefono = cliente?.telefono || ''
    const direccion = entrega.direccion_entrega || ''

    const ventaNumero = venta?.serie && venta?.numero
      ? `${venta.serie}-${venta.numero}`
      : 'S/N'

    // Limpiar teléfono para WhatsApp (solo dígitos, agregar código país si falta)
    let telefonoWhatsapp = telefono.replace(/[^0-9]/g, '')
    if (telefonoWhatsapp.length === 9 && telefonoWhatsapp.startsWith('9')) {
      telefonoWhatsapp = `51${telefonoWhatsapp}` // Perú
    }

    const mensajeWhatsapp = encodeURIComponent(
      `Hola ${clienteNombre.split(' ')[0]}, le informamos que su pedido de la venta *${ventaNumero}* ya fue despachado y se encuentra *en camino* a la dirección: ${direccion}. Cualquier consulta no dude en comunicarse con nosotros.`
    )

    const estadoLabel = entrega.estado_entrega === 'pe' ? 'Pendiente'
      : entrega.estado_entrega === 'ec' ? 'En Camino'
      : entrega.estado_entrega === 'en' ? 'Entregado'
      : entrega.estado_entrega === 'ca' ? 'Cancelado'
      : ''

    const fueRecienDespachado = entrega.estado_entrega === 'ec'

    return {
      ventaNumero,
      clienteNombre,
      telefono,
      telefonoWhatsapp,
      mensajeWhatsapp,
      direccion,
      estadoLabel,
      fueRecienDespachado,
      latitud: entrega.latitud ? Number(entrega.latitud) : null,
      longitud: entrega.longitud ? Number(entrega.longitud) : null,
    }
  }, [entrega])

  if (!info) return null

  const abrirWhatsapp = () => {
    if (info.telefonoWhatsapp) {
      window.open(`https://wa.me/${info.telefonoWhatsapp}?text=${info.mensajeWhatsapp}`, '_blank')
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${info.fueRecienDespachado ? 'bg-green-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
            {info.fueRecienDespachado
              ? <FaCheck className="text-green-600 text-lg" />
              : <FaMapMarkedAlt className="text-blue-600 text-lg" />
            }
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">
              {info.fueRecienDespachado ? 'Entrega Despachada' : 'Mapa de Entrega'}
            </div>
            <span className={`${info.fueRecienDespachado ? 'text-green-600' : 'text-blue-600'} text-xs font-mono`}>
              Venta {info.ventaNumero} - {info.estadoLabel}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={950}
      centered
      destroyOnClose
      footer={
        <div className="flex items-center justify-between">
          <Button
            onClick={onClose}
            className="!rounded-lg !h-10 !px-5 !font-semibold"
          >
            Cerrar
          </Button>
          <div className="flex gap-2">
            {info.telefonoWhatsapp && (
              <Button
                type="primary"
                icon={<FaWhatsapp size={18} />}
                onClick={abrirWhatsapp}
                className="!rounded-lg !h-10 !px-6 !font-bold !bg-green-600 hover:!bg-green-700 !border-none !shadow-lg !shadow-green-600/30"
              >
                Notificar por WhatsApp
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner de info */}
        <div className={`${info.fueRecienDespachado ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 flex items-center gap-4`}>
          <div className="text-4xl">{info.fueRecienDespachado ? '🚚' : '📍'}</div>
          <div>
            <p className={`font-bold ${info.fueRecienDespachado ? 'text-green-800' : 'text-blue-800'} text-sm`}>
              {info.fueRecienDespachado ? 'El pedido fue despachado exitosamente' : 'Información de entrega'}
            </p>
            <p className={`${info.fueRecienDespachado ? 'text-green-600' : 'text-blue-600'} text-xs mt-0.5`}>
              Cliente: <strong>{info.clienteNombre}</strong> &bull; Dirección: {info.direccion || 'No especificada'}
            </p>
            {info.telefono && (
              <p className={`${info.fueRecienDespachado ? 'text-green-600' : 'text-blue-600'} text-xs`}>Teléfono: {info.telefono}</p>
            )}
          </div>
        </div>

        {/* Botón WhatsApp destacado */}
        {info.telefonoWhatsapp && (
          <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaWhatsapp className="text-green-500" size={24} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Notificar al cliente</p>
                <p className="text-xs text-slate-500">Enviar mensaje por WhatsApp informando que su pedido va en camino</p>
              </div>
            </div>
            <Button
              type="primary"
              icon={<FaWhatsapp />}
              onClick={abrirWhatsapp}
              className="!rounded-lg !bg-green-600 hover:!bg-green-700 !border-none !font-semibold"
            >
              Enviar mensaje
            </Button>
          </div>
        )}

        {!info.telefonoWhatsapp && info.telefono && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            El cliente tiene teléfono ({info.telefono}) pero no es un número celular válido para WhatsApp.
          </div>
        )}

        {!info.telefono && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            El cliente no tiene un número de teléfono registrado.
          </div>
        )}

        {/* Mapa */}
        <MapaEntregaMapbox
          direccion={info.direccion}
          latitud={info.latitud}
          longitud={info.longitud}
          clienteNombre={info.clienteNombre}
        />
      </div>
    </Modal>
  )
}
