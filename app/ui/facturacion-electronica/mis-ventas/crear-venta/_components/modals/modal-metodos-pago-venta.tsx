'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaHashtag } from 'react-icons/fa6'
import useCreateVenta from '../../_hooks/use-create-venta'
import InputBase from '~/app/_components/form/inputs/input-base'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface MetodoPago {
  id: string
  despliegue_de_pago_id: string
  despliegue_name: string
  monto: number
  referencia?: string
  recibe_efectivo?: number
}

export default function ModalMetodosPagoVenta({
  open,
  onCancel,
  form: ventaForm,
  totalCobrado,
  tipo_moneda,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  totalCobrado: number
  tipo_moneda: TipoMoneda
}) {
  const [modalForm] = Form.useForm()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [despliegueName, setDespliegueName] = useState<string>('')

  // Hook para crear venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta()

  // Cargar despliegues de pago para obtener el ID de CCH/Efectivo
  const { data: desplieguesPago } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const result = await despliegueDePagoApi.getAll({ mostrar: true })
      return result.data?.data || []
    },
    enabled: open,
  })

  // Watch de campos del formulario
  const monto = Form.useWatch('monto', modalForm)
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Detectar si es efectivo
  const isEfectivo = useMemo(
    () => despliegueName.toUpperCase().includes('EFECTIVO'),
    [despliegueName]
  )

  // Calcular total pagado
  const totalPagado = useMemo(() => {
    return metodosPago.reduce((sum, metodo) => sum + metodo.monto, 0)
  }, [metodosPago])

  // Calcular saldo pendiente
  const saldoPendiente = useMemo(() => {
    return Math.max(0, totalCobrado - totalPagado)
  }, [totalCobrado, totalPagado])

  // Calcular vuelto
  const vuelto = useMemo(() => {
    if (!isEfectivo) return 0
    return Math.max(0, (Number(recibe_efectivo) || 0) - (Number(monto) || 0))
  }, [isEfectivo, recibe_efectivo, monto])

  // Resetear formulario al abrir
  useEffect(() => {
    if (open) {
      modalForm.resetFields()
      setDespliegueName('')
      setMetodosPago([])
      // Setear el monto inicial al saldo pendiente
      modalForm.setFieldValue('monto', totalCobrado)
      
      // Buscar y setear CCH/Efectivo por defecto
      if (desplieguesPago && desplieguesPago.length > 0) {
        const efectivo = desplieguesPago.find(d => 
          d.name.toUpperCase().includes('EFECTIVO') || 
          d.name.toUpperCase().includes('CCH')
        )
        
        if (efectivo) {
          modalForm.setFieldValue('despliegue_de_pago_id', efectivo.id)
          setDespliegueName(efectivo.name)
        }
      }
    }
  }, [open, modalForm, totalCobrado, desplieguesPago])

  // Actualizar monto cuando cambia el saldo pendiente
  useEffect(() => {
    if (open && saldoPendiente > 0) {
      modalForm.setFieldValue('monto', saldoPendiente)
    }
  }, [saldoPendiente, open, modalForm])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields()
      const values = modalForm.getFieldsValue()

      // Validar que el monto no exceda el saldo pendiente
      if (values.monto > saldoPendiente) {
        message.error(`El monto no puede exceder el saldo pendiente`)
        return
      }

      const nuevoMetodo: MetodoPago = {
        id: Date.now().toString(),
        despliegue_de_pago_id: values.despliegue_de_pago_id,
        despliegue_name: despliegueName,
        monto: values.monto,
        referencia: values.referencia || undefined,
        recibe_efectivo: values.recibe_efectivo || undefined,
      }

      setMetodosPago([...metodosPago, nuevoMetodo])
      modalForm.resetFields()
      setDespliegueName('')
      message.success('Método de pago agregado')
    } catch (error: any) {
      console.error('Error al validar formulario:', error)
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0]
        message.error(firstError.errors[0])
      }
    }
  }

  const handleEliminarMetodo = (id: string) => {
    setMetodosPago(metodosPago.filter(m => m.id !== id))
    message.info('Método de pago eliminado')
  }

  const handleGuardar = async () => {
    if (metodosPago.length === 0) {
      message.error('Debes agregar al menos un método de pago')
      return
    }

    if (totalPagado < totalCobrado) {
      message.error('El total pagado debe ser igual al total a cobrar')
      return
    }

    // Preparar métodos de pago para el backend
    const metodos = metodosPago.map(m => ({
      despliegue_de_pago_id: m.despliegue_de_pago_id,
      monto: m.monto,
      referencia: m.referencia || null,
      recibe_efectivo: m.recibe_efectivo || null,
    }))

    // Guardar en el formulario de venta
    ventaForm.setFieldValue('metodos_de_pago', metodos)
    ventaForm.setFieldValue('estado_de_venta', EstadoDeVenta.CREADO)

    // Obtener todos los valores del formulario de venta
    const ventaValues = ventaForm.getFieldsValue()

    // Crear la venta
    await crearVenta(ventaValues)
    
    // Cerrar el modal después de crear la venta
    onCancel()
    modalForm.resetFields()
    setMetodosPago([])
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setDespliegueName('')
    setMetodosPago([])
    onCancel()
  }

  const monedaSymbol = tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'

  return (
    <Modal
      title='Cobrar - Métodos de Pago'
      open={open}
      onCancel={handleCancelar}
      width={1000}
      footer={null}
      centered
      destroyOnClose
    >
      <div className='mt-4'>
        {/* Total a Cobrar y Saldo */}
        <div className='grid grid-cols-3 gap-4 mb-6'>
          <div className='p-4 bg-blue-50 rounded-lg border-2 border-blue-300'>
            <div className='text-sm font-medium text-slate-600'>Total a Cobrar</div>
            <div className='text-2xl font-bold text-blue-600'>
              {monedaSymbol} {totalCobrado.toFixed(2)}
            </div>
          </div>
          <div className='p-4 bg-green-50 rounded-lg border-2 border-green-300'>
            <div className='text-sm font-medium text-slate-600'>Total Pagado</div>
            <div className='text-2xl font-bold text-green-600'>
              {monedaSymbol} {totalPagado.toFixed(2)}
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${saldoPendiente > 0 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
            <div className='text-sm font-medium text-slate-600'>Saldo Pendiente</div>
            <div className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {monedaSymbol} {saldoPendiente.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tabla de métodos agregados */}
        {metodosPago.length > 0 && (
          <div className='mb-6'>
            <div className='text-sm font-semibold text-slate-700 mb-2'>Métodos de Pago Agregados</div>
            <div className='border rounded-lg overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-slate-100'>
                  <tr>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>#</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Tipo de Pago</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Monto</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Referencia</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Recibe</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Vuelto</th>
                    <th className='px-4 py-2 text-center text-sm font-semibold text-slate-700'>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {metodosPago.map((metodo, index) => {
                    const vueltoMetodo = metodo.recibe_efectivo 
                      ? Math.max(0, metodo.recibe_efectivo - metodo.monto)
                      : 0
                    return (
                      <tr key={metodo.id} className='border-t hover:bg-slate-50'>
                        <td className='px-4 py-3 text-sm text-slate-600'>{index + 1}</td>
                        <td className='px-4 py-3 text-sm font-medium text-slate-700'>{metodo.despliegue_name}</td>
                        <td className='px-4 py-3 text-sm font-semibold text-right text-blue-600'>
                          {monedaSymbol} {metodo.monto.toFixed(2)}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600'>{metodo.referencia || '-'}</td>
                        <td className='px-4 py-3 text-sm text-right text-slate-600'>
                          {metodo.recibe_efectivo ? `${monedaSymbol} ${metodo.recibe_efectivo.toFixed(2)}` : '-'}
                        </td>
                        <td className='px-4 py-3 text-sm font-semibold text-right text-green-600'>
                          {vueltoMetodo > 0 ? `${monedaSymbol} ${vueltoMetodo.toFixed(2)}` : '-'}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <button
                            onClick={() => handleEliminarMetodo(metodo.id)}
                            className='text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors'
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulario para agregar método */}
        {saldoPendiente > 0 && (
          <Form form={modalForm} className='border-t pt-4'>
            <div className='text-sm font-semibold text-slate-700 mb-3'>Agregar Método de Pago</div>
            
            <div className='flex items-end gap-3'>
              {/* Tipo de Pago */}
              <div className='flex-1 min-w-[200px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>Tipo de Pago</label>
                <SelectDespliegueDePago
                  classNameIcon='text-rose-700 mx-1'
                  className='w-full'
                  propsForm={{
                    name: 'despliegue_de_pago_id',
                    rules: [{ required: true, message: 'Requerido' }],
                  }}
                  onChange={(value, option: any) => {
                    const name = option?.label || ''
                    setDespliegueName(name)
                    if (!name.toUpperCase().includes('EFECTIVO')) {
                      modalForm.setFieldValue('recibe_efectivo', undefined)
                    } else {
                      modalForm.setFieldValue('referencia', undefined)
                    }
                  }}
                />
              </div>

              {/* Monto */}
              <div className='w-[140px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>Monto</label>
                <InputNumberBase
                  prefix={<span className='text-rose-700 font-bold text-xs'>{monedaSymbol}</span>}
                  placeholder='0.00'
                  min={0}
                  max={saldoPendiente}
                  precision={2}
                  propsForm={{
                    name: 'monto',
                    className: 'w-full',
                    rules: [
                      { required: true, message: 'Requerido' },
                      {
                        validator: (_, value) => {
                          if (value > saldoPendiente) {
                            return Promise.reject(`Máx: ${saldoPendiente.toFixed(2)}`)
                          }
                          return Promise.resolve()
                        },
                      },
                    ],
                  }}
                />
              </div>

              {/* Referencia (solo si NO es efectivo) */}
              {!isEfectivo && (
                <div className='flex-1 min-w-[180px]'>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>Referencia</label>
                  <InputBase
                    prefix={<FaHashtag className='text-cyan-600 mx-1' size={12} />}
                    placeholder='N° Transacción'
                    uppercase={false}
                    propsForm={{
                      name: 'referencia',
                      rules: [{ required: true, message: 'Requerido' }],
                    }}
                  />
                </div>
              )}

              {/* Recibe Efectivo (solo si ES efectivo) */}
              {isEfectivo && (
                <>
                  <div className='w-[140px]'>
                    <label className='block text-xs font-medium text-slate-600 mb-1'>Recibe</label>
                    <InputNumberBase
                      prefix={<span className='text-rose-700 font-bold text-xs'>{monedaSymbol}</span>}
                      placeholder='0.00'
                      min={0}
                      precision={2}
                      propsForm={{
                        name: 'recibe_efectivo',
                        className: 'w-full',
                        rules: [
                          { required: true, message: 'Requerido' },
                          {
                            validator: (_, value) => {
                              if (value < (monto || 0)) {
                                return Promise.reject('Debe ser ≥ monto')
                              }
                              return Promise.resolve()
                            },
                          },
                        ],
                      }}
                    />
                  </div>

                  {/* Vuelto (calculado automáticamente) */}
                  <div className='w-[140px]'>
                    <label className='block text-xs font-medium text-slate-600 mb-1'>Vuelto</label>
                    <div className='h-8 px-3 flex items-center justify-end bg-yellow-50 border border-yellow-300 rounded-lg'>
                      <span className='text-sm font-bold text-green-600'>
                        {monedaSymbol} {vuelto.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Botón Agregar */}
              <div className='w-[140px]'>
                <ButtonBase
                  onClick={handleAgregarMetodo}
                  color='info'
                  className='flex items-center justify-center gap-2 w-full h-8'
                >
                  <FaPlus size={12} />
                  Agregar
                </ButtonBase>
              </div>
            </div>
          </Form>
        )}

        {/* Botones finales */}
        <div className='flex gap-3 justify-end mt-6 pt-4 border-t'>
          <ButtonBase onClick={handleCancelar} color='default' size='lg'>
            Cancelar
          </ButtonBase>
          <ButtonBase
            onClick={handleGuardar}
            color='success'
            size='lg'
            disabled={creandoVenta || metodosPago.length === 0 || saldoPendiente > 0}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            {creandoVenta ? 'Guardando...' : 'Guardar Venta'}
          </ButtonBase>
        </div>
      </div>
    </Modal>
  )
}
