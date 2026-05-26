'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { Modal, Spin, InputNumber, DatePicker, App } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FaTruck, FaPlus, FaListUl, FaMapMarkerAlt, FaHistory } from 'react-icons/fa'
import type { ColDef } from 'ag-grid-community'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi } from '~/lib/api/venta'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'

export type TipoEntregaCodigo = 'rt' | 'de' | 'pa'

export interface CantidadOverride {
  udvId: string
  cantidad: number
}

interface FilaProducto {
  key: string
  udvId: string
  nombre: string
  codigo: string
  marca: string
  unidad: string
  total: number
  entregado: number
  pendiente: number
  cantAProgramar: number
}

interface Props {
  open: boolean
  onClose: () => void
  ventaId: string | undefined
  ventaNumero?: string
  clienteNombre?: string
  /** Abre Step 2 con configuración completa (mapa, dirección, chofer) */
  onAbrirConfiguracion: (
    tipoEntrega: TipoEntregaCodigo,
    cantidades: CantidadOverride[],
    fechaProgramada: string | null,
  ) => void
  onSuccess?: () => void
}

const TIPO_OPTIONS: { value: TipoEntregaCodigo; emoji: string; label: string }[] = [
  { value: 'rt', emoji: '🏪', label: 'Recojo en Tienda' },
  { value: 'de', emoji: '🚚', label: 'Despacho a Domicilio' },
  { value: 'pa', emoji: '📦', label: 'Parcial' },
]

/**
 * Celda editable A Programar.
 * Si max === 0 (producto ya entregado) muestra "—" de solo lectura.
 */
const CantProgramarCell = memo(function CantProgramarCell({
  rowKey, initialValue, max, onCommit,
}: {
  rowKey: string
  initialValue: number
  max: number
  onCommit: (key: string, value: number) => void
}) {
  const [value, setValue] = useState<number | null>(initialValue)
  useEffect(() => { setValue(initialValue) }, [initialValue])

  if (max === 0) {
    return (
      <div className="flex items-center h-full px-2">
        <span className="text-slate-300 text-sm">—</span>
      </div>
    )
  }

  const commit = () =>
    onCommit(rowKey, Math.max(0, Math.min(Math.round(Number(value) || 0), max)))

  return (
    <div className="flex items-center h-full">
      <InputNumber
        size="small"
        value={value}
        min={0}
        max={max}
        precision={0}
        onChange={setValue}
        onBlur={commit}
        onPressEnter={commit}
        style={{ width: '100%' }}
      />
    </div>
  )
})

