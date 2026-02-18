'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useQuery } from '@tanstack/react-query'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import { exportComprasToExcel } from '~/utils/export-compras-excel'
import dayjs from 'dayjs'

const TableComprasPorPagar = memo(function TableComprasPorPagar() {
  const tableRef = useRef<AgGridReact>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const filtros = useStoreFiltrosComprasPorPagar(state => state.filtros)

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
      proveedor_id: filtros.proveedor_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
      search,
      per_page: pageSize,
      page,
    }
  }, [filtros, page])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR, apiFilters],
    queryFn: async () => {
      const result = await compraApi.getComprasPorPagar(apiFilters)
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
  
  // The backend already filters for credit purchases with pending balance
  const rowData = useMemo(() => {
    return data?.data ?? []
  }, [data?.data])

  // Definir columnas específicas para compras por pagar
  const columns: ColDef<Compra>[] = useMemo(() => [
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
          'in': 'Ingreso',
          'sa': 'Salida',
          'rc': 'Recepción',
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
      headerName: 'Ruc',
      width: 120,
      valueGetter: (params) => params.data?.proveedor?.ruc || '',
    },
    {
      headerName: 'Proveedor',
      width: 300,
      valueGetter: (params) => params.data?.proveedor?.razon_social || '',
    },
    {
      headerName: 'Detalle',
      width: 200,
      valueGetter: (params) => {
        const compra = params.data as Compra
        if (!compra?.productos_por_almacen || compra.productos_por_almacen.length === 0) {
          return 'Sin productos'
        }
        
        const totalProductos = compra.productos_por_almacen.length
        
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
        const compra = params.data as Compra
        if (!compra) return 'S/. 0.00'
        
        const total = (compra.productos_por_almacen || []).reduce((acc, item) => {
          const costo = Number(item.costo ?? 0)
          for (const u of item.unidades_derivadas ?? []) {
            const cantidad = Number(u.cantidad ?? 0)
            const factor = Number(u.factor ?? 0)
            const flete = Number(u.flete ?? 0)
            const bonificacion = Boolean(u.bonificacion)
            const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
            acc += montoLinea
          }
          return acc
        }, 0)
        
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
        const compra = params.data as Compra
        if (!compra) return 'S/. 0.00'
        
        const total = (compra.productos_por_almacen || []).reduce((acc, item) => {
          const costo = Number(item.costo ?? 0)
          for (const u of item.unidades_derivadas ?? []) {
            const cantidad = Number(u.cantidad ?? 0)
            const factor = Number(u.factor ?? 0)
            const flete = Number(u.flete ?? 0)
            const bonificacion = Boolean(u.bonificacion)
            const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
            acc += montoLinea
          }
          return acc
        }, 0)
        
        const totalPagado = Number(compra.total_pagado || 0)
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
        const compra = params.data as Compra
        if (!compra?.fecha) return '0'
        
        const fechaCompra = dayjs(compra.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaCompra, 'days')
        
        return diasVencidos > 0 ? diasVencidos.toString() : '0'
      },
      cellStyle: (params: any) => {
        const compra = params.data as Compra
        if (!compra?.fecha) return null
        
        const fechaCompra = dayjs(compra.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaCompra, 'days')
        
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
  ], [page, pageSize])

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Compra>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      const selectedCompra = selectedNodes?.[0]?.data as Compra
      // Aquí podrías manejar la selección si es necesario
      console.log('Compra seleccionada:', selectedCompra)
    },
    []
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<Compra>) => {
      // Aquí podrías abrir un modal con detalles de la compra
      console.log('Doble click en compra:', event.data)
    },
    []
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<Compra>) => {
      event.node.setSelected(true)
    },
    []
  )

  // Función para calcular el color de fondo de cada fila (todas rojas por ser vencidas)
  const getRowStyle = useCallback(() => {
    return {
      background: redColors[2]
    }
  }, [])

  // Memoizar opciones de columnas para evitar recreaciones
  const optionsSelectColumns = useMemo(
    () => [
      {
        label: 'Default',
        columns: [
          'Fecha',
          'Documento',
          'Serie-Correl',
          'Ruc',
          'Proveedor',
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

  // Función para exportar todas las compras con los filtros actuales
  const handleExportExcel = useCallback(async () => {
    try {
      // Obtener todas las compras haciendo múltiples peticiones si es necesario
      let allCompras: Compra[] = []
      let currentPage = 1
      let hasMorePages = true
      const perPage = 100 // Máximo permitido por el backend

      while (hasMorePages) {
        const result = await compraApi.getComprasPorPagar({
          ...apiFilters,
          per_page: perPage,
          page: currentPage,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }

        const pageData = result.data?.data ?? []
        allCompras = [...allCompras, ...pageData]

        // Verificar si hay más páginas
        const lastPage = result.data?.last_page ?? 1
        hasMorePages = currentPage < lastPage
        currentPage++
      }
      
      if (allCompras.length === 0) {
        alert('No hay datos para exportar')
        return
      }

      // Extraer fechas de los filtros para el reporte
      const fechaFilter = filtros?.fecha as any
      const fechaDesde = fechaFilter?.gte ? new Date(fechaFilter.gte).toLocaleDateString('es-PE') : undefined
      const fechaHasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toLocaleDateString('es-PE') : undefined

      exportComprasToExcel({
        compras: allCompras,
        nameFile: 'Compras_Por_Pagar',
        fechaDesde,
        fechaHasta,
      })
    } catch (error: any) {
      console.error('Error al exportar:', error)
      alert(`Error al exportar los datos: ${error.message || 'Error desconocido'}`)
    }
  }, [apiFilters, filtros])

  // Seleccionar automáticamente la primera fila cuando se cargan los datos
  useEffect(() => {
    if (rowData && rowData.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
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
    <TableWithTitle<Compra>
      id='table-compras-por-pagar'
      selectionColor={redColors[10]}
      onSelectionChanged={handleSelectionChanged}
      onRowClicked={handleRowClicked}
      onRowDoubleClicked={handleRowDoubleClicked}
      tableRef={tableRef}
      title='Facturas de Compras Vencidas'
      schema={CompraCreateInputSchema}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      optionsSelectColumns={optionsSelectColumns}
      getRowStyle={getRowStyle}
      exportExcel={true}
      exportPdf={true}
      selectColumns={true}
      onExportExcel={handleExportExcel}
      // Habilitar lazy loading para mejor rendimiento
      suppressRowTransform={true}
      rowBuffer={10}
      cacheBlockSize={100}
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

export default TableComprasPorPagar