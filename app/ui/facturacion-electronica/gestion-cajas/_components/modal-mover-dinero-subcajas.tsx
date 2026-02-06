'use client'

import React, { useState } from 'react'
import { Form, App, Select, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
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

  // Limpiar el despliegue de pago origen cuando cambie la sub-caja origen
  const prevSubCajaOrigenId = React.useRef(subCajaOrigenId)
  React.useEffect(() => {
    if (prevSubCajaOrigenId.current !== subCajaOrigenId && prevSubCajaOrigenId.current !== undefined) {
      form.setFieldValue('despliegue_de_pago_origen_id', undefined)
    }
    prevSubCajaOrigenId.current = subCajaOrigenId
  }, [subCajaOrigenId, form])

  // Obtener sub-cajas con saldo EN EFECTIVO del vendedor
  const { data: subCajasEfectivo } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'todas-con-saldo-efectivo'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/cajas/sub-cajas/todas-con-saldo-efectivo`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      console.log('💵 Sub-cajas con efectivo del vendedor:', data?.data)
      return data?.data || []
    },
    enabled: open,
    staleTime: 0, // No usar caché
    refetchOnMount: 'always', // Siempre refrescar al montar
  })

  // Obtener TODAS las sub-cajas para el destino (sin filtrar por efectivo)
  const { data: todasSubCajas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'todas'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/cajas/sub-cajas/todas-con-saldo-vendedor`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      console.log('Todas las sub-cajas:', data?.data)
      return data?.data || []
    },
    enabled: open,
    staleTime: 0,
    refetchOnMount: 'always',
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

      console.log(' Enviando payload:', payload)
      console.log('URL:', `${process.env.NEXT_PUBLIC_API_URL}/cajas/movimientos-internos`)
      console.log(' Token:', localStorage.getItem('auth_token') ? 'Presente' : 'Ausente')

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

      console.log(' Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const contentType = response.headers.get('content-type')
      console.log(' Content-Type:', contentType)

      let data
      if (contentType?.includes('application/json')) {
        data = await response.json()
        console.log(' Response data:', data)
      } else {
        const text = await response.text()
        console.log(' Response text (primeros 500 chars):', text.substring(0, 500))
        throw new Error(`El servidor devolvió HTML en lugar de JSON. Status: ${response.status}`)
      }

      if (!response.ok || !data.success) {
        console.error(' Error en respuesta:', data)
        message.error(data.message || 'Error al registrar movimiento interno')
        return
      }

      console.log(' Movimiento interno registrado exitosamente')
      message.success('Dinero transferido exitosamente entre sub-cajas')
      form.resetFields()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error(' Error completo:', error)
      console.error(' Error stack:', error instanceof Error ? error.stack : 'No stack')
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
      <div className="space-y-3">
        {/* Información del proceso */}
        <div className="p-2.5 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Transferencia Digital:</strong> Retira efectivo que tengas en tu sub-caja y transfiérelo a pagos digitales (Yape, Plin, Banco) en otra sub-caja.
          </p>
        </div>

        {/* Sección: Origen */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 border-b pb-1">
            📤 Origen (Tu efectivo disponible)
          </div>

          <LabelBase label="Sub-Caja Origen" orientation="column">
            <Form.Item
              name="sub_caja_origen_id"
              rules={[{ required: true, message: 'Selecciona la sub-caja origen' }]}
              className="mb-1"
            >
              <Select
                placeholder="Selecciona sub-caja con tu efectivo"
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={subCajasEfectivo?.map((sc: any) => ({
                  label: `${sc.nombre} - Efectivo: S/. ${sc.saldo_efectivo || '0.00'}`,
                  value: sc.id,
                }))}
              />
            </Form.Item>
            <p className="text-xs text-slate-500 -mt-1">
              Solo se muestran sub-cajas donde tienes efectivo disponible
            </p>
          </LabelBase>

          <LabelBase label="Efectivo a Retirar" orientation="column">
            <SelectDespliegueDePago
              placeholder="Selecciona el efectivo a retirar"
              propsForm={{
                name: 'despliegue_de_pago_origen_id',
                rules: [{ required: true, message: 'Selecciona el efectivo origen' }],
              }}
              filterByTipo="efectivo"
              subCajaId={subCajaOrigenId}
            />
            <p className="text-xs text-slate-500 mt-1">
              Solo puedes mover efectivo físico que tengas
            </p>
          </LabelBase>
        </div>

        {/* Sección: Destino */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 border-b pb-1">
          </div>
            📥 Destino (Pago digital)

          <LabelBase label="Sub-Caja Destino" orientation="column">
            <Form.Item
              name="sub_caja_destino_id"
              rules={[{ required: true, message: 'Selecciona la sub-caja destino' }]}
              className="mb-1"
            >
              <Select
                placeholder="Selecciona sub-caja destino"
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={todasSubCajas
                  ?.filter((sc: any) => sc.id !== subCajaOrigenId)
                  ?.map((sc: any) => ({
                    label: `${sc.nombre}`,
                    value: sc.id,
                  }))}
                disabled={!subCajaOrigenId}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Método de Pago Digital Destino" orientation="column">
            <SelectDespliegueDePago
              placeholder="Selecciona Yape, Plin, Banco, etc."
              propsForm={{
                name: 'despliegue_de_pago_destino_id',
                rules: [{ required: true, message: 'Selecciona el método de pago destino' }],
              }}
              filterByTipo={['banco', 'billetera']}
            />
            <p className="text-xs text-slate-500 mt-1">
              Selecciona el método digital donde se registrará el dinero
            </p>
          </LabelBase>
        </div>

        {/* Sección: Detalles de la transferencia */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 border-b pb-1">
            💰 Detalles de la Transferencia
          </div>

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

          <LabelBase label="Número de Operación" orientation="column">
            <Form.Item
              name="numero_operacion"
              rules={[
                { required: true, message: 'El número de operación es requerido' },
                { max: 100, message: 'Máximo 100 caracteres' }
              ]}
              className="mb-1"
            >
              <Input
                placeholder="Ej: 123456789 o código de transferencia"
                maxLength={100}
                className="w-full"
                style={{ minWidth: '400px' }}
              />
            </Form.Item>
            <p className="text-xs text-slate-500 -mt-1">
              Número de operación de la transferencia digital
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
                rows={2}
                placeholder="Describe el motivo del movimiento interno"
                maxLength={1000}
                showCount
                className="w-full"
                style={{ minWidth: '400px' }}
              />
            </Form.Item>
          </LabelBase>
        </div>

        {/* Nota informativa */}
        <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>⚠️ Nota:</strong> Esta operación registrará un egreso de efectivo en tu sub-caja origen y un ingreso digital en la sub-caja destino.
          </p>
        </div>
      </div>
    </ModalForm>
  )
}
