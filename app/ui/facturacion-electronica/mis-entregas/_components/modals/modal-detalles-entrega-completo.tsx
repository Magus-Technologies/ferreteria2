'use client'

import { Modal, Tag } from 'antd'
import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaCalendarAlt,
  FaClock,
  FaWarehouse,
  FaTruck,
  FaUserTie,
  FaCommentDots,
} from 'react-icons/fa'
import dayjs from 'dayjs'

interface ModalDetallesEntregaCompletoProps {
  open: boolean
  onClose: () => void
  entrega?: any
}

const TIPO_ENTREGA_LABEL: Record<string, string> = {
  rt: '🏪 Recojo en Tienda',
  de: '🏠 Despacho a Domicilio',
  pa: '🔀 Parcial',
}

const TIPO_DESPACHO_LABEL: Record<string, string> = {
  in: '⚡ Inmediato',
  pr: '📅 Programado',
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pe: { label: 'Pendiente', color: 'orange' },
  ec: { label: 'En Camino', color: 'blue' },
  en: { label: 'Entregado', color: 'green' },
  ca: { label: 'Cancelado', color: 'red' },
}

const QUIEN_ENTREGA_LABEL: Record<string, string> = {
  almacen: 'Almacén',
  vendedor: 'Vendedor',
  chofer: 'Chofer',
}

export default function ModalDetallesEntregaCompleto({
  open,
  onClose,
  entrega,
}: ModalDetallesEntregaCompletoProps) {
  if (!entrega) return null

  const venta = entrega.venta
  const cliente = venta?.cliente
  const clienteNombre =
    cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
    'SIN CLIENTE'
  const ventaNumero =
    venta?.serie && venta?.numero ? `${venta.serie}-${venta.numero}` : 'S/N'

  const productos = entrega.productos_entregados || []
  const estado = ESTADO_LABEL[entrega.estado_entrega] || {
    label: entrega.estado_entrega,
    color: 'default',
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FaFileInvoice className="text-amber-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">
              Detalles de Entrega
            </div>
            <span className="text-amber-600 text-xs font-mono">
              Venta {ventaNumero}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={780}
      centered
      destroyOnHidden
      footer={null}
    >
      <div className="space-y-4">
        {/* Estado y tipos */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag color={estado.color} className="!text-sm !py-1 !px-3 !font-semibold">
            {estado.label}
          </Tag>
          {entrega.tipo_entrega && (
            <Tag color="purple" className="!text-sm !py-1 !px-3">
              {TIPO_ENTREGA_LABEL[entrega.tipo_entrega] || entrega.tipo_entrega}
            </Tag>
          )}
          {entrega.tipo_despacho && (
            <Tag color="cyan" className="!text-sm !py-1 !px-3">
              {TIPO_DESPACHO_LABEL[entrega.tipo_despacho] || entrega.tipo_despacho}
            </Tag>
          )}
          {entrega.quien_entrega && (
            <Tag color="geekblue" className="!text-sm !py-1 !px-3">
              Entrega: {QUIEN_ENTREGA_LABEL[entrega.quien_entrega] || entrega.quien_entrega}
            </Tag>
          )}
        </div>

        {/* Cliente */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-2">
            Cliente
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaUser className="text-slate-400 text-xs" />
            <span className="text-slate-800 font-medium">{clienteNombre}</span>
            {cliente?.numero_documento && (
              <span className="text-slate-500">— {cliente.numero_documento}</span>
            )}
          </div>
          {cliente?.telefono && (
            <div className="flex items-center gap-2 text-sm">
              <FaPhone className="text-slate-400 text-xs" />
              <span className="text-slate-700">{cliente.telefono}</span>
            </div>
          )}
        </div>

        {/* Entrega */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-2">
            Información de Entrega
          </div>
          {entrega.direccion_entrega && (
            <div className="flex items-start gap-2 text-sm">
              <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5" />
              <div>
                <div className="text-slate-800">{entrega.direccion_entrega}</div>
                {entrega.referencia_entrega && (
                  <div className="text-slate-500 text-xs">
                    Ref: {entrega.referencia_entrega}
                  </div>
                )}
              </div>
            </div>
          )}
          {entrega.fecha_programada && (
            <div className="flex items-center gap-2 text-sm">
              <FaCalendarAlt className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Programada: {dayjs(entrega.fecha_programada).format('DD/MM/YYYY')}
              </span>
            </div>
          )}
          {(entrega.hora_inicio || entrega.hora_fin) && (
            <div className="flex items-center gap-2 text-sm">
              <FaClock className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                {entrega.hora_inicio || '?'} — {entrega.hora_fin || '?'}
              </span>
            </div>
          )}
          {entrega.almacenSalida?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaWarehouse className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Almacén salida: {entrega.almacenSalida.name}
              </span>
            </div>
          )}
          {entrega.despachador?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaUserTie className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Despachador: {entrega.despachador.name}
              </span>
            </div>
          )}
          {entrega.vehiculo?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaTruck className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Vehículo: {entrega.vehiculo.name}
                {entrega.vehiculo.placa ? ` (${entrega.vehiculo.placa})` : ''}
              </span>
            </div>
          )}
          {entrega.observaciones && (
            <div className="flex items-start gap-2 text-sm">
              <FaCommentDots className="text-slate-400 text-xs mt-0.5" />
              <span className="text-slate-700">{entrega.observaciones}</span>
            </div>
          )}
        </div>

        {/* Productos */}
        {productos.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase text-slate-600 tracking-wide flex items-center justify-between">
              <span>Productos</span>
              <span className="text-slate-500 font-normal normal-case">
                Pedida / Esta entrega / Pendiente venta
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
              {productos.map((p: any, i: number) => {
                const udv = p.unidad_derivada_venta
                const prod = udv?.producto_almacen_venta?.producto_almacen?.producto
                const nombre = prod?.name || 'Producto'
                const codigo = prod?.cod_producto
                const unidad = udv?.unidad_derivada_inmutable?.name || ''
                const cantidadEntregada = Number(p.cantidad_entregada || 0)
                const cantidadTotal = Number(udv?.cantidad || 0)
                const cantidadPendiente = Number(udv?.cantidad_pendiente || 0)
                return (
                  <div
                    key={p.id || i}
                    className="px-4 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 truncate">
                        {nombre}
                      </div>
                      {codigo && (
                        <div className="text-xs text-slate-500">{codigo}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                      <span className="text-slate-500">
                        {cantidadTotal} {unidad}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="font-bold text-green-700">
                        {cantidadEntregada} {unidad}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span
                        className={
                          cantidadPendiente > 0
                            ? 'text-orange-600 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        {cantidadPendiente} {unidad}
                      </span>
                    </div>
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
