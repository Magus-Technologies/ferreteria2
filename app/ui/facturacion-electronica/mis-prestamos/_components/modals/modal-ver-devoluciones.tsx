  'use client'

import { Modal, message, Input } from 'antd'
import { FaClockRotateLeft, FaBan } from 'react-icons/fa6'
import { Prestamo, prestamoApi, PagoPrestamo } from '~/lib/api/prestamo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
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

const invalidateStockQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_BY_ALMACEN] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_SEARCH] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_TABLE_SEARCH] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.KARDEX] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.KARDEX_INVENTARIO] })
  queryClient.invalidateQueries({ queryKey: ['productos-search'] })
  queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
  queryClient.invalidateQueries({ queryKey: ['vencimientos-proximos'] })
}

export default function ModalVerDevoluciones({
  open,
  setOpen,
  prestamo,
}: ModalVerDevolucionesProps) {
  const queryClient = useQueryClient()
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPrestamo | null>(null)
  const tableRef = useRef<AgGridReact>(null)

  // Hook para consultar el historial de pagos / devoluciones del préstamo
  const { data: pagos, isLoading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'pagos', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return []
      const result = await prestamoApi.getPagos(prestamo.id)
      return result.data?.data || []
    },
    enabled: open && !!prestamo,
  })

  // Hook para consultar el detalle completo del préstamo, incluyendo las devoluciones con sus productos devueltos
  const { data: prestamoFull } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'detalle-devoluciones', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return null
      const result = await prestamoApi.getById(prestamo.id)
      return result.data?.data ?? null
    },
    enabled: open && !!prestamo,
  })

  // Función autoejecutable (IIFE) para procesar y listar los productos devueltos de la devolución que fue seleccionada por el usuario
  const devoluciones = (prestamoFull as any)?.devoluciones ?? []
  const getNumeroDevolucionFromObs = (observaciones?: string | null) =>
    observaciones?.match(/Devoluci[oó]n\s+(\S+?)[.\s]/i)?.[1]
  const pagosDevolucion = useMemo(
    () =>
      (pagos || []).filter(
        (pago) =>
          pago.metodo_pago === 'Devolución Física' ||
          Boolean(getNumeroDevolucionFromObs(pago.observaciones))
      ),
    [pagos]
  )

  // Seleccionar automáticamente la primera fila de devoluciones cuando se cargan
  useEffect(() => {
    if (pagosDevolucion && pagosDevolucion.length > 0 && !pagoSeleccionado) {
      const firstRow = pagosDevolucion[0]
      setPagoSeleccionado(firstRow)
      // Seleccionar visualmente la primera fila en la tabla
      setTimeout(() => {
        const api = tableRef.current?.api
        if (api) {
          api.forEachNode((node, index) => {
            if (index === 0) {
              node.setSelected(true)
            }
          })
        }
      }, 50)
    }
  }, [pagosDevolucion])

  const productosDevueltos: ProductoDevueltoRow[] = (() => {
    if (!pagoSeleccionado) return []
    const numeroDev = getNumeroDevolucionFromObs(pagoSeleccionado.observaciones)
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

  // Hook Mutation para anular/eliminar una devolución registrada y refrescar los listados del préstamo
  const [anularModalOpen, setAnularModalOpen] = useState(false)
  const [pagoAAnular, setPagoAAnular] = useState<PagoPrestamo | null>(null)
  const [motivoAnular, setMotivoAnular] = useState('')

  const anularMutation = useMutation({
    mutationFn: async ({ pagoId, motivo }: { pagoId: string; motivo: string }) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')
      const res = await prestamoApi.anularPago(prestamo.id, pagoId, motivo)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      message.success('Devolución anulada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS, 'pagos', prestamo?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS, 'detalle-devoluciones', prestamo?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS, 'detalle-registrar-devolucion', prestamo?.id] })
      invalidateStockQueries(queryClient)
      setAnularModalOpen(false)
      setPagoAAnular(null)
      setMotivoAnular('')
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al anular la devolución')
    },
  })

  const abrirAnular = (pago: PagoPrestamo) => {
    setPagoAAnular(pago)
    setMotivoAnular('')
    setAnularModalOpen(true)
  }

  const confirmarAnular = () => {
    if (!pagoAAnular) return
    if (!motivoAnular.trim() || motivoAnular.trim().length < 3) {
      message.warning('Ingrese un motivo de anulación (mínimo 3 caracteres)')
      return
    }
    anularMutation.mutate({ pagoId: pagoAAnular.id, motivo: motivoAnular.trim() })
  }

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
      headerName: 'Estado',
      width: 110,
      cellRenderer: (params: { data: PagoPrestamo }) => {
        const anulado = params.data?.estado === false
        return (
          <div className='flex items-center h-full'>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${anulado ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {anulado ? 'ANULADA' : 'ACTIVA'}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Observaciones',
      field: 'observaciones',
      flex: 1,
      minWidth: 260,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Motivo Anulación',
      field: 'motivo_anulacion',
      width: 200,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Acciones',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: { data: PagoPrestamo }) => {
        const anulado = params.data?.estado === false
        if (anulado) {
          return (
            <div className='flex items-center justify-center h-full text-gray-400 text-xs'>
              —
            </div>
          )
        }
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
            <ButtonBase
              color='danger'
              size='md'
              className='flex items-center !px-3'
              title='Anular devolución'
              onClick={() => abrirAnular(params.data)}
            >
              <FaBan />
            </ButtonBase>
          </div>
        )
      },
    },
  ]

  return (
    <>
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
          rowData={pagosDevolucion}
          loading={isLoading}
          tableRef={tableRef}
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

    {/* Modal: motivo de anulación */}
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaBan className='text-red-600' />
          <span>Anular Devolución</span>
        </div>
      }
      open={anularModalOpen}
      onOk={confirmarAnular}
      onCancel={() => setAnularModalOpen(false)}
      okText='Anular'
      cancelText='Cancelar'
      okButtonProps={{ danger: true }}
      confirmLoading={anularMutation.isPending}
      destroyOnHidden
    >
      <div className='py-2 flex flex-col gap-3'>
        <p className='text-sm text-gray-600'>
          La devolución <b>{pagoAAnular?.numero_pago}</b> quedará registrada como
          <b> ANULADA</b> y se revertirá el stock afectado. Esta acción requiere un motivo.
        </p>
        <div>
          <label className='block text-sm font-medium mb-1'>Motivo de anulación:</label>
          <Input.TextArea
            rows={3}
            value={motivoAnular}
            onChange={(e) => setMotivoAnular(e.target.value)}
            placeholder='Ingrese el motivo por el cual se anula esta devolución'
            maxLength={500}
            showCount
          />
        </div>
      </div>
    </Modal>
    </>
  )
}
