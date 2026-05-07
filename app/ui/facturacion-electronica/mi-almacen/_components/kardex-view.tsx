'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { DatePicker, Tag } from 'antd'
import { FaClipboardList, FaBoxOpen, FaSearch } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex } from '~/lib/api/kardex'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'
import type { Cliente } from '~/lib/api/cliente'
import { GetStock } from '~/app/_utils/get-stock'

const { RangePicker } = DatePicker

const tipoVentaColors: Record<string, string> = {
  'VENTA CONTADO': 'green',
  'VENTA CRÉDITO': 'gold',
  'COTIZACIÓN': 'blue',
  'PRÉSTAMO': 'orange',
  'GUÍA': 'purple',
}

const estadoColors: Record<string, string> = {
  'VENTA': 'green',
  'EDITADA': 'orange',
  'ANULADA': 'volcano',
  'AJUSTE POR EDICIÓN': 'purple',
  'DEVOLUCIÓN': 'cyan',
}

// Función para parsear el movimiento y extraer tipo y estado
const parseMovimiento = (movimiento: string) => {
  // Casos especiales con tipo de venta
  // "AJUSTE POR EDICIÓN (CONTADO)" o "AJUSTE POR EDICIÓN (CRÉDITO)"
  const ajusteMatch = movimiento.match(/^AJUSTE POR EDICIÓN \((CONTADO|CRÉDITO)\)$/)
  if (ajusteMatch) {
    return {
      tipo: `VENTA ${ajusteMatch[1]}`, // "VENTA CONTADO" o "VENTA CRÉDITO"
      estado: 'AJUSTE POR EDICIÓN',
    }
  }

  // Casos especiales sin tipo de venta
  if (movimiento === 'AJUSTE POR EDICIÓN') {
    return { tipo: '', estado: 'AJUSTE POR EDICIÓN' }
  }
  if (movimiento === 'DEVOLUCIÓN') {
    return { tipo: '', estado: 'DEVOLUCIÓN' }
  }
  if (movimiento === 'ENTRADA' || movimiento === 'SALIDA' || movimiento === 'REFERENCIA' || movimiento === 'ANULADO') {
    return { tipo: movimiento, estado: '' }
  }

  // Patrones: "VENTA CONTADO (EDITADA)", "VENTA CRÉDITO (ANULADA)", etc.
  const match = movimiento.match(/^(VENTA CONTADO|VENTA CRÉDITO)\s*(?:\((EDITADA|ANULADA)\))?$/)
  if (match) {
    return {
      tipo: match[1], // "VENTA CONTADO" o "VENTA CRÉDITO"
      estado: match[2] || 'VENTA', // "EDITADA", "ANULADA" o "VENTA" si está vacío
    }
  }

  // Si no coincide con ningún patrón, devolver como está
  return { tipo: movimiento, estado: '' }
}

