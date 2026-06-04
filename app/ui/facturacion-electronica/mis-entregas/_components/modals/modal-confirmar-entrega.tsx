'use client'

import { useMemo, useState } from 'react'
import { Modal, Button, Tooltip, Image } from 'antd'
import { FaCheck, FaBoxOpen, FaUser, FaMapMarkerAlt, FaFileInvoice, FaFilePdf, FaTruck } from 'react-icons/fa'
import type { ColDef } from 'ag-grid-community'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi } from '~/lib/api/venta'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import { getStorageUrl } from '~/utils/upload'

interface ModalConfirmarEntregaProps {
  open: boolean
  onClose: () => void
  onConfirmar: () => Promise<void>
  onMarcarEnCamino?: () => Promise<void>
  entrega?: any
  loading?: boolean
  loadingEnCamino?: boolean
}

type ProductoConfirmacion = {
  id: string | number
  foto?: string | null
  codigo: string
  producto: string
  ubicacion: string
  unidad: string
  cantidad: number
}

export default function ModalConfirmarEntrega({
  open,
  onClose,
  onConfirmar,
  onMarcarEnCamino,
  entrega,
  loading = false,
  loadingEnCamino = false,
}: ModalConfirmarEntregaProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [marcandoEnCamino, setMarcandoEnCamino] = useState(false)
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
        foto: producto.img || null,
        codigo: producto.cod_producto || '—',
        producto: producto.name || 'Producto',
        ubicacion: producto.ubicacion_almacen || '—',
        unidad: ud.unidad_derivada_inmutable?.name || '—',
        cantidad: cantidadAConfirmar,
      }
    })
  }, [entrega])

  const colDefs = useMemo<ColDef<ProductoConfirmacion>[]>(() => [
    {
      headerName: 'Foto',
      field: 'foto',
      width: 72,
      cellRenderer: ({ value }: { value?: string | null }) => {
        const src = getStorageUrl(value)
        return (
          <div className="flex h-full items-center justify-center">
            {src ? (
              <Image
                src={src}
                alt="Producto"
                width={40}
                height={40}
                className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                preview={{ mask: 'Ver' }}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-400">
                S/I
              </div>
            )}
          </div>
        )
      },
    },
    { headerName: 'Código',   field: 'codigo',   width: 110 },
    { headerName: 'Producto', field: 'producto', flex: 1, minWidth: 200 },
    { headerName: 'Ubicación', field: 'ubicacion', width: 130 },
    { headerName: 'Unidad',   field: 'unidad',   width: 100 },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 90,
      valueFormatter: ({ value }) => Number(value).toFixed(0),
      cellStyle: { textAlign: 'center', fontWeight: 600, color: '#047857' },
    },
  ], [])

  // Carga datos del cliente (con sus direcciones) cuando la entrega es domicilio
  // y no tiene dirección propia — para mostrar la dirección principal del cliente.
  const esDomicilioSinDir = !!entrega && entrega.tipo_entrega === 'de' && !entrega.direccion_entrega
  const { data: ventaResp } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'confirmar-entrega', entrega?.venta_id],
    queryFn:  () => ventaApi.getById(entrega!.venta_id),
    enabled:  open && esDomicilioSinDir && !!entrega?.venta_id,
    staleTime: 5 * 60 * 1000,
  })
  const ventaDetalle  = (ventaResp?.data?.data ?? ventaResp?.data) as any
  const clienteDirs   = ventaDetalle?.cliente?.direcciones as any[] | undefined
  const dirPrincipal  = clienteDirs?.find((d: any) => d.es_principal) ?? clienteDirs?.[0] ?? null

  if (!entrega) return null

  const pdfLabel = entrega?.estado_entrega === 'pe'
    ? entrega?.tipo_entrega === 'de' ? 'Vale de Despacho'
      : entrega?.tipo_entrega === 'pa' ? 'Vale de Entrega Parcial'
      : 'Vale de Recojo'
    : entrega?.estado_entrega === 'ec' ? 'Entrega en Camino'
    : entrega?.estado_entrega === 'ca' ? 'Entrega Cancelada'
    : 'Ticket de Entrega'

  const venta = entrega.venta
  const cliente = venta?.cliente
  const clienteNombre = cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() || 'SIN CLIENTE'
  const ventaNumero = venta?.serie && venta?.numero
    ? `${venta.serie}-${venta.numero}` : 'S/N'
  const direccion = entrega.direccion_entrega
    || dirPrincipal?.direccion
    || 'No especificada'
  const latitud  = entrega.latitud  ?? dirPrincipal?.latitud  ?? null
  const longitud = entrega.longitud ?? dirPrincipal?.longitud ?? null
  const gpsUrl   = latitud && longitud
    ? `https://www.google.com/maps?q=${latitud},${longitud}`
    : null
  const telefono = cliente?.telefono || ''
  const esDomicilio          = entrega.tipo_entrega === 'de'
  const esDomicilioPendiente = esDomicilio && entrega.estado_entrega === 'pe'
  const esDomicilioEnCamino  = esDomicilio && entrega.estado_entrega === 'ec'

  const handleConfirmar = async () => {
    setConfirmando(true)
    try {
      await onConfirmar()
    } finally {
      setConfirmando(false)
    }
  }

  const handleMarcarEnCamino = async () => {
    if (!onMarcarEnCamino) return
    setMarcandoEnCamino(true)
    try {
      await onMarcarEnCamino()
    } finally {
      setMarcandoEnCamino(false)
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
      width={900}
      centered
      destroyOnHidden
      footer={
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            onClick={onClose}
            className="!rounded-lg !h-10 !px-5 !font-semibold"
          >
            Cancelar
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Tooltip
              title={esDomicilioPendiente ? 'El vale se habilita al marcar en camino' : undefined}
              placement="top"
            >
              <Button
                icon={<FaFilePdf />}
                onClick={esDomicilioPendiente ? undefined : () => openPdfModal(entrega)}
                disabled={esDomicilioPendiente}
                className="!rounded-lg !h-10 !px-3 !font-semibold !text-red-600 !border-red-300 hover:!bg-red-50 disabled:!opacity-40"
              >
                {pdfLabel}
              </Button>
            </Tooltip>
            {(esDomicilioPendiente || esDomicilioEnCamino) && onMarcarEnCamino && (
              <Button
                icon={esDomicilioEnCamino ? <FaCheck /> : <FaTruck />}
                onClick={esDomicilioPendiente ? handleMarcarEnCamino : undefined}
                disabled={esDomicilioEnCamino}
                loading={esDomicilioPendiente && (marcandoEnCamino || loadingEnCamino)}
                className={
                  esDomicilioEnCamino
                    ? '!rounded-lg !h-10 !px-3 !font-bold !text-green-700 !border-green-300 !bg-green-50'
                    : '!rounded-lg !h-10 !px-3 !font-bold !text-blue-700 !border-blue-300 hover:!bg-blue-50'
                }
              >
                {esDomicilioEnCamino ? 'En Camino' : 'Marcar en Camino'}
              </Button>
            )}
            <Tooltip
              title={esDomicilioPendiente ? 'Primero marcá la entrega en camino' : undefined}
              placement="top"
            >
              <Button
                type="primary"
                icon={<FaCheck />}
                onClick={handleConfirmar}
                loading={confirmando || loading}
                disabled={esDomicilioPendiente}
                className="!rounded-lg !h-10 !px-4 !font-bold !bg-green-600 hover:!bg-green-700 !border-none !shadow-lg !shadow-green-600/30 disabled:!opacity-40"
              >
                Confirmar Entrega
              </Button>
            </Tooltip>
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
            <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5 flex-shrink-0" />
            <span className="font-semibold text-slate-600 flex-shrink-0">Dirección:</span>
            <span className="text-slate-800 flex-1">{direccion}</span>
            {gpsUrl && (
              <a
                href={gpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold border border-blue-200 rounded-lg px-2 py-0.5 hover:bg-blue-50 transition-colors"
                title="Abrir en Google Maps"
              >
                <FaMapMarkerAlt size={9} /> GPS
              </a>
            )}
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
          <div className="h-[290px] rounded-xl border border-gray-200 p-3">
              <TableWithTitle<ProductoConfirmacion>
                id="mis-entregas-confirmar-productos"
                title={`Productos a entregar (${productos.length})`}
                rowData={productos}
                columnDefs={colDefs}
                getRowId={({ data }) => String(data.id)}
                withNumberColumn={false}
                rowSelection={false}
                persistColumnState={false}
                isVisible={open}
                rowHeight={48}
              />
          </div>
        )}
      </div>
    </Modal>
  )
}
