'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal, Select, message } from 'antd'
import { useEffect, useMemo, useState, useRef } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaHashtag } from 'react-icons/fa6'
import InputBase from '~/app/_components/form/inputs/input-base'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'

interface MetodoPago {
  id: string
  despliegue_de_pago_id: string
  despliegue_name: string
  monto: number
  referencia?: string
  recibe_efectivo?: number
  sobrecargo?: {
    tipo: string
    valor: number
    monto: number
  }
}

function roundMoney(value: number) {
  return Number(value.toFixed(2))
}

export default function ModalMetodosPagoVenta({
  open,
  onCancel,
  form: ventaForm,
  totalCobrado,
  tipo_moneda,
  tipo_documento,
  baseAmount,
  onSurchargeChange,
  onContinuar,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  totalCobrado: number
  tipo_moneda: TipoMoneda
  tipo_documento?: string
  baseAmount: number
  onSurchargeChange: (surcharge: number) => void
  onContinuar?: () => void
}) {
  const [modalForm] = Form.useForm()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<any>(null)
  const [selectedDespliegueValue, setSelectedDespliegueValue] = useState<string | null>(null)
  const [sobrecargo, setSobrecargo] = useState<{ tipo: string; valor: number; monto: number }>({ tipo: 'ninguno', valor: 0, monto: 0 })
  const wasOpenRef = useRef(false)

  // Notificar al componente padre cuando cambia el surcharge o metodosPago
  useEffect(() => {
    const totalSurcharge = metodosPago.reduce((sum, m) => sum + (m.sobrecargo?.monto || 0), 0) + sobrecargo.monto
    onSurchargeChange(totalSurcharge)
  }, [sobrecargo, metodosPago, onSurchargeChange])

  // Cargar depliegues de pago para obtener el ID de CCH/Efectivo
  const { data: desplieguesPago, isFetched } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Watch de campos del formulario
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Calcular total pagado (incluye sobrecargo)
  const totalPagado = useMemo(() => {
    return roundMoney(metodosPago.reduce((sum, metodo) => {
      return sum + metodo.monto + (metodo.sobrecargo?.monto || 0)
    }, 0))
  }, [metodosPago])

  // Calcular saldo pendiente
  const saldoPendiente = useMemo(() => {
    return roundMoney(Math.max(0, totalCobrado - totalPagado))
  }, [totalCobrado, totalPagado])

  // Calcular vuelto total de todos los métodos agregados
  const vueltoTotal = useMemo(() => {
    return metodosPago.reduce((sum, metodo) => {
      if (metodo.recibe_efectivo) {
        const montoTotalConSobrecargo = metodo.monto + (metodo.sobrecargo?.monto || 0)
        const vueltoMetodo = Math.max(0, metodo.recibe_efectivo - montoTotalConSobrecargo)
        return sum + vueltoMetodo
      }
      return sum
    }, 0)
  }, [metodosPago])

  // Filtrar despliegues por tipo de documento (igual que hace el Select)
  const desplieguesFiltradosPorTipo = useMemo(() => {
    if (!desplieguesPago) return []
    if (!tipo_documento) return desplieguesPago
    return desplieguesPago.filter((d: any) =>
      d.tipos_comprobante?.includes(tipo_documento)
    )
  }, [desplieguesPago, tipo_documento])

  const despliegueName = metodoPagoSeleccionado?.label || ''

  const isEfectivo = useMemo(() => {
    if (!metodoPagoSeleccionado) return false
    const tipo = metodoPagoSeleccionado.tipo?.toUpperCase?.() || ''
    const label = metodoPagoSeleccionado.label?.toUpperCase?.() || ''
    const metodo = metodoPagoSeleccionado.metodo?.toUpperCase?.() || ''
    return (
      tipo === 'EFECTIVO' ||
      label.includes('EFECTIVO') ||
      label.includes('CCH') ||
      metodo.includes('EFECTIVO')
    )
  }, [metodoPagoSeleccionado])

  // Calcular vuelto del formulario actual (antes de agregar)
  const vuelto = useMemo(() => {
    if (!isEfectivo) return 0
    return Math.max(0, (Number(recibe_efectivo) || 0) - saldoPendiente)
  }, [isEfectivo, recibe_efectivo, saldoPendiente])

  // Resetear formulario SOLO al abrir el modal (transición false → true).
  // No incluir totalCobrado como disparador: cuando el usuario selecciona un
  // método con sobrecargo, el padre recalcula totalCobrado y este efecto se
  // dispararía reseteando la selección de vuelta a efectivo.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      modalForm.resetFields()
      setMetodosPago([])
      setMetodoPagoSeleccionado(null)
      setSelectedDespliegueValue(null)
      setSobrecargo({ tipo: 'ninguno', valor: 0, monto: 0 })
      modalForm.setFieldValue('monto', roundMoney(totalCobrado))
      modalForm.setFieldValue('recibe_efectivo', roundMoney(totalCobrado))
    }
    wasOpenRef.current = open
  }, [open, modalForm, totalCobrado])

  // Cuando ya tenemos los datos de la API, setear Efectivo por defecto SOLO si no hay selección
  useEffect(() => {
    if (open && isFetched && desplieguesFiltradosPorTipo.length > 0) {
      const currentValue = selectedDespliegueValue
      if (!currentValue) {
        const efectivo = desplieguesFiltradosPorTipo.find((d: any) =>
          d.tipo === 'efectivo' ||
          d.label?.toUpperCase().includes('EFECTIVO') ||
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          setSelectedDespliegueValue(String(efectivo.value))
          setMetodoPagoSeleccionado(efectivo)
        }
      }
    }
  }, [open, isFetched, desplieguesFiltradosPorTipo, selectedDespliegueValue])

  // Actualizar "Monto Recibe" cuando cambia el saldo pendiente
  useEffect(() => {
    if (!open || saldoPendiente <= 0) return
    modalForm.setFieldValue('monto', roundMoney(saldoPendiente))
    const current = modalForm.getFieldValue('recibe_efectivo')
    if (current === undefined || current === null || Number(current) === 0) {
      modalForm.setFieldValue('recibe_efectivo', roundMoney(saldoPendiente))
    }
  }, [saldoPendiente, open, modalForm])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields(['referencia', 'recibe_efectivo'])
      const values = modalForm.getFieldsValue()

      if (!selectedDespliegueValue || !metodoPagoSeleccionado) {
        message.error('Selecciona un método de pago')
        return
      }

      const montoRecibido = roundMoney(Number(values.recibe_efectivo) || 0)
      const montoFinal = roundMoney(Math.min(montoRecibido, saldoPendiente))

      if (montoFinal <= 0) {
        message.error('El monto debe ser mayor a 0')
        return
      }

      const nuevoMetodo: MetodoPago = {
        id: Date.now().toString(),
        despliegue_de_pago_id: selectedDespliegueValue,
        despliegue_name: despliegueName,
        monto: montoFinal,
        referencia: values.referencia || undefined,
        recibe_efectivo: values.recibe_efectivo || undefined,
        sobrecargo: sobrecargo.monto > 0 ? sobrecargo : undefined,
      }

      setMetodosPago((prev) => [...prev, nuevoMetodo])
      modalForm.resetFields()
      setMetodoPagoSeleccionado(null)
      setSelectedDespliegueValue(null)
      setSobrecargo({ tipo: 'ninguno', valor: 0, monto: 0 })
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

    if (roundMoney(totalPagado) < roundMoney(totalCobrado)) {
      message.error('El total pagado debe ser igual al total a cobrar')
      return
    }

    const metodos = metodosPago.map(m => ({
      despliegue_de_pago_id: m.despliegue_de_pago_id,
      monto: m.monto,
      numero_operacion: m.referencia || undefined,
      sobrecargo: m.sobrecargo && m.sobrecargo.monto > 0 ? m.sobrecargo : undefined,
    }))

    ventaForm.setFieldValue('metodos_de_pago', metodos)
    ventaForm.setFieldValue('estado_de_venta', EstadoDeVenta.CREADO)

    onCancel()
    modalForm.resetFields()
    setMetodosPago([])
    
    onContinuar?.()
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setMetodosPago([])
    setMetodoPagoSeleccionado(null)
    setSelectedDespliegueValue(null)
    setSobrecargo({ tipo: 'ninguno', valor: 0, monto: 0 })
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
      destroyOnHidden
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
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Subtotal</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Referencia</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Sobrecargo</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Total Cobrado</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Recibe</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Vuelto</th>
                    <th className='px-4 py-2 text-center text-sm font-semibold text-slate-700'>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {metodosPago.map((metodo, index) => {
                    const montoTotalCobrado = metodo.monto + (metodo.sobrecargo?.monto || 0)
                    const vueltoMetodo = metodo.recibe_efectivo 
                      ? Math.max(0, metodo.recibe_efectivo - montoTotalCobrado)
                      : 0
                    return (
                      <tr key={metodo.id} className='border-t hover:bg-slate-50'>
                        <td className='px-4 py-3 text-sm text-slate-600'>{index + 1}</td>
                        <td className='px-4 py-3 text-sm font-medium text-slate-700'>{metodo.despliegue_name}</td>
                        <td className='px-4 py-3 text-sm text-right text-blue-600'>
                          {monedaSymbol} {metodo.monto.toFixed(2)}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600'>{metodo.referencia || '-'}</td>
                        <td className='px-4 py-3 text-sm text-right'>
                          {metodo.sobrecargo && metodo.sobrecargo.monto > 0 ? (
                            <span className='px-2 py-1 bg-orange-50 border border-orange-300 rounded text-orange-700 font-semibold text-xs whitespace-nowrap'>
                              {metodo.sobrecargo.tipo === 'porcentaje'
                                ? `+${metodo.sobrecargo.valor}% = ${monedaSymbol} ${metodo.sobrecargo.monto.toFixed(2)}`
                                : `+${monedaSymbol} ${metodo.sobrecargo.monto.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className='text-slate-400'>-</span>
                          )}
                        </td>
                        <td className='px-4 py-3 text-sm font-bold text-right text-green-700'>
                          {monedaSymbol} {montoTotalCobrado.toFixed(2)}
                        </td>
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
                <Select
                  className='w-full'
                  value={selectedDespliegueValue ?? undefined}
                  placeholder='Método de Pago'
                  showSearch
                  optionFilterProp='label'
                  options={desplieguesFiltradosPorTipo.map((item: any) => ({
                    value: String(item.value),
                    label: item.label,
                  }))}
                  filterOption={(input, option) =>
                    String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const valueAsString = String(value)
                    setSelectedDespliegueValue(valueAsString)

                    const despliegueData = desplieguesFiltradosPorTipo.find((d: any) => String(d.value) === valueAsString)
                    setMetodoPagoSeleccionado(despliegueData || null)

                    let nuevoSobrecargo = { tipo: 'ninguno', valor: 0, monto: 0 }
                    if (despliegueData?.tipo_sobrecargo === 'porcentaje' && Number(despliegueData.sobrecargo_porcentaje) > 0) {
                      const monto = baseAmount * Number(despliegueData.sobrecargo_porcentaje) / 100
                      nuevoSobrecargo = { tipo: 'porcentaje', valor: Number(despliegueData.sobrecargo_porcentaje), monto }
                    } else if (despliegueData?.tipo_sobrecargo === 'monto_fijo' && Number(despliegueData.adicional) > 0) {
                      nuevoSobrecargo = { tipo: 'monto_fijo', valor: Number(despliegueData.adicional), monto: Number(despliegueData.adicional) }
                    }
                    setSobrecargo(nuevoSobrecargo)

                    if (despliegueData && (
                      despliegueData.tipo?.toUpperCase?.() === 'EFECTIVO' ||
                      despliegueData.label?.toUpperCase?.().includes('EFECTIVO') ||
                      despliegueData.label?.toUpperCase?.().includes('CCH')
                    )) {
                      modalForm.setFieldValue('referencia', undefined)
                    }

                    modalForm.setFieldValue('recibe_efectivo', roundMoney(saldoPendiente))
                  }}
                />
                {!selectedDespliegueValue && (
                  <div className='mt-1 text-xs text-red-500'>Requerido</div>
                )}
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

              {/* Monto Recibe (para TODOS los métodos) */}
              <div className='w-[180px]'>
                <div className='flex items-center gap-2 mb-1'>
                  <label className='block text-xs font-medium text-slate-600'>Monto Recibe</label>
                  {sobrecargo.monto > 0 && (
                    <span className='px-1.5 py-0.5 bg-orange-50 border border-orange-300 rounded text-xs text-orange-700 font-semibold whitespace-nowrap'>
                      {sobrecargo.tipo === 'porcentaje'
                        ? `+${sobrecargo.valor}% = ${monedaSymbol} ${sobrecargo.monto.toFixed(2)}`
                        : `+${monedaSymbol} ${sobrecargo.monto.toFixed(2)}`}
                    </span>
                  )}
                </div>
                <InputNumberBase
                  prefix={<span className='text-rose-700 font-bold text-xs'>{monedaSymbol}</span>}
                  placeholder='0.00'
                  min={0}
                  max={!isEfectivo ? roundMoney(saldoPendiente + sobrecargo.monto) : undefined}
                  precision={2}
                  propsForm={{
                    name: 'recibe_efectivo',
                    className: 'w-full',
                    rules: [
                      { required: true, message: 'Requerido' },
                      {
                        validator: (_, value) => {
                          if (!value || value <= 0) {
                            return Promise.reject('Debe ser > 0')
                          }
                          const maxPermitido = saldoPendiente + sobrecargo.monto
                          if (!isEfectivo && value > maxPermitido) {
                            return Promise.reject(`Máx: ${maxPermitido.toFixed(2)}`)
                          }
                          return Promise.resolve()
                        },
                      },
                    ],
                  }}
                />
              </div>

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
        <div className='flex gap-3 justify-between items-center mt-6 pt-4 border-t'>
          <ButtonBase onClick={handleCancelar} color='default' size='lg'>
            Cancelar
          </ButtonBase>
          
          <div className='flex items-center gap-2 px-4 py-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg'>
            <span className='text-sm font-medium text-slate-700'>Vuelto Total:</span>
            <span className='text-xl font-bold text-green-600'>
              {monedaSymbol} {vueltoTotal.toFixed(2)}
            </span>
          </div>
          
          <ButtonBase
            onClick={handleGuardar}
            color='success'
            size='lg'
            disabled={metodosPago.length === 0 || saldoPendiente > 0}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            Continuar
          </ButtonBase>
        </div>
      </div>
    </Modal>
  )
}
