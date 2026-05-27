'use client'

import { Form, Modal, message } from 'antd'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormCrearVale from '~/app/ui/facturacion-electronica/vales-compra/crear-vale/_components/form/form-crear-vale'
import CardResumenVale from '~/app/ui/facturacion-electronica/vales-compra/crear-vale/_components/cards/card-resumen-vale'
import type { FormCreateVale } from '~/app/ui/facturacion-electronica/vales-compra/crear-vale/_components/others/body-crear-vale'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import { FaSave, FaList } from 'react-icons/fa'
import { updateValeCompra, type ValeCompra } from '~/lib/api/vales-compra'
import dayjs from 'dayjs'
import { descomponerTipoPromocion } from '~/app/ui/facturacion-electronica/vales-compra/_constants/form-vale-options'

export type FormEditVale = FormCreateVale

interface BodyEditarValeProps {
  vale?: ValeCompra
}

export default function BodyEditarVale({ vale }: BodyEditarValeProps) {
  const [form] = Form.useForm<FormEditVale>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [valeEditado, setValeEditado] = useState<ValeCompra | null>(null)

  const toArray = (val: unknown): number[] | undefined => {
    if (!val) return undefined
    if (Array.isArray(val)) return val
    return [val as number]
  }

  const getInitialValues = () => {
    if (!vale) return {}
    // Para el beneficio derivamos del tipo_promocion del vale.
    // Para el momento: si el backend ya tiene la columna momento_aplicacion
    // la usamos directamente; sino caemos al derivado por compatibilidad.
    const { momento: momentoDerivado, beneficio } = descomponerTipoPromocion(vale.tipo_promocion)
    const momento = vale.momento_aplicacion ?? momentoDerivado
    return {
      nombre: vale.nombre,
      descripcion: vale.descripcion || undefined,
      tipo_promocion: vale.tipo_promocion,
      momento_aplicacion: momento,
      tipo_beneficio: beneficio,
      modalidad: vale.modalidad,
      cantidad_minima: vale.cantidad_minima,
      descuento_tipo: vale.descuento_tipo || undefined,
      descuento_valor: vale.descuento_valor || undefined,
      producto_gratis_id: vale.producto_gratis_id || undefined,
      cantidad_producto_gratis: vale.cantidad_producto_gratis || 1,
      fecha_inicio: vale.fecha_inicio ? dayjs(vale.fecha_inicio) : dayjs(),
      fecha_fin: vale.fecha_fin ? dayjs(vale.fecha_fin) : undefined,
      fecha_validez_vale: vale.fecha_validez_vale ? dayjs(vale.fecha_validez_vale) : undefined,
      usa_limite_por_cliente: Boolean(vale.usa_limite_por_cliente),
      limite_usos_cliente: vale.limite_usos_cliente || undefined,
      usa_limite_stock: Boolean(vale.usa_limite_stock),
      stock_disponible: vale.stock_disponible || undefined,
      aplica_precio_publico: Boolean(vale.aplica_precio_publico),
      aplica_precio_especial: Boolean(vale.aplica_precio_especial),
      aplica_precio_minimo: Boolean(vale.aplica_precio_minimo),
      aplica_precio_ultimo: Boolean(vale.aplica_precio_ultimo),
      producto_ids: vale.productos?.map((producto) => producto.id) || undefined,
      categoria_ids: vale.categorias?.map((categoria) => categoria.id) || undefined,
    }
  }

  const handleSubmit = async (values: FormEditVale) => {
    if (!vale) return
    setLoading(true)
    try {
      // Solo descartamos `tipo_beneficio` (UI-only para derivar tipo_promocion).
      // `momento_aplicacion` se envía al backend para que actualice su columna.
      const { tipo_beneficio: _tb, ...rest } = values
      const payload = {
        ...rest,
        fecha_inicio: values.fecha_inicio ? dayjs(values.fecha_inicio).format('YYYY-MM-DD') : undefined,
        fecha_fin: values.fecha_fin ? dayjs(values.fecha_fin).format('YYYY-MM-DD') : undefined,
        fecha_validez_vale: values.fecha_validez_vale ? dayjs(values.fecha_validez_vale).format('YYYY-MM-DD') : undefined,
        producto_ids: toArray(values.producto_ids),
        categoria_ids: toArray(values.categoria_ids),
      }

      const response = await updateValeCompra(vale.id, payload as any)

      if (response.data) {
        message.success('Vale actualizado exitosamente')
        setValeEditado(response.data.data)
        setShowSuccessModal(true)
      } else {
        message.error(response.error?.message || 'Error al actualizar el vale')
      }
    } catch (error: any) {
      message.error(error?.message || 'Error al actualizar el vale de compra')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    setShowSuccessModal(false)
    router.push('/ui/facturacion-electronica/vales-compra')
  }

  return (
    <FormBase<FormEditVale>
      form={form}
      name='editar-vale'
      layout='vertical'
      className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
      onFinish={handleSubmit}
      initialValues={getInitialValues()}
    >
      <div className='flex-1 flex flex-col gap-4 min-w-0 min-h-0'>
        <div className='bg-white rounded-lg shadow-md p-4 flex-1'>
          <FormCrearVale form={form} />

          <div className='flex justify-end gap-3 mt-4 pt-4 border-t'>
            <ButtonBase
              color='default'
              size='md'
              onClick={() => router.push('/ui/facturacion-electronica/vales-compra')}
            >
              Cancelar
            </ButtonBase>
            <ButtonBase
              color='success'
              size='md'
              type='submit'
              loading={loading}
              className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white'
            >
              <FaSave />
              Guardar Cambios
            </ButtonBase>
          </div>
        </div>
      </div>

      <div className='w-full xl:w-auto'>
        <CardResumenVale form={form} />
      </div>

      <Modal
        open={showSuccessModal}
        onCancel={handleContinue}
        footer={null}
        centered
        width={400}
      >
        <div className='text-center py-6'>
          <div className='mb-4'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
              <FaSave className='text-green-600 text-3xl' />
            </div>
          </div>

          <h3 className='text-xl font-bold mb-2'>¡Vale Actualizado!</h3>

          {valeEditado && (
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <p className='text-sm text-gray-600 mb-1'>Código del Vale</p>
              <p className='text-2xl font-bold text-gray-800'>{valeEditado.codigo}</p>
            </div>
          )}

          <p className='text-gray-600 mb-6'>
            El vale de compra ha sido actualizado correctamente
          </p>

          <div className='flex gap-2'>
            <ButtonBase
              color='default'
              size='md'
              onClick={handleContinue}
              className='flex-1'
            >
              <FaList />
              Ver Mis Vales
            </ButtonBase>
          </div>
        </div>
      </Modal>
    </FormBase>
  )
}
