'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useEffect, useState } from 'react'
import { redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { VentaCreateInputSchema } from '~/types/zod-schemas'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent, ModelUpdatedEvent } from 'ag-grid-community'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { useQuery } from '@tanstack/react-query'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import type { MoraRango } from '../../_store/store-filtros-ventas-por-cobrar'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { FaFilePdf } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// Store para la venta seleccionada
type UseStoreVentaSeleccionada = {
  venta: VentaCompleta | undefined
  setVenta: (venta: VentaCompleta | undefined) => void
}

export const useStoreVentaSeleccionada = create<UseStoreVentaSeleccionada>((set) => ({
  venta: undefined,
  setVenta: (venta) => set({ venta }),
}))

// Store para las ventas filtradas (para el reporte y las tarjetas de resumen)
type UseStoreVentasFiltradas = {
  ventas: VentaCompleta[]
  loading: boolean
  setVentas: (ventas: VentaCompleta[]) => void
  setLoading: (loading: boolean) => void
}

export const useStoreVentasFiltradas = create<UseStoreVentasFiltradas>((set) => ({
  ventas: [],
  loading: false,
  setVentas: (ventas) => set({ ventas }),
  setLoading: (loading) => set({ loading }),
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

  // Estados para el modal de PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [ventaSeleccionadaPdf, setVentaSeleccionadaPdf] = useState<VentaCompleta | null>(null)
  const [esTicketFormato, setEsTicketFormato] = useState(false) // Controla formato del PDF (false = A4, true = ticket)

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)
  const searchKey = useStoreFiltrosVentasPorCobrar(state => state.searchKey)
  const moraRango = useStoreFiltrosVentasPorCobrar(state => state.moraRango)
  const estadoPago = useStoreFiltrosVentasPorCobrar(state => state.estadoPago)
  const quickFilterText = useStoreFiltrosVentasPorCobrar(state => state.quickFilterText)
  const isSearching = quickFilterText !== '' && quickFilterText.length < 2 // Mostrar loading si está escribiendo

  // Debug: verificar que quickFilterText se está actualizando
  useEffect(() => {
    console.log('📊 Tabla recibió quickFilterText:', quickFilterText)
  }, [quickFilterText])

  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    let search: string | undefined
    
    // Extraer búsqueda de cliente si existe
    const busquedaCliente = (filtros as any).busqueda_cliente as string | undefined
    
    // Extraer búsqueda de serie/número si existe
    if (filtros.OR && Array.isArray(filtros.OR)) {
      const serieFilter = filtros.OR.find((f: any) => f?.serie?.contains)
      if (serieFilter) search = (serieFilter as any).serie.contains as string
    }
    
    // Priorizar búsqueda de cliente sobre búsqueda de serie
    if (busquedaCliente) {
      search = busquedaCliente
    }
    
    const fechaFiltro = (filtros as any).fecha
    const tipoDocumento = (filtros as any).tipo_documento as string | undefined
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      cliente_id: filtros.cliente_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde: fechaFiltro?.gte as string | undefined,
      hasta: fechaFiltro?.lte as string | undefined,
      search,
      tipo_documento: tipoDocumento,
      estado_pago: estadoPago,
      per_page: -1,
    }
  }, [filtros, estadoPago])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, apiFilters, searchKey],
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

  // Función para ver el PDF de la venta
  const handleVerPdf = useCallback(async (venta: VentaCompleta, formato?: 'a4' | 'ticket') => {
    if (!venta?.id) return
    
    setVentaSeleccionadaPdf(venta)
    setPdfModalOpen(true)
    setPdfLoading(true)
    
    // Limpiar el PDF anterior
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    setPdfUrl(null)
    
    // Si no se proporciona formato, usar el estado actual
    const formatoActual = formato || (esTicketFormato ? 'ticket' : 'a4')
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const token = getAuthToken()
      const res = await fetch(`${API_URL}/pdf/venta/${venta.id}?formato=${formatoActual}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      })
      
      if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error('Error al obtener PDF de venta:', err)
      setPdfModalOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }, [pdfUrl, esTicketFormato])

  // Limpiar URL al cerrar modal
  const handleClosePdfModal = useCallback((v: boolean) => {
    setPdfModalOpen(v)
    if (!v && pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
      setVentaSeleccionadaPdf(null)
      // NO resetear esTicketFormato - mantener el formato elegido por el usuario
    }
  }, [pdfUrl])

  // Recargar PDF cuando cambie el formato (ticket/A4)
  useEffect(() => {
    if (pdfModalOpen && ventaSeleccionadaPdf) {
      const formato = esTicketFormato ? 'ticket' : 'a4'
      handleVerPdf(ventaSeleccionadaPdf, formato)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTicketFormato])

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
      field: 'fecha' as any,
      colId: 'fecha',
      width: 150,
      valueGetter: (params: any) => {
        const val = params.data?.created_at || params.data?.fecha
        if (!val) return ''
        return dayjs(val).format('DD/MM/YYYY hh:mm:ss A')
      },
    },
    {
      headerName: 'Documento',
      field: 'tipo_documento' as any,
      colId: 'tipo_documento',
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
      field: 'serie' as any,
      colId: 'serie',
      width: 140,
      valueGetter: (params: any) => {
        const serie = params.data?.serie || ''
        const numero = params.data?.numero || ''
        return serie && numero ? `${serie}-${numero}` : ''
      },
    },
    {
      headerName: 'Doc. Cliente',
      field: 'cliente.numero_documento' as any,
      colId: 'cliente_documento',
      width: 120,
      valueGetter: (params) => params.data?.cliente?.numero_documento || '',
    },
    {
      headerName: 'Cliente',
      field: 'cliente.razon_social' as any,
      colId: 'cliente',
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
      field: 'productos_por_almacen' as any,
      colId: 'detalle',
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
      field: 'user.name' as any,
      colId: 'registra',
      width: 150,
      valueGetter: (params) => params.data?.user?.name || '',
    },
    {
      headerName: 'Total',
      field: 'total' as any,
      colId: 'total',
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
      field: 'total_cobrado' as any,
      colId: 'paga',
      width: 120,
      valueGetter: (params: any) => {
        const pagado = Number(params.data?.total_cobrado || 0)
        return `S/. ${pagado.toFixed(2)}`
      },
    },
    {
      headerName: 'Saldo',
      field: 'saldo' as any,
      colId: 'saldo',
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
      field: 'moneda' as any,
      colId: 'moneda',
      width: 80,
      valueGetter: () => 'PEN',
    },
    {
      headerName: 'Moras',
      field: 'moras' as any,
      colId: 'moras',
      width: 80,
      cellRenderer: (params: any) => {
        const mora = calcularMora(params.data as VentaCompleta)
        if (mora <= 0) return <span className='text-black'>{mora}</span>
        return <span className='text-black font-bold'>{mora}</span>
      },
      valueGetter: (params: any) => calcularMora(params.data as VentaCompleta),
    },
    {
      headerName: 'Último Pago',
      field: 'ultimo_pago' as any,
      colId: 'ultimo_pago',
      width: 150,
      valueGetter: (params: any) => {
        const ultimoPago = params.data?.ultimo_pago
        if (!ultimoPago) return 'Sin pagos'
        return dayjs(ultimoPago).format('DD/MM/YYYY hh:mm:ss A')
      },
    },
    {
      headerName: 'Estado',
      field: 'estado' as any,
      colId: 'estado',
      width: 110,
      valueGetter: (params: any) => {
        const venta = params.data as VentaCompleta
        if (!venta) return ''
        const total = (venta.productos_por_almacen || []).reduce((acc: number, item: any) => {
          for (const u of item.unidades_derivadas ?? []) {
            const precio = Number(u.precio ?? 0)
            const cantidad = Number(u.cantidad ?? 0)
            const descuento = Number(u.descuento ?? 0)
            const bonificacion = Boolean(u.bonificacion)
            acc += bonificacion ? 0 : (precio * cantidad) - descuento
          }
          return acc
        }, 0)
        const totalPagado = Number(venta.total_cobrado || 0)
        return (total - totalPagado) <= 0.01 ? 'Pagado' : 'Pendiente'
      },
      cellRenderer: (params: any) => {
        const estado = params.value // Usa el valor calculado por valueGetter
        const isPagado = estado === 'Pagado'
        
        return (
          <div className="flex items-center h-full">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPagado ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {estado}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'PDF',
      field: 'pdf' as any,
      colId: 'pdf',
      width: 70,
      suppressMovable: true, // No permitir mover esta columna (siempre al final)
      cellRenderer: (params: any) => {
        if (!params.data?.id) return null
        return (
          <button
            onClick={() => handleVerPdf(params.data)}
            className='flex items-center justify-center w-full h-full text-red-600 hover:text-red-800'
            title='Ver comprobante PDF'
          >
            <FaFilePdf size={16} />
          </button>
        )
      },
    },
  ], [calcularTotalVenta, handleVerPdf])

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
          'Último Pago',
          'Estado',
          'PDF',
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

  // Publicar al store las filas REALMENTE visibles (después del filtro rápido del
  // buscador, no solo del filtro de mora). Así el reporte y las tarjetas de
  // resumen reflejan exactamente lo que ve el usuario en la tabla.
  const publicarVentasVisibles = useCallback((api: ModelUpdatedEvent<VentaCompleta>['api']) => {
    const visibles: VentaCompleta[] = []
    api.forEachNodeAfterFilter(node => {
      if (node.data) visibles.push(node.data)
    })
    useStoreVentasFiltradas.getState().setVentas(visibles)
  }, [])

  const handleModelUpdated = useCallback((e: ModelUpdatedEvent<VentaCompleta>) => {
    publicarVentasVisibles(e.api)
  }, [publicarVentasVisibles])

  // Fallback: si el grid aún no ha disparado onModelUpdated, publicar rowData.
  useEffect(() => {
    const api = tableRef.current?.api
    if (api) publicarVentasVisibles(api)
    else useStoreVentasFiltradas.getState().setVentas(rowData)
  }, [rowData, publicarVentasVisibles])

  // Propagar estado de carga a las tarjetas de resumen
  useEffect(() => {
    useStoreVentasFiltradas.getState().setLoading(isLoading || isSearching)
  }, [isLoading, isSearching])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  // Construir número de documento para el modal
  const nroDoc = ventaSeleccionadaPdf 
    ? `${ventaSeleccionadaPdf.serie}-${ventaSeleccionadaPdf.numero}` 
    : ''

  return (
    <>
      <TableWithTitle<VentaCompleta>
        id='table-ventas-por-cobrar'
        selectionColor={redColors[1]}
        onSelectionChanged={handleSelectionChanged}
        onRowClicked={handleRowClicked}
        onRowDoubleClicked={handleRowDoubleClicked}
        tableRef={tableRef}
        title='Facturas de Ventas Vencidas'
        schema={VentaCreateInputSchema}
        loading={isLoading || isSearching}
        columnDefs={columns}
        rowData={rowData}
        optionsSelectColumns={optionsSelectColumns}
        exportExcel={true}
        exportPdf={true}
        selectColumns={true}
        suppressRowTransform={true}
        rowBuffer={10}
        quickFilterText={quickFilterText}
        onModelUpdated={handleModelUpdated}
      >
      </TableWithTitle>

      {/* Modal para ver PDF de la venta */}
      <ModalShowDoc
        open={pdfModalOpen}
        setOpen={handleClosePdfModal}
        nro_doc={nroDoc}
        esTicket={esTicketFormato}
        setEsTicket={setEsTicketFormato}
        tipoDocumento='venta'
        backendPdfUrl={pdfUrl}
        backendPdfLoading={pdfLoading}
      >
        <></>
      </ModalShowDoc>
    </>
  )
})

export default TableVentasPorCobrar
