'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { greenColors, orangeColors, redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import { Prisma, EstadoDeCompra } from '@prisma/client'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useQuery } from '@tanstack/react-query'
import { exportComprasToExcel } from '~/utils/export-compras-excel'

interface TableComprasProps {
  columns: ColDef<Compra>[]
  id: string
  setCompraSeleccionada: (compra: Compra | undefined) => void
  filtros: Prisma.CompraWhereInput | undefined
  querykeys: QueryKeys[]
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Compra | undefined
  }) => void
}

const TableCompras = memo(function TableCompras({
  columns,
  id,
  setCompraSeleccionada,
  filtros,
  querykeys,
  onRowDoubleClicked,
}: TableComprasProps) {
  const tableRef = useRef<AgGridReact>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    // Mapeo de estados de Prisma a valores del backend
    const estadoMap: Record<string, string> = {
      'Creado': 'cr',
      'EnEspera': 'ee',
      'Anulado': 'an',
      'Procesado': 'pr',
    };

    // Mapeo de forma de pago
    const formaPagoMap: Record<string, string> = {
      'Contado': 'co',
      'Credito': 'cr',
    };

    // Mapeo de tipo de documento
    const tipoDocumentoMap: Record<string, string> = {
      'Factura': '01',
      'Boleta': '03',
      'NotaDeVenta': 'nv',
      'Ingreso': 'in',
      'Salida': 'sa',
      'RecepcionAlmacen': 'rc',
    };

    // Extraer estado_de_compra
    let estadoDeCompra: string | undefined;
    if (filtros.estado_de_compra) {
      const estadoFilter = filtros.estado_de_compra as any;
      if (estadoFilter.equals) {
        estadoDeCompra = estadoMap[estadoFilter.equals] || estadoFilter.equals;
      } else if (estadoFilter.in && Array.isArray(estadoFilter.in) && estadoFilter.in.length > 0) {
        // Si hay múltiples estados, el backend no soporta múltiples valores
        // No enviamos el filtro para que muestre todos los estados del array
        estadoDeCompra = undefined;
      } else if (typeof estadoFilter === 'string') {
        estadoDeCompra = estadoMap[estadoFilter] || estadoFilter;
      }
    }

    // Extraer forma_de_pago
    let formaDePago: string | undefined;
    if (filtros.forma_de_pago) {
      const formaPago = filtros.forma_de_pago as string;
      formaDePago = formaPagoMap[formaPago] || formaPago;
    }

    // Extraer tipo_documento
    let tipoDocumento: string | undefined;
    if (filtros.tipo_documento) {
      const tipoDoc = filtros.tipo_documento as string;
      tipoDocumento = tipoDocumentoMap[tipoDoc] || tipoDoc;
    }

    // Extraer fechas
    const fechaFilter = filtros.fecha as any;
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined;
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined;

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      estado_de_compra: estadoDeCompra,
      proveedor_id: filtros.proveedor_id as number | undefined,
      forma_de_pago: formaDePago,
      tipo_documento: tipoDocumento,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
      per_page: pageSize,
      page,
    }
  }, [filtros, page])

  const { data, isLoading } = useQuery({
    queryKey: [...querykeys, apiFilters],
    queryFn: async () => {
      const result = await compraApi.getAll(apiFilters)
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
  
  // Filtrar por estado_de_cuenta en el frontend si está presente
  const rowData = useMemo(() => {
    let compras = data?.data ?? []
    
    // Aplicar filtro de estado_de_cuenta si existe
    const estadoDeCuenta = (filtros as any)?.estado_de_cuenta
    if (estadoDeCuenta) {
      compras = compras.filter(compra => {
        // Calcular el total y lo pagado
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
        const resta = total - totalPagado

        // Determinar el estado de cuenta
        const isPagado = resta <= 0.01
        const isDeuda = resta > 0.01

        if (estadoDeCuenta === 'Pagado') {
          return isPagado
        } else if (estadoDeCuenta === 'Deuda') {
          return isDeuda
        }
        return true
      })
    }
    
    return compras
  }, [data?.data, filtros])

  // Calcular el color de una compra basado en su estado
  const calcularColorCompra = useCallback((compra: Compra | undefined) => {
    if (!compra) return 'transparent'

    // Calcular el total y lo pagado
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
    const resta = total - totalPagado

    // Comparar con strings de Laravel (la API devuelve 'co', 'cr', 'ee', 'an')
    const formaDePago = compra.forma_de_pago as string
    const estadoDeCompra = compra.estado_de_compra as string
    
    const formaDePagoContado = formaDePago === 'co'
    const formaDePagoCredito = formaDePago === 'cr'
    const estadoEnEspera = estadoDeCompra === 'ee'
    const estadoAnulado = estadoDeCompra === 'an'

    // Verde: Contado (siempre pagado) o Crédito completamente pagado
    if (formaDePagoContado || (formaDePagoCredito && resta <= 0.01)) {
      return greenColors[2]
    }
    // Naranja: En Espera o Anulado
    else if (estadoEnEspera || estadoAnulado) {
      return orangeColors[2]
    }
    // Rojo: Crédito y Pendiente
    else if (formaDePagoCredito && resta > 0.01) {
      return redColors[2]
    }

    return 'transparent'
  }, [])

  const [selectionColor, setSelectionColor] = useState('transparent')

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Compra>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      const selectedCompra = selectedNodes?.[0]?.data as Compra
      setCompraSeleccionada(selectedCompra)
      
      // Actualizar el color de selección para que coincida con el color de la fila
      setSelectionColor(calcularColorCompra(selectedCompra))
      
      // Forzar redibujado de TODAS las filas para actualizar los bordes
      event.api?.redrawRows()
    },
    [setCompraSeleccionada, calcularColorCompra]
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<Compra>) => {
      onRowDoubleClicked?.({ data: event.data })
    },
    [onRowDoubleClicked]
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<Compra>) => {
      event.node.setSelected(true)
    },
    []
  )

  // Función para calcular el color de fondo de cada fila
  const getRowStyle = useCallback((params: any) => {
    const compra = params.data as Compra
    if (!compra) return undefined

    // Calcular el total y lo pagado
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
    const resta = total - totalPagado

    // Comparar con strings de Laravel (la API devuelve 'co', 'cr', 'ee', 'an')
    const formaDePago = compra.forma_de_pago as string
    const estadoDeCompra = compra.estado_de_compra as string
    
    const formaDePagoContado = formaDePago === 'co'
    const formaDePagoCredito = formaDePago === 'cr'
    const estadoEnEspera = estadoDeCompra === 'ee'
    const estadoAnulado = estadoDeCompra === 'an'

    // Verde: Contado (siempre pagado) o Crédito completamente pagado
    if (formaDePagoContado || (formaDePagoCredito && resta <= 0.01)) {
      return {
        background: greenColors[2]
      }
    }
    // Naranja: En Espera o Anulado
    if (estadoEnEspera || estadoAnulado) {
      return {
        background: orangeColors[2]
      }
    }
    // Rojo: Crédito y Pendiente
    if (formaDePagoCredito && resta > 0.01) {
      return {
        background: redColors[2]
      }
    }

    return undefined
  }, [])


  // Memoizar opciones de columnas para evitar recreaciones
  const optionsSelectColumns = useMemo(
    () => [
      {
        label: 'Default',
        columns: [
          '#',
          'Documento',
          'Serie',
          'Número',
          'Fecha Emisión',
          'Fecha Vencimiento',
          'RUC',
          'Proveedor',
          'Subtotal',
          'IGV',
          'Percepción',
          'Total',
          'Forma de Pago',
          'Total Pagado',
          'Resta',
          'Estado de Cuenta',
          'Registrador',
          'Estado',
          'Acciones',
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
        const result = await compraApi.getAll({
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
        nameFile: 'Reporte_Compras',
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
          setCompraSeleccionada(firstNode.data);
          setSelectionColor(calcularColorCompra(firstNode.data));
        }
      }, 100);
    }
  }, [rowData, setCompraSeleccionada, calcularColorCompra]);

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <TableWithTitle<Compra>
      id={id}
      selectionColor={greenColors[10]} // Color dinámico que coincide con el color de la fila
      onSelectionChanged={handleSelectionChanged}
      onRowClicked={handleRowClicked}
      onRowDoubleClicked={handleRowDoubleClicked}
      tableRef={tableRef}
      title='Compras'
      schema={CompraCreateInputSchema}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      optionsSelectColumns={optionsSelectColumns}
      getRowStyle={getRowStyle}
      exportExcel={true} // Mantener el botón de Excel
      exportPdf={true} // Mantener los botones de PDF
      selectColumns={true}
      onExportExcel={handleExportExcel} // Custom Excel export handler
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

export default TableCompras
