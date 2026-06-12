'use client'

import { Modal, Tag, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  FaCalendarAlt,
  FaClock,
  FaCommentDots,
  FaFileInvoice,
  FaFilePdf,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaPhone,
  FaTruck,
  FaUser,
  FaUserTie,
  FaWarehouse,
} from 'react-icons/fa'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import dayjs from 'dayjs'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregaProductoApi } from '~/lib/api/entrega-producto'
import {
  ESTADO_ENTREGA_COLOR,
  ESTADO_ENTREGA_LABEL,
  QUIEN_ENTREGA_LABEL,
  TIPO_DESPACHO_LABEL_CON_ICON as TIPO_DESPACHO_LABEL,
  TIPO_ENTREGA_LABEL_CON_ICON as TIPO_ENTREGA_LABEL,
} from '~/app/_lib/entrega-labels'
import {
  getResumenProductosParcialAgrupado,
  isEntregaParcialAgrupada,
} from '../../_lib/entregas-parciales'
import TableWithTitle from '~/components/tables/table-with-title'
import type { ColDef } from 'ag-grid-community'

interface ModalDetallesEntregaCompletoProps {
  open: boolean
  onClose: () => void
  entrega?: any
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pe: { label: ESTADO_ENTREGA_LABEL.pe, color: ESTADO_ENTREGA_COLOR.pe },
  ec: { label: ESTADO_ENTREGA_LABEL.ec, color: ESTADO_ENTREGA_COLOR.ec },
  en: { label: ESTADO_ENTREGA_LABEL.en, color: ESTADO_ENTREGA_COLOR.en },
  ca: { label: ESTADO_ENTREGA_LABEL.ca, color: ESTADO_ENTREGA_COLOR.ca },
}

