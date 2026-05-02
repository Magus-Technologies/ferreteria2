'use client'

import { Modal, DatePicker, Input, Button, Select } from 'antd'
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
  // Por defecto: solo hoy
  const [fechaDesde, setFechaDesde] = useState(dayjs())
  const [fechaHasta, setFechaHasta] = useState(dayjs())
  const [searchText, setSearchText] = useState('')
  const [estadoMetodoPago, setEstadoMetodoPago] = useState<string>('todos')

  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  // Obtener TODOS los cobros directamente con el nuevo endpoint
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    return {
      almacen_id: filtros.almacen_id as number | undefined,
      desde: fechaDesde.format('YYYY-MM-DD'),
      hasta: fechaHasta.format('YYYY-MM-DD'),
      per_page: -1,
    }
  }, [filtros, fechaDesde, fechaHasta])

  const { data: cobrosResponse, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, 'all-cobros', apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getAllCobros(apiFilters)
      return result.data?.data ?? []
    },
    enabled: open && !!filtros,
    staleTime: 1 * 60 * 1000,
  })

  const allCobros = cobrosResponse ?? []

  // Filtrar cobros por búsqueda y estado (la fecha ya se filtra en el backend)
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

    // Filtrar por estado del cobro (activo/anulado)
    if (estadoMetodoPago !== 'todos') {
      filtered = filtered.filter(cobro => {
        const esActivo = cobro.estado ?? true
        if (estadoMetodoPago === 'activos') {
          return esActivo
        } else if (estadoMetodoPago === 'anulados') {
          return !esActivo
        }
        return true
      })
    }

    return filtered
  }, [allCobros, searchText, estadoMetodoPago])

  // Total importe
  const totalImporte = useMemo(() =>
    cobrosFiltrados.reduce((acc, c) => acc + Number(c.monto || 0), 0)
  , [cobrosFiltrados])

  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'nv': 'NOTA DE VENTA' }

  const columns: ColDef<CobroVenta>[] = useMemo(() => [
    { headerName: '#', width: 50, valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'Estado',
      width: 90,
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
      headerName: 'Fecha y Hora Pago',
      width: 150,
      valueGetter: (p) => {
        const val = p.data?.created_at || p.data?.fecha
        return val ? dayjs(val).format('DD/MM/YYYY hh:mm A') : ''
      },
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
      destroyOnHidden
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
        <div>
          <label className='text-xs font-medium text-gray-600'>Estado Método de Pago:</label>
          <Select
            value={estadoMetodoPago}
            onChange={setEstadoMetodoPago}
            style={{ width: 200 }}
            options={[
              { label: 'Todos', value: 'todos' },
              { label: 'Activos', value: 'activos' },
              { label: 'Anulados/Desactivados', value: 'anulados' },
            ]}
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
        <Button type='primary' onClick={() => refetch()}>
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
          withNumberColumn={false}
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
