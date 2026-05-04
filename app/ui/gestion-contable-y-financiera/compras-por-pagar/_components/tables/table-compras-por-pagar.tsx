'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useEffect, useState } from 'react'
import { redColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useQuery } from '@tanstack/react-query'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import type { MoraRango } from '../../_store/store-filtros-compras-por-pagar'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { FaFilePdf } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// Store para la compra seleccionada
type UseStoreCompraSeleccionada = {
  compra: Compra | undefined
  setCompra: (compra: Compra | undefined) => void
}

export const useStoreCompraSeleccionada = create<UseStoreCompraSeleccionada>((set) => ({
  compra: undefined,
  setCompra: (compra) => set({ compra }),
}))

// Store para las compras filtradas (para el reporte)
type UseStoreComprasFiltradas = {
  compras: Compra[]
  setCompras: (compras: Compra[]) => void
}

export const useStoreComprasFiltradas = create<UseStoreComprasFiltradas>((set) => ({
  compras: [],
  setCompras: (compras) => set({ compras }),
}))

// Calcula días de mora: positivo = vencida, negativo = aún no vence
function calcularMora(compra: Compra): number {
  const ref = compra.fecha_vencimiento || compra.fecha
  return dayjs().startOf('day').diff(dayjs(ref).startOf('day'), 'days')
}

function aplicarFiltroMora(compras: Compra[], rango: MoraRango): Compra[] {
  if (rango === 'todas') return compras
  if (rango === 'hoy') return compras.filter(c => calcularMora(c) === 0)
  if (rango === 'vencidas') return compras.filter(c => calcularMora(c) > 0)
  return compras.filter(c => { const m = calcularMora(c); return m >= -(rango as number) && m <= (rango as number) })
}