export default function ModalDetallesEntregaCompleto({
  open,
  onClose,
  entrega,
}: ModalDetallesEntregaCompletoProps) {
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)
  const esParcialAgrupada = isEntregaParcialAgrupada(entrega)

  // NOTE: old entregaProductoApi.getById is disabled — the new delivery system
  // already provides full data via the entrega prop from entregasNuevasApi.listar.
  const { data: entregaCompleta } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'detalle-completo', entrega?.id],
    queryFn: async () => {
      const res = await entregaProductoApi.getById(entrega.id)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? res.data
    },
    enabled: false,
    staleTime: 0,
  })

  if (!entrega) return null

  const entregaView = esParcialAgrupada ? entrega : (entregaCompleta ?? entrega)
  const venta = entregaView.venta
  const cliente = venta?.cliente
  const clienteNombre =
    cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
    'SIN CLIENTE'
  const ventaNumero =
    venta?.serie && venta?.numero ? `${venta.serie}-${venta.numero}` : 'S/N'

  const productos = entregaView.productos_entregados || entregaView.productosEntregados || []
  const productosParcialAgrupado = esParcialAgrupada
    ? getResumenProductosParcialAgrupado(entregaView)
    : []
  const entregaFueEntregadaAntes = Boolean(
    entregaView?.user_entregado_id || entregaView?.userEntregado?.id,
  )
  const entregaTieneEntregaFisica =
    entregaView?.estado_entrega === 'en' || entregaFueEntregadaAntes
  const estado = ESTADO_LABEL[entregaView.estado_entrega] || {
    label: entregaView.estado_entrega,
    color: 'default',
  }

  const entregasRelacionadas = esParcialAgrupada
    ? [...(entregaView.entregas_agrupadas || [])]
    : Array.isArray(venta?.entregas_productos)
      ? [...venta.entregas_productos]
      : []

  entregasRelacionadas.sort((a: any, b: any) => {
    const fechaA = dayjs(a.fecha_creacion || 0).valueOf()
    const fechaB = dayjs(b.fecha_creacion || 0).valueOf()
    if (fechaA !== fechaB) return fechaA - fechaB
    return Number(a.id || 0) - Number(b.id || 0)
  })

  const totalEntregasVenta = entregasRelacionadas.length || 1
  const indiceEntregaVenta = totalEntregasVenta > 1
    ? Math.max(
        1,
        entregasRelacionadas.findIndex((e: any) => Number(e.id) === Number(entregaView.id)) + 1,
      )
    : 1

  // ── AG Grid productos ────────────────────────────────────────────────────
  type ProdRow = {
    codigo: string
    nombre: string
    unidad: string
    pedida: number
    programada: number
    entregada: number
    pendiente: number
  }

  const productosColDefs: ColDef<ProdRow>[] = [
    { field: 'codigo', headerName: 'Código', width: 80 },
    { field: 'nombre', headerName: 'Producto', flex: 1, minWidth: 140 },
    { field: 'unidad', headerName: 'Unidad', width: 90 },
    { field: 'pedida', headerName: 'Pedida', width: 78 },
    { field: 'programada', headerName: 'Programado', width: 105 },
    { field: 'entregada', headerName: 'Entregado', width: 98 },
    { field: 'pendiente', headerName: 'Pendiente', width: 95 },
  ]

  const productosRowData: ProdRow[] = esParcialAgrupada
    ? productosParcialAgrupado.map(r => ({
        codigo: (r as any).codigo || '',
        nombre: (r as any).producto,
        unidad: (r as any).unidad,
        pedida: (r as any).total,
        programada: (r as any).programado,
        entregada: (r as any).entregado,
        pendiente: (r as any).pendiente,
      }))
    : productos.map((p: any) => {
        const udv = p.unidad_derivada_venta
        const prod = udv?.producto_almacen_venta?.producto_almacen?.producto
        const cantidadTotal = Number(udv?.cantidad || 0)
        const cantidadEntregadaPersistida = Number(p.cantidad_entregada || 0)
        const cantidadPendientePersistida = Number(udv?.cantidad_pendiente || 0)
        const cantidadProgramada = entregaTieneEntregaFisica
          ? 0
          : Math.max(0, cantidadTotal - cantidadPendientePersistida)
        const cantidadEntregada = entregaTieneEntregaFisica ? cantidadEntregadaPersistida : 0
        return {
          codigo: prod?.cod_producto || '',
          nombre: prod?.name || 'Producto',
          unidad: udv?.unidad_derivada_inmutable?.name || '',
          pedida: cantidadTotal,
          programada: cantidadProgramada,
          entregada: cantidadEntregada,
          pendiente: cantidadPendientePersistida,
        }
      })

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
      footer={
        <div className="flex justify-end pt-1">
          <Button
            icon={<FaFilePdf />}
            onClick={() => entrega && openPdfModal(entrega)}
            className="!rounded-lg !h-9 !px-4 !font-semibold !text-red-600 !border-red-300 hover:!bg-red-50"
          >
            Imprimir Ticket
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag color={estado.color} className="!text-sm !py-1 !px-3 !font-semibold">
            {estado.label}
          </Tag>
          {entregaView.tipo_entrega && (
            <Tag color="purple" className="!text-sm !py-1 !px-3">
              {TIPO_ENTREGA_LABEL[entregaView.tipo_entrega] || entregaView.tipo_entrega}
            </Tag>
          )}
          {entregaView.tipo_despacho && (
            <Tag color="cyan" className="!text-sm !py-1 !px-3">
              {esParcialAgrupada
                ? '🔀 PARCIAL'
                : TIPO_DESPACHO_LABEL[entregaView.tipo_despacho] || entregaView.tipo_despacho}
            </Tag>
          )}
          {entregaView.quien_entrega && (
            <Tag color="geekblue" className="!text-sm !py-1 !px-3">
              Entrega: {QUIEN_ENTREGA_LABEL[entregaView.quien_entrega as keyof typeof QUIEN_ENTREGA_LABEL] || entregaView.quien_entrega}
            </Tag>
          )}
          {esParcialAgrupada ? (
            <Tag color="gold" className="!text-sm !py-1 !px-3 !font-semibold">
              Parcial agrupado • {totalEntregasVenta} tramos
            </Tag>
          ) : totalEntregasVenta > 1 ? (
            <Tag color="gold" className="!text-sm !py-1 !px-3 !font-semibold">
              Entrega {indiceEntregaVenta} de {totalEntregasVenta}
            </Tag>
          ) : null}
        </div>

        {totalEntregasVenta > 1 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <FaLayerGroup className="mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              {esParcialAgrupada ? (
                <>
                  Esta venta parcial fue dividida en <span className="font-semibold">{totalEntregasVenta} tramos</span>.
                  Esta vista los agrupa en una sola fila operativa.
                </>
              ) : (
                <>
                  Esta venta fue dividida en <span className="font-semibold">{totalEntregasVenta} entregas</span>.
                  Estás viendo la <span className="font-semibold">entrega {indiceEntregaVenta}</span>.
                </>
              )}
            </div>
          </div>
        )}

        {esParcialAgrupada && totalEntregasVenta > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1">
              Tramos de la Entrega Parcial
            </div>
            {entregasRelacionadas.map((tramo: any, index: number) => (
              <div
                key={tramo.id || index}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <div className="font-medium text-slate-700">Tramo {index + 1}</div>
                <div className="text-slate-600">
                  {tramo.tipo_despacho === 'in' ? '⚡ Inmediato' : '📅 Programado'}
                </div>
                <div className="text-slate-500">
                  {tramo.hora_inicio && tramo.hora_fin ? `${tramo.hora_inicio} - ${tramo.hora_fin}` : 'Sin horario'}
                </div>
                <Tag color={ESTADO_LABEL[tramo.estado_entrega]?.color || 'default'}>
                  {ESTADO_LABEL[tramo.estado_entrega]?.label || tramo.estado_entrega}
                </Tag>
              </div>
            ))}
          </div>
        )}

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

        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-2">
            Información de Entrega
          </div>
          {entregaView.direccion_entrega && (
            <div className="flex items-start gap-2 text-sm">
              <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5" />
              <div>
                <div className="text-slate-800">{entregaView.direccion_entrega}</div>
                {entregaView.referencia_entrega && (
                  <div className="text-slate-500 text-xs">
                    Ref: {entregaView.referencia_entrega}
                  </div>
                )}
              </div>
            </div>
          )}
          {entregaView.fecha_programada && (
            <div className="flex items-center gap-2 text-sm">
              <FaCalendarAlt className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Programada: {dayjs(entregaView.fecha_programada).format('DD/MM/YYYY')}
              </span>
            </div>
          )}
          {(entregaView.hora_inicio || entregaView.hora_fin) && (
            <div className="flex items-center gap-2 text-sm">
              <FaClock className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                {entregaView.hora_inicio || '?'} — {entregaView.hora_fin || '?'}
              </span>
            </div>
          )}
          {entregaView.almacenSalida?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaWarehouse className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Almacén salida: {entregaView.almacenSalida.name}
              </span>
            </div>
          )}
          {entregaView.user?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaUserTie className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Entregado por: <span className="font-semibold">{entregaView.user.name}</span>
                {entregaView.quien_entrega && (
                  <span className="text-slate-500">
                    {' '}({QUIEN_ENTREGA_LABEL[entregaView.quien_entrega as keyof typeof QUIEN_ENTREGA_LABEL] || entregaView.quien_entrega})
                  </span>
                )}
              </span>
            </div>
          )}
          {entregaView.despachador?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaUserTie className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Despachador: {entregaView.despachador.name}
              </span>
            </div>
          )}
          {entregaView.vehiculo?.name && (
            <div className="flex items-center gap-2 text-sm">
              <FaTruck className="text-slate-400 text-xs" />
              <span className="text-slate-700">
                Vehículo: {entregaView.vehiculo.name}
                {entregaView.vehiculo.placa ? ` (${entregaView.vehiculo.placa})` : ''}
              </span>
            </div>
          )}
          {entregaView.observaciones && (
            <div className="flex items-start gap-2 text-sm">
              <FaCommentDots className="text-slate-400 text-xs mt-0.5" />
              <span className="text-slate-700">{entregaView.observaciones}</span>
            </div>
          )}
        </div>

        {productosRowData.length > 0 && (
          <div className="h-[280px]">
            {/* TableWithTitle trae la barra estandar: selector de columnas +
                export Excel/PDF (igual que las demas tablas del sistema). */}
            <TableWithTitle
              id="fe.mis-entregas.detalle-entrega.productos"
              title="Productos"
              rowData={productosRowData}
              columnDefs={productosColDefs}
              rowSelection={false}
              persistColumnState={true}
              withNumberColumn={false}
              pagination={false}
              domLayout="normal"
              isVisible={open}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
