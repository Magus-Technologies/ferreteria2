'use client'

import { Modal, DatePicker, Input, Button, App } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type CobroVenta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import dayjs from 'dayjs'
import { useMemo, useState, useCallback } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { blueColors } from '~/lib/colors'
import { FaPrint } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'

interface ModalImprimirTicketsMasivosProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalImprimirTicketsMasivos({ open, setOpen }: ModalImprimirTicketsMasivosProps) {
  const { message } = App.useApp()
  const [fechaDesde, setFechaDesde] = useState(dayjs())
  const [fechaHasta, setFechaHasta] = useState(dayjs())
  const [searchText, setSearchText] = useState('')

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      per_page: -1,
    }
  }, [filtros])

  const { data: cobrosResponse, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, 'mass-print', apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getAllCobros(apiFilters)
      return result.data?.data ?? []
    },
    enabled: open && !!filtros,
  })

  const allCobros = cobrosResponse ?? []

  const cobrosFiltrados = useMemo(() => {
    let filtered = allCobros ?? []
    filtered = filtered.filter(cobro => {
      const fechaCobro = dayjs(cobro.fecha)
      return (fechaCobro.isSame(fechaDesde, 'day') || fechaCobro.isAfter(fechaDesde, 'day')) &&
             (fechaCobro.isSame(fechaHasta, 'day') || fechaCobro.isBefore(fechaHasta, 'day'))
    })

    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(cobro => {
        const c = cobro.venta?.cliente
        const nombre = (c?.razon_social || `${c?.nombres || ''} ${c?.apellidos || ''}`).toLowerCase()
        const doc = (c?.numero_documento || '').toLowerCase()
        const nroVenta = `${cobro.venta?.serie}-${cobro.venta?.numero}`.toLowerCase()
        return nombre.includes(search) || doc.includes(search) || nroVenta.includes(search)
      })
    }
    return filtered
  }, [allCobros, fechaDesde, fechaHasta, searchText])

  // Estado para modal de impresión
  const [showPdf, setShowPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handlePrintAll = useCallback(async () => {
    if (cobrosFiltrados.length === 0) {
      message.warning('No hay cobros para imprimir')
      return
    }

    const ids = cobrosFiltrados.map(c => c.id)
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const { getAuthToken } = await import('~/lib/api')
    const token = getAuthToken()

    setShowPdf(true)
    setPdfLoading(true)
    setPdfUrl(null)

    try {
      const res = await fetch(`${API_URL}/pdf/cobro-venta-multiple?ids=${ids.join(',')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      })
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error(err)
      message.error('Error al generar el PDF masivo')
      setShowPdf(false)
    } finally {
      setPdfLoading(false)
    }
  }, [cobrosFiltrados, message])

  const columns: ColDef<CobroVenta>[] = useMemo(() => [
    { 
      headerName: 'Fecha y Hora', 
      width: 150, 
      valueGetter: (p) => {
        const val = p.data?.created_at || p.data?.fecha
        return dayjs(val).format('DD/MM/YYYY hh:mm A')
      }
    },
    { headerName: 'Venta', width: 120, valueGetter: (p) => `${p.data?.venta?.serie}-${p.data?.venta?.numero}` },
    {
      headerName: 'Cliente',
      flex: 1,
      valueGetter: (p) => {
        const c = p.data?.venta?.cliente
        return c ? (c.razon_social || `${c.nombres} ${c.apellidos}`) : ''
      }
    },
    { headerName: 'Monto', width: 100, valueGetter: (p) => `S/. ${Number(p.data?.monto).toFixed(2)}` },
    {
      headerName: 'Despliegue de Pago',
      width: 180,
      valueGetter: (p) => {
        const dp = p.data?.despliegue_de_pago
        const metodo = dp?.metodo_de_pago?.name
        return metodo ? `${metodo} / ${dp.name}` : dp?.name || ''
      }
    },
  ], [])

  return (
    <>
    <Modal
      title='IMPRESIÓN MASIVA DE TICKETS DE COBRO'
      open={open}
      onCancel={() => setOpen(false)}
      width={950}
      footer={[
        <Button key="close" onClick={() => setOpen(false)}>Cerrar</Button>,
        <Button 
          key="print" 
          type="primary" 
          danger 
          icon={<FaPrint />} 
          onClick={handlePrintAll}
          disabled={cobrosFiltrados.length === 0}
        >
          Imprimir {cobrosFiltrados.length} Tickets
        </Button>
      ]}
    >
      <div className='flex gap-4 mb-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-200'>
        <div className='flex-1 grid grid-cols-2 gap-2'>
          <div>
            <label className='text-[10px] font-bold text-gray-500 block mb-1'>DESDE:</label>
            <DatePicker className='w-full' value={fechaDesde} onChange={v => v && setFechaDesde(v)} format='DD/MM/YYYY' />
          </div>
          <div>
            <label className='text-[10px] font-bold text-gray-500 block mb-1'>HASTA:</label>
            <DatePicker className='w-full' value={fechaHasta} onChange={v => v && setFechaHasta(v)} format='DD/MM/YYYY' />
          </div>
        </div>
        <div className='flex-[2]'>
          <label className='text-[10px] font-bold text-gray-500 block mb-1'>BUSCAR CLIENTE / VENTA:</label>
          <Input placeholder='Ej: 2060... / NV-001' value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
        </div>
        <Button 
          type='primary' 
          onClick={() => refetch()} 
          loading={isLoading}
          className='bg-blue-600'
        >
          Buscar
        </Button>
      </div>

      <div className='h-[350px] border rounded'>
        <TableWithTitle<CobroVenta>
          id='table-mass-print'
          title={`Cobros Filtrados: ${cobrosFiltrados.length}`}
          columnDefs={columns}
          rowData={cobrosFiltrados}
          loading={isLoading}
          selectionColor={blueColors[1]}
        />
      </div>
    </Modal>

    <ModalShowDoc
      open={showPdf}
      setOpen={setShowPdf}
      nro_doc='Tickets Masivos'
      esTicket
      tipoDocumento='venta'
      backendPdfUrl={pdfUrl}
      backendPdfLoading={pdfLoading}
    >
      <></>
    </ModalShowDoc>
    </>
  )
}
