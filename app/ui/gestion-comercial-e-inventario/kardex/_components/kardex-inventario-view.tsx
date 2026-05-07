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
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'
import type { Proveedor } from '~/lib/api/proveedor'
import { GetStock } from '~/app/_utils/get-stock'

const { RangePicker } = DatePicker

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'compra', label: 'Compras' },
  { value: 'recepcion', label: 'Recepciones' },
  { value: 'recepcion_anulada', label: 'Recepciones Anuladas' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'salida', label: 'Salidas' },
  { value: 'cuadre', label: 'Cuadres' },
]

const tipoColors: Record<string, string> = {
  compra: 'green',
  recepcion: 'cyan',
  recepcion_anulada: 'volcano',
  ingreso: 'blue',
  salida: 'red',
  cuadre: 'purple',
  // backward compat para registros anteriores
  ingreso_anulado: 'purple',
  salida_anulada: 'purple',
}

const tipoLabels: Record<string, string> = {
  compra: 'Compra',
  recepcion: 'Recepcion',
  recepcion_anulada: 'Recepcion Anulada',
  ingreso: 'Ingreso',
  salida: 'Salida',
  cuadre: 'Cuadre',
  // backward compat para registros anteriores
  ingreso_anulado: 'Cuadre',
  salida_anulada: 'Cuadre',
}

const movimientoColors: Record<string, string> = {
  ENTRADA: 'green',
  SALIDA: 'red',
  COMPRA: 'orange',
  REFERENCIA: 'blue',
  ANULACION: 'volcano',
  ANULADA_ENTRADA: 'volcano',
  ANULADA_SALIDA: 'geekblue',
}

const movimientoLabels: Record<string, string> = {
  ANULADA_ENTRADA: 'Anulada Entrada',
  ANULADA_SALIDA: 'Anulada Salida',
}

