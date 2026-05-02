'use client'

import { Modal, DatePicker, Input, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta, type CobroVenta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { blueColors } from '~/lib/colors'

interface ModalConsultarPagosProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalConsultarPagos({ open, setOpen }: ModalConsultarPagosProps) {
  // Por defecto: fecha de hoy
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs())
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs())
  const [searchText, setSearchText] = useState('')
  const [estadoMetodoPago, setEstadoMetodoPago] = useState<string>('todos')

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  // Construir filtros para el API - solo enviar fechas si están definidas
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    
    const filters: any = {
      almacen_id: filtros.almacen_id as number | undefined,
      estado: estadoMetodoPago, // Enviar el estado al backend
      per_page: -1,
    }
    
    // Solo agregar fechas si están definidas
    if (fechaDesde) {
      filters.desde = fechaDesde.format('YYYY-MM-DD')
    }
    if (fechaHasta) {
      filters.hasta = fechaHasta.format('YYYY-MM-DD')
    }
    
    return filters
  }, [filtros, fechaDesde, fechaHasta, estadoMetodoPago])

  const { data: cobrosResponse, isLoading } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, 'all-cobros', apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getAllCobros(apiFilters)
      return result.data?.data ?? []
    },
    enabled: open && !!filtros,
    staleTime: 1 * 60 * 1000,
  })

  const allCobros = cobrosResponse ?? []

  // Filtrar cobros por búsqueda (el estado y fecha ya se filtran en el backend)
  const cobrosFiltrados = useMemo(() => {
    let filtered = allCobros ?? []

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
  }, [allCobros, searchText])

  // Total importe
  const totalImporte = useMemo(() =>
    cobrosFiltrados.reduce((acc, c) => acc + Number(c.monto || 0), 0)
  , [cobrosFiltrados])

  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'nv': 'NOTA DE VENTA' }

  const columns: ColDef<CobroVenta>[] = useMemo(() => [
    {
      headerName: 'Estado',
      field: 'estado',
      width: 100,
      cellRenderer: (p: any) => {
        const estado = p.data?.estado
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
            estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {estado ? 'ACTIVO' : 'ANULADO'}
          </span>
        )
      },
    },
    {
      headerName: 'Documento',
      field: 'venta.tipo_documento',
      width: 140,
      valueGetter: (p) => {
        const v = p.data?.venta
        return v ? tipoDocMap[v.tipo_documento] || v.tipo_documento : ''
      },
    },
    {
      headerName: 'Venta N°',
      field: 'venta.serie',
      width: 130,
      valueGetter: (p) => {
        const v = p.data?.venta
        return v ? `${v.serie}-${v.numero}` : ''
      },
    },
    {
      headerName: 'F. Venta',
      field: 'venta.fecha',
      width: 110,
      valueGetter: (p) => p.data?.venta?.fecha ? dayjs(p.data.venta.fecha).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'F. Vence',
      field: 'venta.fecha_vencimiento',
      width: 110,
      valueGetter: (p) => p.data?.venta?.fecha_vencimiento ? dayjs(p.data.venta.fecha_vencimiento).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'Cliente',
      field: 'venta.cliente',
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
      headerName: 'Fecha y Hora Pago',
      field: 'created_at',
      width: 160,
      valueGetter: (p) => {
        const val = p.data?.created_at || p.data?.fecha
        return val ? dayjs(val).format('DD/MM/YYYY hh:mm A') : ''
      },
    },
    {
      headerName: 'T. Pago',
      field: 'despliegue_de_pago.name',
      width: 120,
      valueGetter: (p) => p.data?.despliegue_de_pago?.name || '',
    },
    {
      headerName: 'Banco',
      field: 'despliegue_de_pago.metodo_de_pago.name',
      width: 120,
      valueGetter: (p) => p.data?.despliegue_de_pago?.metodo_de_pago?.name || '',
    },
    {
      headerName: 'Importe',
      field: 'monto',
      width: 110,
      valueGetter: (p) => `S/. ${Number(p.data?.monto || 0).toFixed(2)}`,
    },
  ], [tipoDocMap])

  return (
    <Modal
      title='COBROS REALIZADOS POR DETALLE'
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1200}
      destroyOnHidden
    >
      {/* Filtros */}
      <div className='flex flex-wrap items-end gap-4 mb-4'>
        <div>
          <label className='text-xs font-medium text-gray-600'>Fecha Cobro Desde:</label>
          <DatePicker
            value={fechaDesde}
            onChange={(d) => setFechaDesde(d)}
            format='DD/MM/YYYY'
            className='w-full'
            placeholder='Todas las fechas'
            allowClear
          />
        </div>
        <div>
          <label className='text-xs font-medium text-gray-600'>Hasta:</label>
          <DatePicker
            value={fechaHasta}
            onChange={(d) => setFechaHasta(d)}
            format='DD/MM/YYYY'
            className='w-full'
            placeholder='Todas las fechas'
            allowClear
          />
        </div>
        <div>
          <label className='text-xs font-medium text-gray-600'>Estado:</label>
          <Select
            value={estadoMetodoPago}
            onChange={setEstadoMetodoPago}
            style={{ width: 180 }}
            options={[
              { label: 'Todos', value: 'todos' },
              { label: 'Activos', value: 'activos' },
              { label: 'Anulados', value: 'anulados' },
            ]}
          />
        </div>
        <div className='flex-1 min-w-[200px]'>
          <label className='text-xs font-medium text-gray-600'>Buscar Cliente:</label>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='RUC, Razón Social, Serie-Número...'
            allowClear
          />
        </div>
      </div>

      {/* Tabla */}
      <div className='h-[400px]'>
        <TableWithTitle
          id='table-cobros-realizados-detalle'
          title={`REGISTROS ENCONTRADOS: ${cobrosFiltrados.length}`}
          columnDefs={columns}
          rowData={cobrosFiltrados}
          loading={isLoading}
          selectionColor={blueColors[1]}
          suppressRowTransform
          exportExcel
          withNumberColumn={true}
          isVisible={open}
          persistColumnState={true}
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-center mt-4 bg-gray-100 rounded-lg p-3'>
        <span className='text-sm font-bold'>
          TOTAL IMPORTE: <span className='text-blue-700 text-lg'>S/. {totalImporte.toFixed(2)}</span>
        </span>
      </div>
    </Modal>
  )
}
