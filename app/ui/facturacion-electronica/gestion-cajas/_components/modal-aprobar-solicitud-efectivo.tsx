'use client'

import { Form, InputNumber, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import { useAprobarSolicitudEfectivo } from '../_hooks/use-aprobar-solicitud-efectivo'
import { subCajaApi, type SubCaja } from '~/lib/api/sub-caja'

interface ModalAprobarSolicitudEfectivoProps {
  solicitudId: number
  open: boolean
  setOpen: (open: boolean) => void
  montoSolicitado: number
  solicitanteNombre: string
  onSuccess?: () => void
}

interface FormValues {
  sub_caja_origen_id: number
  monto_aprobado?: number
}

export default function ModalAprobarSolicitudEfectivo({
  solicitudId,
  open,
  setOpen,
  montoSolicitado,
  solicitanteNombre,
  onSuccess,
}: ModalAprobarSolicitudEfectivoProps) {
  const [form] = Form.useForm<FormValues>()
  const { aprobar, loading } = useAprobarSolicitudEfectivo()

  // Obtener caja activa del usuario
  const { data: cajaActiva } = useQuery({
    queryKey: ['caja-activa'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/activa`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      return data.data
    },
    enabled: open,
  })

  // Obtener sub-cajas del usuario
  const { data: subCajasResponse, isLoading: loadingSubCajas } = useQuery({
    queryKey: ['sub-cajas', cajaActiva?.caja_principal_id],
    queryFn: async () => {
      if (!cajaActiva?.caja_principal_id) return null
      return await subCajaApi.getByCajaPrincipal(cajaActiva.caja_principal_id)
    },
    enabled: open && !!cajaActiva?.caja_principal_id,
  })

  const subCajas = subCajasResponse?.data?.data || []

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        monto_aprobado: montoSolicitado,
      })
    }
  }, [open, montoSolicitado, form])

  const handleSubmit = async (values: FormValues) => {
    const success = await aprobar({
      solicitud_id: solicitudId,
      sub_caja_origen_id: values.sub_caja_origen_id,
      monto_aprobado: values.monto_aprobado || montoSolicitado,
    })

    if (success) {
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 600,
        title: <TitleForm>Aprobar Solicitud de Efectivo</TitleForm>,
        centered: true,
        okButtonProps: { loading },
        okText: 'Aprobar y Transferir',
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
        <p className='text-sm text-blue-700'>
          <strong>{solicitanteNombre}</strong> solicita <strong>S/. {montoSolicitado.toFixed(2)}</strong>
        </p>
      </div>

      <LabelBase label='Sub-Caja Origen' orientation='column'>
        <Form.Item
          name='sub_caja_origen_id'
          rules={[{ required: true, message: 'Selecciona la sub-caja de donde saldrá el dinero' }]}
        >
          <Select
            placeholder='Selecciona la sub-caja'
            loading={loadingSubCajas}
            showSearch
            options={subCajas.map((sc: SubCaja) => ({
              value: sc.id,
              label: `${sc.nombre} - Saldo: S/. ${parseFloat(sc.saldo_actual || '0').toFixed(2)}`,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </LabelBase>

      <LabelBase label='Monto a Aprobar' orientation='column'>
        <Form.Item
          name='monto_aprobado'
          rules={[
            { required: true, message: 'Ingresa el monto' },
            { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
            {
              type: 'number',
              max: montoSolicitado,
              message: `El monto no puede ser mayor a S/. ${montoSolicitado.toFixed(2)}`,
            },
          ]}
        >
          <InputNumber
            placeholder='0.00'
            className='w-full'
            prefix='S/.'
            min={0}
            max={montoSolicitado}
            step={0.01}
            precision={2}
          />
        </Form.Item>
      </LabelBase>

      <div className='mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
        <p className='text-sm text-yellow-700'>
          ⚠️ Asegúrate de tener suficiente efectivo en la sub-caja seleccionada
        </p>
      </div>
    </ModalForm>
  )
}
