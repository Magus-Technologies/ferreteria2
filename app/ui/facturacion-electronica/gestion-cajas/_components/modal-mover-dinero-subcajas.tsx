'use client'

import { useState } from 'react'
import { Form, App, Select, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { subCajaApi } from '~/lib/api/sub-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'

interface ModalMoverDineroSubCajasProps {
  open: boolean
  setOpen: (open: boolean) => void
  cajaPrincipalId?: number
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

  // Obtener caja principal del usuario si no se proporciona
  const { data: cajaPrincipalData } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES, 'usuario-actual'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/cajas-principales/usuario/actual`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      return data.data
    },
    enabled: open && !cajaPrincipalId,
  })

  const cajaPrincipalIdFinal = cajaPrincipalId || cajaPrincipalData?.id

  // Obtener sub-cajas de la caja principal
  const { data: subCajas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, cajaPrincipalIdFinal],
    queryFn: async () => {
      const response = await subCajaApi.getByCajaPrincipal(cajaPrincipalIdFinal)
      return response.data?.data || []
    },
    enabled: open && !!cajaPrincipalIdFinal,
  })

  const handleSubmit = async (values: any) => {
    if (values.sub_caja_origen_id === values.sub_caja_destino_id) {
      message.error('La sub-caja origen y destino no pueden ser la misma')
      return
    }

    setLoading(true)
    try {
      const payload = {
        sub_caja_origen_id: values.sub_caja_origen_id,
        sub_caja_destino_id: values.sub_caja_destino_id,
        monto: values.monto,
        despliegue_de_pago_origen_id: extractDesplieguePagoId(values.despliegue_de_pago_origen_id),
        despliegue_de_pago_destino_id: extractDesplieguePagoId(values.despliegue_de_pago_destino_id),
        numero_operacion: values.numero_operacion,
        justificacion: values.justificacion,
      }

      console.log('📤 Enviando payload:', payload)
      console.log('🔗 URL:', `${process.env.NEXT_PUBLIC_API_URL}/cajas/movimientos-internos`)
      console.log('🔑 Token:', localStorage.getItem('auth_token') ? 'Presente' : 'Ausente')

      // Llamar al endpoint de movimientos internos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/movimientos-internos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const contentType = response.headers.get('content-type')
      console.log('📥 Content-Type:', contentType)

      let data
      if (contentType?.includes('application/json')) {
        data = await response.json()
        console.log('📥 Response data:', data)
      } else {
        const text = await response.text()
        console.log('📥 Response text (primeros 500 chars):', text.substring(0, 500))
        throw new Error(`El servidor devolvió HTML en lugar de JSON. Status: ${response.status}`)
      }

      if (!response.ok || !data.success) {
        console.error('❌ Error en respuesta:', data)
        message.error(data.message || 'Error al registrar movimiento interno')
        return
      }

      console.log('✅ Movimiento interno registrado exitosamente')
      message.success('Dinero transferido exitosamente entre sub-cajas')
      form.resetFields()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error completo:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
      message.error(error instanceof Error ? error.message : 'Error inesperado al transferir dinero')
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
            <strong>Depósito Bancario:</strong> Retira efectivo de una sub-caja y deposítalo en una cuenta bancaria de otra sub-caja.
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

        <LabelBase label="Efectivo a Retirar (Origen)" orientation="column">
          <SelectDespliegueDePago
            placeholder="Selecciona Efectivo"
            propsForm={{
              name: 'despliegue_de_pago_origen_id',
              rules: [{ required: true, message: 'Selecciona el efectivo origen' }],
            }}
            filterByTipo="efectivo"
          />
          <p className="text-xs text-slate-500 mt-1">
            Solo puedes mover efectivo físico
          </p>
        </LabelBase>

        <LabelBase label="Cuenta Bancaria Destino (Depósito)" orientation="column">
          <SelectDespliegueDePago
            placeholder="Selecciona cuenta bancaria"
            propsForm={{
              name: 'despliegue_de_pago_destino_id',
              rules: [{ required: true, message: 'Selecciona la cuenta destino' }],
            }}
            filterByTipo="banco"
          />
          <p className="text-xs text-slate-500 mt-1">
            Selecciona la cuenta donde se depositará el efectivo
          </p>
        </LabelBase>

        <LabelBase label="Número de Operación" orientation="column">
          <Form.Item
            name="numero_operacion"
            rules={[
              { required: true, message: 'El número de operación es requerido' },
              { max: 100, message: 'Máximo 100 caracteres' }
            ]}
            className="mb-0"
          >
            <Input
              placeholder="Ej: 123456789"
              maxLength={100}
            />
          </Form.Item>
          <p className="text-xs text-slate-500 mt-1">
            Número de operación del depósito bancario
          </p>
        </LabelBase>

        <LabelBase label="Justificación" orientation="column">
          <Form.Item
            name="justificacion"
            rules={[
              { required: true, message: 'La justificación es requerida' },
              { max: 1000, message: 'Máximo 1000 caracteres' }
            ]}
            className="mb-0"
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe el motivo del movimiento interno"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </LabelBase>

        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Nota:</strong> Esta operación registrará un egreso de efectivo en la sub-caja origen y un ingreso bancario en la sub-caja destino.
          </p>
        </div>
      </div>
    </ModalForm>
  )
}
