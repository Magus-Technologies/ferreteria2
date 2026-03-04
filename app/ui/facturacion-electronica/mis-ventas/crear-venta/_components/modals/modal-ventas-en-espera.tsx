'use client'

import { Modal, DatePicker, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, EstadoDeVenta, type getVentaResponseProps } from '~/lib/api/venta'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreVentasEnEspera } from '../../_store/store-ventas-en-espera'
import { useColumnsMisVentas } from '../../../_components/tables/columns-mis-ventas'
import TableWithTitle from '~/components/tables/table-with-title'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs, { Dayjs } from 'dayjs'
import { FaSearch } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { orangeColors } from '~/lib/colors'

export default function ModalVentasEnEspera({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const router = useRouter()
  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const ventaSeleccionada = useStoreVentasEnEspera(state => state.ventaSeleccionada)
  const setVentaSeleccionada = useStoreVentasEnEspera(state => state.setVentaSeleccionada)

  const [desde, setDesde] = useState<Dayjs | null>(dayjs().startOf('day'))
  const [hasta, setHasta] = useState<Dayjs | null>(dayjs().endOf('day'))
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_EN_ESPERA, almacen_id, desde?.toISOString(), hasta?.toISOString(), search],
    queryFn: async () => {
      const response = await ventaApi.list({
        almacen_id: almacen_id ?? undefined,
        estado_de_venta: EstadoDeVenta.EN_ESPERA,
        search: search || undefined,
      })
      if (response.error) throw new Error(response.error.message)

      let ventas = response.data?.data || []

      // Filtrar por fecha en frontend si se proporcionan
      if (desde) {
        const desdeStr = desde.startOf('day').toISOString()
        ventas = ventas.filter((v: any) => v.fecha >= desdeStr)
      }
      if (hasta) {
        const hastaStr = hasta.endOf('day').toISOString()
        ventas = ventas.filter((v: any) => v.fecha <= hastaStr)
      }

      return ventas
    },
    enabled: open,
  })

  // Columnas simplificadas para el modal (sin acciones)
  const allColumns = useColumnsMisVentas()
  const columns: ColDef<getVentaResponseProps>[] = allColumns.filter(
    col => col.headerName !== 'Acciones'
  )

  // Detalle de productos de la venta seleccionada
  type DetalleProducto = {
    producto: string
    unidad: string
    cantidad: number
    precio: number
    subtotal: number
  }

  const detalleProductos: DetalleProducto[] =
    ventaSeleccionada?.productos_por_almacen?.flatMap((productoAlmacen: any) =>
      productoAlmacen.unidades_derivadas.map((unidad: any) => ({
        producto: productoAlmacen.producto_almacen.producto.name,
        unidad: unidad.unidad_derivada_inmutable.name,
        cantidad: Number(unidad.cantidad),
        precio: Number(unidad.precio),
        subtotal: Number(unidad.cantidad) * Number(unidad.precio),
      }))
    ) || []

  const columnsDet: ColDef<DetalleProducto>[] = [
    { headerName: 'Producto', field: 'producto', flex: 1 },
    { headerName: 'Unidad', field: 'unidad', width: 120 },
    { headerName: 'Cantidad', field: 'cantidad', width: 100, valueFormatter: p => Number(p.value).toFixed(2) },
    { headerName: 'Precio', field: 'precio', width: 100, valueFormatter: p => `S/. ${Number(p.value).toFixed(2)}` },
    { headerName: 'Subtotal', field: 'subtotal', width: 120, valueFormatter: p => `S/. ${Number(p.value).toFixed(2)}` },
  ]

  const handleDoubleClick = (data: getVentaResponseProps | undefined) => {
    if (!data?.id) return
    setOpen(false)
    router.push(`/ui/facturacion-electronica/mis-ventas/editar-venta/${data.id}`)
  }

  return (
    <Modal
      centered
      width={1100}
      open={open}
      title='Ventas en Espera'
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
            placeholder='Cliente, serie...'
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
        {/* Tabla de ventas en espera */}
        <div style={{ height: 250 }}>
          <TableWithTitle<getVentaResponseProps>
            id='ventas-en-espera'
            title='VENTAS EN ESPERA (doble click para recuperar)'
            loading={isLoading}
            columnDefs={columns}
            rowData={data || []}
            selectionColor={orangeColors[10]}
            onRowClicked={event => {
              event.node.setSelected(true)
            }}
            onSelectionChanged={({ selectedNodes }) => {
              const selected = selectedNodes?.[0]?.data as getVentaResponseProps
              setVentaSeleccionada(selected)
            }}
            onRowDoubleClicked={({ data }) => handleDoubleClick(data)}
          />
        </div>

        {/* Tabla de detalle */}
        <div style={{ height: 230 }}>
          <TableWithTitle<DetalleProducto>
            id='detalle-venta-en-espera'
            title='DETALLE DE VENTA'
            columnDefs={columnsDet}
            rowData={detalleProductos}
            selectionColor={orangeColors[10]}
          />
        </div>
      </div>
    </Modal>
  )
}
