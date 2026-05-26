'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { Modal, Select, Spin, InputNumber, DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { FaTruck, FaPlus, FaListUl, FaClipboardCheck, FaMapMarkerAlt } from 'react-icons/fa'
import type { ColDef } from 'ag-grid-community'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi } from '~/lib/api/venta'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'

const ModalMapaEntrega = dynamic(
  () => import('~/app/ui/facturacion-electronica/mis-entregas/_components/modals/mapbox/modal-mapa-entrega'),
  { ssr: false },
)

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
  pendiente: number
  cantAProgramar: number
}

interface Props {
  open: boolean
  onClose: () => void
  ventaId: string | undefined
  ventaNumero?: string
  clienteNombre?: string
  onProgramar: (tipoEntrega: TipoEntregaCodigo, cantidades: CantidadOverride[], fechaProgramada: string | null) => void
}

const TIPO_OPTIONS = [
  { value: 'rt', label: '🏪 Recojo en Tienda' },
  { value: 'de', label: '🚚 Despacho a Domicilio' },
  { value: 'pa', label: '📦 Parcial' },
]

/**
 * Celda editable para la columna "Cant. a programar".
 * Idéntico al patrón de ProgramarCell en crear-venta:
 * - InputNumber de Ant Design (no agNumberCellEditor)
 * - Buffer local para no re-renderizar la fila en cada keystroke
 * - Commit en blur o Enter
 */
