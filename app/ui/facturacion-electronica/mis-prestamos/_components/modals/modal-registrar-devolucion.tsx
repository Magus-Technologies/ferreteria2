'use client'

import { Modal, Form, message, InputNumber, Checkbox } from 'antd'
import { useState, useMemo } from 'react'
import FormBase from '~/components/form/form-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { FaSave } from 'react-icons/fa'
import { Prestamo, prestamoApi } from '~/lib/api/prestamo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import { FaCalendar } from 'react-icons/fa6'
import type { ProductoAlmacenPrestamo } from '~/lib/api/prestamo'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

interface ModalRegistrarDevolucionProps {
  open: boolean
  setOpen: (open: boolean) => void
  prestamo?: Prestamo
}

interface ProductoDevolucion {
  producto_almacen_prestamo_id: number
  cantidad: number
  factor: number
  selected: boolean
}

interface FormValues {
  fecha_devolucion: dayjs.Dayjs
  observaciones?: string
}

export default function ModalRegistrarDevolucion({
  open,
  setOpen,
  prestamo,
}: ModalRegistrarDevolucionProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<ProductoDevolucion[]>([])
  const queryClient = useQueryClient()

  // Initialize productos when prestamo changes
  useMemo(() => {
    if (prestamo?.productosPorAlmacen) {
      const initialProductos = prestamo.productosPorAlmacen.map((pa: ProductoAlmacenPrestamo) => {
        const unidad = pa.unidadesDerivadas?.[0]
        return {
          producto_almacen_prestamo_id: pa.id,
          cantidad: unidad ? Number(unidad.cantidad) : Number(prestamo.monto_pendiente || 0),
          factor: unidad ? Number(unidad.factor) : 1,
          selected: true,
        }
      })
      setProductos(initialProductos)
    }
  }, [prestamo?.productosPorAlmacen, prestamo?.monto_pendiente])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')

      const selectedProductos = productos
        .filter(p => p.selected)
        .map(p => ({
          producto_almacen_prestamo_id: p.producto_almacen_prestamo_id,
          cantidad: p.cantidad,
          factor: p.factor,
        }))

      if (selectedProductos.length === 0) {
        throw new Error('Debe seleccionar al menos un producto')
      }

      const data = {
        productos: selectedProductos,
        fecha_devolucion: values.fecha_devolucion.format('YYYY-MM-DD'),
        observaciones: values.observaciones,
      }

      return prestamoApi.registrarDevolucion(prestamo.id, data)
    },
    onSuccess: () => {
      message.success('Devolución registrada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
      form.resetFields()
      setOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      message.error(err?.response?.data?.message || err?.message || 'Error al registrar la devolución')
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(values)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setOpen(false)
  }

  const handleProductoChange = (index: number, field: 'cantidad' | 'selected', value: number | boolean) => {
    setProductos(prev => {
      const updated = [...prev]
      if (field === 'selected') {
        updated[index] = { ...updated[index], selected: value as boolean }
      } else {
        updated[index] = { ...updated[index], cantidad: value as number }
      }
      return updated
    })
  }

  const columns: ColDef<ProductoDevolucion>[] = [
    {
      headerName: '',
      field: 'selected',
      width: 50,
      cellRenderer: (params: any) => {
        const index = params.rowIndex
        return (
          <div className='flex justify-center items-center h-full'>
            <Checkbox
              checked={productos[index]?.selected}
              onChange={(e) => handleProductoChange(index, 'selected', e.target.checked)}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Producto',
      valueGetter: (params: any) => {
        const index = params.rowIndex
        const pa = prestamo?.productosPorAlmacen?.[index]
        const prod = pa?.productoAlmacen?.producto
        return prod ? `${prod.name} (${prod.cod_producto})` : 'N/A'
      },
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'UND',
      valueGetter: (params: any) => {
        const index = params.rowIndex
        const pa = prestamo?.productosPorAlmacen?.[index]
        return pa?.unidadesDerivadas?.[0]?.name || 'UNIDAD'
      },
      width: 80,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 120,
      cellRenderer: (params: any) => {
        const index = params.rowIndex
        return (
          <div className='flex justify-center items-center h-full w-full py-1 pr-2'>
            <InputNumber
              min={0}
              max={productos[index]?.factor * 10000}
              value={productos[index]?.cantidad || 0}
              onChange={(value) => handleProductoChange(index, 'cantidad', value || 0)}
              disabled={!productos[index]?.selected}
              size='small'
              style={{ width: '100%' }}
            />
          </div>
        )
      },
    },
  ]

  const totalSelected = productos
    .filter(p => p.selected)
    .reduce((sum, p) => sum + (p.cantidad * p.factor), 0)

  return (
    <Modal
      title={
        <div className='flex items-center gap-2 border-b border-gray-100 pb-3 mr-6'>
          <div className='p-2 bg-orange-50 rounded-lg text-orange-600'>
            <FaSave size={18} />
          </div>
          <div>
            <h3 className='text-base font-bold text-gray-900 leading-none'>Registrar Devolución</h3>
            <span className='text-xs font-normal text-gray-500'>Procesa el retorno de los productos en préstamo</span>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnHidden
    >
      {prestamo && (
        <div className='mb-6 mt-3 p-5 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-100 rounded-xl shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>N° Préstamo:</span>
              <span className='font-bold text-gray-800 bg-orange-100/60 px-2 py-0.5 rounded text-xs'>{prestamo.numero}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Cliente/Proveedor:</span>
              <span className='font-semibold text-gray-800 truncate max-w-[240px]' title={prestamo.cliente?.razon_social || `${prestamo.cliente?.nombres || ''} ${prestamo.cliente?.apellidos || ''}`.trim() || prestamo.proveedor?.razon_social}>
                {prestamo.cliente?.razon_social ||
                  `${prestamo.cliente?.nombres || ''} ${prestamo.cliente?.apellidos || ''}`.trim() ||
                  prestamo.proveedor?.razon_social ||
                  'N/A'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Tipo:</span>
              <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                prestamo.tipo_operacion === 'PRESTAR' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
              }`}>
                {prestamo.tipo_operacion === 'PRESTAR' ? 'Préstamo' : 'Pedir Prestado'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Cantidad Total:</span>
              <span className='font-semibold text-gray-800'>{Number(prestamo.monto_total).toFixed(0)} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Devuelto:</span>
              <span className='text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded'>{Number(prestamo.monto_pagado).toFixed(0)} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Pendiente:</span>
              <span className='text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded'>{Number(prestamo.monto_pendiente).toFixed(0)} u.</span>
            </div>
          </div>
        </div>
      )}

      <div className='w-full h-[220px] mb-6'>
        <TableWithTitle<ProductoDevolucion>
          id='productos-devolucion-prestamo'
          title='PRODUCTOS A DEVOLVER'
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={productos}
        />
      </div>

      <div className='flex justify-between items-center bg-orange-50/50 border border-orange-100/60 rounded-xl px-4 py-2.5 mb-6'>
        <span className='text-orange-850 text-sm font-semibold'>Total Seleccionado:</span>
        <span className='font-bold text-lg text-orange-950'>{totalSelected.toFixed(0)} <span className='text-xs font-normal text-orange-800'>unidades</span></span>
      </div>

      <FormBase
        form={form}
        name='form-registrar-devolucion'
        onFinish={handleSubmit}
        initialValues={{
          fecha_devolucion: dayjs(),
        }}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-start'>
            <div className='col-span-1'>
              <LabelBase label='Fecha de Devolución' orientation='column'>
                <DatePickerBase
                  propsForm={{
                    name: 'fecha_devolucion',
                    rules: [{ required: true, message: 'Seleccione la fecha' }],
                  }}
                  placeholder='Seleccione la fecha'
                  prefix={<FaCalendar size={15} className='text-orange-600 mx-1' />}
                />
              </LabelBase>
            </div>

            <div className='col-span-2'>
              <LabelBase label='Observaciones (Opcional)' orientation='column'>
                <TextareaBase
                  propsForm={{
                    name: 'observaciones',
                  }}
                  placeholder='Ingrese observaciones sobre la devolución'
                  rows={2}
                />
              </LabelBase>
            </div>
          </div>

          <div className='flex gap-2 justify-end pt-4 border-t border-gray-100'>
            <ButtonBase color='default' size='md' type='button' onClick={handleCancel}>
              Cancelar
            </ButtonBase>
            <ButtonBase
              color='success'
              size='md'
              type='submit'
              disabled={loading || totalSelected === 0}
              className='flex items-center gap-2'
            >
              <FaSave />
              {loading ? 'Registrando...' : 'Registrar Devolución'}
            </ButtonBase>
          </div>
        </div>
      </FormBase>
    </Modal>
  )
}