'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave } from 'react-icons/fa'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaHashtag } from 'react-icons/fa6'
import useCreateVenta from '../../_hooks/use-create-venta'
import LabelBase from '~/components/form/label-base'

export default function ModalMetodosPagoVenta({
  open,
  onCancel,
  form: ventaForm,
  totalCobrado,
  tipo_moneda,
  onSuccessVenta,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  totalCobrado: number
  tipo_moneda: TipoMoneda
  onSuccessVenta?: (data: any) => void
}) {
  const [modalForm] = Form.useForm()

  // Watch del tipo de pago seleccionado
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Obtener el nombre del despliegue seleccionado para detectar tipo
  const [despliegueName, setDespliegueName] = useState<string>('')

  // Detectar si es efectivo
  const isEfectivo = useMemo(
    () => despliegueName.toUpperCase().includes('EFECTIVO'),
    [despliegueName]
  )

  // Calcular cambio del cliente
  const cambioCliente = useMemo(() => {
    if (!isEfectivo) return 0
    const recibe = Number(recibe_efectivo ?? 0)
    return Math.max(0, recibe - totalCobrado)
  }, [isEfectivo, recibe_efectivo, totalCobrado])

  // Hook para crear venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta({
    form: ventaForm,
    onSuccess: (data) => {
      onCancel()
      modalForm.resetFields()
      // Llamar al onSuccess del padre para abrir el modal del ticket
      onSuccessVenta?.(data)
    },
  })

  // Resetear formulario al abrir
  useEffect(() => {
    if (open) {
      modalForm.resetFields()
      setDespliegueName('')
    }
  }, [open, modalForm])

  const handleGuardar = async () => {
    try {
      await modalForm.validateFields()
      const values = modalForm.getFieldsValue()

      // Preparar método de pago con los nuevos campos
      const metodo_pago = {
        despliegue_de_pago_id: values.despliegue_de_pago_id,
        monto: totalCobrado,
        referencia: values.referencia || null,
        recibe_efectivo: values.recibe_efectivo || null,
      }

      // Guardar en el formulario de venta
      ventaForm.setFieldValue('metodos_de_pago', [metodo_pago])
      ventaForm.setFieldValue('estado_de_venta', EstadoDeVenta.CREADO)

      // Obtener todos los valores del formulario de venta
      const ventaValues = ventaForm.getFieldsValue()

      // Crear la venta
      await crearVenta(ventaValues)
    } catch (error) {
      console.error('Error al validar formulario:', error)
    }
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setDespliegueName('')
    onCancel()
  }

  return (
    <Modal
      title='Cobrar'
      open={open}
      onCancel={handleCancelar}
      width={500}
      footer={null}
      centered
    >
      <Form form={modalForm} layout='vertical' className='mt-4'>
        {/* Total a Cobrar */}
        <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <div className='flex justify-between items-center'>
            <span className='text-base font-medium text-slate-700'>Total</span>
            <span className='text-3xl font-bold text-blue-600'>
              {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'}{' '}
              {totalCobrado.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tipo de Pago */}
        <LabelBase label='Tipo de Pago [Medio de Pago]' classNames={{ labelParent: 'mb-4' }} orientation='column'>
          <SelectDespliegueDePago
            classNameIcon='text-rose-700 mx-1'
            className='w-full'
            propsForm={{
              name: 'despliegue_de_pago_id',
              rules: [{ required: true, message: 'Selecciona un tipo de pago' }],
            }}
            onChange={(value, option: any) => {
              setDespliegueName(option?.label || '')
              modalForm.setFieldValue('referencia', undefined)
              modalForm.setFieldValue('recibe_efectivo', undefined)
            }}
          />
        </LabelBase>

        {/* Referencia Tipo de Pago */}
        <LabelBase label='Referencia Tipo de Pago' classNames={{ labelParent: 'mb-4' }} orientation='column'>
          <InputBase
            prefix={<FaHashtag className='text-cyan-600 mx-1' />}
            placeholder='Número de transacción'
            disabled={isEfectivo}
            uppercase={false}
            propsForm={{
              name: 'referencia',
              rules: [
                {
                  required: !isEfectivo,
                  message: 'Ingresa el número de transacción',
                },
              ],
            }}
          />
        </LabelBase>

        {/* Recibe Efectivo */}
        <LabelBase label='Recibe Efectivo' classNames={{ labelParent: 'mb-4' }} orientation='column'>
          <InputNumberBase
            prefix={
              <span className='text-rose-700 font-bold'>
                {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'}
              </span>
            }
            placeholder='Monto recibido'
            disabled={!isEfectivo}
            min={0}
            precision={2}
            propsForm={{
              name: 'recibe_efectivo',
              className: 'w-full',
              rules: [
                {
                  required: isEfectivo,
                  message: 'Ingresa el monto recibido',
                },
                {
                  validator: (_, value) => {
                    if (isEfectivo && value < totalCobrado) {
                      return Promise.reject(
                        new Error('El monto debe ser mayor o igual al total')
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ],
            }}
          />
        </LabelBase>

        {/* Cambio del Cliente */}
        {isEfectivo && recibe_efectivo && (
          <div className='mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
            <div className='flex justify-between items-center'>
              <span className='text-base font-medium text-slate-700'>
                Cambio del Cliente
              </span>
              <span className='text-2xl font-bold text-blue-600'>
                {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'}{' '}
                {cambioCliente.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className='flex gap-3 justify-end mt-6'>
          <ButtonBase onClick={handleCancelar} color='default'>
            Cancelar
          </ButtonBase>
          <ButtonBase
            onClick={handleGuardar}
            color='success'
            disabled={creandoVenta}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            {creandoVenta ? 'Guardando...' : 'Guardar'}
          </ButtonBase>
        </div>
      </Form>
    </Modal>
  )
}
