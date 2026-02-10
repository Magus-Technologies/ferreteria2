'use client'

import { Form, message, Modal } from 'antd'
import { useState, useEffect } from 'react'
import TitleForm from '~/components/form/title-form'
import type { getVentaResponseProps } from '~/lib/api/venta'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import ButtonBase from '~/components/buttons/button-base'
import TablaProductosEntrega from '../tables/tabla-productos-entrega'
import { useProductosEntrega } from '../../_hooks/use-productos-entrega'
import { useStoreAlmacen } from '~/store/store-almacen'
import useCreateEntrega from '../../_hooks/use-create-entrega'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { TipoEntrega, TipoDespacho, EstadoEntrega } from '~/lib/api/entrega-producto'

interface ModalEntregaDirectaProps {
  open: boolean
  setOpen: (open: boolean) => void
  venta?: getVentaResponseProps
}

interface FormValues {
  almacen_salida_id: number
}

export default function ModalEntregaDirecta({
  open,
  setOpen,
  venta,
}: ModalEntregaDirectaProps) {
  const [form] = Form.useForm<FormValues>()
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)
  const { user } = useAuth()

  const { productosEntrega, setProductosEntrega } = useProductosEntrega(venta, open)

  const { crearEntrega, loading } = useCreateEntrega({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      setProductosEntrega([])
    },
  })

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
    const values = form.getFieldsValue()

    if (productosEntrega.length === 0) {
      message.error('No hay productos pendientes de entrega')
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

    if (!venta || !user?.id) return

    crearEntrega({
      venta_id: venta.id,
      tipo_entrega: TipoEntrega.RECOJO_EN_TIENDA,
      tipo_despacho: TipoDespacho.INMEDIATO,
      estado_entrega: EstadoEntrega.ENTREGADO,
      fecha_entrega: dayjs().format('YYYY-MM-DD'),
      almacen_salida_id: values.almacen_salida_id,
      user_id: user.id,
      productos_entregados: productosConCantidad.map((p) => ({
        unidad_derivada_venta_id: Number(p.unidad_derivada_venta_id),
        cantidad_entregada: p.entregar,
        ubicacion: p.ubicacion || undefined,
      })),
    })
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          ENTREGAR PRODUCTOS
          {venta && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              Venta N° {venta.serie}-{venta.numero} | Cliente:{' '}
              {venta.cliente?.razon_social ||
                `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
                'CLIENTES VARIOS'}
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
            Cancelar
          </ButtonBase>
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Entregar'}
          </ButtonBase>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén de salida: <span className="text-red-500">*</span>
            </label>
            <SelectAlmacen
              propsForm={{
                name: 'almacen_salida_id',
                rules: [{ required: true, message: 'Seleccione un almacén' }],
              }}
              className="w-full"
              form={form}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              Productos a entregar:
            </div>
            <div className="text-sm font-bold text-blue-600">
              {productosEntrega.filter((p) => p.entregar > 0).length} de{' '}
              {productosEntrega.length} seleccionado(s)
            </div>
          </div>

          <TablaProductosEntrega
            productos={productosEntrega}
            onProductoChange={setProductosEntrega}
          />
        </div>
      </Form>
    </Modal>
  )
}
