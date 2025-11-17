import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import LabelBase from '~/components/form/label-base'
import SelectEgresosDinero from '~/app/_components/form/selects/select-egresos-dinero'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { useEffect } from 'react'

export default function FormMetodoPagoCompra({ form }: { form: FormInstance }) {
  const egreso_dinero_id = Form.useWatch('egreso_dinero_id', form)
  const metodo_de_pago_id = Form.useWatch('metodo_de_pago_id', form)

  useEffect(() => {
    if (egreso_dinero_id) form.setFieldValue('metodo_de_pago_id', undefined)
    if (metodo_de_pago_id) form.setFieldValue('egreso_dinero_id', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [egreso_dinero_id, metodo_de_pago_id])

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
          disabled={!!metodo_de_pago_id}
        />
      </LabelBase>
      <LabelBase
        label='Despliegue de Pago:'
        classNames={{ labelParent: 'mb-6' }}
      >
        <SelectDespliegueDePago
          classNameIcon='text-cyan-600 mx-1'
          className='!w-[135px] !min-w-[135px] !max-w-[135px]'
          propsForm={{
            name: 'metodo_de_pago_id',
          }}
          disabled={!!egreso_dinero_id}
        />
      </LabelBase>
    </>
  )
}