export default function KardexView() {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>()
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente>()
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  const productoId = productoSeleccionado?.id
  const clienteId = clienteSeleccionado?.id

  const { data, isFetching, refetch } = useQuery({
    queryKey: [QueryKeys.KARDEX, productoId, clienteId, almacenId, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD'), searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientos({
        producto_id: productoId || undefined as any,
        cliente_id: clienteId || undefined as any,
        almacen_id: almacenId || undefined,
        desde: fechas?.[0]?.format('YYYY-MM-DD'),
        hasta: fechas?.[1]?.format('YYYY-MM-DD'),
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: true,
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
        cellStyle: { color: '#f97316', fontWeight: 'bold' },
      },
      {
        headerName: 'Producto',
        field: 'producto_nombre' as keyof MovimientoKardex,
        flex: 1,
        minWidth: 200,
      },
    ] : []),
    {
      headerName: 'Cliente',
      field: 'cliente_nombre' as keyof MovimientoKardex,
      width: 180,
      minWidth: 150,
      cellStyle: { color: '#0891b2', fontStyle: 'italic' },
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Tipo',
      field: 'movimiento',
      width: 150,
      minWidth: 130,
      valueGetter: (params: any) => {
        const { tipo } = parseMovimiento(params.data?.movimiento || '')
        return tipo
      },
      cellRenderer: (params: any) => {
        const { tipo } = parseMovimiento(params.data?.movimiento || '')
        if (!tipo) return null
        return (
          <div className='flex items-center h-full'>
            <Tag color={tipoVentaColors[tipo] || 'default'} className='!m-0 text-xs'>
              {tipo}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Estado',
      field: 'movimiento',
      width: 170,
      minWidth: 150,
      valueGetter: (params: any) => {
        const { estado } = parseMovimiento(params.data?.movimiento || '')
        return estado
      },
      cellRenderer: (params: any) => {
        const { estado } = parseMovimiento(params.data?.movimiento || '')
        if (!estado) return null
        return (
          <div className='flex items-center h-full'>
            <Tag color={estadoColors[estado] || 'default'} className='!m-0 text-xs'>
              {estado}
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
      headerName: 'P. Venta',
      field: 'precio',
      width: 100,
      minWidth: 90,
      type: 'numericColumn',
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return `S/. ${Number(params.value).toFixed(2)}`
      },
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
      valueFormatter: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.data?.cantidad ?? 0).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (!params.value || params.value === 0) return <span>-</span>
        const cantidad = Number(params.data?.cantidad ?? 0)
        const unidad = params.data?.unidad || ''
        return (
          <div className='flex items-center h-full'>
            <span className='text-emerald-600 font-bold text-xs'>{cantidad} <span className='font-normal text-gray-500'>{unidad}</span></span>
          </div>
        )
      }
    } as ColDef<MovimientoKardex>,
    {
      headerName: 'Cant. Salida',
      field: 'salida' as keyof MovimientoKardex,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      valueFormatter: (params: any) => {
        if (!params.value || params.value === 0) return '-'
        return Number(params.data?.cantidad ?? 0).toFixed(2)
      },
      cellRenderer: (params: any) => {
        if (!params.value || params.value === 0) return <span>-</span>
        const cantidad = Number(params.data?.cantidad ?? 0)
        const unidad = params.data?.unidad || ''
        return (
          <div className='flex items-center h-full'>
            <span className='text-red-600 font-bold text-xs'>{cantidad} <span className='font-normal text-gray-500'>{unidad}</span></span>
          </div>
        )
      }
    } as ColDef<MovimientoKardex>,
    {
      headerName: 'Stock Actual',
      field: 'stock_actual' as keyof MovimientoKardex,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: { color: '#ea580c', fontWeight: 'bold' },
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
          <FaClipboardList size={18} className='text-orange-600' />
          <span className='font-bold text-gray-800'>Kardex de Productos</span>
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
                selectionColor={orangeColors[10]}
                onChange={(_id, producto) => {
                  setProductoSeleccionado(producto ?? undefined)
                  if (!producto) setSearchText('')
                }}
                onSearch={(val) => setSearchText(val)}
              />
            </div>
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Cliente</label>
            <SelectClientes
              className='!min-w-[250px] !w-[250px] !max-w-[250px]'
              allowClear
              onChange={(_id, cliente) => {
                setClienteSeleccionado(cliente ?? undefined)
              }}
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
            <span>Selecciona un <strong>producto</strong> para ver el seguimiento de stock (Stock Anterior / Stock Actual) y el saldo acumulado.</span>
          </div>
        )}

        {/* Info del producto seleccionado */}
        {productoSeleccionado && (
          <div className='flex items-center gap-4 bg-orange-50 rounded-lg px-4 py-2 border border-orange-200'>
            <FaBoxOpen className='text-orange-500' />
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
                  <div className='font-bold text-lg text-orange-600'>{data.stock_actual.toFixed(2)}</div>
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
          id='kardex.movimientos.facturacion.v2'
          title={productoId ? 'Movimientos' : 'Todos los Movimientos de Hoy'}
          selectionColor={orangeColors[10]}
          loading={isFetching || isSearching}
          columnDefs={columns}
          rowData={data?.data || []}
          pagination={false}
          persistColumnState={false}
          quickFilterText={debouncedSearchText}
          getRowStyle={(params) => {
            const movimiento = (params.data as MovimientoKardex)?.movimiento
            const { estado } = parseMovimiento(movimiento || '')
            
            if (estado === 'ANULADA') {
              return { background: '#fef2f2' } as any
            }
            if (estado === 'DEVOLUCIÓN') {
              return { background: '#ecfdf5' }
            }
            return undefined
          }}
          optionsSelectColumns={[
            {
              label: 'Default',
              columns: productoId
                ? ['Fecha', 'Cliente', 'Tipo', 'Estado', 'Documento', 'Unidad', 'Cantidad', 'P. Venta', 'Costo Anterior', 'Costo Actual', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual']
                : ['Fecha', 'Código', 'Producto', 'Cliente', 'Tipo', 'Estado', 'Documento', 'Unidad', 'Cantidad', 'P. Venta', 'Costo Anterior', 'Costo Actual', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual'],
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
