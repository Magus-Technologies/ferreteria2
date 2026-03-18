/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import LabelBase from '~/components/form/label-base'
import SelectEgresosDinero, { type GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { useEffect, useState } from 'react'
import { FormaDePago } from '~/types'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalAprobarGastoExtra from '~/app/ui/gestion-contable-y-financiera/mis-gastos/_components/others/modal-aprobar-gasto-extra'

export default function FormMetodoPagoCompra({ form, compraId }: { form: FormInstance; compraId?: string }) {
  const formaDePago = Form.useWatch('forma_de_pago', form)
  const queryClient = useQueryClient()

  const [disabled, setDisabled] = useState(false)
  const [modalAprobarOpen, setModalAprobarOpen] = useState(false)
  const [gastoSeleccionadoId, setGastoSeleccionadoId] = useState<string | null>(null)

  useEffect(() => {
    if (formaDePago === FormaDePago.cr) {
      form.setFieldValue('despliegue_de_pago_id', undefined)
      form.setFieldValue('gasto_extra_id', undefined)
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [formaDePago])

  const handleSelectGasto = (gasto: GastoExtraDisponible | undefined) => {
    if (!gasto) return
    if (gasto.estado === 'pendiente') {
      setGastoSeleccionadoId(gasto.id)
      setModalAprobarOpen(true)
    }
  }

  const handleCerrarModal = () => {
    setModalAprobarOpen(false)
    // Si cancela la aprobación, limpiar la selección
    form.setFieldValue('gasto_extra_id', undefined)
    setGastoSeleccionadoId(null)
  }

  const handleAprobarExito = () => {
    setModalAprobarOpen(false)
    setGastoSeleccionadoId(null)
    // Refrescar la lista para que el gasto ahora aparezca como aprobado
    queryClient.invalidateQueries({ queryKey: [QueryKeys.EGRESOS_DINERO] })
  }

  return (
    <>
      <LabelBase
        label='Egreso Asociado:'
        classNames={{ labelParent: 'mb-6' }}
        infoTooltip='Gasto registrado en "Mis Gastos" (aprobado o pendiente) que cubre parte o todo el pago. Los pendientes requieren aprobación al seleccionarlos. Puede combinarse con un Despliegue de Pago.'
      >
        <SelectEgresosDinero
          classNameIcon='text-cyan-600 mx-1'
          className='!w-[200px] !min-w-[200px] !max-w-[200px]'
          propsForm={{
            name: 'gasto_extra_id',
          }}
          excluirCompraId={compraId}
          onSelectGasto={handleSelectGasto}
          disabled={disabled}
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
          disabled={disabled}
        />
      </LabelBase>

      <ModalAprobarGastoExtra
        open={modalAprobarOpen}
        onClose={handleCerrarModal}
        gastoId={gastoSeleccionadoId}
        onSuccess={handleAprobarExito}
      />
    </>
  )
}
