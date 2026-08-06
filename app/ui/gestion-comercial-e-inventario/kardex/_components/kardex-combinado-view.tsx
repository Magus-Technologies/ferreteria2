'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { DatePicker, Select, Tag } from 'antd'
import { FaClipboardList, FaBoxOpen, FaSearch } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { blueColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex, type TipoMovimientoInventario } from '~/lib/api/kardex'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'
import type { Proveedor } from '~/lib/api/proveedor'
import type { Cliente } from '~/lib/api/cliente'
import { GetStock } from '~/app/_utils/get-stock'

const { RangePicker } = DatePicker

type Origen = 'inventario' | 'facturacion'
type MovimientoCombinado = MovimientoKardex & { _origen: Origen; _fechaEfectiva: string }

// ---- Vocabulario de Inventario (fijo) ----
const tipoOptionsInventario = [
  { value: '', label: 'Todos' },
  { value: 'compra', label: 'Compras' },
  { value: 'recepcion', label: 'Recepciones' },
  { value: 'recepcion_anulada', label: 'Recepciones Anuladas' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'salida', label: 'Salidas' },
  { value: 'transferencia', label: 'Transferencias' },
  { value: 'cuadre', label: 'Cuadres' },
]

const tipoColorsInventario: Record<string, string> = {
  compra: 'green',
  recepcion: 'cyan',
  recepcion_anulada: 'volcano',
  ingreso: 'blue',
  salida: 'red',
  transferencia: 'orange',
  cuadre: 'purple',
  ingreso_anulado: 'purple',
  salida_anulada: 'purple',
}

const tipoLabelsInventario: Record<string, string> = {
  compra: 'Compra',
  recepcion: 'Recepcion',
  recepcion_anulada: 'Recepcion',
  ingreso: 'Ingreso',
  salida: 'Salida',
  transferencia: 'Transferencia',
  cuadre: 'Cuadre',
  ingreso_anulado: 'Cuadre',
  salida_anulada: 'Cuadre',
}

const movimientoColorsInventario: Record<string, string> = {
  ENTRADA: 'green',
  SALIDA: 'red',
  COMPRA: 'orange',
  REFERENCIA: 'blue',
  ANULACION: 'volcano',
  'ENTRADA ANULADO': 'magenta',
  'SALIDA ANULADO': 'purple',
  ANULADA_ENTRADA: 'volcano',
  ANULADA_SALIDA: 'geekblue',
  'SALIDA POR TRANSFERENCIA': 'orange',
  'ENTRADA POR TRANSFERENCIA': 'lime',
  'ENTRADA POR TRANSFERENCIA ANULADO': 'volcano',
  'SALIDA POR TRANSFERENCIA ANULADO': 'volcano',
}

const movimientoLabelsInventario: Record<string, string> = {
  ANULADA_ENTRADA: 'Anulada Entrada',
  ANULADA_SALIDA: 'Anulada Salida',
  'SALIDA POR TRANSFERENCIA': 'Salida Transf.',
  'ENTRADA POR TRANSFERENCIA': 'Entrada Transf.',
  'ENTRADA POR TRANSFERENCIA ANULADO': 'Entrada Transf. Anul.',
  'SALIDA POR TRANSFERENCIA ANULADO': 'Salida Transf. Anul.',
}

const esAnuladoInventario = (m: MovimientoKardex) => {
  const mov = String((m as any).movimiento || '').toUpperCase()
  const t = String((m as any).tipo || '').toLowerCase()
  return t.includes('anulad') || mov.includes('ANULA')
}

// ---- Vocabulario de Facturación (dinámico, se parsea del campo `movimiento`) ----
const tipoVentaColorsFacturacion: Record<string, string> = {
  'VENTA CONTADO': 'green',
  'VENTA CRÉDITO': 'gold',
  'COTIZACIÓN': 'blue',
  'PRÉSTAMO': 'orange',
  'GUÍA': 'purple',
  'ENTREGA': 'geekblue',
}

