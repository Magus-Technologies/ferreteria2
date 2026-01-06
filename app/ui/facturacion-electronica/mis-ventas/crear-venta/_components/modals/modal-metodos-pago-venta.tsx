'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal, Table, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaHashtag } from 'react-icons/fa6'
import useCreateVenta from '../../_hooks/use-create-venta'
import LabelBase from '~/components/form/label-base'

interface MetodoPago {
  id: string
  despliegue_de_pago_id: number
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

  // Watch del tipo de pago seleccionado
  const monto = Form.useWatch('monto', modalForm)
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Obtener el nombre del despliegue seleccionado para detectar tipo
  const [despliegueName, setDespliegueName] = useState<string>('')

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

  // Calcular cambio del cliente
  const cambioCliente = useMemo(() => {
    if (!isEfectivo) return 0
    const recibe = Number(recibe_efectivo ?? 0)
    const montoActual = Number(monto ?? 0)
    return Math.max(0, recibe - montoActual)
  }, [isEfectivo, recibe_efectivo, monto])

  // Hook para crear venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta()

  // Resetear formulario al abrir
  useEffect(() => {
    if (open) {
      modalForm.resetFields()
      setDespliegueName('')
      setMetodosPago([])
    }
  }, [open, modalForm])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields()
      const values = modalForm.getFieldsValue()

      // Validar que el monto no exceda el saldo pendiente
      if (values.monto > saldoPendiente) {
        message.error(`El monto no puede exceder el saldo pendiente (${tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} ${saldoPendiente.toFixed(2)})`)
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
      
      // Mostrar errores específicos de validación
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0]
        const fieldName = firstError.name[0]
        const errorMessage = firstError.errors[0]
        
        console.log('Campo con error:', fieldName)
        console.log('Mensaje de error:', errorMessage)
        
        message.error(`Error en ${fieldName}: ${errorMessage}`)
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

