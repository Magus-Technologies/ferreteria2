'use client'

import { Modal, DatePicker, Input, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta, type CobroVenta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { blueColors } from '~/lib/colors'

interface ModalConsultarPagosProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalConsultarPagos({ open, setOpen }: ModalConsultarPagosProps) {
  const [fechaDesde, setFechaDesde] = useState(dayjs())
  const [fechaHasta, setFechaHasta] = useState(dayjs())
  const [searchText, setSearchText] = useState('')

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  // Obtener TODAS las ventas por cobrar para extraer sus cobros
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    const fechaFilter = filtros.fecha as any
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      desde,
      hasta,
      per_page: -1,
    }
  }, [filtros])

  const { data: ventasData } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'all-for-cobros', apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar(apiFilters)
      return result.data?.data ?? []
    },
    enabled: open && !!filtros,
    staleTime: 2 * 60 * 1000,
  })

  // Obtener cobros de cada venta
  const ventaIds = useMemo(() => (ventasData || []).map(v => v.id), [ventasData])

  const { data: allCobros, isLoading } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, 'all', ventaIds],
    queryFn: async () => {
      const results: (CobroVenta & { venta?: VentaCompleta })[] = []
      for (const venta of ventasData || []) {
        const res = await ventaApi.getCobros(venta.id)
        const cobros = res.data?.data ?? []
        cobros.forEach(cobro => results.push({ ...cobro, venta }))
      }
      return results
    },
    enabled: open && ventaIds.length > 0,
    staleTime: 1 * 60 * 1000,
  })

  // Filtrar cobros por fecha y búsqueda
  const cobrosFiltrados = useMemo(() => {
    let filtered = allCobros ?? []

    // Filtrar por fecha del cobro
    filtered = filtered.filter(cobro => {
      const fechaCobro = dayjs(cobro.fecha)
      return fechaCobro.isSame(fechaDesde, 'day') || fechaCobro.isSame(fechaHasta, 'day') ||
        (fechaCobro.isAfter(fechaDesde, 'day') && fechaCobro.isBefore(fechaHasta, 'day'))
    })

    // Filtrar por texto
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(cobro => {
        const venta = cobro.venta as VentaCompleta | undefined
        const clienteNombre = venta?.cliente?.razon_social ||
          `${venta?.cliente?.nombres || ''} ${venta?.cliente?.apellidos || ''}`.trim()
        const docCliente = venta?.cliente?.numero_documento || ''
        const serieNumero = venta ? `${venta.serie}-${venta.numero}` : ''
        return clienteNombre.toLowerCase().includes(search) ||
          docCliente.includes(search) ||
          serieNumero.toLowerCase().includes(search)
      })
    }

    return filtered
  }, [allCobros, fechaDesde, fechaHasta, searchText])

  // Total importe
  const totalImporte = useMemo(() =>
    cobrosFiltrados.reduce((acc, c) => acc + Number(c.monto || 0), 0)
  , [cobrosFiltrados])

  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'nv': 'NOTA DE VENTA' }

  const columns: ColDef<(CobroVenta & { venta?: VentaCompleta })>[] = useMemo(() => [
    { headerName: '#', width: 50, valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'Documento',
      width: 140,
      valueGetter: (p) => {
        const v = p.data?.venta
        return v ? tipoDocMap[v.tipo_documento] || v.tipo_documento : ''
      },
    },
    {
      headerName: 'Venta N°',
      width: 130,
      valueGetter: (p) => {
        const v = p.data?.venta
        return v ? `${v.serie}-${v.numero}` : ''
      },
    },
    {
      headerName: 'F. Venta',
      width: 100,
      valueGetter: (p) => p.data?.venta?.fecha ? dayjs(p.data.venta.fecha).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'F. Vence',
      width: 100,
      valueGetter: (p) => p.data?.venta?.fecha_vencimiento ? dayjs(p.data.venta.fecha_vencimiento).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'Cliente',
      flex: 1,
      minWidth: 200,
      valueGetter: (p) => {
        const c = p.data?.venta?.cliente
        if (!c) return ''
        const doc = c.numero_documento || ''
        const nombre = c.razon_social || `${c.nombres || ''} ${c.apellidos || ''}`.trim()
        return `${doc} - ${nombre}`
      },
    },
    {
      headerName: 'Fecha Pago',
      width: 110,
      valueGetter: (p) => p.data?.fecha ? dayjs(p.data.fecha).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'T. Pago',
      width: 100,
      valueGetter: (p) => p.data?.despliegue_de_pago?.name || '',
    },
    {
      headerName: 'Banco',
      width: 100,
      valueGetter: (p) => p.data?.despliegue_de_pago?.metodo_de_pago?.name || '',
    },
    {
      headerName: 'Importe',
      width: 110,
      valueGetter: (p) => `S/. ${Number(p.data?.monto || 0).toFixed(2)}`,
    },
  ], [])

  return (
    <Modal
      title='COBROS REALIZADOS POR DETALLE'
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {/* Filtros */}
      <div className='flex flex-wrap items-end gap-4 mb-4'>
        <div>
          <label className='text-xs font-medium text-gray-600'>Fecha Cobro Desde:</label>
          <DatePicker
            value={fechaDesde}
            onChange={(d) => d && setFechaDesde(d)}
            format='DD/MM/YYYY'
            className='w-full'
          />
        </div>
        <div>
          <label className='text-xs font-medium text-gray-600'>Hasta:</label>
          <DatePicker
            value={fechaHasta}
            onChange={(d) => d && setFechaHasta(d)}
            format='DD/MM/YYYY'
            className='w-full'
          />
        </div>
        <div className='flex-1'>
          <label className='text-xs font-medium text-gray-600'>Ruc/Razón/Comercial del Cliente:</label>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Buscar cliente...'
          />
        </div>
        <Button type='primary' onClick={() => {/* Los filtros son reactivos */}}>
          Buscar
        </Button>
      </div>

      {/* Tabla */}
      <div className='h-[350px]'>
        <TableWithTitle
          id='table-cobros-realizados'
          title={`CABECERA REGISTROS: ${cobrosFiltrados.length}`}
          columnDefs={columns}
          rowData={cobrosFiltrados}
          loading={isLoading}
          selectionColor={blueColors[1]}
          suppressRowTransform
          exportExcel
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-center mt-4 bg-gray-100 rounded-lg p-3'>
        <span className='text-sm font-bold'>
          RESUMEN DE CUENTA — Total Importe: <span className='text-blue-700 text-lg'>S/. {totalImporte.toFixed(2)}</span>
        </span>
      </div>
    </Modal>
  )
}
