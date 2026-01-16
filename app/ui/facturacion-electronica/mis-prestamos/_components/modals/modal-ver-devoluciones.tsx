'use client'

import { Modal, message, Popconfirm } from 'antd'
import { FaClockRotateLeft, FaTrash } from 'react-icons/fa6'
import { Prestamo, prestamoApi, PagoPrestamo } from '~/lib/api/prestamo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import ButtonBase from '~/components/buttons/button-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

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

  const { data: pagos, isLoading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'pagos', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return []
      const result = await prestamoApi.getPagos(prestamo.id)
      return result.data?.data || []
    },
    enabled: open && !!prestamo,
  })

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
      destroyOnClose
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

      <div className='w-full h-[400px]'>
        <TableWithTitle<PagoPrestamo>
          id='devoluciones-prestamo'
          title='Devoluciones Registradas'
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={pagos || []}
          loading={isLoading}
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
