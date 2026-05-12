'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
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
  const [despliegueName, setDespliegueName] = useState<string>('')
  const [sobrecargo, setSobrecargo] = useState<{ tipo: string; valor: number; monto: number }>({ tipo: 'ninguno', valor: 0, monto: 0 })

  // Notificar al componente padre cuando cambia el surcharge total
  useEffect(() => {
    const totalSurcharge = metodosPago.reduce((sum, m) => sum + (m.sobrecargo?.monto || 0), 0)
    onSurchargeChange(totalSurcharge)
  }, [metodosPago, onSurchargeChange])

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
  const monto = Form.useWatch('monto', modalForm)
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Detectar si es efectivo
  const isEfectivo = useMemo(
    () => despliegueName.toUpperCase().includes('EFECTIVO'),
    [despliegueName]
  )

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
  // El vuelto es: lo que recibe - monto (incluyendo sobrecargo)
  const vueltoTotal = useMemo(() => {
    return metodosPago.reduce((sum, metodo) => {
      if (metodo.recibe_efectivo) {
        // El monto total que debería recibir es monto + sobrecargo
        const montoTotalConSobrecargo = metodo.monto + (metodo.sobrecargo?.monto || 0)
        // El vuelto es la diferencia entre lo recibido y lo que realmente se cobra
        const vueltoMetodo = Math.max(0, metodo.recibe_efectivo - montoTotalConSobrecargo)
        return sum + vueltoMetodo
      }
      return sum
    }, 0)
  }, [metodosPago])

  // Calcular vuelto del formulario actual (antes de agregar)
  const vuelto = useMemo(() => {
    if (!isEfectivo) return 0
    return Math.max(0, (Number(recibe_efectivo) || 0) - saldoPendiente)
  }, [isEfectivo, recibe_efectivo, saldoPendiente])

  // Filtrar despliegues por tipo de documento (igual que hace el Select)
  const desplieguesFiltradosPorTipo = useMemo(() => {
    if (!desplieguesPago) return []
    if (!tipo_documento) return desplieguesPago
    return desplieguesPago.filter((d: any) =>
      d.tipos_comprobante?.includes(tipo_documento)
    )
  }, [desplieguesPago, tipo_documento])

  // Resetear formulario y setear Efectivo por defecto al abrir
  useEffect(() => {
    if (open) {
      modalForm.resetFields()
      setDespliegueName('')
      setMetodosPago([])
      setSobrecargo({ tipo: 'ninguno', valor: 0, monto: 0 })
      modalForm.setFieldValue('monto', roundMoney(totalCobrado))
      // Pre-llenar "Monto Recibe" con el total a cobrar (= saldo pendiente al
      // momento de abrir). El usuario puede editarlo.
      modalForm.setFieldValue('recibe_efectivo', roundMoney(totalCobrado))

      // Si ya tenemos los datos, setear Efectivo del tipo de documento correcto
      if (desplieguesFiltradosPorTipo.length > 0) {
        const efectivo = desplieguesFiltradosPorTipo.find((d: any) =>
          d.tipo === 'efectivo' ||
          d.label?.toUpperCase().includes('EFECTIVO') ||
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          modalForm.setFieldValue('despliegue_de_pago_id', efectivo.value)
          setDespliegueName(efectivo.label)
        }
      }
    }
  }, [open, modalForm, totalCobrado, desplieguesFiltradosPorTipo])

  // Si los datos llegan después de abrir el modal, setear Efectivo
  useEffect(() => {
    if (open && isFetched && desplieguesFiltradosPorTipo.length > 0) {
      const currentValue = modalForm.getFieldValue('despliegue_de_pago_id')
      if (!currentValue) {
        const efectivo = desplieguesFiltradosPorTipo.find((d: any) =>
          d.tipo === 'efectivo' ||
          d.label?.toUpperCase().includes('EFECTIVO') ||
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          modalForm.setFieldValue('despliegue_de_pago_id', efectivo.value)
          setDespliegueName(efectivo.label)
        }
      }
    }
  }, [open, isFetched, desplieguesFiltradosPorTipo, modalForm])

  // Actualizar "Monto Recibe" cuando cambia el saldo pendiente — se dispara
  // al agregar un pago parcial (el form acaba de resetearse, así que el
  // recibe_efectivo está vacío y aquí lo re-llenamos con el nuevo saldo).
  // Sólo pre-llenamos si está vacío para no pisar lo que el usuario tipeó.
  useEffect(() => {
    if (!open || saldoPendiente <= 0) return
    modalForm.setFieldValue('monto', roundMoney(saldoPendiente))
    const current = modalForm.getFieldValue('recibe_efectivo')
    if (current === undefined || current === null || Number(current) === 0) {
      const valor = isEfectivo
        ? saldoPendiente
        : saldoPendiente + sobrecargo.monto
      modalForm.setFieldValue('recibe_efectivo', roundMoney(valor))
    }
  }, [saldoPendiente, open, modalForm, isEfectivo, sobrecargo.monto])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields()
      const values = modalForm.getFieldsValue()

      // El monto siempre viene de recibe_efectivo
      // Para efectivo: puede ser mayor que el saldo (hay vuelto)
      // Para otros métodos: debe ser exactamente lo que pagas (máximo el saldo)
      const montoRecibido = roundMoney(Number(values.recibe_efectivo) || 0)
      
      // El monto registrado es el menor entre lo que recibe y el saldo pendiente
      const montoFinal = roundMoney(Math.min(montoRecibido, saldoPendiente))

      // Validar que el monto sea mayor a 0
      if (montoFinal <= 0) {
        message.error(`El monto debe ser mayor a 0`)
        return
      }

      const nuevoMetodo: MetodoPago = {
        id: Date.now().toString(),
        despliegue_de_pago_id: values.despliegue_de_pago_id,
        despliegue_name: despliegueName,
        monto: montoFinal,
        referencia: values.referencia || undefined,
        recibe_efectivo: values.recibe_efectivo || undefined,
        sobrecargo: sobrecargo.monto > 0 ? sobrecargo : undefined,
      }

      setMetodosPago((prev) => [...prev, nuevoMetodo])
      modalForm.resetFields()
      setDespliegueName('')
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

    // Preparar métodos de pago para el backend
    const metodos = metodosPago.map(m => ({
      despliegue_de_pago_id: m.despliegue_de_pago_id,
      monto: m.monto,
      numero_operacion: m.referencia || undefined,
      sobrecargo: m.sobrecargo?.monto > 0 ? m.sobrecargo : undefined,
    }))

    // Guardar en el formulario de venta
    ventaForm.setFieldValue('metodos_de_pago', metodos)
    ventaForm.setFieldValue('estado_de_venta', EstadoDeVenta.CREADO)

    // Cerrar el modal y llamar a onContinuar para intentar finalizar la venta
    onCancel()
    modalForm.resetFields()
    setMetodosPago([])
    
    // Llamar a onContinuar si existe (que intentará finalizar la venta)
    onContinuar?.()
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setDespliegueName('')
    setMetodosPago([])
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
                    // El monto total cobrado incluye sobrecargo
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
                <SelectDespliegueDePago
                  classNameIcon='text-rose-700 mx-1'
                  className='w-full'
                  tipoComprobante={tipo_documento}
                  propsForm={{
                    name: 'despliegue_de_pago_id',
                    rules: [{ required: true, message: 'Requerido' }],
                  }}
                  onChange={(value, option: any) => {
                    const name = option?.label || ''
                    setDespliegueName(name)

                    // Calcular sobrecargo del método seleccionado basado en el monto BASE
                    const despliegueData = desplieguesPago?.find((d: any) => d.value === value)
                    let nuevoSobrecargo = { tipo: 'ninguno', valor: 0, monto: 0 }
                    if (despliegueData?.tipo_sobrecargo === 'porcentaje' && Number(despliegueData.sobrecargo_porcentaje) > 0) {
                      // El surcharge se calcula sobre el monto base y se suma al total
                      const monto = baseAmount * Number(despliegueData.sobrecargo_porcentaje) / 100
                      nuevoSobrecargo = { tipo: 'porcentaje', valor: Number(despliegueData.sobrecargo_porcentaje), monto }
                    } else if (despliegueData?.tipo_sobrecargo === 'monto_fijo' && Number(despliegueData.adicional) > 0) {
                      nuevoSobrecargo = { tipo: 'monto_fijo', valor: Number(despliegueData.adicional), monto: Number(despliegueData.adicional) }
                    }
                    setSobrecargo(nuevoSobrecargo)

                    // Pre-llenar "Monto Recibe" con el saldo pendiente (sin sumar surcharge,
                    // ya que el surcharge se muestra aparte y se suma al total general)
                    modalForm.setFieldValue('recibe_efectivo', roundMoney(saldoPendiente))
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
          
          {/* Vuelto Total - Siempre visible */}
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