const CantProgramarCell = memo(function CantProgramarCell({
  rowKey,
  initialValue,
  max,
  onCommit,
}: {
  rowKey: string
  initialValue: number
  max: number
  onCommit: (key: string, value: number) => void
}) {
  const [value, setValue] = useState<number | null>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const commit = () => onCommit(rowKey, Math.max(0, Math.min(Math.round(Number(value) || 0), max)))

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
  open, onClose, ventaId, ventaNumero, clienteNombre, onProgramar,
}: Props) {
  const [tipoEntrega,     setTipoEntrega]     = useState<TipoEntregaCodigo>('de')
  const [fechaProgramada, setFechaProgramada] = useState<Dayjs | null>(dayjs())
  const [filas,           setFilas]           = useState<FilaProducto[]>([])
  const [openMapa,        setOpenMapa]        = useState(false)

  const { data: ventaResp, isFetching } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'resumen-entrega', ventaId],
    queryFn: () => ventaApi.getById(ventaId!),
    enabled: open && !!ventaId,
    staleTime: 0,
  })

  const ventaDetalle = (ventaResp?.data?.data ?? ventaResp?.data) as any

  // Inicializar filas cuando carga ventaDetalle — solo pendientes > 0
  useEffect(() => {
    if (!ventaDetalle) return
    const rows: FilaProducto[] = (ventaDetalle.productos_por_almacen ?? []).flatMap(
      (prod: any, pi: number) =>
        (prod.unidades_derivadas ?? [])
          .filter((udv: any) => Number(udv.cantidad_pendiente ?? 0) > 0)
          .map((udv: any, ui: number) => ({
            key:            `${pi}-${ui}`,
            udvId:          String(udv.id),
            nombre:         prod.producto_almacen?.producto?.name ?? 'Producto',
            codigo:         prod.producto_almacen?.producto?.cod_producto ?? '—',
            marca:          prod.producto_almacen?.producto?.marca?.name ?? '—',
            unidad:         udv.unidad_derivada_inmutable?.name ?? '—',
            total:          Number(udv.cantidad ?? 0),
            pendiente:      Number(udv.cantidad_pendiente ?? 0),
            cantAProgramar: Number(udv.cantidad_pendiente ?? 0),
          }))
    )
    setFilas(rows)
  }, [ventaDetalle])

  // Commit desde InputNumber → actualiza el array de filas
  const handleCommit = useCallback((key: string, value: number) => {
    setFilas(prev => prev.map(f => f.key === key ? { ...f, cantAProgramar: value } : f))
  }, [])

  // Columnas Tabla 1 — cellRenderer con InputNumber (patrón ProgramarCell)
  const columnDefsT1 = useMemo(() => [
    {
      field: 'nombre',
      headerName: 'Producto',
      flex: 1,
      minWidth: 130,
      cellRenderer: ({ data }: { data: FilaProducto }) => (
        <div className="flex flex-col justify-center h-full leading-tight">
          <div className="text-sm font-medium text-slate-800 truncate">{data.nombre}</div>
          <div className="text-[11px] text-slate-400">{data.codigo}</div>
        </div>
      ),
    },
    {
      field: 'marca',
      headerName: 'Marca',
      width: 90,
      cellStyle: { color: '#475569', fontSize: '12px' },
    },
    {
      field: 'unidad',
      headerName: 'Unidad',
      width: 75,
      cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' },
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 65,
      cellStyle: { textAlign: 'center', color: '#64748b', fontWeight: '600' },
    },
    {
      field: 'pendiente',
      headerName: 'Pendiente',
      width: 90,
      cellStyle: { textAlign: 'center', color: '#ea580c', fontWeight: '700' },
    },
    {
      field: 'cantAProgramar',
      headerName: 'A programar',
      width: 140,
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

  // Columnas Tabla 2 — read-only, mismo estilo que Tabla 1
  const columnDefsT2 = useMemo(() => [
    {
      field: 'nombre',
      headerName: 'Producto',
      flex: 1,
      minWidth: 130,
      cellRenderer: ({ data }: { data: FilaProducto }) => (
        <div className="flex flex-col justify-center h-full leading-tight">
          <div className="text-sm font-medium text-slate-800 truncate">{data.nombre}</div>
          <div className="text-[11px] text-slate-400">{data.codigo}</div>
        </div>
      ),
    },
    {
      field: 'marca',
      headerName: 'Marca',
      width: 90,
      cellStyle: { color: '#475569', fontSize: '12px' },
    },
    {
      field: 'unidad',
      headerName: 'Unidad',
      width: 80,
      cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' },
    },
    {
      field: 'total',
      headerName: 'Total venta',
      width: 90,
      cellStyle: { textAlign: 'center', color: '#64748b', fontWeight: '600' },
    },
    {
      field: 'pendiente',
      headerName: 'Pendiente',
      width: 90,
      cellStyle: { textAlign: 'center', color: '#ea580c', fontWeight: '700' },
    },
    {
      field: 'cantAProgramar',
      headerName: 'Programado',
      width: 110,
      cellStyle: { textAlign: 'center', backgroundColor: '#eff6ff' },
      cellRenderer: ({ data }: { data: FilaProducto }) => (
        <span className="text-base font-bold text-blue-700">{data.cantAProgramar}</span>
      ),
    },
  ] as ColDef<FilaProducto>[], [])

  // Derivado: lo que se va a programar (cantAProgramar > 0)
  const filasParaProgramar = filas.filter(f => f.cantAProgramar > 0)
  const totalUnidades      = filasParaProgramar.reduce((s, f) => s + f.cantAProgramar, 0)

  const handleProgramar = () => {
    if (filasParaProgramar.length === 0) return
    onProgramar(
      tipoEntrega,
      filasParaProgramar.map(f => ({ udvId: f.udvId, cantidad: f.cantAProgramar })),
      fechaProgramada ? fechaProgramada.format('YYYY-MM-DD') : null,
    )
  }

  // Shape para ModalMapaEntrega — expone las direcciones registradas del cliente
  const entregaParaMapa = useMemo(() => {
    if (!ventaDetalle) return undefined
    return {
      direccion_entrega:  null,
      referencia_entrega: null,
      observaciones:      null,
      estado_entrega:     'pe',
      venta: {
        serie:   ventaNumero ?? '',
        numero:  '',
        cliente: {
          razon_social: clienteNombre ?? ventaDetalle.cliente?.razon_social ?? '',
          telefono:     ventaDetalle.cliente?.telefono ?? '',
          direcciones:  ventaDetalle.cliente?.direcciones ?? [],
        },
      },
    }
  }, [ventaDetalle, ventaNumero, clienteNombre])

  // Alturas dinámicas — máx 5 filas Tabla 1, máx 4 filas Tabla 2
  const tableHeight1 = Math.min(37 + Math.max(filas.length, 1) * 42 + 4, 37 + 5 * 42 + 4)
  const tableHeight2 = Math.min(37 + Math.max(filasParaProgramar.length, 1) * 42 + 4, 37 + 4 * 42 + 4)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={960}
      centered
      destroyOnHidden
      footer={null}
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
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4 pt-1">

          {/* ── Configuración: tipo, fecha y estado en una sola fila ── */}
          <div className="flex items-center gap-4 flex-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">

            {/* Tipo de entrega */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Tipo:</span>
              <Select
                value={tipoEntrega}
                onChange={setTipoEntrega}
                options={TIPO_OPTIONS}
                size="middle"
                style={{ width: 210 }}
                disabled={filas.length === 0}
              />
            </div>

            {/* Fecha programada */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Fecha:</span>
              <DatePicker
                value={fechaProgramada}
                onChange={setFechaProgramada}
                size="middle"
                placeholder="Sin fecha"
                format="DD/MM/YYYY"
                allowClear
                style={{ width: 140 }}
              />
            </div>

            {/* Estado — siempre Pendiente para una nueva entrega */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Estado:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-300">
                🕐 Pendiente
              </span>
            </div>

          </div>

          {/* ── TABLA 1 — pendientes con InputNumber editable ── */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FaListUl className="text-slate-400" size={12} />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Productos pendientes
              </span>
            </div>
            <div style={{ height: tableHeight1 }} className="w-full">
              <TableBase<FilaProducto>
                rowData={filas}
                columnDefs={columnDefsT1}
                rowSelection={false}
                withNumberColumn={false}
                pagination={false}
                persistColumnState={false}
                domLayout="normal"
                rowHeight={42}
                headerHeight={37}
                isVisible={open}
                noRowsOverlayComponent={() => (
                  <div className="text-gray-400 text-sm">Sin productos pendientes</div>
                )}
              />
            </div>
          </div>

          {/* ── Botones entre tablas ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaClipboardCheck className="text-blue-500" size={12} />
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Esta entrega
                {filasParaProgramar.length > 0
                  ? ` — ${filasParaProgramar.length} ítem${filasParaProgramar.length !== 1 ? 's' : ''} · ${totalUnidades} unidad${totalUnidades !== 1 ? 'es' : ''}`
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ButtonBase
                disabled={!ventaDetalle}
                onClick={() => setOpenMapa(true)}
                className="flex items-center gap-2 border-blue-400 !text-blue-700 hover:bg-blue-50"
              >
                <FaMapMarkerAlt size={12} />
                Mapa
              </ButtonBase>
              <ButtonBase
                color="success"
                size="md"
                disabled={filasParaProgramar.length === 0}
                onClick={handleProgramar}
                className="flex items-center gap-2"
              >
                <FaPlus size={12} />
                Programar Entrega
              </ButtonBase>
            </div>
          </div>

          {/* ── TABLA 2 — preview de esta entrega ── */}
          <div>
            <div style={{ height: tableHeight2 }} className="w-full">
              <TableBase<FilaProducto>
                rowData={filasParaProgramar}
                columnDefs={columnDefsT2}
                rowSelection={false}
                withNumberColumn={false}
                pagination={false}
                persistColumnState={false}
                domLayout="normal"
                rowHeight={42}
                headerHeight={37}
                isVisible={open}
                noRowsOverlayComponent={() => (
                  <div className="text-gray-400 text-sm">
                    Ajustá las cantidades en la tabla de arriba
                  </div>
                )}
              />
            </div>
          </div>

          {/* ── Acciones ── */}
          <div className="flex items-center border-t border-slate-100 pt-3">
            <ButtonBase onClick={onClose}>Cancelar</ButtonBase>
          </div>
        </div>
      )}

      {entregaParaMapa && (
        <ModalMapaEntrega
          open={openMapa}
          onClose={() => setOpenMapa(false)}
          entrega={entregaParaMapa}
        />
      )}
    </Modal>
  )
}
