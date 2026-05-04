'use client'

import { Modal, DatePicker, Input, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { compraApi, type Compra, type PagoDeCompra } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

interface ModalConsultarPagosCompraProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalConsultarPagosCompra({ open, setOpen }: ModalConsultarPagosCompraProps) {
  // Por defecto: fecha de hoy
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs())
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs())
  const [searchText, setSearchText] = useState('')
  const [estadoMetodoPago, setEstadoMetodoPago] = useState<string>('todos')

  const filtros = useStoreFiltrosComprasPorPagar(state => state.filtros)

  // Construir filtros para el API
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined
    
    const filters: any = {
      almacen_id: filtros.almacen_id as number | undefined,
      estado: estadoMetodoPago,
      per_page: -1,
    }
    
    if (fechaDesde) {
      filters.desde = fechaDesde.format('YYYY-MM-DD')
    }
    if (fechaHasta) {
      filters.hasta = fechaHasta.format('YYYY-MM-DD')
    }
    
    return filters
  }, [filtros, fechaDesde, fechaHasta, estadoMetodoPago])

  // Obtener todos los pagos de compras
  const { data: pagosResponse, isLoading } = useQuery({
    queryKey: [QueryKeys.PAGOS_COMPRA, 'all-pagos', apiFilters],
    queryFn: async () => {
      // Primero obtener todas las compras
      const comprasResult = await compraApi.getAll({ 
        almacen_id: apiFilters?.almacen_id,
        per_page: -1 
      })
      
      if (comprasResult.error || !comprasResult.data?.data) return []
      
      // Luego obtener los pagos de cada compra
      const compras = comprasResult.data.data
      const pagosPromises = compras.map(async (compra: Compra) => {
        const pagosResult = await compraApi.getPagos(compra.id)
        if (pagosResult.error || !pagosResult.data?.data) return []
        
        // Agregar información de la compra a cada pago
        return pagosResult.data.data.map((pago: PagoDeCompra) => ({
          ...pago,
          compra: compra,
        }))
      })
      
      const allPagosArrays = await Promise.all(pagosPromises)
      return allPagosArrays.flat()
    },
    enabled: open && !!filtros,
    staleTime: 1 * 60 * 1000,
  })

  const allPagos = pagosResponse ?? []

  // Filtrar pagos por búsqueda y estado
  const pagosFiltrados = useMemo(() => {
    let filtered = allPagos ?? []

    // Filtrar por estado
    if (estadoMetodoPago === 'activos') {
      filtered = filtered.filter(pago => pago.estado === true)
    } else if (estadoMetodoPago === 'anulados') {
      filtered = filtered.filter(pago => pago.estado === false)
    }

    // Filtrar por fechas
    if (fechaDesde) {
      filtered = filtered.filter(pago => {
        const fechaPago = dayjs(pago.created_at || pago.fecha)
        return fechaPago.isAfter(fechaDesde.startOf('day')) || fechaPago.isSame(fechaDesde.startOf('day'))
      })
    }
    if (fechaHasta) {
      filtered = filtered.filter(pago => {
        const fechaPago = dayjs(pago.created_at || pago.fecha)
        return fechaPago.isBefore(fechaHasta.endOf('day')) || fechaPago.isSame(fechaHasta.endOf('day'))
      })
    }

    // Filtrar por texto
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(pago => {
        const compra = (pago as any).compra as Compra | undefined
        const proveedorNombre = compra?.proveedor?.razon_social || ''
        const docProveedor = compra?.proveedor?.ruc || ''
        const serieNumero = compra ? `${compra.serie}-${compra.numero}` : ''
        return proveedorNombre.toLowerCase().includes(search) ||
          docProveedor.includes(search) ||
          serieNumero.toLowerCase().includes(search)
      })
    }

    return filtered
  }, [allPagos, searchText, estadoMetodoPago, fechaDesde, fechaHasta])

  // Total importe (solo pagos activos)
  const totalImporte = useMemo(() =>
    pagosFiltrados
      .filter(p => p.estado === true)
      .reduce((acc, p) => acc + Number(p.monto || 0), 0)
  , [pagosFiltrados])

  // Total de pagos anulados
  const totalAnulados = useMemo(() =>
    pagosFiltrados
      .filter(p => p.estado === false)
      .reduce((acc, p) => acc + Number(p.monto || 0), 0)
  , [pagosFiltrados])

  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'gr': 'GUÍA REMISIÓN' }

  const columns: ColDef<PagoDeCompra>[] = useMemo(() => [
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
      width: 140,
      valueGetter: (p) => {
        const c = (p.data as any)?.compra
        return c ? tipoDocMap[c.tipo_documento] || c.tipo_documento : ''
      },
    },
    {
      headerName: 'Compra N°',
      width: 130,
      valueGetter: (p) => {
        const c = (p.data as any)?.compra
        return c ? `${c.serie}-${c.numero}` : ''
      },
    },
    {
      headerName: 'F. Compra',
      width: 110,
      valueGetter: (p) => {
        const c = (p.data as any)?.compra
        return c?.fecha ? dayjs(c.fecha).format('DD/MM/YYYY') : ''
      },
    },
    {
      headerName: 'F. Vence',
      width: 110,
      valueGetter: (p) => {
        const c = (p.data as any)?.compra
        return c?.fecha_vencimiento ? dayjs(c.fecha_vencimiento).format('DD/MM/YYYY') : ''
      },
    },
    {
      headerName: 'Proveedor',
      flex: 1,
      minWidth: 200,
      valueGetter: (p) => {
        const c = (p.data as any)?.compra
        const prov = c?.proveedor
        if (!prov) return ''
        const doc = prov.ruc || ''
        const nombre = prov.razon_social || ''
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
      width: 120,
      valueGetter: (p) => p.data?.despliegue_de_pago?.numero_celular || '',
    },
    {
      headerName: 'Banco',
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
      title='PAGOS REALIZADOS POR DETALLE'
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1200}
      destroyOnHidden
    >
      {/* Filtros */}
      <div className='flex flex-wrap items-end gap-4 mb-4'>
        <div>
          <label className='text-xs font-medium text-gray-600'>Fecha Pago Desde:</label>
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
          <label className='text-xs font-medium text-gray-600'>Buscar Proveedor:</label>
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
          id='table-pagos-realizados-detalle'
          title={`REGISTROS ENCONTRADOS: ${pagosFiltrados.length}`}
          columnDefs={columns}
          rowData={pagosFiltrados}
          loading={isLoading}
          selectionColor={orangeColors[1]}
          suppressRowTransform
          exportExcel
          withNumberColumn={true}
          isVisible={open}
          persistColumnState={true}
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-between items-center mt-4 bg-gray-100 rounded-lg p-3 gap-6'>
        <span className='text-sm font-bold'>
          TOTAL IMPORTE (ACTIVOS): <span className='text-green-700 text-lg'>S/. {totalImporte.toFixed(2)}</span>
        </span>
        {totalAnulados > 0 && (
          <span className='text-sm font-bold'>
            TOTAL ANULADOS: <span className='text-red-700 text-lg'>S/. {totalAnulados.toFixed(2)}</span>
          </span>
        )}
      </div>
    </Modal>
  )
}
