'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { VentaCreateInputSchema } from '~/prisma/generated/zod'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { useQuery } from '@tanstack/react-query'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
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

const TableVentasPorCobrar = memo(function TableVentasPorCobrar() {
  const tableRef = useRef<AgGridReact>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    // Extraer fechas
    const fechaFilter = filtros.fecha as any;
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined;
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined;

    // Extraer búsqueda del filtro OR
    let search: string | undefined;
    if (filtros.OR && Array.isArray(filtros.OR)) {
      const serieFilter = filtros.OR.find((filter: any) => filter.serie && typeof filter.serie === 'object' && filter.serie.contains);
      if (serieFilter && serieFilter.serie && typeof serieFilter.serie === 'object' && typeof serieFilter.serie.contains === 'string') {
        search = serieFilter.serie.contains as string;
      }
    }

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      cliente_id: filtros.cliente_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
      search,
      per_page: pageSize,
      page,
    }
  }, [filtros, page])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar(apiFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const totalPages = data?.last_page ?? 0
  const total = data?.total ?? 0
  
  // The backend already filters for credit sales with pending balance
  const rowData = useMemo(() => {
    return data?.data ?? []
  }, [data?.data])

  // Función para calcular el total de una venta
  const calcularTotalVenta = useCallback((venta: VentaCompleta) => {
    return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
      const precioUnitario = Number(item.precio_unitario ?? 0)
      for (const u of item.unidades_derivadas ?? []) {
        const cantidad = Number(u.cantidad ?? 0)
        const factor = Number(u.factor ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precioUnitario * cantidad * factor) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }, [])

  // Definir columnas específicas para ventas por cobrar
  const columns: ColDef<VentaCompleta>[] = useMemo(() => [
    {
      headerName: 'Fecha',
      width: 120,
      valueGetter: (params) => {
        if (!params.data?.fecha) return ''
        return dayjs(params.data.fecha).format('DD/MM/YYYY')
      },
    },
    {
      headerName: 'Documento',
      width: 120,
      valueGetter: (params) => {
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
      valueGetter: (params) => {
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
      valueGetter: (params) => {
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
      valueGetter: (params) => {
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
      valueGetter: (params) => {
        const pagado = Number(params.data?.total_pagado || 0)
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
        const totalPagado = Number(venta.total_pagado || 0)
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
        const venta = params.data as VentaCompleta
        if (!venta?.fecha) return '0'
        
        const fechaVenta = dayjs(venta.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaVenta, 'days')
        
        return diasVencidos > 0 ? diasVencidos.toString() : '0'
      },
      cellStyle: (params: any) => {
        const venta = params.data as VentaCompleta
        if (!venta?.fecha) return null
        
        const fechaVenta = dayjs(venta.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaVenta, 'days')
        
        if (diasVencidos > 30) {
          return { color: '#dc2626', fontWeight: 'bold' }
        } else if (diasVencidos > 15) {
          return { color: '#ea580c', fontWeight: 'bold' }
        } else if (diasVencidos > 0) {
          return { color: '#ca8a04', fontWeight: 'bold' }
        }
        
        return null
      },
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

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1)
    }
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1)
    }
  }, [page])

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
      {/* Paginación */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        loading={isLoading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </TableWithTitle>
  )
})

export default TableVentasPorCobrar