export default function ModalResumenEntregaVenta({
  open, onClose, ventaId, ventaNumero, clienteNombre, onAbrirConfiguracion, onSuccess,
}: Props) {
  const { message } = App.useApp()
  const queryClient  = useQueryClient()

  const [tipoEntrega,     setTipoEntrega]     = useState<TipoEntregaCodigo>('de')
  const [fechaProgramada, setFechaProgramada] = useState<Dayjs | null>(dayjs())
  const [filas,           setFilas]           = useState<FilaProducto[]>([])

  // ── Detalle de venta ─────────────────────────────────────────────────────
  const { data: ventaResp, isFetching } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'resumen-entrega', ventaId],
    queryFn:  () => ventaApi.getById(ventaId!),
    enabled:  open && !!ventaId,
    staleTime: 0,
  })
  const ventaDetalle = (ventaResp?.data?.data ?? ventaResp?.data) as any

  // ── Historial de entregas ────────────────────────────────────────────────
  const { data: historial = [] } = useQuery<EntregaNueva[]>({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId],
    queryFn:  async () => {
      const res = await entregasNuevasApi.porVenta(ventaId!)
      return (res.data as any)?.data ?? []
    },
    enabled:  open && !!ventaId,
    staleTime: 0,
  })

  // ── Filas — TODOS los productos, sin filtrar por pendiente ───────────────
  useEffect(() => {
    if (!ventaDetalle) return
    const rows: FilaProducto[] = (ventaDetalle.productos_por_almacen ?? []).flatMap(
      (prod: any, pi: number) =>
        (prod.unidades_derivadas ?? []).map((udv: any, ui: number) => {
          const total     = Number(udv.cantidad ?? 0)
          const pendiente = Number(udv.cantidad_pendiente ?? 0)
          return {
            key:            `${pi}-${ui}`,
            udvId:          String(udv.id),
            nombre:         prod.producto_almacen?.producto?.name ?? 'Producto',
            codigo:         prod.producto_almacen?.producto?.cod_producto ?? '—',
            marca:          prod.producto_almacen?.producto?.marca?.name ?? '—',
            unidad:         udv.unidad_derivada_inmutable?.name ?? '—',
            total,
            entregado:      total - pendiente,
            pendiente,
            cantAProgramar: pendiente,
          }
        }),
    )
    setFilas(rows)
  }, [ventaDetalle])

  const handleCommit = useCallback((key: string, value: number) => {
    setFilas(prev => prev.map(f => f.key === key ? { ...f, cantAProgramar: value } : f))
  }, [])

  // ── Columnas tabla productos ─────────────────────────────────────────────
  const columnDefsProductos = useMemo(() => [
    {
      field: 'nombre',
      headerName: 'Producto',
      flex: 1,
      minWidth: 140,
      cellRenderer: ({ data }: { data: FilaProducto }) => (
        <div className="flex flex-col justify-center h-full leading-tight">
          <div className="text-sm font-medium text-slate-800 truncate">{data.nombre}</div>
          <div className="text-[11px] text-slate-400">{data.codigo}</div>
        </div>
      ),
    },
    { field: 'marca',    headerName: 'Marca',    width: 90,  cellStyle: { color: '#475569', fontSize: '12px' } },
    { field: 'unidad',   headerName: 'Unidad',   width: 72,  cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' } },
    { field: 'total',    headerName: 'Total',    width: 62,  cellStyle: { textAlign: 'center', color: '#64748b', fontWeight: '600' } },
    { field: 'entregado', headerName: 'Entregado', width: 88, cellStyle: { textAlign: 'center', color: '#16a34a', fontWeight: '700' } },
    { field: 'pendiente', headerName: 'Pendiente', width: 88, cellStyle: { textAlign: 'center', color: '#ea580c', fontWeight: '700' } },
    {
      field: 'cantAProgramar',
      headerName: 'A programar',
      width: 130,
      cellStyle: { backgroundColor: '#f0fdf4' },
      cellRenderer: ({ data }: { data: FilaProducto }) => (
        <CantProgramarCell
          rowKey={data.key}
          initialValue={data.cantAProgramar}
          max={data.pendiente}
          onCommit={handleCommit}
        />
      ),
    },
  ] as ColDef<FilaProducto>[], [handleCommit])

  // ── Columnas tabla historial ─────────────────────────────────────────────
  const columnDefsHistorial = useMemo(() => [
    {
      field: 'venta_entrega_secuencia',
      headerName: '#',
      width: 48,
      cellStyle: { textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '12px' },
    },
    {
      headerName: 'Tipo',
      width: 165,
      cellRenderer: ({ data }: { data: EntregaNueva }) => (
        <div className="flex items-center gap-1.5 h-full">
          <span className="text-base leading-none">{data.tipo_entrega_icono}</span>
          <span className="text-xs text-slate-700">{data.tipo_entrega_nombre ?? '—'}</span>
        </div>
      ),
    },
    {
      headerName: 'Estado',
      width: 110,
      cellRenderer: ({ data }: { data: EntregaNueva }) => {
        const map: Record<string, string> = { pe: '#d97706', ec: '#3b82f6', en: '#16a34a', ca: '#ef4444' }
        const c = map[data.estado_entrega_codigo ?? ''] ?? '#64748b'
        return (
          <div className="flex items-center h-full">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${c}20`, color: c, border: `1px solid ${c}40` }}>
              {data.estado_entrega_nombre ?? '—'}
            </span>
          </div>
        )
      },
    },
    {
      field: 'fecha_programada',
      headerName: 'Fecha',
      width: 88,
      cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' },
      valueFormatter: ({ value }: { value: string | null }) =>
        value ? dayjs(value).format('DD/MM/YY') : '—',
    },
    {
      headerName: 'Quién entrega',
      flex: 1,
      minWidth: 120,
      cellRenderer: ({ data }: { data: EntregaNueva }) => (
        <div className="flex flex-col justify-center h-full leading-tight">
          <span className="text-xs text-slate-700">{data.quien_entrega_nombre ?? '—'}</span>
          {data.chofer_name && (
            <span className="text-[11px] text-slate-400">{data.chofer_name}</span>
          )}
        </div>
      ),
    },
    {
      headerName: 'Ítems',
      width: 60,
      cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' },
      cellRenderer: ({ data }: { data: EntregaNueva }) => (
        <span>{data.detalles?.length ?? 0}</span>
      ),
    },
  ] as ColDef<EntregaNueva>[], [])

  // ── Derivados ────────────────────────────────────────────────────────────
  const filasParaProgramar = filas.filter(f => f.cantAProgramar > 0)
  const totalUnidades      = filasParaProgramar.reduce((s, f) => s + f.cantAProgramar, 0)

  // ── Mutación directa (sin Step 2) ────────────────────────────────────────
  const { mutate: registrarEntrega, isPending: isRegistrando } = useMutation({
    mutationFn: () => entregasNuevasApi.crear({
      venta_id:          ventaId!,
      tipo_entrega:      tipoEntrega,
      tipo_despacho:     'in',
      quien_entrega:     ventaDetalle?.quien_entrega ?? 'almacen',
      almacen_salida_id: Number(ventaDetalle?.almacen_id ?? ventaDetalle?.almacen?.id ?? 0),
      fecha_programada:  fechaProgramada ? fechaProgramada.format('YYYY-MM-DD') : null,
      productos:         filasParaProgramar.map(f => ({
        unidad_derivada_venta_id: parseInt(f.udvId),
        cantidad:                 f.cantAProgramar,
      })),
      user_creador_id:   ventaDetalle?.user?.id ?? ventaDetalle?.user_id ?? '',
    }),
    onSuccess: () => {
      message.success('Entrega registrada correctamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message ?? 'Error al registrar la entrega')
    },
  })

  // MAPA → abre Step 2 (solo Domicilio)
  const handleAbrirConfiguracion = () => {
    if (filasParaProgramar.length === 0) return
    onAbrirConfiguracion(
      tipoEntrega,
      filasParaProgramar.map(f => ({ udvId: f.udvId, cantidad: f.cantAProgramar })),
      fechaProgramada ? fechaProgramada.format('YYYY-MM-DD') : null,
    )
  }

  // PROGRAMAR → registra directo
  const handleProgramar = () => {
    if (filasParaProgramar.length === 0) return
    registrarEntrega()
  }

  // Alturas dinámicas
  const rowH        = 42
  const headerH     = 37
  const heightProds = Math.min(headerH + Math.max(filas.length, 1) * rowH + 4, headerH + 6 * rowH + 4)
  const heightHist  = Math.min(headerH + Math.max(historial.length, 1) * rowH + 4, headerH + 4 * rowH + 4)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      centered
      destroyOnHidden
      footer={null}
      styles={{ body: { padding: '12px 20px 20px' } }}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaTruck className="text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Configurar Entrega</div>
            {ventaNumero && (
              <div className="text-xs text-slate-500">
                {ventaNumero}{clienteNombre ? ` — ${clienteNombre}` : ''}
              </div>
            )}
          </div>
        </div>
      }
    >
      {isFetching ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex gap-5 min-h-[480px]">

          {/* ════════════════ PANEL IZQUIERDO ════════════════ */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-4">

            {/* Tipo de entrega — cards seleccionables */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tipo de entrega
              </div>
              <div className="flex flex-col gap-1.5">
                {TIPO_OPTIONS.map(opt => {
                  const selected = tipoEntrega === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTipoEntrega(opt.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg leading-none">{opt.emoji}</span>
                      <span className="text-xs leading-tight">{opt.label}</span>
                      {selected && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fecha programada */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fecha programada
              </div>
              <DatePicker
                value={fechaProgramada}
                onChange={setFechaProgramada}
                size="middle"
                placeholder="Sin fecha"
                format="DD/MM/YYYY"
                allowClear
                style={{ width: '100%' }}
              />
            </div>

            {/* Estado */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Estado
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-300">
                🕐 Pendiente
              </span>
            </div>

            {/* Resumen de esta entrega */}
            {filasParaProgramar.length > 0 ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mb-1.5">
                  Esta entrega
                </div>
                <div className="text-2xl font-extrabold text-blue-700 leading-none">
                  {filasParaProgramar.length}
                </div>
                <div className="text-xs text-blue-500 mt-0.5">
                  ítem{filasParaProgramar.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm font-bold text-blue-600 mt-1.5">
                  {totalUnidades}{' '}
                  <span className="text-xs font-normal text-blue-400">
                    unidad{totalUnidades !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-xs text-slate-400">Sin cantidades a programar</div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Botones de acción */}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
              {/* Mapa — solo para Domicilio, abre Step 2 */}
              <ButtonBase
                disabled={tipoEntrega !== 'de' || filasParaProgramar.length === 0}
                onClick={handleAbrirConfiguracion}
                className="w-full flex items-center justify-center gap-2 border-blue-400 !text-blue-700 hover:bg-blue-50"
              >
                <FaMapMarkerAlt size={12} />
                Mapa / Dirección
              </ButtonBase>

              {/* Programar — registra directo sin Step 2 */}
              <ButtonBase
                color="success"
                size="md"
                disabled={filasParaProgramar.length === 0 || isRegistrando || !ventaDetalle}
                onClick={handleProgramar}
                className="w-full flex items-center justify-center gap-2"
              >
                <FaPlus size={12} />
                {isRegistrando ? 'Registrando...' : 'Programar Entrega'}
              </ButtonBase>

              <ButtonBase onClick={onClose} className="w-full flex items-center justify-center">
                Cancelar
              </ButtonBase>
            </div>
          </div>

          {/* Divisor vertical */}
          <div className="w-px bg-slate-100 flex-shrink-0" />

          {/* ════════════════ PANEL DERECHO ════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Tabla de productos */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FaListUl className="text-slate-400" size={11} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Productos de la venta
                </span>
              </div>
              <div style={{ height: heightProds }} className="w-full">
                <TableBase<FilaProducto>
                  rowData={filas}
                  columnDefs={columnDefsProductos}
                  rowSelection={false}
                  withNumberColumn={false}
                  pagination={false}
                  persistColumnState={false}
                  domLayout="normal"
                  rowHeight={rowH}
                  headerHeight={headerH}
                  isVisible={open}
                  noRowsOverlayComponent={() => (
                    <div className="text-gray-400 text-sm">Sin productos</div>
                  )}
                />
              </div>
            </div>

            {/* Historial de entregas */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FaHistory className="text-slate-400" size={11} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Historial de entregas
                </span>
                {historial.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    · {historial.length} registro{historial.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ height: heightHist }} className="w-full">
                <TableBase<EntregaNueva>
                  rowData={historial}
                  columnDefs={columnDefsHistorial}
                  rowSelection={false}
                  withNumberColumn={false}
                  pagination={false}
                  persistColumnState={false}
                  domLayout="normal"
                  rowHeight={rowH}
                  headerHeight={headerH}
                  isVisible={open}
                  noRowsOverlayComponent={() => (
                    <div className="text-gray-400 text-sm">Sin entregas registradas aún</div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
