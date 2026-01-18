'use client'

import { Form, message, Modal } from 'antd'
import { useState, useEffect } from 'react'
import TitleForm from '~/components/form/title-form'
import { getVentaResponseProps } from '~/app/_actions/venta'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import ButtonBase from '~/components/buttons/button-base'
import TablaProductosEntrega from '../tables/tabla-productos-entrega'
import { useProductosEntrega } from '../../_hooks/use-productos-entrega'
import { useStoreAlmacen } from '~/store/store-almacen'

interface ModalSeleccionarProductosEntregaProps {
  open: boolean
  setOpen: (open: boolean) => void
  venta?: getVentaResponseProps
  tipoDespacho: 'EnTienda' | 'Domicilio' | 'Parcial'
  datosProgramacion?: {
    chofer_id?: string | number
    fecha_programada?: Date
    hora_inicio?: string
    hora_fin?: string
    direccion_entrega?: string
    observaciones?: string
    quien_entrega?: 'vendedor' | 'almacen'
  }
  onConfirmar: (data: {
    almacen_salida_id: number
    productos: Array<{
      unidad_derivada_venta_id: number
      cantidad_entregada: number
      ubicacion?: string
    }>
  }) => void
  loading?: boolean
}

interface FormValues {
  almacen_salida_id: number
}

export default function ModalSeleccionarProductosEntrega({
  open,
  setOpen,
  venta,
  tipoDespacho,
  datosProgramacion,
  onConfirmar,
  loading = false,
}: ModalSeleccionarProductosEntregaProps) {
  const [form] = Form.useForm<FormValues>()
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  // Hook personalizado para manejar productos
  const { productosEntrega, setProductosEntrega } = useProductosEntrega(venta, open)

  // Debug: verificar si el modal se renderiza con open=true
  console.log('🎯 ModalSeleccionarProductosEntrega - open:', open, 'venta:', !!venta, 'productos:', productosEntrega.length)

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (open && venta) {
      form.setFieldsValue({
        almacen_salida_id: almacen_id,
      })
    } else if (!open) {
      form.resetFields()
      setProductosEntrega([])
    }
  }, [open, venta, almacen_id, form, setProductosEntrega])

  const handleConfirmar = () => {
    console.log('🚀 handleConfirmar llamado - intentando crear entrega')
    const values = form.getFieldsValue()
    console.log('📋 Valores del formulario:', values)
    console.log('📦 Productos a entregar:', productosEntrega)

    if (productosEntrega.length === 0) {
      message.error('Debe haber al menos un producto para entregar')
      return
    }

    const productosConCantidad = productosEntrega.filter((p) => p.entregar > 0)

    if (productosConCantidad.length === 0) {
      message.error('Debe especificar cantidades a entregar')
      return
    }

    if (!values.almacen_salida_id) {
      message.error('Debe seleccionar un almacén de salida')
      return
    }

    onConfirmar({
      almacen_salida_id: values.almacen_salida_id,
      productos: productosConCantidad.map((p) => ({
        unidad_derivada_venta_id: Number(p.unidad_derivada_venta_id),
        cantidad_entregada: p.entregar,
        ubicacion: p.ubicacion || undefined,
      })),
    })
  }

  const getTitulo = () => {
    if (tipoDespacho === 'EnTienda') return '🏪 SELECCIONAR PRODUCTOS - EN TIENDA'
    if (tipoDespacho === 'Domicilio') return '🚚 SELECCIONAR PRODUCTOS - DOMICILIO'
    return '📦 SELECCIONAR PRODUCTOS - PARCIAL'
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          {getTitulo()}
          {venta && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              FACTURA N° {venta.serie}-{venta.numero} | Cliente:{' '}
              {venta.cliente?.razon_social ||
                `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim()}
            </div>
          )}
        </TitleForm>
      }
      open={open}
      onCancel={() => {
        setOpen(false)
        form.resetFields()
        setProductosEntrega([])
      }}
      width={1000}
      centered
      style={{ top: 20 }}
      footer={
        <div className="flex justify-between items-center">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => {
              setOpen(false)
              form.resetFields()
              setProductosEntrega([])
            }}
          >
            ← Volver
          </ButtonBase>
          <div className="flex gap-2">
            <ButtonBase
              color="success"
              size="md"
              onClick={handleConfirmar}
              disabled={loading}
            >
              {loading
                ? 'Procesando...'
                : tipoDespacho === 'EnTienda'
                ? '✅ Entregar Ahora'
                : tipoDespacho === 'Parcial'
                ? '✅ Entregar Parcial'
                : '✅ Programar Entrega'}
            </ButtonBase>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <div className="space-y-4">
          {/* Resumen de programación (si aplica) */}
          {(tipoDespacho === 'Domicilio' || tipoDespacho === 'Parcial') && datosProgramacion && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-900 mb-2">
                📋 Resumen de Programación
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                {datosProgramacion.fecha_programada && (
                  <div>
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(datosProgramacion.fecha_programada).toLocaleDateString('es-PE')}
                  </div>
                )}
                {datosProgramacion.hora_inicio && datosProgramacion.hora_fin && (
                  <div>
                    <span className="font-medium">Horario:</span>{' '}
                    {datosProgramacion.hora_inicio} - {datosProgramacion.hora_fin}
                  </div>
                )}
                {datosProgramacion.direccion_entrega && (
                  <div className="col-span-2">
                    <span className="font-medium">Dirección:</span>{' '}
                    {datosProgramacion.direccion_entrega}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumen En Tienda */}
          {tipoDespacho === 'EnTienda' && datosProgramacion?.quien_entrega && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-semibold text-green-900 mb-2">
                📋 Despacho en Tienda
              </div>
              <div className="text-xs text-gray-700">
                <span className="font-medium">Entrega:</span>{' '}
                {datosProgramacion.quien_entrega === 'vendedor' ? 'Vendedor' : 'Almacén'}
              </div>
            </div>
          )}

          {/* Locación de salida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locación de salida (Almacén): <span className="text-red-500">*</span>
            </label>
            <SelectAlmacen
              propsForm={{
                name: 'almacen_salida_id',
                rules: [
                  {
                    required: true,
                    message: 'Seleccione un almacén',
                  },
                ],
              }}
              className="w-full"
              form={form}
            />
          </div>

          {/* Contador de productos */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              📦 Productos a entregar:
            </div>
            <div className="text-sm font-bold text-blue-600">
              {productosEntrega.filter((p) => p.entregar > 0).length} de{' '}
              {productosEntrega.length} seleccionado(s)
            </div>
          </div>

          {/* Tabla de productos */}
          <TablaProductosEntrega
            productos={productosEntrega}
            onProductoChange={setProductosEntrega}
          />
        </div>
      </Form>
    </Modal>
  )
}
