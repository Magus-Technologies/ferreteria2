'use client'

import { Form, InputNumber, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import useSolicitarEfectivo from '../_hooks/use-solicitar-efectivo'
import { prestamoVendedorApi, type VendedorConEfectivo } from '~/lib/api/prestamo-vendedor'

interface ModalSolicitarEfectivoProps {
  open: boolean
  setOpen: (open: boolean) => void
  aperturaId: string
  onSuccess?: () => void
}

interface FormValues {
  vendedor_prestamista_id: number
  monto_solicitado: number
  motivo?: string
}

export default function ModalSolicitarEfectivo({
  open,
  setOpen,
  aperturaId,
  onSuccess,
}: ModalSolicitarEfectivoProps) {
  const [form] = Form.useForm<FormValues>()
  const { solicitarEfectivo, loading } = useSolicitarEfectivo(() => {
    setOpen(false)
    form.resetFields()
    onSuccess?.()
  })

  // Obtener vendedores con efectivo disponible
  const { data: vendedores = [], isLoading: loadingVendedores } = useQuery({
    queryKey: ['vendedores-con-efectivo', aperturaId],
    queryFn: async () => {
      const result = await prestamoVendedorApi.obtenerVendedoresConEfectivo(aperturaId)
      return result.data || []
    },
    enabled: open && !!aperturaId,
  })

  const handleSubmit = (values: FormValues) => {
    solicitarEfectivo({
      apertura_cierre_caja_id: aperturaId,
      ...values,
    })
  }

  return (
    <ModalForm
      modalProps={{
        width: 600,
        title: <TitleForm>Solicitar Efectivo</TitleForm>,
        centered: true,
        okButtonProps: { loading },
        okText: 'Enviar Solicitud',
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
          💡 Solicita efectivo a otro vendedor cuando necesites dar vuelto
        </p>
      </div>

      <LabelBase label='Vendedor' orientation='column'>
        <Form.Item
          name='vendedor_prestamista_id'
          rules={[{ required: true, message: 'Selecciona un vendedor' }]}
        >
          <Select
            placeholder='Selecciona el vendedor'
            loading={loadingVendedores}
            options={vendedores.map((v: VendedorConEfectivo) => ({
              value: v.vendedor_id,
              label: `${v.vendedor_nombre} - Disponible: S/. ${v.efectivo_disponible}`,
            }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </LabelBase>

      <LabelBase label='Monto a Solicitar' orientation='column'>
        <Form.Item
          name='monto_solicitado'
          rules={[
            { required: true, message: 'Ingresa el monto' },
            { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
          ]}
        >
          <InputNumber
            placeholder='0.00'
            className='w-full'
            prefix='S/.'
            min={0}
            step={0.01}
            precision={2}
          />
        </Form.Item>
      </LabelBase>

      <LabelBase label='Motivo (Opcional)' orientation='column'>
        <InputBase
          placeholder='Ej: Necesito dar vuelto de S/. 50'
          uppercase={false}
          propsForm={{
            name: 'motivo',
            rules: [{ max: 500, message: 'Máximo 500 caracteres' }],
          }}
        />
      </LabelBase>

      {vendedores.length === 0 && !loadingVendedores && (
        <div className='mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
          <p className='text-sm text-yellow-700'>
            ⚠️ No hay vendedores con efectivo disponible en este momento
          </p>
        </div>
      )}
    </ModalForm>
  )
}
