'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal, Spin, App } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FaTruck } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi } from '~/lib/api/venta'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'
import TableWithTitle from '~/components/tables/table-with-title'
import useEntregasDeVenta from '~/app/ui/facturacion-electronica/mis-entregas/_hooks/use-entregas-de-venta'
import ModalPdfEntregaWrapper from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-pdf-entrega-wrapper'
import { FilaProducto, useColsProductosPendientes } from '../tables/columns-productos-pendientes'
import { useColsHistorialEntrega } from '../tables/columns-historial-entrega'
import CardControlesEntrega from '../cards/card-controles-entrega'

export type TipoEntregaCodigo = 'rt' | 'de' | 'pa'
export interface CantidadOverride { udvId: string; cantidad: number }

interface Props {
  open: boolean; onClose: () => void
  ventaId: string | undefined; ventaNumero?: string; clienteNombre?: string
  onAbrirConfiguracion: (t: TipoEntregaCodigo, c: CantidadOverride[], f: string | null) => void
  onSuccess?: () => void
}

const HH = 36

export default function ModalResumenEntregaVenta({
  open, onClose, ventaId, ventaNumero, clienteNombre, onAbrirConfiguracion, onSuccess,
}: Props) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [tipo,  setTipo]  = useState<TipoEntregaCodigo>('de')
  const [fecha, setFecha] = useState<Dayjs | null>(dayjs())
  const [filas, setFilas] = useState<FilaProducto[]>([])

  const { data: ventaResp, isFetching } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'resumen-entrega', ventaId],
    queryFn:  () => ventaApi.getById(ventaId!),
    enabled:  open && !!ventaId,
    staleTime: 0,
  })
  const vd = (ventaResp?.data?.data ?? ventaResp?.data) as any

  const { entregas: historial, loading: loadingHistorial, refetch: refetchHistorial } = useEntregasDeVenta(open ? ventaId : undefined)

  // Cobertura acumulada desde el historial — TODOS los no-cancelados (pe+ec+en)
  // Se usa para mostrar pendiente/entregado correctos sin depender de cantidad_pendiente del DB
  const coveredMap = useMemo(() => {
    const covered: Record<string, number> = {}
    for (const entrega of historial) {
      if (entrega.estado_entrega_codigo === 'ca') continue
      for (const d of entrega.detalles ?? []) {
        const id = String(d.unidad_derivada_venta_id)
        covered[id] = (covered[id] ?? 0) + (d.cantidad ?? 0)
      }
    }
    return covered
  }, [historial])

  useEffect(() => {
    if (!vd) return
    setFilas((vd.productos_por_almacen ?? []).flatMap((prod: any, pi: number) =>
      (prod.unidades_derivadas ?? []).map((udv: any, ui: number) => {
        const total    = Number(udv.cantidad ?? 0)
        const entregado = coveredMap[String(udv.id)] ?? 0
        const pendiente = Math.max(0, total - entregado)
        return {
          key: `${pi}-${ui}`, udvId: String(udv.id),
          nombre:   prod.producto_almacen?.producto?.name ?? 'Producto',
          codigo:   prod.producto_almacen?.producto?.cod_producto ?? '—',
          marca:    prod.producto_almacen?.producto?.marca?.name ?? '—',
          unidad:   udv.unidad_derivada_inmutable?.name ?? '—',
          total, entregado, pendiente, cantAProgramar: pendiente,
        }
      })
    ))
  }, [vd, coveredMap])

  // Cuando se cambia a "En Tienda", poner toda la cantidad pendiente a programar
  useEffect(() => {
    if (tipo === 'rt') {
      setFilas(prev => prev.map(f => ({ ...f, cantAProgramar: f.pendiente })))
    }
  }, [tipo])

  const onCommit = useCallback((key: string, value: number) => {
    setFilas(prev => prev.map(f => f.key === key ? { ...f, cantAProgramar: value } : f))
  }, [])

  // "A Programar" solo visible cuando el tipo es Domicilio
  const colsProductos = useColsProductosPendientes({ onCommit, includeAProgramar: tipo === 'de' })
  const colsHistorial = useColsHistorialEntrega({ onRefetch: refetchHistorial, entregas: historial })

  const hasPendiente = useMemo(() => {
    if (!vd) return true
    const covered: Record<string, number> = {}
    for (const entrega of historial) {
      if (entrega.estado_entrega_codigo === 'ca') continue
      if (entrega.estado_entrega_codigo === 'pe') continue
      for (const d of entrega.detalles ?? []) {
        const id = String(d.unidad_derivada_venta_id)
        covered[id] = (covered[id] ?? 0) + (d.cantidad ?? 0)
      }
    }
    return (vd.productos_por_almacen ?? []).some((prod: any) =>
      (prod.unidades_derivadas ?? []).some((udv: any) =>
        Number(udv.cantidad ?? 0) - (covered[String(udv.id)] ?? 0) > 0
      )
    )
  }, [vd, historial])

  const aProg    = filas.filter(f => f.cantAProgramar > 0)
  const totUnd   = aProg.reduce((s, f) => s + f.cantAProgramar, 0)

  const { mutate: registrar, isPending: registrando } = useMutation({
    mutationFn: () => entregasNuevasApi.crear({
      venta_id: ventaId!, tipo_entrega: tipo, tipo_despacho: 'in', tipo_pedido: 'interno',
      quien_entrega:     vd?.quien_entrega ?? 'almacen',
      almacen_salida_id: Number(vd?.almacen_id ?? vd?.almacen?.id ?? 0),
      fecha_programada:  fecha ? fecha.format('YYYY-MM-DD') : null,
      productos:         aProg.map(f => ({ unidad_derivada_venta_id: parseInt(f.udvId), cantidad: f.cantAProgramar })),
      user_creador_id:   vd?.user?.id ?? vd?.user_id ?? '',
    }),
    onSuccess: () => {
      message.success('Entrega registrada')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      refetchHistorial()
      onSuccess?.(); onClose()
    },
    onError: (err: any) => message.error(err?.response?.data?.message ?? 'Error al registrar'),
  })

  const abrirConfig = () => {
    if (!aProg.length) return
    onAbrirConfiguracion(tipo, aProg.map(f => ({ udvId: f.udvId, cantidad: f.cantAProgramar })), fecha?.format('YYYY-MM-DD') ?? null)
  }

  return (
    <>
    <Modal open={open} onCancel={onClose} width={1200} centered destroyOnHidden footer={null}
      styles={{ body: { padding: '12px 20px 20px', height: 560, display: 'flex', flexDirection: 'column' } }}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaTruck className="text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Configurar Entrega</div>
            {ventaNumero && <div className="text-xs text-slate-500">{ventaNumero}{clienteNombre ? ` — ${clienteNombre}` : ''}</div>}
          </div>
        </div>
      }
    >
      {isFetching || loadingHistorial ? (
        <div className="flex items-center justify-center flex-1"><Spin size="large" /></div>
      ) : !hasPendiente ? (
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <div className="flex-1 min-h-0">
            <TableWithTitle<EntregaNueva>
              id="entrega-historial-v4"
              title="Historial de entregas"
              extraTitle={historial.length > 0
                ? <span className="text-xs text-slate-400 font-normal">· {historial.length} registro{historial.length !== 1 ? 's' : ''}</span>
                : undefined}
              rowData={historial} columnDefs={colsHistorial}
              rowSelection={false} withNumberColumn={false} pagination={false}
              persistColumnState={true} domLayout="normal" rowHeight={48} headerHeight={HH}
              isVisible={open} exportExcel={false} exportPdf={false}
              noRowsOverlayComponent={() => <div className="text-gray-400 text-sm">Sin entregas registradas</div>}
            />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-2.5">
            <button type="button" onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded transition-colors cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">

          {/* ═══ TABLAS ═══ */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">

            {/* Productos — 55% del alto */}
            <div style={{ flex: 3 }} className="min-h-0">
              <TableWithTitle<FilaProducto>
                id={tipo === 'de' ? 'entrega-productos-de-v1' : 'entrega-productos-rt-v1'}
                title="Productos de la venta"
                rowData={filas} columnDefs={colsProductos}
                rowSelection={false} withNumberColumn={false} pagination={false}
                persistColumnState={true} domLayout="normal" rowHeight={36} headerHeight={HH}
                isVisible={open} exportExcel={false} exportPdf={false}
                noRowsOverlayComponent={() => <div className="text-gray-400 text-sm">Sin productos</div>}
              />
            </div>

            {/* Historial — 45% del alto */}
            <div style={{ flex: 2 }} className="min-h-0">
              <TableWithTitle<EntregaNueva>
                id="entrega-historial-v4"
                title="Historial de entregas"
                extraTitle={historial.length > 0
                  ? <span className="text-xs text-slate-400 font-normal">· {historial.length} registro{historial.length !== 1 ? 's' : ''}</span>
                  : undefined}
                rowData={historial} columnDefs={colsHistorial}
                rowSelection={false} withNumberColumn={false} pagination={false}
                persistColumnState={true} domLayout="normal" rowHeight={48} headerHeight={HH}
                isVisible={open} exportExcel={false} exportPdf={false}
                noRowsOverlayComponent={() => <div className="text-gray-400 text-sm">Sin entregas registradas</div>}
              />
            </div>
          </div>

          <div className="w-px bg-slate-100 flex-shrink-0" />

          {/* ═══ CONTROLES ═══ */}
          <CardControlesEntrega
            tipo={tipo} onTipo={setTipo}
            fecha={fecha} onFecha={setFecha}
            itemCount={aProg.length} unidadCount={totUnd}
            registrando={registrando}
            onMapa={abrirConfig}
            onProgramar={() => registrar()}
            onCancelar={onClose}
          />
        </div>
      )}
    </Modal>

    <ModalPdfEntregaWrapper />
    </>
  )
}
