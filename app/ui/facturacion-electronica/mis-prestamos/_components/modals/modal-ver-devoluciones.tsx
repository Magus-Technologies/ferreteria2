  'use client'

import { Modal, message, Popconfirm } from 'antd'
import { FaClockRotateLeft, FaTrash } from 'react-icons/fa6'
import { Prestamo, prestamoApi, PagoPrestamo } from '~/lib/api/prestamo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import { useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

interface ProductoDevueltoRow {
  producto: string
  codigo: string
  unidad: string
  cantidad: number
  factor: number
}

interface ModalVerDevolucionesProps {
  open: boolean
  setOpen: (open: boolean) => void
  prestamo?: Prestamo
}

export default function ModalVerDevoluciones({
  open,
  setOpen,
  prestamo,
}: ModalVerDevolucionesProps) {
  const queryClient = useQueryClient()
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPrestamo | null>(null)

  const { data: pagos, isLoading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'pagos', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return []
      const result = await prestamoApi.getPagos(prestamo.id)
      return result.data?.data || []
    },
    enabled: open && !!prestamo,
  })

  // Préstamo completo (incluye devoluciones con sus productos devueltos)
  const { data: prestamoFull } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'detalle-devoluciones', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return null
      const result = await prestamoApi.getById(prestamo.id)
      return result.data?.data ?? null
    },
    enabled: open && !!prestamo,
  })

  // Productos de la devolución correspondiente al pago seleccionado.
  // El PagoPrestamo "legacy" guarda en observaciones: "Devolución {numero}. ..."
  const devoluciones = (prestamoFull as any)?.devoluciones ?? []
  const productosDevueltos: ProductoDevueltoRow[] = (() => {
    if (!pagoSeleccionado) return []
    const obs = pagoSeleccionado.observaciones || ''
    const match = obs.match(/Devoluci[oó]n\s+(\S+?)[.\s]/i)
    const numeroDev = match?.[1]
    const dev = numeroDev
      ? devoluciones.find((d: any) => String(d.numero_devolucion) === String(numeroDev))
      : undefined
    if (!dev) return []
    const pdList = dev.productos_devueltos ?? dev.productosDevueltos ?? []
    return pdList.map((pd: any) => {
      const pap = pd.producto_almacen_prestamo ?? pd.productoAlmacenPrestamo
      const prod = pap?.producto_almacen?.producto ?? pap?.productoAlmacen?.producto
      const unidades = pap?.unidades_derivadas ?? pap?.unidadesDerivadas ?? []
      return {
        producto: prod?.name || 'N/A',
        codigo: prod?.cod_producto || '',
        unidad: unidades?.[0]?.name || 'UNIDAD',
        cantidad: Number(pd.cantidad || 0),
        factor: Number(pd.factor || 1),
      }
    })
  })()

  const columnsProductos: ColDef<ProductoDevueltoRow>[] = [
    { headerName: 'Producto', colId: 'producto', flex: 1, minWidth: 220,
      valueGetter: (p) => p.data ? `${p.data.producto} (${p.data.codigo})` : '' },
    { headerName: 'Unidad', colId: 'unidad', field: 'unidad', width: 130 },
    { headerName: 'Cantidad', colId: 'cantidad', field: 'cantidad', width: 120,
      valueFormatter: (p) => Number(p.value || 0).toFixed(0),
      cellStyle: { fontWeight: 'bold', color: '#059669' } },
  ]

  const deleteMutation = useMutation({
    mutationFn: async (pagoId: string) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')
      return prestamoApi.eliminarPago(prestamo.id, pagoId)
    },
    onSuccess: () => {
      message.success('Devolución eliminada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS, 'pagos', prestamo?.id] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Error al eliminar la devolución')
    },
  })

  const columns: ColDef<PagoPrestamo>[] = [
    {
      headerName: 'N° Devolución',
      field: 'numero_pago',
      width: 150,
    },
    {
      headerName: 'Fecha',
      field: 'fecha_pago',
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'Tipo de Operación',
      width: 190,
      cellRenderer: () => {
        // PRESTAR  → yo presté, me devuelven
        // PEDIR_PRESTADO → yo pedí prestado, yo devuelvo
        const esPrestar = prestamo?.tipo_operacion === 'PRESTAR'
        const texto = esPrestar ? 'Me están devolviendo' : 'Estoy devolviendo'
        const cls = esPrestar
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-orange-100 text-orange-700'
        return (
          <div className='flex items-center h-full'>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${cls}`}>
              {texto}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Cantidad',
      field: 'monto',
      width: 100,
      valueFormatter: (params) => {
        const value = Number(params.value)
        return isNaN(value) ? '0' : value.toFixed(0)
      },
      cellStyle: { fontWeight: 'bold', color: '#059669' },
    },
    {
      headerName: 'Usuario',
      valueGetter: (params) => params.data?.user?.name || '',
      width: 150,
    },
    {
      headerName: 'Observaciones',
      field: 'observaciones',
      flex: 1,
      minWidth: 300,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Acciones',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: { data: PagoPrestamo }) => {
        return (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              height: '100%',
              alignItems: 'center',
            }}
          >
            <Popconfirm
              title='¿Eliminar devolución?'
              description='Esta acción no se puede deshacer'
              onConfirm={() => deleteMutation.mutate(params.data.id)}
              okText='Sí, eliminar'
              cancelText='Cancelar'
              okButtonProps={{ danger: true }}
            >
              <ButtonBase
                color='danger'
                size='md'
                className='flex items-center !px-3'
                title='Eliminar'
              >
                <FaTrash />
              </ButtonBase>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaClockRotateLeft className='text-blue-600' />
          <span>Historial de Devoluciones</span>
        </div>
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1200}
      destroyOnHidden
    >
      {prestamo && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <div className='grid grid-cols-3 gap-2 text-sm'>
            <div>
              <span className='font-semibold'>N° Préstamo:</span> {prestamo.numero}
            </div>
            <div>
              <span className='font-semibold'>Cliente/Proveedor:</span>{' '}
              {prestamo.cliente?.razon_social ||
                `${prestamo.cliente?.nombres || ''} ${prestamo.cliente?.apellidos || ''}`.trim() ||
                prestamo.proveedor?.razon_social ||
                'N/A'}
            </div>
            <div>
              <span className='font-semibold'>Estado:</span>{' '}
              <span
                className={`font-bold ${
                  prestamo.estado_prestamo === 'pagado_total'
                    ? 'text-green-600'
                    : prestamo.estado_prestamo === 'pagado_parcial'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}
              >
                {prestamo.estado_prestamo === 'pendiente' && 'PENDIENTE'}
                {prestamo.estado_prestamo === 'pagado_parcial' && 'DEVUELTO PARCIAL'}
                {prestamo.estado_prestamo === 'pagado_total' && 'DEVUELTO TOTAL'}
                {prestamo.estado_prestamo === 'vencido' && 'VENCIDO'}
              </span>
            </div>
            <div>
              <span className='font-semibold'>Cantidad Total:</span> {Number(prestamo.monto_total).toFixed(0)}
            </div>
            <div>
              <span className='font-semibold'>Devuelto:</span>{' '}
              <span className='text-green-600 font-bold'>{Number(prestamo.monto_pagado).toFixed(0)}</span>
            </div>
            <div>
              <span className='font-semibold'>Pendiente:</span>{' '}
              <span className='text-red-600 font-bold'>{Number(prestamo.monto_pendiente).toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      <div className='w-full h-[280px]'>
        <TableWithTitle<PagoPrestamo>
          id='devoluciones-prestamo'
          title='Devoluciones Registradas (clic para ver productos)'
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={pagos || []}
          loading={isLoading}
          onRowClicked={(event) => {
            event.node.setSelected(true)
            setPagoSeleccionado(event.data as PagoPrestamo)
          }}
          onSelectionChanged={({ selectedNodes }) =>
            setPagoSeleccionado((selectedNodes?.[0]?.data as PagoPrestamo) ?? null)
          }
        />
      </div>

      <div className='w-full h-[220px] mt-4'>
        <TableWithTitle<ProductoDevueltoRow>
          id='productos-devueltos-prestamo'
          title={
            pagoSeleccionado
              ? 'Productos Devueltos en esta Devolución'
              : 'Productos Devueltos (seleccione una devolución arriba)'
          }
          selectionColor={orangeColors[10]}
          columnDefs={columnsProductos}
          rowData={productosDevueltos}
          overlayNoRowsTemplate='<span class="text-gray-500">Seleccione una devolución para ver sus productos</span>'
        />
      </div>

      <div className='flex justify-end mt-4'>
        <ButtonBase color='default' size='md' type='button' onClick={() => setOpen(false)}>
          Cerrar
        </ButtonBase>
      </div>
    </Modal>
  )
}
