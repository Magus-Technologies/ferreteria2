'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useEffect } from 'react'
import { redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { VentaCreateInputSchema } from '~/types/zod-schemas'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { useQuery } from '@tanstack/react-query'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import type { MoraRango } from '../../_store/store-filtros-ventas-por-cobrar'
import dayjs from 'dayjs'
import { create } from 'zustand'

// Store para la venta seleccionada
type UseStoreVentaSeleccionada = {
  venta: VentaCompleta | undefined
  setVenta: (venta: VentaCompleta | undefined) => void
}

export const useStoreVentaSeleccionada = create<UseStoreVentaSeleccionada>((set) => ({
  venta: undefined,
  setVenta: (venta) => set({ venta }),
}))

// Store para las ventas filtradas (para el reporte)
type UseStoreVentasFiltradas = {
  ventas: VentaCompleta[]
  setVentas: (ventas: VentaCompleta[]) => void
}

export const useStoreVentasFiltradas = create<UseStoreVentasFiltradas>((set) => ({
  ventas: [],
  setVentas: (ventas) => set({ ventas }),
}))

// Calcula días de mora: positivo = vencida, negativo = aún no vence
function calcularMora(venta: VentaCompleta): number {
  const ref = venta.fecha_vencimiento || venta.fecha
  return dayjs().startOf('day').diff(dayjs(ref).startOf('day'), 'days')
}

function aplicarFiltroMora(ventas: VentaCompleta[], rango: MoraRango): VentaCompleta[] {
  if (rango === 'todas') return ventas
  if (rango === 'hoy') return ventas.filter(v => calcularMora(v) === 0)
  if (rango === 'vencidas') return ventas.filter(v => calcularMora(v) > 0)
  return ventas.filter(v => { const m = calcularMora(v); return m >= -(rango as number) && m <= (rango as number) })
}

const TableVentasPorCobrar = memo(function TableVentasPorCobrar() {
  const tableRef = useRef<AgGridReact>(null)

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)
  const moraRango = useStoreFiltrosVentasPorCobrar(state => state.moraRango)

  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    let search: string | undefined
    if (filtros.OR && Array.isArray(filtros.OR)) {
      const serieFilter = filtros.OR.find((f: any) => f?.serie?.contains)
      if (serieFilter) search = (serieFilter as any).serie.contains as string
    }
    const fechaFiltro = (filtros as any).fecha
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      cliente_id: filtros.cliente_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde: fechaFiltro?.gte as string | undefined,
      hasta: fechaFiltro?.lte as string | undefined,
      search,
      per_page: -1,
    }
  }, [filtros])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar(apiFilters)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 0,
  })

  const rowData = useMemo(() => {
    const ventas = data?.data ?? []
    const filtradas = aplicarFiltroMora(ventas, moraRango)
    return [...filtradas].sort((a, b) => Number(b.id) - Number(a.id))
  }, [data?.data, moraRango])

  // Función para calcular el total de una venta
  const calcularTotalVenta = useCallback((venta: VentaCompleta) => {
    return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const precio = Number(u.precio ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precio * cantidad) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }, [])

  // Definir columnas específicas para ventas por cobrar
  const columns: ColDef<VentaCompleta>[] = useMemo(() => [
    {
      headerName: 'Fecha y Hora',
      width: 150,
      valueGetter: (params: any) => {
        const val = params.data?.created_at || params.data?.fecha
        if (!val) return ''
        return dayjs(val).format('DD/MM/YYYY hh:mm A')
      },
    },
    {
      headerName: 'Documento',
      width: 120,
      valueGetter: (params: any) => {
        const tipoDoc = params.data?.tipo_documento as string
        const tipoDocMap: Record<string, string> = {
          '01': 'Factura',
          '03': 'Boleta',
          'nv': 'Nota de Venta',
        }
        return tipoDocMap[tipoDoc] || tipoDoc || ''
      },
    },
    {
      headerName: 'Serie-Correl',
      width: 140,
      valueGetter: (params: any) => {
        const serie = params.data?.serie || ''
        const numero = params.data?.numero || ''
        return serie && numero ? `${serie}-${numero}` : ''
      },
    },
    {
      headerName: 'Doc. Cliente',
      width: 120,
      valueGetter: (params) => params.data?.cliente?.numero_documento || '',
    },
    {
      headerName: 'Cliente',
      width: 300,
      valueGetter: (params: any) => {
        const cliente = params.data?.cliente
        if (!cliente) return ''
        // Priorizar razon_social, si no existe usar nombres + apellidos
        return cliente.razon_social ||
          `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
      },
    },
    {
      headerName: 'Detalle',
      width: 200,
      valueGetter: (params: any) => {
        const venta = params.data as VentaCompleta
        if (!venta?.productos_por_almacen || venta.productos_por_almacen.length === 0) {
          return 'Sin productos'
        }
        
        const totalProductos = venta.productos_por_almacen.length
        
        if (totalProductos === 1) {
          return `1 producto`
        } else {
          return `${totalProductos} productos`
        }
      },
    },
    {
      headerName: 'Registra',
      width: 150,
      valueGetter: (params) => params.data?.user?.name || '',
    },
    {
      headerName: 'Total',
      width: 120,
      cellRenderer: (params: any) => {
        const venta = params.data as VentaCompleta
        if (!venta) return 'S/. 0.00'
        
        const total = calcularTotalVenta(venta)
        return `S/. ${total.toFixed(2)}`
      },
    },
    {
      headerName: 'Paga',
      width: 120,
      valueGetter: (params: any) => {
        const pagado = Number(params.data?.total_cobrado || 0)
        return `S/. ${pagado.toFixed(2)}`
      },
    },
    {
      headerName: 'Saldo',
      width: 120,
      cellRenderer: (params: any) => {
        const venta = params.data as VentaCompleta
        if (!venta) return 'S/. 0.00'
        
        const total = calcularTotalVenta(venta)
        const totalPagado = Number(venta.total_cobrado || 0)
        const saldo = total - totalPagado
        
        return `S/. ${saldo.toFixed(2)}`
      },
    },
    {
      headerName: 'Mon.',
      width: 80,
      valueGetter: () => 'PEN',
    },
    {
      headerName: 'Moras',
      width: 80,
      cellRenderer: (params: any) => {
        const mora = calcularMora(params.data as VentaCompleta)
        if (mora <= 0) return <span className='text-black'>{mora}</span>
        return <span className='text-black font-bold'>{mora}</span>
      },
      valueGetter: (params: any) => calcularMora(params.data as VentaCompleta),
    },
  ], [calcularTotalVenta])

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<VentaCompleta>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      const selectedVenta = selectedNodes?.[0]?.data as VentaCompleta
      useStoreVentaSeleccionada.getState().setVenta(selectedVenta)
    },
    []
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<VentaCompleta>) => {
      console.log('Doble click en venta:', event.data)
    },
    []
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<VentaCompleta>) => {
      event.node.setSelected(true)
    },
    []
  )

  // Memoizar opciones de columnas para evitar recreaciones
  const optionsSelectColumns = useMemo(
    () => [
      {
        label: 'Default',
        columns: [
          'Fecha',
          'Documento',
          'Serie-Correl',
          'Doc. Cliente',
          'Cliente',
          'Detalle',
          'Registra',
          'Total',
          'Paga',
          'Saldo',
          'Mon.',
          'Moras',
        ],
      },
    ],
    []
  )


  // Seleccionar automáticamente la primera fila cuando se cargan los datos
  useEffect(() => {
    if (rowData && rowData.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
        }
      }, 100);
    }
  }, [rowData]);

  // Actualizar el store de ventas filtradas para el reporte
  useEffect(() => {
    useStoreVentasFiltradas.getState().setVentas(rowData)
  }, [rowData])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <TableWithTitle<VentaCompleta>
      id='table-ventas-por-cobrar'
      selectionColor={redColors[1]}
      onSelectionChanged={handleSelectionChanged}
      onRowClicked={handleRowClicked}
      onRowDoubleClicked={handleRowDoubleClicked}
      tableRef={tableRef}
      title='Facturas de Ventas Vencidas'
      schema={VentaCreateInputSchema}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      optionsSelectColumns={optionsSelectColumns}
      exportExcel={true}
      exportPdf={true}
      selectColumns={true}
      suppressRowTransform={true}
      rowBuffer={10}
    >
    </TableWithTitle>
  )
})

export default TableVentasPorCobrar
