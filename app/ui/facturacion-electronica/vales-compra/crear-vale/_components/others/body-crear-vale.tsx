'use client'

import { Form, Modal } from 'antd'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormCrearVale from '../form/form-crear-vale'
import CardResumenVale from '../cards/card-resumen-vale'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import { FaSave, FaPrint, FaList } from 'react-icons/fa'
import { createValeCompra, type CreateValeCompraRequest, type ValeCompra } from '~/lib/api/vales-compra'
import { message } from 'antd'
import dayjs from 'dayjs'
import { getAuthToken } from '~/lib/api'
import type { MomentoAplicacion, TipoBeneficio } from '../../../_constants/form-vale-options'

export interface FormCreateVale extends CreateValeCompraRequest {
  // Campos UI-only que se descomponen al enviar al backend.
  momento_aplicacion?: MomentoAplicacion
  tipo_beneficio?: TipoBeneficio
  // Switches que controlan visibilidad de campos; no se envían al backend.
  usa_limite_por_venta?: boolean
}

export default function BodyCrearVale() {
  const [form] = Form.useForm<FormCreateVale>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [valeCreado, setValeCreado] = useState<ValeCompra | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (values: FormCreateVale) => {
    console.log('📝 Valores del formulario:', values)
    setLoading(true)
    try {
      // Asegurar que producto_ids y categoria_ids sean siempre arrays
      const toArray = (val: unknown): number[] | undefined => {
        if (!val) return undefined
        if (Array.isArray(val)) return val
        return [val as number]
      }

      // Descartamos el campo UI-only `tipo_beneficio` que solo sirve para
      // derivar `tipo_promocion` dentro del formulario.
      // `momento_aplicacion` SÍ se envía: el backend lo persiste en su
      // propia columna para distinguir vales que generan código futuro.
      const { tipo_beneficio: _tb, usa_limite_por_venta: _ulv, ...rest } = values
      let payload = {
        ...rest,
        fecha_inicio: values.fecha_inicio ? dayjs(values.fecha_inicio).format('YYYY-MM-DD') : undefined,
        fecha_fin: values.fecha_fin ? dayjs(values.fecha_fin).format('YYYY-MM-DD') : undefined,
        fecha_validez_vale: values.fecha_validez_vale ? dayjs(values.fecha_validez_vale).format('YYYY-MM-DD') : undefined,
        producto_ids: toArray(values.producto_ids),
        categoria_ids: toArray(values.categoria_ids),
        // Si el switch está OFF, nullear el valor para que el backend lo limpie.
        max_vales_por_venta: values.usa_limite_por_venta ? values.max_vales_por_venta : null,
        limite_usos_cliente: values.usa_limite_por_cliente ? values.limite_usos_cliente : null,
        stock_disponible: values.usa_limite_stock ? values.stock_disponible : null,
        // Destino del descuento: solo aplica al beneficio DESCUENTO; limpiar listas
        // según el alcance elegido para no mandar datos stale.
        descuento_alcance: values.tipo_beneficio === 'DESCUENTO' ? (values.descuento_alcance ?? 'VENTA') : null,
        descuento_producto_ids: values.tipo_beneficio === 'DESCUENTO' && values.descuento_alcance === 'PRODUCTOS' ? toArray(values.descuento_producto_ids) : null,
        descuento_categoria_ids: values.tipo_beneficio === 'DESCUENTO' && values.descuento_alcance === 'CATEGORIAS' ? toArray(values.descuento_categoria_ids) : null,
      }

      // Para SORTEO: limpiar descuentos
      if (values.tipo_promocion === 'SORTEO') {
        payload = {
          ...payload,
          descuento_tipo: null,
          descuento_valor: null,
          // Si no incluye producto, limpiar producto_gratis
          ...(!(values as any).sorteo_incluye_producto && {
            producto_gratis_id: null,
            cantidad_producto_gratis: null,
          }),
        } as typeof payload
      }

      console.log('📦 Payload a enviar:', payload)

      const response = await createValeCompra(payload as any)
      
      if (response.data) {
        message.success('Vale de compra creado exitosamente')
        setValeCreado(response.data.data)
        setShowSuccessModal(true)
      } else {
        message.error(response.error?.message || 'Error al crear el vale de compra')
      }
    } catch (error: any) {
      console.error('Error al crear vale:', error)
      message.error(error?.message || 'Error al crear el vale de compra')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintAndContinue = async () => {
    if (valeCreado) {
      try {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(`${API_URL}/pdf/vale/${valeCreado.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        }
      } catch (err) {
        console.error('Error al imprimir vale:', err)
      }
    }
    handleContinue()
  }

  const handleContinue = () => {
    setShowSuccessModal(false)
    router.push('/ui/facturacion-electronica/vales-compra')
  }

  const handleCrearOtro = () => {
    setShowSuccessModal(false)
    setValeCreado(null)
    form.resetFields()
  }

  return (
    <FormBase<FormCreateVale>
      form={form}
      name='crear-vale'
      layout='vertical'
      className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
      onFinish={handleSubmit}
      initialValues={{
        // UI-only: arranca por defecto en "Esta misma compra" + "Descuento".
        // El campo `tipo_promocion` se deriva automáticamente.
        momento_aplicacion: 'MISMA_COMPRA',
        tipo_beneficio: 'DESCUENTO',
        tipo_promocion: 'DESCUENTO_MISMA_COMPRA',
        modalidad: 'CANTIDAD_MINIMA',
        descuento_tipo: 'PORCENTAJE',
        descuento_alcance: 'VENTA',
        fecha_inicio: dayjs(),
        aplica_precio_publico: true,
        aplica_precio_especial: true,
        aplica_precio_minimo: true,
        aplica_precio_ultimo: true,
        usa_limite_por_cliente: false,
        usa_limite_stock: false,
        cantidad_producto_gratis: 1,
      }}
    >
      {/* Columna principal - Formulario */}
      <div className='flex-1 flex flex-col gap-4 min-w-0 min-h-0'>
        <div className='bg-white rounded-lg shadow-md p-4 flex-1'>
          <FormCrearVale form={form} />

          {/* Botones de acción */}
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
              className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white'
            >
              <FaSave />
              Crear Vale
            </ButtonBase>
          </div>
        </div>
      </div>

      {/* Columna lateral - Resumen */}
      <div className='w-full xl:w-auto'>
        <CardResumenVale form={form} />
      </div>

      {/* Modal de Éxito */}
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
          
          <h3 className='text-xl font-bold mb-2'>¡Vale Creado Exitosamente!</h3>
          
          {valeCreado && (
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <p className='text-sm text-gray-600 mb-1'>Código del Vale</p>
              <p className='text-2xl font-bold text-gray-800'>{valeCreado.codigo}</p>
            </div>
          )}

          <p className='text-gray-600 mb-6'>
            El vale de compra ha sido creado correctamente
          </p>

          <div className='flex flex-col gap-3'>
            <ButtonBase
              color='info'
              size='md'
              onClick={handlePrintAndContinue}
              className='flex items-center justify-center gap-2'
            >
              <FaPrint />
              Imprimir Ticket
            </ButtonBase>
            
            <div className='flex gap-2'>
              <ButtonBase
                color='default'
                size='md'
                onClick={handleCrearOtro}
                className='flex-1'
              >
                Crear Otro Vale
              </ButtonBase>
              
              <ButtonBase
                color='success'
                size='md'
                onClick={handleContinue}
                className='flex-1 flex items-center justify-center gap-2'
              >
                <FaList />
                Ver Mis Vales
              </ButtonBase>
            </div>
          </div>
        </div>
      </Modal>
    </FormBase>
  )
}