const estadoColorsFacturacion: Record<string, string> = {
  'VENTA': 'green',
  'VENTA RESERVADO': 'gold',
  'EDITADA': 'orange',
  'ANULADA': 'volcano',
  'AJUSTE POR EDICIÓN': 'purple',
  'DEVOLUCIÓN': 'cyan',
  'RECEPCIONADO': 'cyan',
  'ENTREGA ANULADA': 'magenta',
  'ANULADO': 'magenta',
  'RESERVADO': 'gold',
  'LIBERADA': 'cyan',
}

// `cantidadReservada` distingue una venta común de una que confirma una
// cotización con stock reservado (estado "VENTA RESERVADO") — igual que en
// facturacion-electronica/mi-almacen/_components/kardex-view.tsx.
const parseMovimientoFacturacion = (movimiento: string, cantidadReservada = 0) => {
  if (movimiento === 'ENTREGA ANULADA') return { tipo: 'ENTREGA', estado: 'ANULADO' }
  if (movimiento === 'ENTREGA') return { tipo: 'ENTREGA', estado: 'RECEPCIONADO' }
  if (movimiento === 'RESERVA COTIZACIÓN') return { tipo: 'COTIZACIÓN', estado: 'RESERVADO' }
  if (movimiento === 'RESERVA LIBERADA') return { tipo: 'COTIZACIÓN', estado: 'LIBERADA' }

  const ajusteMatch = movimiento.match(/^AJUSTE POR EDICIÓN \((CONTADO|CRÉDITO)\)$/)
  if (ajusteMatch) return { tipo: `VENTA ${ajusteMatch[1]}`, estado: 'AJUSTE POR EDICIÓN' }
  if (movimiento === 'AJUSTE POR EDICIÓN') return { tipo: '', estado: 'AJUSTE POR EDICIÓN' }

  const devolucionMatch = movimiento.match(/^DEVOLUCIÓN (CONTADO|CRÉDITO)$/)
  if (devolucionMatch) return { tipo: `VENTA ${devolucionMatch[1]}`, estado: 'ANULADO' }
  if (movimiento === 'DEVOLUCIÓN') return { tipo: 'VENTA CONTADO', estado: 'ANULADO' }
  if (movimiento === 'ENTRADA' || movimiento === 'SALIDA' || movimiento === 'REFERENCIA' || movimiento === 'ANULADO') {
    return { tipo: movimiento, estado: '' }
  }

  const match = movimiento.match(/^(VENTA CONTADO|VENTA CRÉDITO)\s*(?:\((EDITADA|ANULADA)\))?$/)
  if (match) return { tipo: match[1], estado: match[2] || (cantidadReservada > 0 ? 'VENTA RESERVADO' : 'VENTA') }

  return { tipo: movimiento, estado: '' }
}

// ---- Helpers unificados (dependen del origen de la fila) ----
function getTipoLabel(m: MovimientoCombinado): { label: string; color: string } {
  if (m._origen === 'inventario') {
    const t = m.tipo || ''
    return { label: tipoLabelsInventario[t] || t, color: tipoColorsInventario[t] || 'default' }
  }
  const { tipo } = parseMovimientoFacturacion(m.movimiento || '')
  return { label: tipo, color: tipoVentaColorsFacturacion[tipo] || 'default' }
}

function getDetalleLabel(m: MovimientoCombinado): { label: string; color: string } {
  if (m._origen === 'inventario') {
    const mov = m.movimiento || ''
    return { label: movimientoLabelsInventario[mov] || mov, color: movimientoColorsInventario[mov] || 'default' }
  }
  const { estado } = parseMovimientoFacturacion(m.movimiento || '', Number(m.cantidad_reservada ?? 0))
  return { label: estado, color: estadoColorsFacturacion[estado] || 'default' }
}

// Fecha efectiva: algunos movimientos de inventario (ingresos/cuadre) guardan `fecha`
// a medianoche (00:00) — en ese caso la hora real está en `created_at`. Se usa para
// ordenar el combinado correctamente y para mostrar la hora real en la columna Fecha.
function fechaEfectiva(m: MovimientoKardex): string {
  const f = m.fecha ? String(m.fecha) : ''
  const createdAt = (m as any).created_at
  const esMedianoche = f ? (dayjs(f).hour() === 0 && dayjs(f).minute() === 0 && dayjs(f).second() === 0) : false
  return (!f || esMedianoche) ? (createdAt || f) : f
}

