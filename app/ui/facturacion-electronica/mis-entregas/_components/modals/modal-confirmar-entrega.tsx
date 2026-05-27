'use client'

import { useMemo, useState } from 'react'
import { Modal, Button } from 'antd'
import { FaCheck, FaBoxOpen, FaUser, FaMapMarkerAlt, FaFileInvoice, FaFilePdf } from 'react-icons/fa'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'

interface ModalConfirmarEntregaProps {
  open: boolean
  onClose: () => void
  onConfirmar: () => Promise<void>
  entrega?: any
  loading?: boolean
}

type ProductoConfirmacion = {
  id: string | number
  codigo: string
  producto: string
  unidad: string
  cantidad: number
}

export default function ModalConfirmarEntrega({
  open,
  onClose,
  onConfirmar,
  entrega,
  loading = false,
}: ModalConfirmarEntregaProps) {
  const [confirmando, setConfirmando] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)

  // useMemo SIEMPRE antes del early return — rules of hooks
  const productos = useMemo<ProductoConfirmacion[]>(() => {
    if (!entrega) return []
    return (entrega.productos_entregados || []).map((p: any, index: number) => {
      const ud = p.unidad_derivada_venta || {}
      const producto = ud.producto_almacen_venta?.producto_almacen?.producto || {}
      const total = Number(ud.cantidad ?? 0)
      const pendienteVenta = Math.max(0, Number(ud.cantidad_pendiente ?? 0))
      const cantidadSolicitada = Math.max(0, Number(p.cantidad_solicitada ?? 0))
      const cantidadEstaEntrega = Math.max(0, Number(p.cantidad_entregada ?? 0))

      // Para entregas EN CAMINO ('ec') o PENDIENTE ('pe'), la cantidad a
      // confirmar es la solicitada al crear la hija. `cantidad_entregada`
      // es 0 hasta que se confirma, y `cantidad_pendiente` ya fue decrementada
      // al crear el despacho, por lo que no refleja lo de esta entrega.
      const cantidadAConfirmar =
        entrega.estado_entrega === 'en'
          ? cantidadEstaEntrega || Math.max(total - pendienteVenta, 0)
          : cantidadSolicitada > 0
            ? cantidadSolicitada
            : cantidadEstaEntrega > 0
              ? cantidadEstaEntrega
              : pendienteVenta > 0
                ? pendienteVenta
                : total

      return {
        id: p.id || index,
        codigo: producto.cod_producto || '—',
        producto: producto.name || 'Producto',
        unidad: ud.unidad_derivada_inmutable?.name || '—',
        cantidad: cantidadAConfirmar,
      }
    })
  }, [entrega])

  const colDefs = useMemo<ColDef<ProductoConfirmacion>[]>(() => [
    { headerName: 'Código',   field: 'codigo',   width: 110 },
    { headerName: 'Producto', field: 'producto', flex: 1, minWidth: 200 },
    { headerName: 'Unidad',   field: 'unidad',   width: 100 },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 90,
      valueFormatter: ({ value }) => Number(value).toFixed(0),
      cellStyle: { textAlign: 'right', fontWeight: 600, color: '#047857' },
    },
  ], [])

  if (!entrega) return null

  const pdfLabel = entrega?.estado_entrega === 'pe' ? 'Vale de Recojo'
    : entrega?.estado_entrega === 'ec' ? 'Entrega en Camino'
    : entrega?.estado_entrega === 'ca' ? 'Entrega Cancelada'
    : 'Ticket de Entrega'

  const venta = entrega.venta
  const cliente = venta?.cliente
  const clienteNombre = cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() || 'SIN CLIENTE'
  const ventaNumero = venta?.serie && venta?.numero
    ? `${venta.serie}-${venta.numero}` : 'S/N'
  const direccion = entrega.direccion_entrega || 'No especificada'
  const telefono = cliente?.telefono || ''

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
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={onClose}
            className="!rounded-lg !h-10 !px-5 !font-semibold"
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              icon={<FaFilePdf />}
              onClick={() => openPdfModal(entrega)}
              className="!rounded-lg !h-10 !px-4 !font-semibold !text-red-600 !border-red-300 hover:!bg-red-50"
            >
              {pdfLabel}
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
          {entrega.referencia_entrega && (
            <div className="flex items-start gap-2 text-sm">
              <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5" />
              <span className="font-semibold text-slate-600">Referencia:</span>
              <span className="text-slate-800">{entrega.referencia_entrega}</span>
            </div>
          )}
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
            <div style={{ height: 240 }}>
              <TableBase<ProductoConfirmacion>
                rowData={productos}
                columnDefs={colDefs}
                getRowId={({ data }) => String(data.id)}
                withNumberColumn={false}
                rowSelection={false}
                persistColumnState={false}
                isVisible={open}
                rowHeight={38}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
