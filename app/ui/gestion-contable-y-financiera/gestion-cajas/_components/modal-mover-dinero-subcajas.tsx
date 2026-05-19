'use client'

import React, { useState } from 'react'
import { Form, App, Select, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'

interface ModalMoverDineroSubCajasProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export default function ModalMoverDineroSubCajas({
  open,
  setOpen,
  onSuccess,
}: ModalMoverDineroSubCajasProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const subCajaOrigenId = Form.useWatch('sub_caja_origen_id', form)
  const subCajaDestinoId = Form.useWatch('sub_caja_destino_id', form)

  // Obtener TODAS las sub-cajas del vendedor (con cualquier saldo)
  const { data: subCajasOrigen, isLoading: loadingSubCajas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'todas-con-saldo-vendedor'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/cajas/sub-cajas/todas-con-saldo-vendedor`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      console.log('💵 Sub-cajas del vendedor:', data?.data)
      console.log('🔍 Estructura de datos:', JSON.stringify(data?.data?.[0], null, 2))
      return data?.data || []
    },
    enabled: open,
    staleTime: 0, // No usar caché
    refetchOnMount: 'always', // Siempre refrescar al montar
  })

  // Limpiar el despliegue de pago origen cuando cambie la sub-caja origen
  const prevSubCajaOrigenId = React.useRef(subCajaOrigenId)
  React.useEffect(() => {
    if (prevSubCajaOrigenId.current !== subCajaOrigenId && prevSubCajaOrigenId.current !== undefined) {
      form.setFieldValue('despliegue_de_pago_origen_id', undefined)
    }
    prevSubCajaOrigenId.current = subCajaOrigenId
  }, [subCajaOrigenId, form])

  // Limpiar el despliegue de pago destino cuando cambie la sub-caja destino
  const prevSubCajaDestinoId = React.useRef(subCajaDestinoId)
  React.useEffect(() => {
    if (prevSubCajaDestinoId.current !== subCajaDestinoId && prevSubCajaDestinoId.current !== undefined) {
      form.setFieldValue('despliegue_de_pago_destino_id', undefined)
    }
    prevSubCajaDestinoId.current = subCajaDestinoId
  }, [subCajaDestinoId, form])

  // Encontrar la sub-caja origen seleccionada para mostrar sus métodos de pago
  const subCajaSeleccionada = React.useMemo(() => {
    if (!subCajaOrigenId || !subCajasOrigen) return null
    return subCajasOrigen.find((sc: any) => sc.id === subCajaOrigenId)
  }, [subCajaOrigenId, subCajasOrigen])

  // Encontrar la sub-caja destino seleccionada para mostrar sus métodos de pago
  const subCajaDestinoSeleccionada = React.useMemo(() => {
    if (!subCajaDestinoId || !subCajasOrigen) return null
    return subCajasOrigen.find((sc: any) => sc.id === subCajaDestinoId)
  }, [subCajaDestinoId, subCajasOrigen])

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
        {/* Sección: Origen */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 border-b pb-1">
            📤 Origen (De dónde sale el dinero)
          </div>

          <LabelBase label="Sub-Caja Origen" orientation="column">
            <Form.Item
              name="sub_caja_origen_id"
              rules={[{ required: true, message: 'Selecciona la sub-caja origen' }]}
              className="mb-0"
            >
              <Select
                placeholder="Selecciona sub-caja origen"
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={subCajasOrigen?.map((sc: any) => ({
                  label: `${sc.nombre} - S/. ${Number(sc.saldo_vendedor || 0).toFixed(2)}`,
                  value: sc.id,
                }))}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Método de Pago Origen" orientation="column">
            <Form.Item
              name="despliegue_de_pago_origen_id"
              rules={[{ required: true, message: 'Selecciona el método de pago origen' }]}
              className="mb-0"
            >
              <Select
                placeholder="Selecciona el método de pago origen"
                showSearch
                disabled={!subCajaOrigenId}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={subCajaSeleccionada?.metodos_pago?.map((mp: any) => {
                  // Construir label con formato: SubCaja/Banco/Titular/Método - S/. SALDO
                  const partes = []
                  
                  // Agregar nombre de la sub-caja
                  if (subCajaSeleccionada?.nombre) {
                    partes.push(subCajaSeleccionada.nombre)
                  }
                  
                  // Agregar banco (metodo_de_pago_nombre)
                  if (mp.metodo_de_pago_nombre) {
                    partes.push(mp.metodo_de_pago_nombre)
                  }
                  
                  // Agregar titular si existe
                  if (mp.nombre_titular) {
                    partes.push(mp.nombre_titular)
                  }
                  
                  // Agregar nombre del método (despliegue)
                  if (mp.nombre) {
                    partes.push(mp.nombre)
                  }
                  
                  const label = partes.join('/')
                  const saldo = ` - S/. ${Number(mp.saldo_vendedor || 0).toFixed(2)}`
                  
                  return {
                    label: `${label}${saldo}`,
                    value: mp.despliegue_pago_id,
                  }
                }) || []}
              />
            </Form.Item>
          </LabelBase>
        </div>

        {/* Sección: Destino */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 border-b pb-1">
            Destino (A dónde va el dinero)
          </div>

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
                options={subCajasOrigen
                  ?.filter((sc: any) => sc.id !== subCajaOrigenId)
                  ?.map((sc: any) => ({
                    label: `${sc.nombre}`,
                    value: sc.id,
                  }))}
                disabled={!subCajaOrigenId}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Método de Pago Destino" orientation="column">
            <Form.Item
              name="despliegue_de_pago_destino_id"
              rules={[{ required: true, message: 'Selecciona el método de pago destino' }]}
              className="mb-1"
            >
              <Select
                placeholder="Selecciona el método de pago destino"
                showSearch
                disabled={!subCajaDestinoId}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={subCajaDestinoSeleccionada?.metodos_pago?.map((mp: any) => {
                  // Construir label con formato: SubCaja/Banco/Titular/Método - S/. SALDO
                  const partes = []
                  
                  // Agregar nombre de la sub-caja
                  if (subCajaDestinoSeleccionada?.nombre) {
                    partes.push(subCajaDestinoSeleccionada.nombre)
                  }
                  
                  // Agregar banco (metodo_de_pago_nombre)
                  if (mp.metodo_de_pago_nombre) {
                    partes.push(mp.metodo_de_pago_nombre)
                  }
                  
                  // Agregar titular si existe
                  if (mp.nombre_titular) {
                    partes.push(mp.nombre_titular)
                  }
                  
                  // Agregar nombre del método (despliegue)
                  if (mp.nombre) {
                    partes.push(mp.nombre)
                  }
                  
                  const label = partes.join('/')
                  const saldo = ` - S/. ${Number(mp.saldo_vendedor || 0).toFixed(2)}`
                  
                  return {
                    label: `${label}${saldo}`,
                    value: mp.despliegue_pago_id,
                  }
                }) || []}
              />
            </Form.Item>
            <p className="text-xs text-slate-500 -mt-1">
              Puede ser efectivo o cualquier pago digital
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
      </div>
    </ModalForm>
  )
}