export default function KardexInventarioView() {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>()
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor>()
  const [tipo, setTipo] = useState<TipoMovimientoInventario | ''>('')
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  const productoId = productoSeleccionado?.id
  const proveedorId = proveedorSeleccionado?.id

  const { data, isFetching } = useQuery({
    queryKey: [QueryKeys.KARDEX_INVENTARIO, productoId, proveedorId, almacenId, tipo, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD'), searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosInventario({
        producto_id: productoId,
        proveedor_id: proveedorId,
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
      width: 200,
      minWidth: 180,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
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
      headerName: 'Proveedor',
      field: 'proveedor_nombre' as keyof MovimientoKardex,
      width: 180,
      minWidth: 150,
      cellStyle: { color: '#059669', fontStyle: 'italic' },
      valueFormatter: (params: any) => params.value || '-',
    },
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
              {movimientoLabels[mov] || mov}
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
      headerName: 'Costo Anterior',
      field: 'costo_anterior' as keyof MovimientoKardex,
      width: 130,
      minWidth: 110,
      cellRenderer: (params: any) => {
        const costoFrac = Number(params.value ?? 0)
        if (!costoFrac) return <span className='text-gray-400 text-xs'>-</span>
        const cantidad = Number(params.data?.cantidad ?? 0)
        const cantidadFraccion = Number(params.data?.cantidad_fraccion ?? 0)
        const factor = (cantidad > 0 && cantidadFraccion > 0) ? cantidadFraccion / cantidad : 1
        const costoUnd = costoFrac * factor
        const unidad = params.data?.unidad || 'und'
        return (
          <div className='flex items-center h-full'>
            <span className='text-gray-700 font-semibold text-xs'>
              S/. {costoUnd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              <span className='text-gray-400 font-normal ml-1'>/ {unidad}</span>
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Costo Actual',
      field: 'costo_actual' as keyof MovimientoKardex,
      width: 160,
      minWidth: 130,
      cellRenderer: (params: any) => {
        const costoFrac = Number(params.value ?? 0)
        if (!costoFrac) return <span className='text-gray-400 text-xs'>-</span>
        const cantidad = Number(params.data?.cantidad ?? 0)
        const cantidadFraccion = Number(params.data?.cantidad_fraccion ?? 0)
        const factor = (cantidad > 0 && cantidadFraccion > 0) ? cantidadFraccion / cantidad : 1
        const costoUnd = costoFrac * factor
        const costoAnt = Number(params.data?.costo_anterior ?? 0)
        const costoAntUnd = costoAnt * factor
        const cambio = costoAntUnd > 0 ? ((costoUnd - costoAntUnd) / costoAntUnd) * 100 : 0
        const subio = cambio > 0.01
        const bajo = cambio < -0.01
        const unidad = params.data?.unidad || 'und'
        return (
          <div className='flex items-center h-full'>
            <span className={`font-bold text-xs ${subio ? 'text-rose-600' : bajo ? 'text-emerald-600' : 'text-emerald-700'}`}>
              S/. {costoUnd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              <span className='font-normal text-gray-500 ml-1'>/ {unidad}</span>
              {subio && <span className='ml-1 text-rose-500 text-[10px]'>▲{Math.abs(cambio).toFixed(1)}%</span>}
              {bajo && <span className='ml-1 text-emerald-500 text-[10px]'>▼{Math.abs(cambio).toFixed(1)}%</span>}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Stock Anterior',
      field: 'stock_anterior' as keyof MovimientoKardex,
      width: 115,
      minWidth: 100,
      type: 'numericColumn' as const,
      cellStyle: { color: '#6b7280', fontWeight: 'bold' },
      valueFormatter: (params: any) => {
        if (params.value == null) return '-'
        return Number(params.value).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (params.value == null) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoKardex>,
    {
      headerName: 'Cant. Ingreso',
      field: 'entrada' as keyof MovimientoKardex,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: (params: any) => {
        if (params.value > 0) return { color: '#16a34a', fontWeight: 'bold' }
        return null
      },
      valueFormatter: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.value).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoKardex>,
    {
      headerName: 'Cant. Salida',
      field: 'salida' as keyof MovimientoKardex,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: (params: any) => {
        if (params.value > 0) return { color: '#dc2626', fontWeight: 'bold' }
        return null
      },
      valueFormatter: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.value).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoKardex>,
    {
      headerName: 'Stock Actual',
      field: 'stock_actual' as keyof MovimientoKardex,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: { color: '#2563eb', fontWeight: 'bold' },
      valueFormatter: (params: any) => {
        if (params.value == null) return '-'
        return Number(params.value).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (params.value == null) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoKardex>,
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
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Proveedor</label>
            <SelectProveedores
              className='!min-w-[250px] !w-[250px] !max-w-[250px]'
              allowClear
              onChange={(_id, proveedor) => {
                setProveedorSeleccionado(proveedor ?? undefined)
              }}
              onSearch={(val) => setSearchText(val)}
            />
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

        {/* Aviso cuando no hay producto seleccionado */}
        {!productoSeleccionado && (
          <div className='flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200 text-sm text-blue-700'>
            <FaBoxOpen className='text-blue-400 flex-shrink-0' />
            <span>Selecciona un <strong>producto</strong> para ver el seguimiento de stock (Stock Antes / Stock Actual) y el saldo acumulado.</span>
          </div>
        )}

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
          id='kardex.inventario.movimientos.v2'
          title={productoId ? 'Movimientos de Inventario' : 'Todos los Movimientos de Hoy'}
          selectionColor={greenColors[10]}
          loading={isFetching || isSearching}
          columnDefs={columns}
          rowData={data?.data || []}
          pagination={false}
          persistColumnState={false}
          quickFilterText={debouncedSearchText}
          optionsSelectColumns={[
            {
              label: 'Default',
              columns: productoId
                ? ['Fecha', 'Proveedor', 'Tipo', 'Mov.', 'Documento', 'Unidad', 'Cantidad', 'Costo Anterior', 'Costo Actual', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual']
                : ['Fecha', 'Código', 'Producto', 'Proveedor', 'Tipo', 'Mov.', 'Documento', 'Unidad', 'Cantidad', 'Costo Anterior', 'Costo Actual', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual'],
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