export default function KardexCombinadoView() {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>()
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor>()
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente>()
  const [tipoInventario, setTipoInventario] = useState<TipoMovimientoInventario | ''>('')
  const [estadoInventario, setEstadoInventario] = useState<'' | 'activos' | 'anulados'>('')
  const [tiposFacturacion, setTiposFacturacion] = useState<string[]>([])
  const [estadosFacturacion, setEstadosFacturacion] = useState<string[]>([])
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  const productoId = productoSeleccionado?.id
  const proveedorId = proveedorSeleccionado?.id
  const clienteId = clienteSeleccionado?.id
  const desde = fechas?.[0]?.format('YYYY-MM-DD')
  const hasta = fechas?.[1]?.format('YYYY-MM-DD')

  const { data: dataInventario, isFetching: fetchingInventario } = useQuery({
    queryKey: [QueryKeys.KARDEX_INVENTARIO, productoId, proveedorId, almacenId, tipoInventario, desde, hasta, searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosInventario({
        producto_id: productoId,
        proveedor_id: proveedorId,
        almacen_id: almacenId || undefined,
        tipo: tipoInventario || undefined,
        desde,
        hasta,
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    staleTime: 0,
  })

  const { data: dataFacturacion, isFetching: fetchingFacturacion } = useQuery({
    queryKey: [QueryKeys.KARDEX, productoId, clienteId, almacenId, desde, hasta, searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientos({
        producto_id: productoId || undefined as any,
        cliente_id: clienteId || undefined as any,
        almacen_id: almacenId || undefined,
        desde,
        hasta,
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    staleTime: 0,
  })

  const isFetching = fetchingInventario || fetchingFacturacion

  // Opciones de Tipo/Estado de facturación, derivadas de los datos cargados (dinámico)
  const { tipoOptionsFacturacion, estadoOptionsFacturacion } = useMemo(() => {
    const tipos = new Set<string>()
    const estados = new Set<string>()
    for (const m of dataFacturacion?.data || []) {
      const { tipo, estado } = parseMovimientoFacturacion(m.movimiento || '', Number(m.cantidad_reservada ?? 0))
      if (tipo) tipos.add(tipo)
      if (estado) estados.add(estado)
    }
    const toOptions = (set: Set<string>) => Array.from(set).sort().map((v) => ({ value: v, label: v }))
    return { tipoOptionsFacturacion: toOptions(tipos), estadoOptionsFacturacion: toOptions(estados) }
  }, [dataFacturacion])

  // Combinar ambas fuentes + aplicar filtros client-side (Estado Inventario, Tipo/Estado Facturación)
  const movimientos: MovimientoCombinado[] = useMemo(() => {
    const rowsInventario = (dataInventario?.data || [])
      .filter((m) => !estadoInventario || (estadoInventario === 'anulados' ? esAnuladoInventario(m) : !esAnuladoInventario(m)))
      .map((m) => ({ ...m, _origen: 'inventario' as const, _fechaEfectiva: fechaEfectiva(m) }))

    const rowsFacturacion = (dataFacturacion?.data || [])
      .filter((m) => {
        if (tiposFacturacion.length === 0 && estadosFacturacion.length === 0) return true
        const { tipo, estado } = parseMovimientoFacturacion(m.movimiento || '', Number(m.cantidad_reservada ?? 0))
        const okTipo = tiposFacturacion.length === 0 || tiposFacturacion.includes(tipo)
        const okEstado = estadosFacturacion.length === 0 || estadosFacturacion.includes(estado)
        return okTipo && okEstado
      })
      .map((m) => ({ ...m, _origen: 'facturacion' as const, _fechaEfectiva: fechaEfectiva(m) }))

    return [...rowsInventario, ...rowsFacturacion].sort((a, b) => {
      const fa = dayjs(a._fechaEfectiva).valueOf()
      const fb = dayjs(b._fechaEfectiva).valueOf()
      return fb - fa
    })
  }, [dataInventario, dataFacturacion, estadoInventario, tiposFacturacion, estadosFacturacion])

  const columns: ColDef<MovimientoCombinado>[] = [
    {
      headerName: 'Fecha',
      field: '_fechaEfectiva',
      width: 200,
      minWidth: 180,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
    },
    {
      headerName: 'Origen',
      field: '_origen',
      width: 120,
      minWidth: 110,
      cellRenderer: (params: any) => (
        <div className='flex items-center h-full'>
          <Tag color={params.value === 'inventario' ? 'green' : 'orange'} className='!m-0'>
            {params.value === 'inventario' ? 'Inventario' : 'Facturación'}
          </Tag>
        </div>
      ),
    },
    ...(!productoId ? [
      {
        headerName: 'Código',
        field: 'producto_codigo' as keyof MovimientoCombinado,
        width: 120,
        minWidth: 100,
        cellStyle: { color: '#2563eb', fontWeight: 'bold' },
      },
      {
        headerName: 'Producto',
        field: 'producto_nombre' as keyof MovimientoCombinado,
        flex: 1,
        minWidth: 200,
      },
    ] : []),
    {
      headerName: 'Proveedor',
      field: 'proveedor_nombre' as keyof MovimientoCombinado,
      width: 170,
      minWidth: 150,
      cellStyle: { color: '#059669', fontStyle: 'italic' },
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Cliente',
      field: 'cliente_nombre' as keyof MovimientoCombinado,
      width: 170,
      minWidth: 150,
      cellStyle: { color: '#0891b2', fontStyle: 'italic' },
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Tipo',
      colId: 'tipo_combinado',
      width: 140,
      minWidth: 120,
      valueGetter: (params: any) => getTipoLabel(params.data).label,
      cellRenderer: (params: any) => {
        const { label, color } = getTipoLabel(params.data)
        if (!label) return null
        return (
          <div className='flex items-center h-full'>
            <Tag color={color} className='!m-0 text-xs'>{label}</Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Detalle',
      colId: 'detalle_combinado',
      width: 150,
      minWidth: 130,
      valueGetter: (params: any) => getDetalleLabel(params.data).label,
      cellRenderer: (params: any) => {
        const { label, color } = getDetalleLabel(params.data)
        if (!label) return null
        return (
          <div className='flex items-center h-full'>
            <Tag color={color} className='!m-0 text-xs'>{label}</Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Documento',
      field: 'documento',
      width: 220,
      minWidth: 200,
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      width: 100,
      minWidth: 90,
    },
    {
      headerName: 'Cantidades',
      field: 'cantidad_total' as keyof MovimientoCombinado,
      width: 90,
      minWidth: 80,
      type: 'numericColumn',
      valueGetter: (params: any) => params.data?.cantidad_total ?? params.data?.cantidad,
      valueFormatter: (params) => params.value ? Number(params.value).toFixed(2) : '-',
    },
    {
      headerName: 'P. Venta',
      field: 'precio',
      width: 100,
      minWidth: 90,
      type: 'numericColumn',
      valueFormatter: (params) => (!params.value ? '-' : `S/. ${Number(params.value).toFixed(2)}`),
    },
    {
      headerName: 'Costo Anterior',
      field: 'costo_anterior' as keyof MovimientoCombinado,
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
      field: 'costo_actual' as keyof MovimientoCombinado,
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
      field: 'stock_anterior' as keyof MovimientoCombinado,
      width: 115,
      minWidth: 100,
      type: 'numericColumn' as const,
      cellStyle: { color: '#6b7280', fontWeight: 'bold' },
      cellRenderer: (params: any) => {
        if (params.value == null) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoCombinado>,
    {
      headerName: 'Cant. Ingreso',
      field: 'entrada' as keyof MovimientoCombinado,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellRenderer: (params: any) => {
        if (!Number(params.value)) return <span>-</span>
        const cantidad = Number(params.data?.cantidad ?? 0)
        const unidad = params.data?.unidad || ''
        return (
          <div className='flex items-center h-full'>
            <span className='text-emerald-600 font-bold text-xs'>{cantidad} <span className='font-normal text-gray-500'>{unidad}</span></span>
          </div>
        )
      }
    } as ColDef<MovimientoCombinado>,
    {
      headerName: 'Cant. Salida',
      field: 'salida' as keyof MovimientoCombinado,
      width: 130,
      minWidth: 110,
      type: 'numericColumn' as const,
      cellRenderer: (params: any) => {
        // La ENTREGA nunca mueve el acumulador (salida=0 siempre, ver
        // backend), pero sigue siendo una salida real de mercadería — por
        // eso acá se muestra igual que su venta pareja, aunque el campo
        // crudo `salida` esté en 0.
        const esEntrega = params.data?.tipo === 'entrega'
        if (!esEntrega && !Number(params.value)) return <span>-</span>
        const total = Number(params.data?.cantidad_total ?? params.data?.cantidad ?? 0)
        if (!total) return <span>-</span>
        const reservada = Number(params.data?.cantidad_reservada ?? 0)
        const unidad = params.data?.unidad || ''
        return (
          <div className='flex items-center h-full'>
            <span className='text-red-600 font-bold text-xs'>
              {total} {reservada > 0 && <span className='font-normal text-red-400'>({reservada})</span>} <span className='font-normal text-gray-500'>{unidad}</span>
            </span>
          </div>
        )
      }
    } as ColDef<MovimientoCombinado>,
    {
      headerName: 'Stock Actual',
      field: 'stock_actual' as keyof MovimientoCombinado,
      width: 110,
      minWidth: 90,
      type: 'numericColumn' as const,
      cellStyle: { color: '#2563eb', fontWeight: 'bold' },
      cellRenderer: (params: any) => {
        if (params.value == null) return '-'
        return (
          <GetStock
            stock_fraccion={Number(params.value)}
            unidades_contenidas={Number(params.data?.unidades_contenidas ?? 0)}
          />
        )
      }
    } as ColDef<MovimientoCombinado>,
  ]

  const totalIngreso = movimientos.reduce((sum, m) => sum + Number(m.entrada ?? 0), 0)
  const totalSalida = movimientos.reduce((sum, m) => sum + Number(m.salida ?? 0), 0)
  const stockActual = dataInventario?.stock_actual ?? dataFacturacion?.stock_actual

  return (
    <div className='flex flex-col gap-4 w-full'>
      {/* Filtros */}
      <div className='bg-white rounded-xl border p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 mb-1'>
          <FaClipboardList size={18} className='text-blue-600' />
          <span className='font-bold text-gray-800'>Kardex Combinado — Inventario + Facturación</span>
        </div>

        <div className='flex flex-wrap gap-3 items-end'>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Producto</label>
            <SelectProductos
              withSearch
              withTipoBusqueda
              classNameTipoBusqueda='!min-w-[150px] !w-[150px] !max-w-[150px]'
              className='!min-w-[250px] !w-[250px] !max-w-[250px]'
              allowClear
              showUltimasCompras={false}
              selectionColor={blueColors[10]}
              onChange={(_id, producto) => {
                setProductoSeleccionado(producto ?? undefined)
                if (!producto) setSearchText('')
              }}
              onSearch={(val) => setSearchText(val)}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Proveedor</label>
            <SelectProveedores
              className='!min-w-[200px] !w-[200px]'
              allowClear
              onChange={(_id, proveedor) => setProveedorSeleccionado(proveedor ?? undefined)}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Cliente</label>
            <SelectClientes
              className='!min-w-[200px] !w-[200px]'
              allowClear
              open={false}
              searchOnEnterOnly
              onChange={(_id, cliente) => setClienteSeleccionado(cliente ?? undefined)}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Tipo (Inventario)</label>
            <Select
              className='!min-w-[150px] !w-[150px]'
              value={tipoInventario}
              onChange={(v) => setTipoInventario(v as TipoMovimientoInventario | '')}
              options={tipoOptionsInventario}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Estado (Inventario)</label>
            <Select
              className='!min-w-[140px] !w-[140px]'
              value={estadoInventario}
              onChange={(v) => setEstadoInventario(v as '' | 'activos' | 'anulados')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'activos', label: 'Activos' },
                { value: 'anulados', label: 'Anulados' },
              ]}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Tipo (Facturación)</label>
            <Select
              mode='multiple'
              allowClear
              placeholder='Todos'
              className='!min-w-[170px] !w-[170px]'
              maxTagCount='responsive'
              value={tiposFacturacion}
              onChange={setTiposFacturacion}
              options={tipoOptionsFacturacion}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Estado (Facturación)</label>
            <Select
              mode='multiple'
              allowClear
              placeholder='Todos'
              className='!min-w-[170px] !w-[170px]'
              maxTagCount='responsive'
              value={estadosFacturacion}
              onChange={setEstadosFacturacion}
              options={estadoOptionsFacturacion}
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

        {!productoSeleccionado && (
          <div className='flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200 text-sm text-blue-700'>
            <FaBoxOpen className='text-blue-400 flex-shrink-0' />
            <span>Selecciona un <strong>producto</strong> para ver el seguimiento de stock combinado (inventario + ventas) y el saldo acumulado.</span>
          </div>
        )}

        {productoSeleccionado && (
          <div className='flex items-center gap-4 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200'>
            <FaBoxOpen className='text-blue-500' />
            <div className='flex-1 min-w-0'>
              <span className='font-semibold text-gray-800 truncate'>{productoSeleccionado.name}</span>
              <span className='text-gray-500 ml-2 text-sm'>({productoSeleccionado.cod_producto})</span>
            </div>
            <div className='flex items-center gap-4 text-sm flex-shrink-0'>
              <div className='text-center'>
                <div className='text-xs text-gray-500'>Total Ingresó</div>
                <div className='font-bold text-lg text-emerald-600'>{totalIngreso.toFixed(2)}</div>
              </div>
              <div className='text-center'>
                <div className='text-xs text-gray-500'>Total Salió</div>
                <div className='font-bold text-lg text-red-500'>{totalSalida.toFixed(2)}</div>
              </div>
              {stockActual != null && (
                <div className='text-center'>
                  <div className='text-xs text-gray-500'>Stock Actual</div>
                  <div className='font-bold text-lg text-blue-600'>{Number(stockActual).toFixed(2)}</div>
                </div>
              )}
              <div className='text-center'>
                <div className='text-xs text-gray-500'>Movimientos</div>
                <div className='font-bold text-lg text-gray-700'>{movimientos.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className='h-[calc(100vh-380px)] min-h-[300px]'>
        <TableWithTitle<MovimientoCombinado>
          id='kardex.combinado.movimientos.v1'
          title={productoId ? 'Movimientos Combinados' : 'Todos los Movimientos de Hoy'}
          selectionColor={blueColors[10]}
          loading={isFetching || isSearching}
          columnDefs={columns}
          rowData={movimientos}
          pagination={false}
          persistColumnState={false}
          quickFilterText={debouncedSearchText}
          optionsSelectColumns={[
            {
              label: 'Default',
              columns: productoId
                ? ['Fecha', 'Origen', 'Proveedor', 'Cliente', 'Tipo', 'Detalle', 'Documento', 'Unidad', 'Cantidades', 'P. Venta', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual']
                : ['Fecha', 'Origen', 'Código', 'Producto', 'Proveedor', 'Cliente', 'Tipo', 'Detalle', 'Documento', 'Unidad', 'Cantidades', 'P. Venta', 'Stock Anterior', 'Cant. Ingreso', 'Cant. Salida', 'Stock Actual'],
            },
          ]}
        />
      </div>
      <div className='flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-1.5 min-h-[32px]'>
        {(isFetching || isSearching) && (
          <div className='text-xs text-gray-500 text-center'>Cargando movimientos...</div>
        )}
      </div>
    </div>
  )
}
