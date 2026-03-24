/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import LabelBase from '~/components/form/label-base'
import SelectEgresosDinero, { type GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'
import { useEffect, useState } from 'react'
import { FormaDePago } from '~/types'
import ModalSeleccionarEgreso from '../modals/modal-seleccionar-egreso'
import ButtonBase from '~/components/buttons/button-base'
import { FaList } from 'react-icons/fa'

export default function FormMetodoPagoCompra({ form, compraId }: { form: FormInstance; compraId?: string }) {
  const formaDePago = Form.useWatch('forma_de_pago', form)

  const [disabled, setDisabled] = useState(false)
  const [modalEgresoOpen, setModalEgresoOpen] = useState(false)

  useEffect(() => {
    if (formaDePago === FormaDePago.cr) {
      form.setFieldValue('gasto_extra_id', undefined)
      form.setFieldValue('metodos_de_pago', undefined)
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [formaDePago])

  const handleSelectDesdeModal = (gasto: GastoExtraDisponible) => {
    form.setFieldValue('gasto_extra_id', gasto.id)
  }

  return (
    <>
      <LabelBase
        label='Egreso Asociado:'
        classNames={{ labelParent: 'mb-6' }}
        infoTooltip='Gasto operativo registrado en "Mis Gastos" que cubre parte o todo el pago.'
      >
        <div className='flex items-center gap-1'>
          <SelectEgresosDinero
            classNameIcon='text-cyan-600 mx-1'
            className='!w-[200px] !min-w-[200px] !max-w-[200px]'
            propsForm={{
              name: 'gasto_extra_id',
            }}
            excluirCompraId={compraId}
            disabled={disabled}
          />
          <ButtonBase
            color='info'
            size='sm'
            className='!px-2 mb-6'
            disabled={disabled}
            onClick={() => setModalEgresoOpen(true)}
            title='Ver lista de egresos'
          >
            <FaList size={12} />
          </ButtonBase>
        </div>
      </LabelBase>

      <ModalSeleccionarEgreso
        open={modalEgresoOpen}
        onClose={() => setModalEgresoOpen(false)}
        excluirCompraId={compraId}
        onSelect={handleSelectDesdeModal}
      />
    </>
  )
}