const TableComprasPorPagar = memo(function TableComprasPorPagar() {
  const tableRef = useRef<AgGridReact>(null)

  // Estados para el modal de PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [compraSeleccionadaPdf, setCompraSeleccionadaPdf] = useState<Compra | null>(null)
  const [esTicketFormato, setEsTicketFormato] = useState(false) // Controla formato del PDF (false = A4, true = ticket)

  const filtros = useStoreFiltrosComprasPorPagar(state => state.filtros)
  const moraRango = useStoreFiltrosComprasPorPagar(state => state.moraRango)
  const estadoPago = useStoreFiltrosComprasPorPagar(state => state.estadoPago)
  const quickFilterText = useStoreFiltrosComprasPorPagar(state => state.quickFilterText)
  const isSearching = quickFilterText !== '' && quickFilterText.length < 2

  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    let search: string | undefined
    
    const busquedaProveedor = (filtros as any).busqueda_proveedor as string | undefined
    
    if (filtros.OR && Array.isArray(filtros.OR)) {
      const serieFilter = filtros.OR.find((f: any) => f?.serie?.contains)
      if (serieFilter) search = (serieFilter as any).serie.contains as string
    }
    
    if (busquedaProveedor) {
      search = busquedaProveedor
    }
    
    const fechaFiltro = (filtros as any).fecha
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      proveedor_id: (filtros as any).proveedor_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde: fechaFiltro?.gte as string | undefined,
      hasta: fechaFiltro?.lte as string | undefined,
      search,
      estado_pago: estadoPago,
      per_page: -1,
    }
  }, [filtros, estadoPago])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR, apiFilters],
    queryFn: async () => {
      const result = await compraApi.getComprasPorPagar(apiFilters)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 0,
  })

  const rowData = useMemo(() => {
    const compras = data?.data ?? []
    const filtradas = aplicarFiltroMora(compras, moraRango)
    return [...filtradas].sort((a, b) => Number(b.id) - Number(a.id))
  }, [data?.data, moraRango])

  // Función para ver el PDF de la compra
  const handleVerPdf = useCallback(async (compra: Compra, formato?: 'a4' | 'ticket') => {
    if (!compra?.id) return
    
    setCompraSeleccionadaPdf(compra)
    setPdfModalOpen(true)
    setPdfLoading(true)
    
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    setPdfUrl(null)
    
    // Si no se proporciona formato, usar el estado actual
    const formatoActual = formato || (esTicketFormato ? 'ticket' : 'a4')
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const token = getAuthToken()
      const res = await fetch(`${API_URL}/pdf/compra/${compra.id}?formato=${formatoActual}`, {
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
      console.error('Error al obtener PDF de compra:', err)
      setPdfModalOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }, [pdfUrl, esTicketFormato])

  const handleClosePdfModal = useCallback((v: boolean) => {
    setPdfModalOpen(v)
    if (!v && pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
      setCompraSeleccionadaPdf(null)
      // NO resetear esTicketFormato - mantener el formato elegido por el usuario
    }
  }, [pdfUrl])

  // Recargar PDF cuando cambie el formato (ticket/A4)
  useEffect(() => {
    if (pdfModalOpen && compraSeleccionadaPdf) {
      const formato = esTicketFormato ? 'ticket' : 'a4'
      handleVerPdf(compraSeleccionadaPdf, formato)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTicketFormato])

  // Función para calcular el total de una compra
  const calcularTotalCompra = useCallback((compra: Compra) => {
    return (compra.productos_por_almacen || []).reduce((acc, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const costo = Number(item.costo ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const flete = Number(u.flete ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (costo * cantidad) + flete
        acc += montoLinea
      }
      return acc
    }, 0) + Number(compra.percepcion ?? 0)
  }, [])

  // Definir columnas específicas para compras por pagar
  const columns: ColDef<Compra>[] = useMemo(() => [
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
          'gr': 'Guía Rem.',
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
      headerName: 'RUC Proveedor',
      width: 120,
      valueGetter: (params) => params.data?.proveedor?.ruc || '',
    },
    {
      headerName: 'Proveedor',
      width: 300,
      valueGetter: (params: any) => {
        const proveedor = params.data?.proveedor
        if (!proveedor) return ''
        return proveedor.razon_social || ''
      },
    },
    {
      headerName: 'Detalle',
      width: 200,
      valueGetter: (params: any) => {
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
        
        const total = calcularTotalCompra(compra)
        return `S/. ${total.toFixed(2)}`
      },
    },
    {
      headerName: 'Paga',
      width: 120,
      valueGetter: (params: any) => {
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
        
        const total = calcularTotalCompra(compra)
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
        const mora = calcularMora(params.data as Compra)
        if (mora <= 0) return <span className='text-black'>{mora}</span>
        return <span className='text-black font-bold'>{mora}</span>
      },
      valueGetter: (params: any) => calcularMora(params.data as Compra),
    },
    {
      headerName: 'PDF',
      width: 70,
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
  ], [calcularTotalCompra, handleVerPdf])

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Compra>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      const selectedCompra = selectedNodes?.[0]?.data as Compra
      useStoreCompraSeleccionada.getState().setCompra(selectedCompra)
    },
    []
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<Compra>) => {
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

  const optionsSelectColumns = useMemo(
    () => [
      {
        label: 'Default',
        columns: [
          'Fecha',
          'Documento',
          'Serie-Correl',
          'RUC Proveedor',
          'Proveedor',
          'Detalle',
          'Registra',
          'Total',
          'Paga',
          'Saldo',
          'Mon.',
          'Moras',
          'PDF',
        ],
      },
    ],
    []
  )

  // Seleccionar automáticamente la primera fila
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

  // Actualizar el store de compras filtradas
  useEffect(() => {
    useStoreComprasFiltradas.getState().setCompras(rowData)
  }, [rowData])

  if (!filtros) return null

  const nroDoc = compraSeleccionadaPdf 
    ? `${compraSeleccionadaPdf.serie}-${compraSeleccionadaPdf.numero}` 
    : ''

  return (
    <>
      <TableWithTitle<Compra>
        id='table-compras-por-pagar'
        selectionColor={redColors[1]}
        onSelectionChanged={handleSelectionChanged}
        onRowClicked={handleRowClicked}
        onRowDoubleClicked={handleRowDoubleClicked}
        tableRef={tableRef}
        title='Facturas de Compras Vencidas'
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
      >
      </TableWithTitle>

      {/* Modal para ver PDF de la compra */}
      <ModalShowDoc
        open={pdfModalOpen}
        setOpen={handleClosePdfModal}
        nro_doc={nroDoc}
        esTicket={esTicketFormato}
        setEsTicket={setEsTicketFormato}
        tipoDocumento='compra'
        backendPdfUrl={pdfUrl}
        backendPdfLoading={pdfLoading}
      >
        <></>
      </ModalShowDoc>
    </>
  )
})

export default TableComprasPorPagar