  const columns = [
    {
      title: 'Método',
      dataIndex: 'despliegue_name',
      key: 'despliegue_name',
      width: '40%',
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      width: '30%',
      render: (monto: number) => (
        <span className='font-semibold'>
          {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {monto.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Ref.',
      dataIndex: 'referencia',
      key: 'referencia',
      width: '20%',
      render: (ref?: string) => ref || '-',
    },
    {
      title: '',
      key: 'acciones',
      width: '10%',
      render: (_: any, record: MetodoPago) => (
        <ButtonBase
          size='sm'
          color='danger'
          onClick={() => handleEliminarMetodo(record.id)}
          className='!px-2'
        >
          <FaTrash size={12} />
        </ButtonBase>
      ),
    },
  ]

  return (
    <Modal
      title='Cobrar - Métodos de Pago'
      open={open}
      onCancel={handleCancelar}
      width={700}
      footer={null}
      centered
    >
      <div className='mt-4'>
        {/* Total a Cobrar y Saldo Pendiente */}
        <div className='grid grid-cols-2 gap-4 mb-6'>
          <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-slate-600'>Total a Cobrar</span>
              <span className='text-2xl font-bold text-blue-600'>
                {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {totalCobrado.toFixed(2)}
              </span>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${saldoPendiente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-slate-600'>Saldo Pendiente</span>
              <span className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {saldoPendiente.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de métodos de pago agregados */}
        {metodosPago.length > 0 && (
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-slate-700 mb-2'>Métodos de Pago Agregados</h3>
            <Table
              dataSource={metodosPago}
              columns={columns}
              pagination={false}
              size='small'
              rowKey='id'
            />
          </div>
        )}

        {/* Formulario para agregar método de pago */}
        {saldoPendiente > 0 && (
          <Form form={modalForm} layout='vertical' className='border-t pt-4'>
            <h3 className='text-sm font-semibold text-slate-700 mb-4'>Agregar Método de Pago</h3>
            
            <div className='grid grid-cols-2 gap-4'>
              {/* Tipo de Pago */}
              <LabelBase label='Tipo de Pago' orientation='column'>
                <SelectDespliegueDePago
                  classNameIcon='text-rose-700 mx-1'
                  className='w-full'
                  propsForm={{
                    name: 'despliegue_de_pago_id',
                    rules: [{ required: true, message: 'Selecciona un tipo de pago' }],
                  }}
                  onChange={(value, option: any) => {
                    const name = option?.label || ''
                    setDespliegueName(name)
                    
                    // Limpiar campos según el tipo
                    if (name.toUpperCase().includes('EFECTIVO')) {
                      // Si es efectivo, limpiar referencia
                      modalForm.setFieldValue('referencia', undefined)
                    } else {
                      // Si NO es efectivo, limpiar recibe_efectivo
                      modalForm.setFieldValue('recibe_efectivo', undefined)
                    }
                    
                    // Revalidar campos
                    modalForm.validateFields(['referencia', 'recibe_efectivo']).catch(() => {})
                  }}
                />
              </LabelBase>

              {/* Monto */}
              <LabelBase label='Monto' orientation='column'>
                <InputNumberBase
                  prefix={
                    <span className='text-rose-700 font-bold'>
                      {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'}
                    </span>
                  }
                  placeholder='Monto a pagar'
                  min={0}
                  max={saldoPendiente}
                  precision={2}
                  propsForm={{
                    name: 'monto',
                    className: 'w-full',
                    rules: [
                      { required: true, message: 'Ingresa el monto' },
                      {
                        validator: (_, value) => {
                          if (value > saldoPendiente) {
                            return Promise.reject(
                              new Error(`No puede exceder ${saldoPendiente.toFixed(2)}`)
                            )
                          }
                          return Promise.resolve()
                        },
                      },
                    ],
                  }}
                />
              </LabelBase>
            </div>

            {/* Referencia Tipo de Pago */}
            <LabelBase label='Referencia' orientation='column'>
              <InputBase
                prefix={<FaHashtag className='text-cyan-600 mx-1' />}
                placeholder='Número de transacción'
                disabled={isEfectivo}
                uppercase={false}
                propsForm={{
                  name: 'referencia',
                  rules: [
                    {
                      required: !isEfectivo && despliegueName !== '',
                      message: 'Ingresa el número de transacción',
                    },
                  ],
                }}
              />
            </LabelBase>

            {/* Recibe Efectivo */}
            {isEfectivo && (
              <>
                <LabelBase label='Recibe Efectivo' orientation='column'>
                  <InputNumberBase
                    prefix={
                      <span className='text-rose-700 font-bold'>
                        {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'}
                      </span>
                    }
                    placeholder='Monto recibido'
                    min={0}
                    precision={2}
                    propsForm={{
                      name: 'recibe_efectivo',
                      className: 'w-full',
                      rules: [
                        {
                          required: true,
                          message: 'Ingresa el monto recibido',
                        },
                        {
                          validator: (_, value) => {
                            const montoActual = modalForm.getFieldValue('monto') || 0
                            if (value < montoActual) {
                              return Promise.reject(
                                new Error('El monto debe ser mayor o igual al monto a pagar')
                              )
                            }
                            return Promise.resolve()
                          },
                        },
                      ],
                    }}
                  />
                </LabelBase>

                {/* Cambio del Cliente */}
                {recibe_efectivo && monto && (
                  <div className='mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium text-slate-700'>
                        Cambio del Cliente
                      </span>
                      <span className='text-xl font-bold text-blue-600'>
                        {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {cambioCliente.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Botón Agregar */}
            <ButtonBase
              onClick={handleAgregarMetodo}
              color='info'
              className='flex items-center gap-2 w-full'
            >
              <FaPlus size={14} />
              Agregar Método de Pago
            </ButtonBase>
          </Form>
        )}

        {/* Botones finales */}
        <div className='flex gap-3 justify-end mt-6 pt-4 border-t'>
          <ButtonBase onClick={handleCancelar} color='default'>
            Cancelar
          </ButtonBase>
          <ButtonBase
            onClick={handleGuardar}
            color='success'
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
