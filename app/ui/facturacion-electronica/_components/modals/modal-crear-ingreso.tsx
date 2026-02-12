'use client'

import { Form, DatePicker, InputNumber, Input, message, Alert } from 'antd'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import SelectCajaPrincipal from '../selects/select-caja-principal'
import SelectSubCaja from '../selects/select-sub-caja'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { subCajaApi, type SubCaja } from '~/lib/api/sub-caja'
import { despliegueDePagoApi, type DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { useAuth } from '~/lib/auth-context'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'

type ModalCrearIngresoProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

interface CrearIngresoFormValues {
  fecha: dayjs.Dayjs
  caja_principal_id: number
  sub_caja_id: number
  despliegue_pago_id: string
  monto: number
  concepto: string
  comentario?: string
  numero_operacion?: string
}

export default function ModalCrearIngreso({
  open,
  setOpen,
  onSuccess,
}: ModalCrearIngresoProps) {
  const { user } = useAuth()
  const [form] = Form.useForm<CrearIngresoFormValues>()
  const [loading, setLoading] = useState(false)
  const [cajaPrincipalId, setCajaPrincipalId] = useState<number | null>(null)
  const [subCajaSeleccionada, setSubCajaSeleccionada] = useState<SubCaja | null>(null)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<DespliegueDePago | null>(null)
  const [advertencia, setAdvertencia] = useState<string | null>(null)

  // Observar cambios en los campos del formulario
  const subCajaId = Form.useWatch('sub_caja_id', form)
  const metodoPagoId = Form.useWatch('despliegue_pago_id', form)

  // Cargar sub-caja seleccionada
  useEffect(() => {
    if (subCajaId) {
      subCajaApi.getById(subCajaId).then((response) => {
        if (response.data?.data) {
          setSubCajaSeleccionada(response.data.data)
        }
      })
    } else {
      setSubCajaSeleccionada(null)
    }
  }, [subCajaId])

  // Cargar método de pago seleccionado
  useEffect(() => {
    if (metodoPagoId) {
      // Extraer el despliegue_pago_id del valor compuesto "sub_caja_id-despliegue_pago_id"
      const desplieguePagoIdReal = metodoPagoId.includes('-')
        ? metodoPagoId.split('-')[1]
        : metodoPagoId

      despliegueDePagoApi.getById(desplieguePagoIdReal).then((response) => {
        if (response.data?.data) {
          setMetodoPagoSeleccionado(response.data.data)
        }
      })
    } else {
      setMetodoPagoSeleccionado(null)
    }
  }, [metodoPagoId])

  // Validar compatibilidad
  useEffect(() => {
    if (subCajaSeleccionada && metodoPagoSeleccionado) {
      const metodosPermitidos = subCajaSeleccionada.despliegues_pago_ids
      const aceptaTodos = Array.isArray(metodosPermitidos) && metodosPermitidos.includes('*')
      const aceptaMetodo = Array.isArray(metodosPermitidos) && metodosPermitidos.includes(metodoPagoSeleccionado.id)

      if (!aceptaTodos && !aceptaMetodo) {
        setAdvertencia(
          `⚠️ La sub-caja "${subCajaSeleccionada.nombre}" NO acepta el método de pago "${metodoPagoSeleccionado.name}". Por favor, selecciona otra sub-caja o método de pago.`
        )
      } else {
        setAdvertencia(null)
      }
    } else {
      setAdvertencia(null)
    }
  }, [subCajaSeleccionada, metodoPagoSeleccionado])

  const handleSubmit = async (values: CrearIngresoFormValues) => {
    // Validar que no haya advertencia
    if (advertencia) {
      message.error('No puedes guardar mientras haya advertencias. Corrige la configuración.')
      return
    }

    setLoading(true)
    try {
      // Extraer el despliegue_pago_id del valor compuesto "sub_caja_id-despliegue_pago_id"
      const desplieguePagoId = values.despliegue_pago_id.includes('-')
        ? values.despliegue_pago_id.split('-')[1]
        : values.despliegue_pago_id

      const response = await transaccionesCajaApi.registrarTransaccion({
        sub_caja_id: values.sub_caja_id,
        tipo_transaccion: 'ingreso',
        monto: values.monto,
        descripcion: values.concepto,
        referencia_tipo: 'ingreso_manual',
        despliegue_pago_id: desplieguePagoId,
        numero_operacion: values.numero_operacion,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al registrar ingreso')
        return
      }

      message.success('Ingreso registrado exitosamente en la caja')
      form.resetFields()
      setCajaPrincipalId(null)
      setSubCajaSeleccionada(null)
      setMetodoPagoSeleccionado(null)
      setAdvertencia(null)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al registrar ingreso:', error)
      message.error('Error inesperado al registrar ingreso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 600,
        title: <TitleForm>Registrar Otros Ingresos</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Guardar',
      }}
      onCancel={() => {
        form.resetFields()
        setCajaPrincipalId(null)
        setSubCajaSeleccionada(null)
        setMetodoPagoSeleccionado(null)
        setAdvertencia(null)
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
        initialValues: {
          fecha: dayjs(),
        },
      }}
    >
      <div className="space-y-3">
        {advertencia && (
          <Alert
            message="Advertencia"
            description={advertencia}
            type="error"
            showIcon
            closable
            className="text-xs"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <LabelBase label="Fecha" orientation="column">
            <Form.Item
              name="fecha"
              rules={[{ required: true, message: 'Selecciona la fecha' }]}
              className="mb-0"
            >
              <DatePicker
                format="DD/MM/YYYY"
                className="w-full"
                placeholder="Selecciona fecha"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Ingreso S/." orientation="column">
            <Form.Item
              name="monto"
              rules={[
                { required: true, message: 'Ingresa el monto' },
                { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
              ]}
              className="mb-0"
            >
              <InputNumber
                className="w-full"
                placeholder="0.00"
                min={0}
                step={0.01}
                precision={2}
                prefix="S/"
              />
            </Form.Item>
          </LabelBase>
        </div>

        <LabelBase label="Caja Principal" orientation="column">
          <SelectCajaPrincipal
            placeholder="Selecciona una caja"
            propsForm={{
              name: 'caja_principal_id',
              rules: [{ required: true, message: 'Selecciona una caja principal' }],
            }}
            onChange={(value) => {
              setCajaPrincipalId(value as number)
              form.setFieldValue('sub_caja_id', undefined)
            }}
            disabled={false}
          />
        </LabelBase>

        <LabelBase label="Sub-Caja" orientation="column">
          <SelectSubCaja
            cajaPrincipalId={cajaPrincipalId || undefined}
            propsForm={{
              name: 'sub_caja_id',
              rules: [{ required: true, message: 'Selecciona una sub-caja' }],
            }}
            onChange={() => {
              form.setFieldValue('despliegue_pago_id', undefined)
            }}
          />
        </LabelBase>

        <LabelBase label="Método de Pago" orientation="column">
          <SelectDespliegueDePago
            placeholder="Selecciona el método de pago"
            subCajaId={subCajaId}
            propsForm={{
              name: 'despliegue_pago_id',
              rules: [{ required: true, message: 'Selecciona un método de pago' }],
            }}
          />
        </LabelBase>

        {metodoPagoSeleccionado?.requiere_numero_serie && (
          <LabelBase label="Número de Operación" orientation="column">
            <Form.Item
              name="numero_operacion"
              rules={[
                { required: true, message: 'Ingresa el número de operación' },
                { max: 100, message: 'Máximo 100 caracteres' },
              ]}
              className="mb-0"
            >
              <Input 
                placeholder="Ej: YAPE-123456789" 
                maxLength={100}
                style={{ minWidth: '400px' }}
              />
            </Form.Item>
          </LabelBase>
        )}

        <LabelBase label="Concepto" orientation="column">
          <Form.Item
            name="concepto"
            rules={[
              { required: true, message: 'Ingresa el concepto' },
              { max: 90, message: 'Máximo 90 caracteres' },
            ]}
            className="mb-0"
          >
            <Input 
              placeholder="Ej: Venta de producto, Cobro de servicio" 
              maxLength={90}
              showCount
              style={{ minWidth: '400px' }}
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Comentario (Opcional)" orientation="column">
          <Form.Item name="comentario" className="mb-0">
            <Input.TextArea
              placeholder="Comentario adicional (opcional)"
              rows={2}
              maxLength={100}
              showCount
              style={{ minWidth: '400px' }}
            />
          </Form.Item>
        </LabelBase>

        <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Nota:</strong> Este ingreso afectará directamente el saldo de la sub-caja seleccionada.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            <strong>SOLO PULSE GUARDAR SI SE REGISTRA EL INGRESO REAL DE DINERO</strong>
          </p>
        </div>
      </div>
    </ModalForm>
  )
}
