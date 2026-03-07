'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DatePicker, Select, Spin, Tag, Empty } from 'antd'
import { FaClipboardList, FaBoxOpen } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import TableWithTitle from '~/components/tables/table-with-title'
import { greenColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex, type TipoMovimientoInventario } from '~/lib/api/kardex'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'

const { RangePicker } = DatePicker

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'compra', label: 'Compras' },
  { value: 'recepcion', label: 'Recepciones' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'salida', label: 'Salidas' },
]

const tipoColors: Record<string, string> = {
  compra: 'green',
  recepcion: 'cyan',
  ingreso: 'blue',
  salida: 'red',
}

const tipoLabels: Record<string, string> = {
  compra: 'Compra',
  recepcion: 'Recepcion',
  ingreso: 'Ingreso',
  salida: 'Salida',
}

const movimientoColors: Record<string, string> = {
  ENTRADA: 'green',
  SALIDA: 'red',
}

export default function KardexInventarioView() {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>()
  const [tipo, setTipo] = useState<TipoMovimientoInventario | ''>('')
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const productoId = productoSeleccionado?.id

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.KARDEX_INVENTARIO, productoId, almacenId, tipo, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosInventario({
        producto_id: productoId!,
        almacen_id: almacenId || undefined,
        tipo: tipo || undefined,
        desde: fechas?.[0]?.format('YYYY-MM-DD'),
        hasta: fechas?.[1]?.format('YYYY-MM-DD'),
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: !!productoId,
    staleTime: 30 * 1000,
  })

  const columns: ColDef<MovimientoKardex>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 140,
      minWidth: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return dayjs(params.value).format('DD/MM/YYYY HH:mm')
      },
      sort: 'asc',
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 110,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const tipo = params.value as string
        return (
          <div className='flex items-center h-full'>
            <Tag color={tipoColors[tipo] || 'default'} className='!m-0'>
              {tipoLabels[tipo] || tipo}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Mov.',
      field: 'movimiento',
      width: 110,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const mov = params.value as string
        return (
          <div className='flex items-center h-full'>
            <Tag color={movimientoColors[mov] || 'default'} className='!m-0 text-xs'>
              {mov}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Documento',
      field: 'documento',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      width: 100,
      minWidth: 90,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 90,
      minWidth: 80,
      type: 'numericColumn',
      valueFormatter: (params) => params.value ? Number(params.value).toFixed(2) : '-',
    },
    {
      headerName: 'Costo',
      field: 'costo',
      width: 100,
      minWidth: 90,
      type: 'numericColumn',
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return `S/. ${Number(params.value).toFixed(4)}`
      },
    },
    {
      headerName: 'Entrada',
      field: 'entrada',
      width: 90,
      minWidth: 80,
      type: 'numericColumn',
      cellStyle: (params) => {
        if (params.value > 0) return { color: '#16a34a', fontWeight: 'bold' }
        return null
      },
      valueFormatter: (params) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.value).toFixed(2)
      },
    },
    {
      headerName: 'Salida',
      field: 'salida',
      width: 90,
      minWidth: 80,
      type: 'numericColumn',
      cellStyle: (params) => {
        if (params.value > 0) return { color: '#dc2626', fontWeight: 'bold' }
        return null
      },
      valueFormatter: (params) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.value).toFixed(2)
      },
    },
    {
      headerName: 'Saldo',
      field: 'saldo',
      width: 100,
      minWidth: 90,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold' },
      valueFormatter: (params) => {
        if (params.value == null) return '-'
        return Number(params.value).toFixed(2)
      },
    },
  ]

  return (
    <div className='flex flex-col gap-4'>
      {/* Filtros */}
      <div className='bg-white rounded-xl border p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 mb-1'>
          <FaClipboardList size={18} className='text-emerald-600' />
          <span className='font-bold text-gray-800'>Kardex de Inventario</span>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-3 items-end'>
          <div className='md:col-span-2'>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Producto</label>
            <div className='flex items-center gap-1'>
              <SelectProductos
                withSearch
                onChange={(_id, producto) => {
                  if (producto) setProductoSeleccionado(producto)
                }}
              />
            </div>
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Tipo</label>
            <Select
              className='w-full'
              value={tipo}
              onChange={(v) => setTipo(v as TipoMovimientoInventario | '')}
              options={tipoOptions}
              size='middle'
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Rango de Fechas</label>
            <RangePicker
              className='w-full'
              onChange={(dates) => setFechas(dates)}
              format='DD/MM/YYYY'
              size='middle'
            />
          </div>
        </div>

        {/* Info del producto seleccionado */}
        {productoSeleccionado && (
          <div className='flex items-center gap-4 bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-200'>
            <FaBoxOpen className='text-emerald-500' />
            <div className='flex-1 min-w-0'>
              <span className='font-semibold text-gray-800 truncate'>{productoSeleccionado.name}</span>
              <span className='text-gray-500 ml-2 text-sm'>({productoSeleccionado.cod_producto})</span>
            </div>
            {data && (
              <div className='flex items-center gap-4 text-sm flex-shrink-0'>
                <div className='text-center'>
                  <div className='text-xs text-gray-500'>Stock Actual</div>
                  <div className='font-bold text-lg text-emerald-600'>{data.stock_actual.toFixed(2)}</div>
                </div>
                <div className='text-center'>
                  <div className='text-xs text-gray-500'>Movimientos</div>
                  <div className='font-bold text-lg text-gray-700'>{data.total}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      {!productoId ? (
        <div className='bg-white rounded-xl border p-12 flex flex-col items-center justify-center'>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className='text-gray-400'>
                <p className='text-base font-medium'>Selecciona un producto para ver su Kardex</p>
                <p className='text-sm'>Busca y selecciona un producto en el campo de arriba</p>
              </div>
            }
          />
        </div>
      ) : isLoading ? (
        <div className='bg-white rounded-xl border p-12 flex items-center justify-center'>
          <Spin size='large' />
          <span className='ml-3 text-gray-500'>Cargando movimientos...</span>
        </div>
      ) : (
        <div className='h-[500px]'>
          <TableWithTitle<MovimientoKardex>
            id='kardex.inventario.movimientos'
            title='Movimientos de Inventario'
            selectionColor={greenColors[10]}
            columnDefs={columns}
            rowData={data?.data || []}
            pagination={false}
            optionsSelectColumns={[
              {
                label: 'Default',
                columns: ['Fecha', 'Tipo', 'Mov.', 'Documento', 'Unidad', 'Cantidad', 'Costo', 'Entrada', 'Salida', 'Saldo'],
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
