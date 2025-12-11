/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import LabelBase from '~/components/form/label-base'
import SelectEgresosDinero from '~/app/_components/form/selects/select-egresos-dinero'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { useEffect, useState } from 'react'
import { FormaDePago } from '@prisma/client'

export default function FormMetodoPagoCompra({ form }: { form: FormInstance }) {
  const egreso_dinero_id = Form.useWatch('egreso_dinero_id', form)
  const despliegue_de_pago_id = Form.useWatch('despliegue_de_pago_id', form)
  const formaDePago = Form.useWatch('forma_de_pago', form)

  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    if (egreso_dinero_id) form.setFieldValue('despliegue_de_pago_id', undefined)
    if (despliegue_de_pago_id) form.setFieldValue('egreso_dinero_id', undefined)
  }, [egreso_dinero_id, despliegue_de_pago_id])

  useEffect(() => {
    if (formaDePago === FormaDePago.cr) {
      form.setFieldValue('despliegue_de_pago_id', undefined)
      form.setFieldValue('egreso_dinero_id', undefined)
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [formaDePago])

  return (
    <>
      <LabelBase
        label='Egreso Asociado:'
        classNames={{ labelParent: 'mb-6' }}
        infoTooltip='En caso esta compra se haya pagado con anterioridad y se haya registrado en un egreso, debe seleccionar el egreso al que corresponde.'
      >
        <SelectEgresosDinero
          classNameIcon='text-cyan-600 mx-1'
          className='!w-[135px] !min-w-[135px] !max-w-[135px]'
          propsForm={{
            name: 'egreso_dinero_id',
          }}
          disabled={disabled || !!despliegue_de_pago_id}
        />
      </LabelBase>
      <LabelBase
        label='Despliegue de Pago:'
        classNames={{ labelParent: 'mb-6' }}
      >
        <SelectDespliegueDePago
          classNameIcon='text-cyan-600 mx-1'
          className='!w-[200px] !min-w-[200px] !max-w-[200px]'
          propsForm={{
            name: 'despliegue_de_pago_id',
          }}
          disabled={disabled || !!egreso_dinero_id}
        />
      </LabelBase>
    </>
  )
}
