'use client'

import { Modal, DatePicker, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { cotizacionesApi, type Cotizacion } from '~/lib/api/cotizaciones'
import { useStoreAlmacen } from '~/store/store-almacen'
import TableWithTitle from '~/components/tables/table-with-title'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs, { Dayjs } from 'dayjs'
import { FaSearch } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'

export default function ModalCotizaciones({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const router = useRouter()
  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null)

  const [desde, setDesde] = useState<Dayjs | null>(dayjs().subtract(30, 'day'))
  const [hasta, setHasta] = useState<Dayjs | null>(dayjs())
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COTIZACIONES, 'modal-crear-venta', almacen_id, desde?.format('YYYY-MM-DD'), hasta?.format('YYYY-MM-DD'), search],
    queryFn: async () => {
      const response = await cotizacionesApi.getAll({
        almacen_id: almacen_id ?? undefined,
        estado_cotizacion: 'pe', // Solo pendientes
        fecha_desde: desde?.format('YYYY-MM-DD') || undefined,
        fecha_hasta: hasta?.format('YYYY-MM-DD') || undefined,
        search: search || undefined,
        per_page: 100,
      })
      if (response.error) throw new Error(response.error.message)
      return response.data?.data || []
    },
    enabled: open,
  })

  // Columnas de cotizaciones (simplificadas sin acciones)
  const columns: ColDef<Cotizacion>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 110,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'N\u00b0 Prof',
      field: 'numero',
      width: 120,
    },
    {
      headerName: 'Cliente',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const cliente = params.data?.cliente
        if (!cliente) return ''
        return (
          cliente.razon_social ||
          `${cliente.nombres} ${cliente.apellidos}`.trim()
        )
      },
    },
    {
      headerName: 'Vendedor',
      valueGetter: (params) => params.data?.user?.name || '',
      width: 140,
    },
    {
      headerName: 'Almacen',
      valueGetter: (params) => params.data?.almacen?.name || '',
      width: 120,
    },
    {
      headerName: 'Total',
      width: 110,
      valueGetter: (params) => {
        const cotizacion = params.data
        if (!cotizacion?.productos_por_almacen) return 0

        return cotizacion.productos_por_almacen.reduce((sum, pa) => {
          const subtotalProducto = (pa.unidades_derivadas || []).reduce((subSum, ud) => {
            const cantidad = Number(ud.cantidad)
            const precio = Number(ud.precio)
            const recargo = Number(ud.recargo || 0)
            const descuento = Number(ud.descuento || 0)

            let montoLinea = precio * cantidad + recargo
            if (ud.descuento_tipo === '%') {
              montoLinea = montoLinea - (montoLinea * descuento / 100)
            } else {
              montoLinea = montoLinea - descuento
            }
            return subSum + montoLinea
          }, 0)
          return sum + subtotalProducto
        }, 0)
      },
      valueFormatter: (params) => `S/. ${params.value?.toFixed(2) || '0.00'}`,
      cellStyle: { fontWeight: 'bold', color: '#059669' },
    },
  ]

  // Detalle de productos de la cotizacion seleccionada
  type DetalleProducto = {
    producto: string
    unidad: string
    cantidad: number
    precio: number
    subtotal: number
  }

  const detalleProductos: DetalleProducto[] =
    cotizacionSeleccionada?.productos_por_almacen?.flatMap((pa) =>
      (pa.unidades_derivadas || []).map((ud) => ({
        producto: pa.producto_almacen?.producto?.name || '',
        unidad: ud.unidad_derivada_inmutable?.name || '',
        cantidad: Number(ud.cantidad),
        precio: Number(ud.precio),
        subtotal: Number(ud.cantidad) * Number(ud.precio),
      }))
    ) || []

  const columnsDet: ColDef<DetalleProducto>[] = [
    { headerName: 'Producto', field: 'producto', flex: 1 },
    { headerName: 'Unidad', field: 'unidad', width: 120 },
    { headerName: 'Cantidad', field: 'cantidad', width: 100, valueFormatter: p => Number(p.value).toFixed(2) },
    { headerName: 'Precio', field: 'precio', width: 100, valueFormatter: p => `S/. ${Number(p.value).toFixed(2)}` },
    { headerName: 'Subtotal', field: 'subtotal', width: 120, valueFormatter: p => `S/. ${Number(p.value).toFixed(2)}` },
  ]

  const handleDoubleClick = (data: Cotizacion | undefined) => {
    if (!data?.id) return
    setOpen(false)
    router.push(`/ui/facturacion-electronica/mis-ventas/crear-venta?cotizacion=${data.id}`)
  }

  return (
    <Modal
      centered
      width={1100}
      open={open}
      title='Cotizaciones Pendientes'
      footer={null}
      onCancel={() => setOpen(false)}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      {/* Filtros */}
      <div className='flex items-center gap-3 mb-4'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Desde:</span>
          <DatePicker
            value={desde}
            onChange={setDesde}
            format='DD/MM/YYYY'
            allowClear
            style={{ width: 140 }}
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Hasta:</span>
          <DatePicker
            value={hasta}
            onChange={setHasta}
            format='DD/MM/YYYY'
            allowClear
            style={{ width: 140 }}
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Buscar:</span>
          <Input
            placeholder='Cliente, n\u00b0 prof...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            onPressEnter={() => {}}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <ButtonBase
          color='info'
          size='md'
          className='flex items-center gap-2'
        >
          <FaSearch /> Buscar
        </ButtonBase>
      </div>

      {/* Tablas */}
      <div className='flex flex-col gap-4' style={{ height: 500 }}>
        {/* Tabla de cotizaciones */}
        <div style={{ height: 250 }}>
          <TableWithTitle<Cotizacion>
            id='cotizaciones-para-venta'
            title='COTIZACIONES PENDIENTES (doble click para convertir a venta)'
            loading={isLoading}
            columnDefs={columns}
            rowData={data || []}
            selectionColor='#3b82f6'
            onRowClicked={event => {
              event.node.setSelected(true)
            }}
            onSelectionChanged={({ selectedNodes }) => {
              const selected = selectedNodes?.[0]?.data as Cotizacion
              setCotizacionSeleccionada(selected)
            }}
            onRowDoubleClicked={({ data }) => handleDoubleClick(data)}
          />
        </div>

        {/* Tabla de detalle */}
        <div style={{ height: 230 }}>
          <TableWithTitle<DetalleProducto>
            id='detalle-cotizacion'
            title='DETALLE DE COTIZACION'
            columnDefs={columnsDet}
            rowData={detalleProductos}
            selectionColor='#3b82f6'
          />
        </div>
      </div>
    </Modal>
  )
}
