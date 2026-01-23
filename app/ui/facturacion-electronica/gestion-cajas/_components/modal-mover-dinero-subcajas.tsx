'use client'

import { useState } from 'react'
import { Form, App, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { subCajaApi, type SubCaja } from '~/lib/api/sub-caja'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface ModalMoverDineroSubCajasProps {
  open: boolean
  setOpen: (open: boolean) => void
  cajaPrincipalId: number
  onSuccess?: () => void
}

export default function ModalMoverDineroSubCajas({
  open,
  setOpen,
  cajaPrincipalId,
  onSuccess,
}: ModalMoverDineroSubCajasProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const subCajaOrigenId = Form.useWatch('sub_caja_origen_id', form)

  // Obtener sub-cajas de la caja principal
  const { data: subCajas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, cajaPrincipalId],
    queryFn: async () => {
      const response = await subCajaApi.getByCajaPrincipal(cajaPrincipalId)
      return response.data?.data || []
    },
    enabled: open && !!cajaPrincipalId,
  })

  const handleSubmit = async (values: any) => {
    if (values.sub_caja_origen_id === values.sub_caja_destino_id) {
      message.error('La sub-caja origen y destino no pueden ser la misma')
      return
    }

    setLoading(true)
    try {
      // 1. Registrar egreso en sub-caja origen
      const responseEgreso = await transaccionesCajaApi.registrarTransaccion({
        sub_caja_id: values.sub_caja_origen_id,
        tipo_transaccion: 'egreso',
        monto: values.monto,
        descripcion: `Transferencia a ${subCajas?.find(s => s.id === values.sub_caja_destino_id)?.nombre}`,
        referencia_tipo: 'movimiento_interno',
        despliegue_pago_id: values.despliegue_pago_id,
      })

      if (responseEgreso.error) {
        message.error(responseEgreso.error.message || 'Error al registrar egreso')
        return
      }

      // 2. Registrar ingreso en sub-caja destino
      const responseIngreso = await transaccionesCajaApi.registrarTransaccion({
        sub_caja_id: values.sub_caja_destino_id,
        tipo_transaccion: 'ingreso',
        monto: values.monto,
        descripcion: `Transferencia desde ${subCajas?.find(s => s.id === values.sub_caja_origen_id)?.nombre}`,
        referencia_tipo: 'movimiento_interno',
        referencia_id: responseEgreso.data?.data.id,
        despliegue_pago_id: values.despliegue_pago_id,
      })

      if (responseIngreso.error) {
        message.error(responseIngreso.error.message || 'Error al registrar ingreso')
        return
      }

      message.success('Dinero transferido exitosamente entre sub-cajas')
      form.resetFields()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      message.error('Error inesperado al transferir dinero')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 600,
        title: <TitleForm>Mover Dinero entre Sub-Cajas</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Transferir',
      }}
      onCancel={() => form.resetFields()}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Movimiento Interno:</strong> Transfiere dinero de una sub-caja a otra dentro de la misma caja principal.
          </p>
        </div>

        <LabelBase label="Sub-Caja Origen" orientation="column">
          <Form.Item
            name="sub_caja_origen_id"
            rules={[{ required: true, message: 'Selecciona la sub-caja origen' }]}
            className="mb-0"
          >
            <Select
              placeholder="Selecciona sub-caja origen"
              options={subCajas?.map(sc => ({
                label: `${sc.nombre} (S/. ${sc.saldo_actual})`,
                value: sc.id,
              }))}
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Sub-Caja Destino" orientation="column">
          <Form.Item
            name="sub_caja_destino_id"
            rules={[{ required: true, message: 'Selecciona la sub-caja destino' }]}
            className="mb-0"
          >
            <Select
              placeholder="Selecciona sub-caja destino"
              options={subCajas
                ?.filter(sc => sc.id !== subCajaOrigenId)
                ?.map(sc => ({
                  label: `${sc.nombre} (S/. ${sc.saldo_actual})`,
                  value: sc.id,
                }))}
              disabled={!subCajaOrigenId}
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Monto a Transferir" orientation="column">
          <InputNumberBase
            placeholder="0.00"
            min={0.01}
            precision={2}
            prefix="S/. "
            propsForm={{
              name: 'monto',
              rules: [
                { required: true, message: 'Ingresa el monto' },
                { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
              ],
            }}
          />
        </LabelBase>

        <LabelBase label="Método de Pago Vinculado" orientation="column">
          <SelectDespliegueDePago
            placeholder="Selecciona el método de pago"
            propsForm={{
              name: 'despliegue_pago_id',
              rules: [{ required: true, message: 'Selecciona un método de pago' }],
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            Especifica qué método de pago se está moviendo (ej: Efectivo, Yape, etc.)
          </p>
        </LabelBase>

        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Nota:</strong> Esta operación registrará un egreso en la sub-caja origen y un ingreso en la sub-caja destino.
          </p>
        </div>
      </div>
    </ModalForm>
  )
}
