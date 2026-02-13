'use client'

import { Form, Input, DatePicker, App } from 'antd'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Compra, compraApi, UpdateLoteVencimientoRequest } from '~/lib/api/compra'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'

interface ModalModificarLotesVencimientosProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra?: Compra
}

interface FormValues {
  lote: string
  vencimiento: dayjs.Dayjs | null
}

export default function ModalModificarLotesVencimientos({
  open,
  setOpen,
  compra,
}: ModalModificarLotesVencimientosProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const queryClient = useQueryClient()
  const productoSeleccionado = useStoreProductoSeleccionado(state => state.productoSeleccionado)
  const [hasVencimiento, setHasVencimiento] = useState(true)

  // Inicializar valores del formulario cuando se abre el modal
  useEffect(() => {
    if (open && productoSeleccionado) {
      form.setFieldsValue({
        lote: productoSeleccionado.lote || '',
        vencimiento: productoSeleccionado.vencimiento ? dayjs(productoSeleccionado.vencimiento) : null,
      })
      setHasVencimiento(!!productoSeleccionado.vencimiento)
    }
  }, [open, productoSeleccionado, form])

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
      message.success('Lote y vencimiento actualizados correctamente')
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      setOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al actualizar lote y vencimiento')
    },
  })

  const handleSubmit = async (values: FormValues) => {
    if (!productoSeleccionado?.id) {
      message.error('No hay producto seleccionado')
      return
    }

    const unidadActualizada: UpdateLoteVencimientoRequest = {
      id: productoSeleccionado.id,
      lote: values.lote || null,
      vencimiento: hasVencimiento && values.vencimiento
        ? values.vencimiento.toISOString()
        : null,
    }

    mutation.mutate([unidadActualizada])
  }

  const handleCancel = () => {
    setOpen(false)
    form.resetFields()
  }

  if (!productoSeleccionado) return null

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Modificar Lote y Fecha de Vencimiento</TitleForm>,
        centered: true,
        okText: 'Guardar Cambios',
        okButtonProps: { 
          loading: mutation.isPending,
          className: 'bg-green-600 hover:bg-green-700',
        },
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        {/* Información de la compra */}
        <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium min-w-[100px]">Proveedor:</span>
              <div className="font-bold text-sm text-gray-800">
                {compra?.proveedor?.razon_social || 'N/A'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium min-w-[100px]">Documento:</span>
              <div className="font-semibold text-sm text-gray-700">
                {compra?.tipo_documento || 'N/A'} {compra?.serie || 'S/'}-{compra?.numero || '0'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium min-w-[100px]">Fecha:</span>
              <div className="font-semibold text-sm text-gray-700">
                {compra?.fecha ? dayjs(compra.fecha).format('DD/MM/YYYY') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Información del producto seleccionado */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="mb-2 font-bold text-sm text-green-800">Producto Seleccionado:</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-[100px]">Código:</span>
              <div className="font-semibold text-sm text-gray-800">
                {(() => {
                  const productoAlmacen = compra?.productos_por_almacen?.find(p => 
                    p.unidades_derivadas?.some(u => u.id === productoSeleccionado?.id)
                  )
                  return productoAlmacen?.producto_almacen?.producto?.cod_producto || 'N/A'
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-[100px]">Nombre:</span>
              <div className="font-bold text-sm text-gray-800">
                {(() => {
                  const productoAlmacen = compra?.productos_por_almacen?.find(p => 
                    p.unidades_derivadas?.some(u => u.id === productoSeleccionado?.id)
                  )
                  return productoAlmacen?.producto_almacen?.producto?.name || 'N/A'
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-[100px]">Unidad:</span>
              <div className="font-semibold text-sm text-gray-700">
                {productoSeleccionado?.unidad_derivada_inmutable?.name || 'N/A'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-[100px]">Cantidad:</span>
              <div className="font-semibold text-sm text-gray-700">
                {Number(productoSeleccionado.cantidad || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de vencimiento */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="tiene-vencimiento"
              name="vencimiento-option"
              checked={hasVencimiento}
              onChange={() => setHasVencimiento(true)}
              className="cursor-pointer w-4 h-4"
            />
            <label htmlFor="tiene-vencimiento" className="cursor-pointer text-sm font-medium text-gray-700">
              Tiene F.Vencimiento (F7)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="no-tiene-vencimiento"
              name="vencimiento-option"
              checked={!hasVencimiento}
              onChange={() => {
                setHasVencimiento(false)
                form.setFieldValue('vencimiento', null)
              }}
              className="cursor-pointer w-4 h-4"
            />
            <label htmlFor="no-tiene-vencimiento" className="cursor-pointer text-sm font-medium text-gray-700">
              No Tiene F.Vencimiento (F8)
            </label>
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-2 gap-3">
          <LabelBase label="Lote:" orientation="column">
            <Form.Item name="lote" className="mb-0">
              <Input 
                placeholder="Ingrese el número de lote (opcional)" 
                className="rounded-lg"
                size="large"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Fecha de Vencimiento:" orientation="column">
            <Form.Item 
              name="vencimiento" 
              className="mb-0"
              rules={[
                {
                  validator: (_, value) => {
                    if (hasVencimiento && !value) {
                      return Promise.reject('La fecha de vencimiento es requerida')
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Seleccione la fecha de vencimiento"
                className="w-full rounded-lg"
                size="large"
                disabled={!hasVencimiento}
                disabledDate={(current) => {
                  // No permitir fechas anteriores a hoy
                  return current && current < dayjs().startOf('day')
                }}
              />
            </Form.Item>
          </LabelBase>
        </div>

      </div>
    </ModalForm>
  )
}
