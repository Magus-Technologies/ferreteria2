'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal, Button } from 'antd'
import { FaCheck, FaBoxOpen, FaUser, FaMapMarkerAlt, FaFileInvoice } from 'react-icons/fa'
import { getAuthToken } from '~/lib/api'

interface ModalConfirmarEntregaProps {
  open: boolean
  onClose: () => void
  onConfirmar: () => Promise<void>
  entrega?: any
  loading?: boolean
}

export default function ModalConfirmarEntrega({
  open,
  onClose,
  onConfirmar,
  entrega,
  loading = false,
}: ModalConfirmarEntregaProps) {
  const [confirmando, setConfirmando] = useState(false)

  if (!entrega) return null

  const venta = entrega.venta
  const cliente = venta?.cliente
  const clienteNombre = cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() || 'SIN CLIENTE'
  const ventaNumero = venta?.serie && venta?.numero
    ? `${venta.serie}-${venta.numero}` : 'S/N'
  const direccion = entrega.direccion_entrega || 'No especificada'
  const telefono = cliente?.telefono || ''

  const productos = entrega.productos_entregados || []

  const handleConfirmar = async () => {
    setConfirmando(true)
    try {
      await onConfirmar()
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <FaBoxOpen className="text-green-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">Confirmar Entrega</div>
            <span className="text-green-600 text-xs font-mono">Venta {ventaNumero}</span>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={600}
      centered
      destroyOnClose
      footer={
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={onClose}
            className="!rounded-lg !h-10 !px-5 !font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={handleConfirmar}
            loading={confirmando || loading}
            className="!rounded-lg !h-10 !px-6 !font-bold !bg-green-600 hover:!bg-green-700 !border-none !shadow-lg !shadow-green-600/30"
          >
            Confirmar Entrega
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Mensaje de confirmación */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800 font-semibold text-sm">
            ¿Estás seguro de que los productos fueron entregados al cliente?
          </p>
          <p className="text-amber-600 text-xs mt-1">
            Esta acción marcará la entrega como completada
          </p>
        </div>

        {/* Info de la entrega */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FaUser className="text-slate-400 text-xs" />
            <span className="font-semibold text-slate-600">Cliente:</span>
            <span className="text-slate-800">{clienteNombre}</span>
          </div>
          {telefono && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 text-xs">📞</span>
              <span className="font-semibold text-slate-600">Teléfono:</span>
              <span className="text-slate-800">{telefono}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5" />
            <span className="font-semibold text-slate-600">Dirección:</span>
            <span className="text-slate-800">{direccion}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaFileInvoice className="text-slate-400 text-xs" />
            <span className="font-semibold text-slate-600">Venta:</span>
            <span className="text-slate-800">{ventaNumero}</span>
          </div>
        </div>

        {/* Resumen de productos */}
        {productos.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Productos a entregar ({productos.length})
            </div>
            <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
              {productos.map((p: any, i: number) => {
                const nombre = p.unidad_derivada_venta?.producto_almacen_venta?.producto_almacen?.producto?.name || 'Producto'
                const cantidad = Number(p.cantidad_entregada)
                const unidad = p.unidad_derivada_venta?.unidad_derivada_inmutable?.name || ''
                return (
                  <div key={p.id || i} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm text-slate-700 truncate flex-1 mr-3">{nombre}</span>
                    <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {cantidad} {unidad}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
