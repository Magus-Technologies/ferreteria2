'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { DatePicker, Select, Tag } from 'antd'
import { FaClipboardList, FaBoxOpen, FaSearch } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { greenColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex, type TipoMovimientoInventario } from '~/lib/api/kardex'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import ButtonBase from '~/components/buttons/button-base'
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
  COMPRA: 'orange',
  REFERENCIA: 'blue',
}

export default function KardexInventarioView() {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>()
  const [tipo, setTipo] = useState<TipoMovimientoInventario | ''>('')
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  const productoId = productoSeleccionado?.id

  const { data, isFetching } = useQuery({
    queryKey: [QueryKeys.KARDEX_INVENTARIO, productoId, almacenId, tipo, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD'), searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosInventario({
        producto_id: productoId,
        almacen_id: almacenId || undefined,
        tipo: tipo || undefined,
        desde: fechas?.[0]?.format('YYYY-MM-DD'),
        hasta: fechas?.[1]?.format('YYYY-MM-DD'),
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    staleTime: 0,
  })

  const columns: ColDef<MovimientoKardex>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 140,
      minWidth: 120,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY HH:mm') || '-',
    },
    // Mostrar columnas de producto solo cuando no hay producto seleccionado
    ...(!productoId ? [
      {
        headerName: 'Código',
        field: 'producto_codigo' as keyof MovimientoKardex,
        width: 120,
        minWidth: 100,
        cellStyle: { color: '#16a34a', fontWeight: 'bold' },
      },
      {
        headerName: 'Producto',
        field: 'producto_nombre' as keyof MovimientoKardex,
        flex: 1,
        minWidth: 200,
      },
    ] : []),
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 110,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const t = params.value as string
        return (
          <div className='flex items-center h-full'>
            <Tag color={tipoColors[t] || 'default'} className='!m-0'>
              {tipoLabels[t] || t}
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
      flex: productoId ? 1 : undefined,
      width: productoId ? undefined : 200,
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
      headerName: 'Stock Antes',
      valueGetter: (params: any) => {
        const { saldo, entrada, salida } = params.data ?? {}
        if (saldo == null) return null
        return Number(saldo) - Number(entrada ?? 0) + Number(salida ?? 0)
      },
      width: 110,
      minWidth: 100,
      type: 'numericColumn' as const,
      valueFormatter: (params: any) => {
        if (params.value == null) return '-'
        return Number(params.value).toFixed(2)
      },
    },
    {
      headerName: 'Cant. Ingreso',
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
      headerName: 'Cant. Salida',
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
      headerName: 'Stock Actual',
      field: 'saldo' as keyof MovimientoKardex,
      width: 100,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: { fontWeight: 'bold' },
      valueFormatter: (params: any) => {
        if (params.value == null) return '-'
        return Number(params.value).toFixed(2)
      },
    },
  ]

  return (
    <div className='flex flex-col gap-4 w-full'>
      {/* Filtros */}
      <div className='bg-white rounded-xl border p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 mb-1'>
          <FaClipboardList size={18} className='text-emerald-600' />
          <span className='font-bold text-gray-800'>Kardex de Inventario</span>
        </div>

        <div className='flex flex-wrap gap-3 items-end'>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Producto</label>
            <div className='flex items-center gap-2'>
              <SelectProductos
                withSearch
                withTipoBusqueda
                classNameTipoBusqueda='!min-w-[150px] !w-[150px] !max-w-[150px]'
                className='!min-w-[250px] !w-[250px] !max-w-[250px]'
                allowClear
                showUltimasCompras={false}
                selectionColor={greenColors[10]}
                onChange={(_id, producto) => {
                  setProductoSeleccionado(producto ?? undefined)
                  if (!producto) setSearchText('')
                }}
                onSearch={(val) => setSearchText(val)}
              />
            </div>
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Tipo</label>
            <Select
              className='!min-w-[140px] !w-[140px]'
              value={tipo}
              onChange={(v) => setTipo(v as TipoMovimientoInventario | '')}
              options={tipoOptions}
              size='middle'
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Rango de Fechas</label>
            <RangePicker
              value={fechas}
              onChange={(dates) => setFechas(dates)}
              format='DD/MM/YYYY'
              size='middle'
            />
          </div>
          <ButtonBase
            color='info'
            size='md'
            className='flex items-center gap-2 w-fit self-end'
            onClick={() => setSearchKey(k => k + 1)}
          >
            <FaSearch />
            Buscar
          </ButtonBase>
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
                  <div className='text-xs text-gray-500'>Total Ingresó</div>
                  <div className='font-bold text-lg text-emerald-600'>
                    {data.data.reduce((sum, m) => sum + Number(m.entrada ?? 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-xs text-gray-500'>Total Salió</div>
                  <div className='font-bold text-lg text-red-500'>
                    {data.data.reduce((sum, m) => sum + Number(m.salida ?? 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-xs text-gray-500'>Stock Actual</div>
                  <div className='font-bold text-lg text-blue-600'>{data.stock_actual.toFixed(2)}</div>
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
      <div className='h-[calc(100vh-380px)] min-h-[300px]'>
        <TableWithTitle<MovimientoKardex>
          id='kardex.inventario.movimientos'
          title={productoId ? 'Movimientos de Inventario' : 'Todos los Movimientos de Hoy'}
          selectionColor={greenColors[10]}
          loading={isFetching || isSearching}
          columnDefs={columns}
          rowData={data?.data || []}
          pagination={false}
          quickFilterText={debouncedSearchText}
          optionsSelectColumns={[
            {
              label: 'Default',
              columns: ['Fecha', 'Código', 'Producto', 'Tipo', 'Mov.', 'Documento', 'Unidad', 'Cantidad', 'Costo', 'Stock Antes', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual'],
            },
          ]}
        />
      </div>
      {/* Barra de estado */}
      <div className='flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-1.5 min-h-[32px]'>
        {(isFetching || isSearching) && (
          <div className='text-xs text-gray-500 text-center'>
            Cargando movimientos...
          </div>
        )}
      </div>
    </div>
  )
}
