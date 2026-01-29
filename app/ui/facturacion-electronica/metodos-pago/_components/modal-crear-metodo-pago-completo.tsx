'use client'

import { useState } from 'react'
import { Form, Radio, Switch, App, Steps, Select, Button } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { apiRequest } from '~/lib/api'
import { metodoDePagoApi, type MetodoDePago } from '~/lib/api/metodo-de-pago'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaUniversity, FaCreditCard, FaCheck } from 'react-icons/fa'

interface ModalCrearMetodoPagoCompletoProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
  bancoIdInicial?: string | null
}

export default function ModalCrearMetodoPagoCompleto({
  open,
  setOpen,
  onSuccess,
  bancoIdInicial,
}: ModalCrearMetodoPagoCompletoProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tipoSobrecargo, setTipoSobrecargo] = useState<string>('ninguno')
  const [paso, setPaso] = useState(0)
  const [necesitaBanco, setNecesitaBanco] = useState<boolean | null>(null)
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string | null>(bancoIdInicial || null)
  const [creandoBanco, setCreandoBanco] = useState(false)
  const [tieneNumeroCelular, setTieneNumeroCelular] = useState(false)
  const { message } = App.useApp()

  // Query para bancos existentes
  const { data: bancos, refetch: refetchBancos } = useQuery({
    queryKey: [QueryKeys.METODO_DE_PAGO],
    queryFn: async () => {
      const response = await metodoDePagoApi.getAll()
      return response.data?.data || []
    },
    enabled: open,
  })

  const handleReset = () => {
    form.resetFields()
    setTipoSobrecargo('ninguno')
    setPaso(0)
    setNecesitaBanco(null)
    setBancoSeleccionado(bancoIdInicial || null)
    setCreandoBanco(false)
    setTieneNumeroCelular(false)
  }

  const handleCrearBanco = async () => {
    try {
      const nombreBanco = form.getFieldValue('nombre_banco')
      const cuentaBancaria = form.getFieldValue('cuenta_bancaria')
      const nombreTitularBanco = form.getFieldValue('nombre_titular_banco')

      if (!nombreBanco) {
        message.error('Ingresa el nombre del banco')
        return
      }

      setCreandoBanco(true)
      const response = await metodoDePagoApi.create({
        name: nombreBanco,
        cuenta_bancaria: cuentaBancaria,
        nombre_titular: nombreTitularBanco,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al crear banco')
        return
      }

      message.success('Banco creado exitosamente')
      setBancoSeleccionado(response.data?.data.id || null)
      await refetchBancos()
      setPaso(2) // Ir directo al paso de método
    } catch (error) {
      message.error('Error inesperado al crear banco')
    } finally {
      setCreandoBanco(false)
    }
  }

  const handleSubmitMetodo = async (values: any) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        metodo_de_pago_id: bancoSeleccionado || undefined,
      }

      const response = await apiRequest('/despliegues-de-pago', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al crear método de pago')
        return
      }

      message.success('Método de pago creado exitosamente')
      setOpen(false)
      handleReset()
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      message.error('Error inesperado al crear')
    } finally {
      setLoading(false)
    }
  }

  const renderPaso0 = () => (
    <div className='space-y-4'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-slate-700 mb-2'>
          ¿Este método pertenece a un banco?
        </h3>
        <p className='text-sm text-slate-500'>
          Ej: BCP Yape necesita banco "BCP". Efectivo no necesita banco.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <button
          type='button'
          onClick={() => {
            setNecesitaBanco(true)
            setPaso(1)
          }}
          className='p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all'
        >
          <FaUniversity className='text-4xl text-blue-600 mx-auto mb-3' />
          <div className='font-semibold text-slate-700'>Sí, tiene banco</div>
          <div className='text-xs text-slate-500 mt-1'>
            BCP, BBVA, Interbank, etc.
          </div>
        </button>

        <button
          type='button'
          onClick={() => {
            setNecesitaBanco(false)
            setBancoSeleccionado(null)
            setPaso(2)
          }}
          className='p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all'
        >
          <FaCreditCard className='text-4xl text-green-600 mx-auto mb-3' />
          <div className='font-semibold text-slate-700'>No, es independiente</div>
          <div className='text-xs text-slate-500 mt-1'>
            Efectivo, Crédito, etc.
          </div>
        </button>
      </div>
    </div>
  )

  const renderPaso1 = () => (
    <div className='space-y-4'>
      <div className='text-center mb-4'>
        <h3 className='text-lg font-semibold text-slate-700 mb-2'>
          Selecciona o crea el banco
        </h3>
      </div>

      <LabelBase label='Banco Existente' orientation='column'>
        <Select
          placeholder='Selecciona un banco'
          value={bancoSeleccionado}
          onChange={(value) => {
            setBancoSeleccionado(value)
            if (value) setPaso(2)
          }}
          options={bancos?.map((banco) => ({
            value: banco.id,
            label: banco.name,
          }))}
          allowClear
        />
      </LabelBase>

      <div className='relative my-6'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-slate-300'></div>
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-2 bg-white text-slate-500'>O crear nuevo banco</span>
        </div>
      </div>

      <LabelBase label='Nombre del Nuevo Banco' orientation='column'>
        <InputBase
          placeholder='Ej: BCP, BBVA, Interbank'
          uppercase={false}
          propsForm={{
            name: 'nombre_banco',
          }}
        />
      </LabelBase>

      <LabelBase label='Nombre del Titular (Opcional)' orientation='column'>
        <InputBase
          placeholder='Ej: Juan Pérez'
          uppercase={false}
          propsForm={{
            name: 'nombre_titular_banco',
          }}
        />
      </LabelBase>

      <LabelBase label='Número de Cuenta (Opcional)' orientation='column'>
        <InputBase
          placeholder='Ej: 123-456789-0-12'
          uppercase={false}
          propsForm={{
            name: 'cuenta_bancaria',
          }}
        />
      </LabelBase>

      <div className='flex gap-2 justify-end mt-4'>
        <Button onClick={() => setPaso(0)}>Atrás</Button>
        <Button
          type='primary'
          loading={creandoBanco}
          onClick={handleCrearBanco}
        >
          Crear Banco y Continuar
        </Button>
      </div>
    </div>
  )

  const renderPaso2 = () => {
    const bancoNombre = bancos?.find(b => b.id === bancoSeleccionado)?.name

    return (
      <div className='space-y-4'>
        {bancoNombre && (
          <div className='p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-center gap-2'>
              <FaCheck className='text-blue-600' />
              <span className='text-sm text-slate-700'>
                <strong>Banco:</strong> {bancoNombre}
              </span>
            </div>
          </div>
        )}

        <LabelBase label='Nombre del Método de Pago' orientation='column'>
          <InputBase
            placeholder={bancoNombre ? 'Ej: Yape, Transferencia, Izipay' : 'Ej: Efectivo, Crédito'}
            uppercase={false}
            propsForm={{
              name: 'name',
              rules: [
                { required: true, message: 'Ingresa el nombre del método' },
                { max: 191, message: 'Máximo 191 caracteres' },
              ],
            }}
          />
        </LabelBase>

        <LabelBase label='¿Tiene Número de Celular?' orientation='column'>
          <Switch
            checked={tieneNumeroCelular}
            onChange={setTieneNumeroCelular}
            checkedChildren="Sí"
            unCheckedChildren="No"
          />
          <p className='text-xs text-slate-500 mt-1'>
            Activar para métodos como Yape o Plin
          </p>
        </LabelBase>

        {tieneNumeroCelular && (
          <LabelBase label='Número de Celular' orientation='column'>
            <InputBase
              placeholder='Ej: 987654321, +51 987 654 321'
              uppercase={false}
              propsForm={{
                name: 'numero_celular',
                rules: [
                  { max: 20, message: 'Máximo 20 caracteres' },
                  { pattern: /^[0-9+\-\s()]*$/, message: 'Solo números y símbolos +, -, ( )' },
                ],
              }}
            />
            <p className='text-xs text-slate-500 mt-1'>
              Debe ser único (no se puede repetir).
            </p>
          </LabelBase>
        )}

        <LabelBase label='¿Requiere Número de Operación?' orientation='column'>
          <Form.Item name='requiere_numero_serie' valuePropName='checked' noStyle>
            <Switch checkedChildren="Sí" unCheckedChildren="No" />
          </Form.Item>
          <p className='text-xs text-slate-500 mt-1'>
            Yape, transferencias, Izipay requieren número. Efectivo no.
          </p>
        </LabelBase>

        <LabelBase label='Tipo de Sobrecargo' orientation='column'>
          <Form.Item
            name='tipo_sobrecargo'
            rules={[{ required: true, message: 'Selecciona el tipo' }]}
          >
            <Radio.Group onChange={(e) => setTipoSobrecargo(e.target.value)}>
              <Radio value='ninguno'>Ninguno</Radio>
              <Radio value='porcentaje'>Porcentaje</Radio>
              <Radio value='monto_fijo'>Monto Fijo</Radio>
            </Radio.Group>
          </Form.Item>
        </LabelBase>

        {tipoSobrecargo === 'porcentaje' && (
          <LabelBase label='Porcentaje de Sobrecargo (%)'>
            <InputNumberBase
              placeholder='Ej: 4.8'
              min={0}
              max={100}
              precision={2}
              propsForm={{
                name: 'sobrecargo_porcentaje',
                rules: [{ required: true, message: 'Ingresa el porcentaje' }],
              }}
            />
          </LabelBase>
        )}

        {tipoSobrecargo === 'monto_fijo' && (
          <LabelBase label='Monto Fijo de Sobrecargo (S/.)'>
            <InputNumberBase
              placeholder='Ej: 5.00'
              min={0}
              precision={2}
              prefix='S/. '
              propsForm={{
                name: 'adicional',
                rules: [{ required: true, message: 'Ingresa el monto' }],
              }}
            />
          </LabelBase>
        )}

        <LabelBase label='Mostrar en Ventas' orientation='column'>
          <Form.Item name='mostrar' valuePropName='checked' noStyle>
            <Switch checkedChildren="Visible" unCheckedChildren="Oculto" />
          </Form.Item>
        </LabelBase>

        {necesitaBanco && (
          <div className='flex gap-2 justify-end mt-4'>
            <Button onClick={() => setPaso(1)}>Atrás</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Crear Método de Pago</TitleForm>,
        centered: true,
        okButtonProps: { 
          loading, 
          disabled: loading || paso !== 2,
          style: paso !== 2 ? { display: 'none' } : undefined,
        },
        cancelButtonProps: {
          style: paso !== 2 ? { display: 'none' } : undefined,
        },
        okText: 'Crear Método',
        footer: paso === 2 ? undefined : null,
      }}
      onCancel={handleReset}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmitMetodo,
        layout: 'vertical',
        initialValues: {
          requiere_numero_serie: false,
          tipo_sobrecargo: 'ninguno',
          sobrecargo_porcentaje: 0,
          adicional: 0,
          mostrar: true,
        },
      }}
    >
      {paso === 0 && renderPaso0()}
      {paso === 1 && renderPaso1()}
      {paso === 2 && renderPaso2()}
    </ModalForm>
  )
}
