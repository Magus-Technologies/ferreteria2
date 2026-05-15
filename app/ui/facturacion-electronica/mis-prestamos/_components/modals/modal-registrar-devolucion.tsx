'use client'

import { Modal, Form, message, Table, InputNumber, Checkbox } from 'antd'
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

  const columns: Array<{
      title: string
      dataIndex: string
      key: string
      width?: number
      render?: (text: unknown, record: ProductoDevolucion, index: number) => React.ReactNode
    }> = [
    {
      title: '',
      dataIndex: 'selected',
      key: 'selected',
      width: 50,
      render: (_: unknown, __: ProductoDevolucion, index: number) => (
        <Checkbox
          checked={productos[index]?.selected}
          onChange={(e) => handleProductoChange(index, 'selected', e.target.checked)}
        />
      ),
    },
    {
      title: 'Producto',
      dataIndex: 'producto',
      key: 'producto',
      render: (_: unknown, __: ProductoDevolucion, index: number) => {
        const pa = prestamo?.productosPorAlmacen?.[index]
        const prod = pa?.productoAlmacen?.producto
        return prod ? `${prod.name} (${prod.cod_producto})` : 'N/A'
      },
    },
    {
      title: 'UND',
      dataIndex: 'unidad',
      key: 'unidad',
      width: 60,
      render: (_: unknown, __: ProductoDevolucion, index: number) => {
        const pa = prestamo?.productosPorAlmacen?.[index]
        return pa?.unidadesDerivadas?.[0]?.name || 'UNIDAD'
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 120,
      render: (_: unknown, __: ProductoDevolucion, index: number) => (
        <InputNumber
          min={0}
          max={productos[index]?.factor * 10000}
          value={productos[index]?.cantidad || 0}
          onChange={(value) => handleProductoChange(index, 'cantidad', value || 0)}
          disabled={!productos[index]?.selected}
          size='small'
          style={{ width: '100%' }}
        />
      ),
    },
  ]

  const totalSelected = productos
    .filter(p => p.selected)
    .reduce((sum, p) => sum + (p.cantidad * p.factor), 0)

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaSave className='text-green-600' />
          <span>Registrar Devolución</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      {prestamo && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <div className='grid grid-cols-2 gap-2 text-sm'>
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
              <span className='font-semibold'>Tipo:</span> {prestamo.tipo_operacion === 'PRESTAR' ? 'Préstamo' : 'Pedir Préstado'}
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

      <div className='mb-4'>
        <label className='font-semibold text-sm mb-2 block'>Productos a devolver</label>
        <Table
          dataSource={productos}
          columns={columns}
          rowKey={(record, index) => String(index)}
          size='small'
          pagination={false}
          scroll={{ y: 200 }}
          footer={() => (
            <div className='flex justify-end'>
              <span className='font-semibold'>
                Total: <span className='text-green-600'>{totalSelected.toFixed(0)}</span> unidades
              </span>
            </div>
          )}
        />
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
          <LabelBase label='Fecha de Devolución' orientation='column'>
            <DatePickerBase
              propsForm={{
                name: 'fecha_devolucion',
                rules: [{ required: true, message: 'Seleccione la fecha' }],
              }}
              placeholder='Seleccione la fecha'
              prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
            />
          </LabelBase>

          <LabelBase label='Observaciones (Opcional)' orientation='column'>
            <TextareaBase
              propsForm={{
                name: 'observaciones',
              }}
              placeholder='Ingrese observaciones sobre la devolución'
              rows={2}
            />
          </LabelBase>

          <div className='flex gap-2 justify-end pt-4'>
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