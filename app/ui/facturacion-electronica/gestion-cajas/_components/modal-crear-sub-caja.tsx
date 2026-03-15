'use client'

import { Form, Checkbox, Input, Button } from 'antd'
import { FaPlus } from 'react-icons/fa'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import LabelBase from '~/components/form/label-base'
import useCrearSubCaja from '../_hooks/use-crear-sub-caja'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { apiRequest } from '~/lib/api'

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
  acepta_todos_metodos?: boolean
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
  const queryClient = useQueryClient()
  const [aceptaTodos, setAceptaTodos] = useState(false)
  const [metodosSeleccionados, setMetodosSeleccionados] = useState<string[]>([])
  const [nombreBase, setNombreBase] = useState('')
  const [mostrarCrearEfectivo, setMostrarCrearEfectivo] = useState(false)
  const [nombreNuevoEfectivo, setNombreNuevoEfectivo] = useState('')
  const [creandoEfectivo, setCreandoEfectivo] = useState(false)
  const [desplieguesLocales, setDesplieguesLocales] = useState<{ id: string; name: string; label: string }[]>([])

  const { data: metodosPago } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO, cajaPrincipalId],
    queryFn: async () => {
      const result = await despliegueDePagoApi.getAll({
        mostrar: true,
        exclude_used_by_caja_principal_id: cajaPrincipalId
      })
      return result.data?.data || []
    },
    enabled: !!cajaPrincipalId && open,
    staleTime: 0,
  })

  const metodosPagoIds = new Set((metodosPago || []).map((m: { id: string }) => m.id))
  const todosLosMetodos = [
    ...(metodosPago || []).map((m: { id: string; name: string; label?: string }) => ({ id: m.id, name: m.name, label: m.label || m.name })),
    ...desplieguesLocales.filter(dl => !metodosPagoIds.has(dl.id)),
  ]

  const generarNombreSubCaja = () => {
    if (!nombreBase.trim()) return ''
    if (aceptaTodos) return `${nombreBase} (Todos los métodos)`
    if (metodosSeleccionados.length === 0) return nombreBase

    const metodosInfo = metodosSeleccionados
      .map(id => todosLosMetodos.find(m => m.id === id))
      .filter(Boolean) as { id: string; name: string; label: string }[]

    if (metodosInfo.length === 0) return nombreBase
    return `${nombreBase} - ${metodosInfo.map(m => m.name).join(', ')}`
  }

  useEffect(() => {
    if (!nombreBase.trim()) return
    const generado = generarNombreSubCaja()
    if (generado) form.setFieldsValue({ nombre: generado })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodosSeleccionados, aceptaTodos, nombreBase, metodosPago, desplieguesLocales])

  const handleCrearEfectivo = async () => {
    if (!nombreNuevoEfectivo.trim()) return
    setCreandoEfectivo(true)
    try {
      const res = await apiRequest('/despliegues-de-pago', {
        method: 'POST',
        body: JSON.stringify({ name: nombreNuevoEfectivo.trim(), mostrar: true }),
      })
      const nuevo = (res.data as { data?: { id: string; name: string } })?.data
      if (!nuevo?.id) throw new Error('Sin ID')
      const item = { id: nuevo.id, name: nuevo.name, label: nuevo.name }
      setDesplieguesLocales(prev => [...prev, item])
      // Seleccionar el recién creado
      const actuales = form.getFieldValue('despliegues_pago_ids') as string[] || []
      const nuevosIds = [...actuales, nuevo.id]
      form.setFieldsValue({ despliegues_pago_ids: nuevosIds })
      setMetodosSeleccionados(nuevosIds)
      setNombreNuevoEfectivo('')
      setMostrarCrearEfectivo(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO] })
    } catch {
      // silencio — el error ya aparece en el response si hay problema
    } finally {
      setCreandoEfectivo(false)
    }
  }

  const resetModal = () => {
    form.resetFields()
    setAceptaTodos(false)
    setMetodosSeleccionados([])
    setNombreBase('')
    setMostrarCrearEfectivo(false)
    setNombreNuevoEfectivo('')
    setDesplieguesLocales([])
  }

  const { crearSubCaja, loading } = useCrearSubCaja({
    cajaPrincipalId,
    onSuccess: () => {
      setOpen(false)
      resetModal()
      onSuccess?.()
    },
  })

  const handleAceptaTodosChange = (checked: boolean) => {
    setAceptaTodos(checked)
    if (checked) {
      form.setFieldsValue({ despliegues_pago_ids: ['*'] })
      setMetodosSeleccionados(['*'])
    } else {
      form.setFieldsValue({ despliegues_pago_ids: [] })
      setMetodosSeleccionados([])
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 900,
        title: <TitleForm>Crear Sub-Caja</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear Sub-Caja',
      }}
      onCancel={resetModal}
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
        <Form.Item name='nombre' rules={[{ required: true, message: 'Ingresa el nombre base primero' }]}>
          <InputBase placeholder='Se generará automáticamente...' uppercase={false} disabled />
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
          Aceptar TODOS los métodos de pago
        </Checkbox>

        {aceptaTodos ? (
          <>
            <Form.Item name='despliegues_pago_ids' initialValue={['*']} hidden>
              <input type='hidden' />
            </Form.Item>
            <div className='p-3 bg-blue-50 rounded border border-blue-200'>
              <p className='text-sm text-blue-700'>✓ Esta sub-caja aceptará todos los métodos de pago disponibles</p>
            </div>
          </>
        ) : (
          <>
            <Form.Item
              name='despliegues_pago_ids'
              rules={[{ required: true, message: 'Selecciona al menos un método de pago' }]}
              className='w-full'
            >
              <SelectBase
                mode='multiple'
                placeholder='Selecciona uno o varios métodos de pago'
                onChange={(values: string[]) => setMetodosSeleccionados(values)}
                options={todosLosMetodos.map(m => ({ value: m.id, label: m.label }))}
                showSearch
                className='w-full'
                style={{ width: '100%' }}
              />
            </Form.Item>

            {/* Crear nuevo Efectivo */}
            {!mostrarCrearEfectivo ? (
              <button
                type='button'
                onClick={() => setMostrarCrearEfectivo(true)}
                className='mt-1 flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium'
              >
                <FaPlus size={10} /> Crear nuevo método Efectivo
              </button>
            ) : (
              <div className='mt-2 flex items-center gap-2'>
                <Input
                  size='small'
                  placeholder='Nombre del efectivo (Ej: Efectivo Caja 2)'
                  value={nombreNuevoEfectivo}
                  onChange={e => setNombreNuevoEfectivo(e.target.value)}
                  onPressEnter={handleCrearEfectivo}
                  className='flex-1'
                />
                <Button
                  size='small'
                  type='primary'
                  loading={creandoEfectivo}
                  disabled={!nombreNuevoEfectivo.trim()}
                  onClick={handleCrearEfectivo}
                >
                  Crear
                </Button>
                <Button size='small' onClick={() => { setMostrarCrearEfectivo(false); setNombreNuevoEfectivo('') }}>
                  Cancelar
                </Button>
              </div>
            )}
          </>
        )}
      </LabelBase>

      <LabelBase label='Tipos de Comprobante' className='mt-4'>
        <Form.Item
          name='tipos_comprobante'
          rules={[{ required: true, message: 'Selecciona al menos un tipo de comprobante' }]}
          noStyle
        >
          <Checkbox.Group options={tiposComprobanteOptions} className='flex flex-col gap-2' />
        </Form.Item>
      </LabelBase>

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
    </ModalForm>
  )
}
