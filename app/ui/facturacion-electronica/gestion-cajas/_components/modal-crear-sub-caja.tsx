'use client'

import { Form, Checkbox } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import LabelBase from '~/components/form/label-base'
import useCrearSubCaja from '../_hooks/use-crear-sub-caja'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'

interface ModalCrearSubCajaProps {
  open: boolean
  setOpen: (open: boolean) => void
  cajaPrincipalId: number
  onSuccess?: () => void
}

export interface CrearSubCajaFormValues {
  nombre: string
  despliegues_pago_ids: string[]
  tipos_comprobante: string[]
  proposito?: string
  acepta_todos_metodos?: boolean  // Para el checkbox de "Todos los métodos"
}

const tiposComprobanteOptions = [
  { label: 'Factura', value: '01' },
  { label: 'Boleta', value: '03' },
  { label: 'Nota de Venta', value: 'nv' },
]

export default function ModalCrearSubCaja({
  open,
  setOpen,
  cajaPrincipalId,
  onSuccess,
}: ModalCrearSubCajaProps) {
  const [form] = Form.useForm<CrearSubCajaFormValues>()
  const [aceptaTodos, setAceptaTodos] = useState(false)
  const [tiposComprobante, setTiposComprobante] = useState<string[]>([])
  const [metodosSeleccionados, setMetodosSeleccionados] = useState<string[]>([])
  const [nombreBase, setNombreBase] = useState('')

  // Obtener todos los métodos de pago para validar
  const { data: metodosPago } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const result = await despliegueDePagoApi.getAll({ mostrar: true })
      return result.data?.data || []
    },
  })

  // Función para generar el nombre de la sub-caja
  const generarNombreSubCaja = () => {
    if (!nombreBase.trim()) return ''

    if (aceptaTodos) {
      return `${nombreBase} (Todos los métodos)`
    }

    if (metodosSeleccionados.length === 0) return nombreBase

    // Obtener información de los métodos seleccionados
    const metodosInfo = metodosSeleccionados
      .map(id => metodosPago?.find(m => m.id === id))
      .filter(Boolean) as any[]

    if (metodosInfo.length === 0) return nombreBase

    // Generar lista de métodos para mostrar
    const metodosNombres = metodosInfo.map(metodo => {
      const nombreMetodo = metodo?.name || ''
      const banco = metodo?.metodo_de_pago?.name
      return banco ? `${nombreMetodo} (${banco})` : nombreMetodo
    }).join(', ')

    return `${nombreBase} - ${metodosNombres}`
  }

  // Actualizar el nombre automáticamente cuando cambian los métodos
  useEffect(() => {
    const nombreGenerado = generarNombreSubCaja()
    if (nombreGenerado && nombreBase) {
      form.setFieldsValue({ nombre: nombreGenerado })
    }
  }, [metodosSeleccionados, aceptaTodos, nombreBase, metodosPago])

  const { crearSubCaja, loading } = useCrearSubCaja({
    cajaPrincipalId,
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      setAceptaTodos(false)
      setTiposComprobante([])
      setMetodosSeleccionados([])
      setNombreBase('')
      onSuccess?.()
    },
  })

  // Verificar si hay efectivo seleccionado
  const tieneEfectivo = () => {
    if (aceptaTodos) return true // Si acepta todos, incluye efectivo

    if (!metodosPago || metodosSeleccionados.length === 0) return false

    return metodosSeleccionados.some((id) => {
      const metodo = metodosPago.find((m) => m.id === id)
      return metodo?.name?.toLowerCase().includes('efectivo') ||
        metodo?.name?.toLowerCase().includes('cch')
    })
  }

  // Verificar si tiene factura o boleta
  const tieneFacturaOBoleta = () => {
    return tiposComprobante.includes('01') || tiposComprobante.includes('03')
  }

  // Validación personalizada
  useEffect(() => {
    if (tieneEfectivo() && tieneFacturaOBoleta()) {
      form.setFields([
        {
          name: 'despliegues_pago_ids',
          errors: ['No puedes usar efectivo para Facturas o Boletas. Solo la Caja Chica acepta efectivo para estos comprobantes.'],
        },
      ])
    } else {
      form.setFields([
        {
          name: 'despliegues_pago_ids',
          errors: [],
        },
      ])
    }
  }, [metodosSeleccionados, tiposComprobante, aceptaTodos, form, metodosPago])

  const handleAceptaTodosChange = (checked: boolean) => {
    setAceptaTodos(checked)
    if (checked) {
      // Asegurar que siempre sea un array con "*"
      form.setFieldsValue({ despliegues_pago_ids: ['*'] })
      setMetodosSeleccionados(['*'])
    } else {
      form.setFieldsValue({ despliegues_pago_ids: [] })
      setMetodosSeleccionados([])
    }
  }

  const handleMetodosChange = (values: string[]) => {
    setMetodosSeleccionados(values)
  }

  const handleTiposComprobanteChange = (values: string[]) => {
    setTiposComprobante(values)
  }

  return (
    <ModalForm
      modalProps={{
        width: 900,
        title: <TitleForm>Crear Sub-Caja</TitleForm>,
        centered: true,
        okButtonProps: {
          loading,
          disabled: loading || (tieneEfectivo() && tieneFacturaOBoleta())
        },
        okText: 'Crear Sub-Caja',
      }}
      onCancel={() => {
        form.resetFields()
        setAceptaTodos(false)
        setTiposComprobante([])
        setMetodosSeleccionados([])
        setNombreBase('')
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearSubCaja,
        layout: 'vertical',
      }}
    >
      <LabelBase label='Nombre Base de la Sub-Caja' orientation='column'>
        <InputBase
          placeholder='Ej: Caja Chica, Caja Ahorro, Caja Ventas'
          uppercase={false}
          value={nombreBase}
          onChange={(e) => setNombreBase(e.target.value)}
        />
        <p className='text-xs text-slate-500 mt-1'>
          El nombre completo se generará automáticamente según los métodos de pago
        </p>
      </LabelBase>

      <LabelBase label='Nombre Completo (Generado Automáticamente)' className='mt-4' orientation='column'>
        <Form.Item
          name='nombre'
          rules={[
            { required: true, message: 'Ingresa el nombre base primero' },
          ]}
        >
          <InputBase
            placeholder='Se generará automáticamente...'
            uppercase={false}
            disabled
          />
        </Form.Item>

        {metodosSeleccionados.length > 1 && (
          <p className='text-xs text-blue-600 mt-2'>
            ℹ️ Esta sub-caja aceptará {metodosSeleccionados.length} métodos de pago diferentes
          </p>
        )}
      </LabelBase>

      <LabelBase label='Métodos de Pago' className='mt-4' orientation='column'>
        <Checkbox
          checked={aceptaTodos}
          onChange={(e) => handleAceptaTodosChange(e.target.checked)}
          className='mb-2'
        >
          Aceptar TODOS los métodos de pago (incluye efectivo)
        </Checkbox>

        {aceptaTodos ? (
          <>
            {/* Campo oculto que mantiene el valor ["*"] */}
            <Form.Item
              name='despliegues_pago_ids'
              initialValue={['*']}
              hidden
            >
              <input type='hidden' />
            </Form.Item>
            <div className='p-3 bg-blue-50 rounded border border-blue-200'>
              <p className='text-sm text-blue-700'>
                ✓ Esta sub-caja aceptará todos los métodos de pago disponibles
              </p>
            </div>
          </>
        ) : (
          <Form.Item
            name='despliegues_pago_ids'
            rules={[
              { required: true, message: 'Selecciona al menos un método de pago' },
            ]}
            className='w-full'
          >
            <SelectBase
              mode='multiple'
              placeholder='Selecciona uno o varios métodos de pago'
              onChange={handleMetodosChange}
              options={metodosPago?.map((metodo: any) => ({
                value: metodo.id,
                label: `${metodo.name}${metodo.metodo_de_pago?.name ? ` (${metodo.metodo_de_pago.name})` : ''}`,
              })) || []}
              showSearch
              className='w-full'
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
      </LabelBase>

      <LabelBase label='Tipos de Comprobante' className='mt-4'>
        <Form.Item
          name='tipos_comprobante'
          rules={[
            {
              required: true,
              message: 'Selecciona al menos un tipo de comprobante',
            },
          ]}
          noStyle
        >
          <Checkbox.Group
            options={tiposComprobanteOptions}
            className='flex flex-col gap-2'
            onChange={handleTiposComprobanteChange}
          />
        </Form.Item>
      </LabelBase>

      {tieneEfectivo() && tieneFacturaOBoleta() && (
        <div className='mt-2 p-3 bg-red-50 rounded-lg border border-red-200'>
          <p className='text-sm text-red-700'>
            <strong>⚠️ Restricción:</strong> No puedes usar efectivo para Facturas o Boletas.
            Solo la Caja Chica (creada automáticamente) acepta efectivo para estos comprobantes.
            <br />
            <span className='text-xs'>Para Notas de Venta sí puedes usar efectivo.</span>
          </p>
        </div>
      )}

      <LabelBase label='Propósito (Opcional)' className='mt-4' orientation='column'>
        <InputBase
          placeholder='Ej: Ventas con factura pagadas por Yape BCP'
          uppercase={false}
          propsForm={{
            name: 'proposito',
            rules: [{ max: 500, message: 'Máximo 500 caracteres' }],
          }}
        />
      </LabelBase>

      <div className='mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
        <p className='text-sm text-slate-600'>
          <strong>Importante:</strong> No se pueden crear dos sub-cajas con la misma configuración (métodos de pago + tipos de comprobante).
        </p>
        <p className='text-xs text-slate-500 mt-2'>
          <strong>Ejemplos:</strong>
          <br />• Notas de Venta con todos los métodos de pago
          <br />• Facturas solo con Yape BCP
          <br />• Boletas y Facturas con todos los métodos BCP
        </p>
      </div>
    </ModalForm>
  )
}
