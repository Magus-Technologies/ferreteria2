'use client'

import { Modal, Form, Input, DatePicker, message, Table } from 'antd'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { Compra, compraApi, UpdateLoteVencimientoRequest } from '~/lib/api/compra'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ModalModificarLotesVencimientosProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra?: Compra
}

interface ProductoRow {
  key: string
  unidad_derivada_id: number
  producto: string
  unidad: string
  cantidad: number
  lote: string | null
  vencimiento: string | null
}

export default function ModalModificarLotesVencimientos({
  open,
  setOpen,
  compra,
}: ModalModificarLotesVencimientosProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [dataSource, setDataSource] = useState<ProductoRow[]>([])
  const [hasVencimiento, setHasVencimiento] = useState(true)

  // Preparar datos cuando se abre el modal
  useEffect(() => {
    if (open && compra?.productos_por_almacen) {
      const rows: ProductoRow[] = []
      
      compra.productos_por_almacen.forEach((productoAlmacen) => {
        productoAlmacen.unidades_derivadas?.forEach((unidadDerivada) => {
          rows.push({
            key: `${unidadDerivada.id}`,
            unidad_derivada_id: unidadDerivada.id,
            producto: productoAlmacen.producto_almacen?.producto.name || '',
            unidad: unidadDerivada.unidad_derivada_inmutable?.name || '',
            cantidad: unidadDerivada.cantidad,
            lote: unidadDerivada.lote,
            vencimiento: unidadDerivada.vencimiento,
          })
        })
      })

      setDataSource(rows)
      
      // Inicializar valores del formulario
      const initialValues: any = {}
      rows.forEach((row) => {
        initialValues[`lote_${row.unidad_derivada_id}`] = row.lote || ''
        if (row.vencimiento) {
          initialValues[`vencimiento_${row.unidad_derivada_id}`] = dayjs(row.vencimiento)
        }
      })
      form.setFieldsValue(initialValues)
    }
  }, [open, compra, form])

  const mutation = useMutation({
    mutationFn: async (data: UpdateLoteVencimientoRequest[]) => {
      if (!compra?.id) throw new Error('No hay compra seleccionada')
      
      const response = await compraApi.updateLotesVencimientos(compra.id, {
        unidades_derivadas: data,
      })
      
      if (response.error) {
        throw new Error(response.error.message || 'Error al actualizar')
      }
      
      return response.data
    },
    onSuccess: () => {
      message.success('Lotes y vencimientos actualizados correctamente')
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      setOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al actualizar lotes y vencimientos')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const unidadesActualizadas: UpdateLoteVencimientoRequest[] = dataSource.map((row) => ({
        id: row.unidad_derivada_id,
        lote: values[`lote_${row.unidad_derivada_id}`] || null,
        vencimiento: hasVencimiento && values[`vencimiento_${row.unidad_derivada_id}`]
          ? values[`vencimiento_${row.unidad_derivada_id}`].toISOString()
          : null,
      }))

      mutation.mutate(unidadesActualizadas)
    } catch (error) {
      console.error('Error en validación:', error)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    form.resetFields()
  }

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'producto',
      key: 'producto',
      width: '30%',
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad',
      key: 'unidad',
      width: '10%',
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: '10%',
      render: (cantidad: number) => Number(cantidad).toFixed(2),
    },
    {
      title: 'Lote',
      key: 'lote',
      width: '20%',
      render: (_: any, record: ProductoRow) => (
        <Form.Item
          name={`lote_${record.unidad_derivada_id}`}
          className='mb-0'
        >
          <Input placeholder='Ingrese lote' />
        </Form.Item>
      ),
    },
    {
      title: 'F. Vencimiento',
      key: 'vencimiento',
      width: '30%',
      render: (_: any, record: ProductoRow) => (
        <Form.Item
          name={`vencimiento_${record.unidad_derivada_id}`}
          className='mb-0'
        >
          <DatePicker
            format='DD/MM/YYYY'
            placeholder='Seleccione fecha'
            className='w-full'
            disabled={!hasVencimiento}
          />
        </Form.Item>
      ),
    },
  ]

  return (
    <Modal
      title='Modificar Lotes y Fechas de Vencimiento'
      open={open}
      onCancel={handleCancel}
      width={1000}
      footer={[
        <ButtonBase
          key='cancel'
          onClick={handleCancel}
          color='default'
          size='md'
        >
          Cancelar
        </ButtonBase>,
        <ButtonBase
          key='submit'
          onClick={handleSubmit}
          color='success'
          size='md'
          disabled={mutation.isPending}
          className={classOkButtonModal}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </ButtonBase>,
      ]}
    >
      <div className='mb-4 flex items-center gap-2'>
        <input
          type='radio'
          id='tiene-vencimiento'
          name='vencimiento-option'
          checked={hasVencimiento}
          onChange={() => setHasVencimiento(true)}
          className='cursor-pointer'
        />
        <label htmlFor='tiene-vencimiento' className='cursor-pointer'>
          Tiene F.Vencimiento (F7)
        </label>

        <input
          type='radio'
          id='no-tiene-vencimiento'
          name='vencimiento-option'
          checked={!hasVencimiento}
          onChange={() => setHasVencimiento(false)}
          className='ml-4 cursor-pointer'
        />
        <label htmlFor='no-tiene-vencimiento' className='cursor-pointer'>
          No Tiene F.Vencimiento (F8)
        </label>
      </div>

      <div className='mb-4'>
        <div className='text-sm text-gray-600'>
          <strong>Proveedor:</strong> {compra?.proveedor?.razon_social || 'N/A'}
        </div>
        <div className='text-sm text-gray-600'>
          <strong>T.Doc:</strong> {compra?.tipo_documento || 'N/A'} | 
          <strong> Ser.Num:</strong> {compra?.serie || 'S/'}-{compra?.numero || '0'}
        </div>
        <div className='text-sm text-gray-600'>
          <strong>Fecha:</strong> {compra?.fecha ? dayjs(compra.fecha).format('DD/MM/YYYY') : 'N/A'}
        </div>
      </div>

      <Form form={form} layout='vertical'>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size='small'
          scroll={{ y: 400, x: 'max-content' }}
          bordered
        />
      </Form>

      <div className='mt-4 text-xs text-gray-500'>
        <p>* Los campos de lote y vencimiento son opcionales</p>
        <p>* Si no tiene fecha de vencimiento, seleccione la opción "No Tiene F.Vencimiento"</p>
      </div>
    </Modal>
  )
}
