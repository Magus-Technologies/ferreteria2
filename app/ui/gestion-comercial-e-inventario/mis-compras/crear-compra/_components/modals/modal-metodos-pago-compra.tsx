'use client'

import { Form, FormInstance, Modal, DatePicker } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import { FaHashtag } from 'react-icons/fa6'
import { GiPayMoney } from 'react-icons/gi'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'
import { TipoMoneda } from '~/types'
import type { GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'
import ModalSeleccionarEgreso from './modal-seleccionar-egreso'
import { compraApi, type Compra } from '~/lib/api/compra'


interface MetodoPago {
  id: string
  despliegue_de_pago_id: string
  despliegue_name: string
  monto: number
  referencia?: string
  recibe_efectivo?: number
  fecha_pago_referencial?: string
}

export default function ModalMetodosPagoCompra({
  open,
  onCancel,
  form: compraForm,
  compra,
  totalAPagar,
  montoEgresoAsociado,
  gastoExtraInfo,
  tipo_moneda,
  excluirCompraId,
  onContinuar,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  /** Compra ya existente (editar): precarga sus pagos ya registrados en la
   * lista, para poder anular (quitarlos) o agregar otros antes de confirmar. */
  compra?: Compra
  totalAPagar: number
  montoEgresoAsociado: number
  gastoExtraInfo?: GastoExtraDisponible
  tipo_moneda: TipoMoneda
  excluirCompraId?: string
  onContinuar?: () => void
}) {
  const { message } = useApp()
  const [modalForm] = Form.useForm()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [despliegueName, setDespliegueName] = useState<string>('')
  const [egresosSeleccionados, setEgresosSeleccionados] = useState<GastoExtraDisponible[]>([])
  const [modalEgresoOpen, setModalEgresoOpen] = useState(false)

  const monedaSymbol = 'S/.'

  const montoTotalEgresos = useMemo(
    () => egresosSeleccionados.reduce((sum, g) => sum + Number(g.monto), 0) + montoEgresoAsociado,
    [egresosSeleccionados, montoEgresoAsociado]
  )

  // Saldo a cubrir con métodos de pago (descontando los egresos)
  const saldoConEgreso = useMemo(
    () => Math.max(0, totalAPagar - montoTotalEgresos),
    [totalAPagar, montoTotalEgresos]
  )

  const { data: desplieguesPago } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // A propósito NO se filtran los métodos por el tipo de documento de la compra.
  // `tipos_comprobante` de las sub-cajas dice qué comprobantes RECIBE cada caja
  // al vender; en una compra el dinero SALE y el comprobante es del proveedor.
  // El backend lo trata así: resuelve la sub-caja solo por el método de pago, sin
  // mirar el comprobante. Filtrar acá bloqueaba pagos legítimos — una nota de
  // venta del proveedor pagada en efectivo desde Caja Chica dejaba el select sin
  // opciones válidas y mostrando el ID crudo del método.

  const isEfectivo = useMemo(
    () => despliegueName.toUpperCase().includes('EFECTIVO'),
    [despliegueName]
  )

  const totalPagado = useMemo(
    () => metodosPago.reduce((sum, m) => sum + m.monto, 0),
    [metodosPago]
  )

  // Redondeado a centavos: sin esto, restar montos con decimales (ej.
  // 64151.60 - 64151.60) puede dejar un residuo de punto flotante ínfimo
  // (0.0000000002) que la tarjeta muestra como "S/. 0.00" (por el toFixed)
  // pero que sigue siendo > 0 para la comparación — dejando visible "Agregar
  // Método de Pago" aunque ya esté pagado por completo.
  const saldoPendiente = useMemo(
    () => Math.max(0, Math.round((saldoConEgreso - totalPagado) * 100) / 100),
    [saldoConEgreso, totalPagado]
  )

  const vueltoTotal = useMemo(
    () => metodosPago.reduce((sum, m) => {
      if (m.recibe_efectivo) return sum + Math.max(0, m.recibe_efectivo - m.monto)
      return sum
    }, 0),
    [metodosPago]
  )

  useEffect(() => {
    if (open) {
      modalForm.resetFields()
      setDespliegueName('')
      setMetodosPago([])
      setEgresosSeleccionados([])
    }
  }, [open, modalForm])

  // Editar compra ya existente: precargar sus pagos ya registrados en la
  // misma lista de "Métodos de Pago Agregados" — así el usuario puede
  // anularlos (botón quitar) o agregar otros antes de "Confirmar Pago",
  // que reenvía la lista completa (el backend anula los pagos previos y
  // recrea exactamente lo que se envíe).
  useEffect(() => {
    if (!open || !compra?.id) return
    compraApi.getPagos(compra.id).then(res => {
      const pagosActivos = (res.data?.data || []).filter(p => p.estado)
      if (pagosActivos.length === 0) return
      setMetodosPago(pagosActivos.map(p => ({
        id: p.id,
        despliegue_de_pago_id: p.despliegue_de_pago_id,
        despliegue_name: p.despliegue_de_pago?.metodo_de_pago?.name || 'Método de pago',
        monto: Number(p.monto),
        referencia: p.numero_operacion || undefined,
        fecha_pago_referencial: p.fecha_pago_referencial || undefined,
      })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, compra?.id])

  useEffect(() => {
    if (open && desplieguesPago && desplieguesPago.length > 0) {
      const efectivo = desplieguesPago.find((d: any) =>
        d.label?.toUpperCase().includes('EFECTIVO') || d.label?.toUpperCase().includes('CCH')
      )
      if (efectivo) {
        setTimeout(() => {
          modalForm.setFieldValue('despliegue_de_pago_id', efectivo.value)
          setDespliegueName(efectivo.label)
        }, 100)
      }
    }
  }, [open, desplieguesPago, modalForm])

  // Precarga "Monto Recibe" con el saldo pendiente — las tarjetas de arriba ya
  // muestran ese monto, así que no debería haber que volver a escribirlo cada
  // vez (el usuario igual puede cambiarlo si va a recibir más, ej. para
  // calcular vuelto en efectivo). Antes esto seteaba un campo 'monto' que no
  // existe en el form (el campo real se llama 'recibe_efectivo'), así que
  // nunca precargaba nada.
  useEffect(() => {
    if (open && saldoPendiente > 0) {
      modalForm.setFieldValue('recibe_efectivo', saldoPendiente)
    }
  }, [saldoPendiente, open, modalForm])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields()
      const values = modalForm.getFieldsValue()
      const montoRecibido = values.recibe_efectivo || 0
      const montoFinal = Math.min(montoRecibido, saldoPendiente)

      if (montoFinal <= 0) {
        message.error('El monto debe ser mayor a 0')
        return
      }

      setMetodosPago([...metodosPago, {
        id: Date.now().toString(),
        despliegue_de_pago_id: values.despliegue_de_pago_id.includes('-') 
          ? values.despliegue_de_pago_id.split('-')[1] // Extraer solo el ID después del guión
          : values.despliegue_de_pago_id, // Si no tiene guión, usar el valor completo
        despliegue_name: despliegueName,
        monto: montoFinal,
        referencia: values.referencia || undefined,
        recibe_efectivo: values.recibe_efectivo || undefined,
        fecha_pago_referencial: values.fecha_pago_referencial
          ? values.fecha_pago_referencial.format('YYYY-MM-DD')
          : undefined,
      }])
      modalForm.resetFields()
      setDespliegueName('')
      message.success('Método de pago agregado')
    } catch (error: any) {
      if (error.errorFields?.length > 0) {
        message.error(error.errorFields[0].errors[0])
      }
    }
  }

  const handleEliminarMetodo = (id: string) => {
    setMetodosPago(metodosPago.filter(m => m.id !== id))
    message.info('Método de pago eliminado')
  }

  const handleGuardar = () => {
    // Validar que haya al menos un método de pago o egreso
    const tieneEgresos = montoTotalEgresos > 0
    const tieneMetodosPago = metodosPago.length > 0
    
    console.log('🔍 Validando pago:', {
      tieneEgresos,
      tieneMetodosPago,
      montoTotalEgresos,
      metodosPagoCount: metodosPago.length,
      saldoPendiente,
      egresosSeleccionados: egresosSeleccionados.length,
      gastoExtraInfo: gastoExtraInfo?.id
    })
    
    if (!tieneEgresos && !tieneMetodosPago) {
      message.error('Debes agregar al menos un método de pago o un egreso asociado')
      return
    }
    
    if (saldoPendiente > 0) {
      message.error('El total pagado debe cubrir el saldo pendiente')
      return
    }

    // Guardar egresos: primero los del modal, si no hay, mantener el del form principal
    if (egresosSeleccionados.length > 0) {
      console.log('💰 Guardando gasto_extra_id del modal:', egresosSeleccionados[0].id)
      compraForm.setFieldValue('gasto_extra_id', egresosSeleccionados[0].id)
    } else if (gastoExtraInfo) {
      // Mantener el gasto_extra_id que ya estaba en el formulario principal
      console.log('💰 Manteniendo gasto_extra_id del form principal:', gastoExtraInfo.id)
      // No es necesario setFieldValue porque ya está en el form
    }
    
    const metodosPagoFormateados = metodosPago.map(m => ({
      despliegue_de_pago_id: m.despliegue_de_pago_id,
      monto: m.monto,
      numero_operacion: m.referencia || undefined,
      fecha_pago_referencial: m.fecha_pago_referencial || undefined,
    }))
    
    console.log('💳 Guardando metodos_de_pago:', metodosPagoFormateados)
    compraForm.setFieldValue('metodos_de_pago', metodosPagoFormateados)

    onCancel()
    modalForm.resetFields()
    setMetodosPago([])
    setEgresosSeleccionados([])
    onContinuar?.()
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setDespliegueName('')
    setMetodosPago([])
    setEgresosSeleccionados([])
    onCancel()
  }

  const handleAgregarEgreso = (gasto: GastoExtraDisponible) => {
    // Evitar duplicados
    if (egresosSeleccionados.some(e => e.id === gasto.id)) {
      message.warning('Este egreso ya fue agregado')
      return
    }
    setEgresosSeleccionados(prev => [...prev, gasto])
    setModalEgresoOpen(false)
  }

  const handleEliminarEgreso = (id: string) => {
    setEgresosSeleccionados(prev => prev.filter(e => e.id !== id))
  }

  const todosLosEgresos = [
    ...(gastoExtraInfo ? [gastoExtraInfo] : []),
    ...egresosSeleccionados,
  ]

  const gridCols = montoTotalEgresos > 0 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <Modal
      title='Pagar - Métodos de Pago'
      open={open}
      onCancel={handleCancelar}
      width={1000}
      footer={null}
      centered
      destroyOnHidden
    >
      <div className='mt-4'>


        {/* Cards de totales */}
        <div className={`grid ${gridCols} gap-4 mb-4`}>
          <div className='p-4 bg-blue-50 rounded-lg border-2 border-blue-300'>
            <div className='text-sm font-medium text-slate-600'>Total a Pagar</div>
            <div className='text-2xl font-bold text-blue-600'>
              {monedaSymbol} {totalAPagar.toFixed(2)}
            </div>
          </div>
          {montoTotalEgresos > 0 && (
            <div className='p-4 bg-amber-50 rounded-lg border-2 border-amber-300'>
              <div className='text-sm font-medium text-slate-600'>Cubre Egresos</div>
              <div className='text-2xl font-bold text-amber-600'>
                {monedaSymbol} {montoTotalEgresos.toFixed(2)}
              </div>
            </div>
          )}
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
        {(todosLosEgresos.length > 0 || metodosPago.length > 0) && (
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-sm font-semibold text-slate-700'>Métodos de Pago Agregados</div>
              {saldoPendiente > 0 && (
                <button
                  onClick={() => setModalEgresoOpen(true)}
                  className='flex items-center gap-1 text-xs text-amber-700 border border-amber-400 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors'
                >
                  <GiPayMoney size={14} />
                  Agregar Egreso
                </button>
              )}
            </div>
            <div className='border rounded-lg overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-slate-100'>
                  <tr>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>#</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Tipo de Pago</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Fecha Pago Ref.</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Monto</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Referencia</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Monto Recibe</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Vuelto</th>
                    <th className='px-4 py-2 text-center text-sm font-semibold text-slate-700'>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Filas de egresos (gastoExtraInfo del form + los seleccionados en el modal) */}
                  {todosLosEgresos.map((egreso, idx) => (
                    <tr key={egreso.id} className='border-t bg-amber-50'>
                      <td className='px-4 py-3 text-sm text-amber-700 font-semibold'>E{idx + 1}</td>
                      <td className='px-4 py-3 text-sm font-medium text-amber-700'>
                        <div className='flex items-center gap-2'>
                          <GiPayMoney size={16} />
                          {egreso.concepto}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm font-semibold text-right text-amber-700'>
                        {monedaSymbol} {Number(egreso.monto).toFixed(2)}
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-400'>-</td>
                      <td className='px-4 py-3 text-sm text-right text-slate-400'>-</td>
                      <td className='px-4 py-3 text-sm text-right text-slate-400'>-</td>
                      <td className='px-4 py-3 text-center'>
                        {/* El egreso del form principal no se puede quitar aquí */}
                        {egresosSeleccionados.some(e => e.id === egreso.id) ? (
                          <button
                            onClick={() => handleEliminarEgreso(egreso.id)}
                            className='text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors'
                          >
                            <FaTrash size={14} />
                          </button>
                        ) : (
                          <span className='text-slate-400'>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {metodosPago.map((metodo, index) => {
                    const vueltoMetodo = metodo.recibe_efectivo
                      ? Math.max(0, metodo.recibe_efectivo - metodo.monto)
                      : 0
                    return (
                      <tr key={metodo.id} className='border-t hover:bg-slate-50'>
                        <td className='px-4 py-3 text-sm text-slate-600'>{index + 1}</td>
                        <td className='px-4 py-3 text-sm font-medium text-slate-700'>{metodo.despliegue_name}</td>
                        <td className='px-4 py-3 text-sm text-slate-600'>{metodo.fecha_pago_referencial || '-'}</td>
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

        {/* Botón agregar egreso cuando la tabla aún no está visible */}
        {todosLosEgresos.length === 0 && metodosPago.length === 0 && (
          <div className='mb-4'>
            {saldoPendiente > 0 ? (
              <button
                onClick={() => setModalEgresoOpen(true)}
                className='flex items-center gap-2 text-sm text-amber-700 border border-amber-400 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded transition-colors'
              >
                <GiPayMoney size={16} />
                Agregar Egreso Asociado (opcional)
              </button>
            ) : (
              <div className='text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2'>
                <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                El pago está cubierto en su totalidad.
              </div>
            )}
          </div>
        )}

        {/* Formulario agregar método */}
        {saldoPendiente > 0 && (
          <Form form={modalForm} className='border-t pt-4'>
            <div className='text-sm font-semibold text-slate-700 mb-3'>
              Agregar Método de Pago
            </div>
            <div className='flex items-end gap-3'>
              <div className='flex-1 min-w-[200px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Tipo de Pago
                </label>
                <SelectDespliegueDePago
                  classNameIcon='text-emerald-700 mx-1'
                  className='w-full'
                  propsForm={{
                    name: 'despliegue_de_pago_id',
                    rules: [{ required: true, message: 'Requerido' }],
                  }}
                  onChange={(value, option: any) => {
                    const name = option?.label || ''
                    setDespliegueName(name)
                    // Precargar el monto a recibir con el saldo pendiente en
                    // cualquier tipo de pago (antes solo lo hacía para no-efectivo,
                    // y en efectivo lo dejaba vacío) — el usuario igual puede
                    // aumentarlo si va a recibir más y calcular vuelto.
                    modalForm.setFieldValue('recibe_efectivo', saldoPendiente)
                    modalForm.setFieldValue('referencia', undefined)
                  }}
                />
              </div>

              {!isEfectivo && (
                <div className='flex-1 min-w-[180px]'>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>
                    Referencia
                  </label>
                  <InputBase
                    prefix={
                      <FaHashtag className='text-cyan-600 mx-1' size={12} />
                    }
                    placeholder='N° Transacción'
                    uppercase={false}
                    propsForm={{
                      name: 'referencia',
                      rules: [{ required: true, message: 'Requerido' }],
                    }}
                  />
                </div>
              )}

              <div className='w-[150px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Fecha Pago Ref.
                </label>
                <Form.Item
                  name='fecha_pago_referencial'
                  className='mb-0'
                >
                  <DatePicker
                    className='w-full'
                    placeholder='Seleccionar'
                    format='YYYY-MM-DD'
                  />
                </Form.Item>
              </div>

              <div className='w-[140px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Monto Recibe
                </label>
                <InputNumberBase
                  prefix={
                    <span className='text-emerald-700 font-bold text-xs'>
                      {monedaSymbol}
                    </span>
                  }
                  placeholder='0.00'
                  min={0}
                  max={!isEfectivo ? saldoPendiente : undefined}
                  precision={2}
                  propsForm={{
                    name: 'recibe_efectivo',
                    className: 'w-full',
                    rules: [
                      { required: true, message: 'Requerido' },
                      {
                        validator: (_, value) => {
                          if (!value || value <= 0)
                            return Promise.reject('Debe ser > 0')
                          if (!isEfectivo && value > saldoPendiente)
                            return Promise.reject(
                              `Máx: ${saldoPendiente.toFixed(2)}`
                            )
                          return Promise.resolve()
                        },
                      },
                    ],
                  }}
                />
              </div>

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


        {/* Footer */}
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
            disabled={saldoPendiente > 0}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            Confirmar Pago
          </ButtonBase>
        </div>
      </div>

      <ModalSeleccionarEgreso
        open={modalEgresoOpen}
        onClose={() => setModalEgresoOpen(false)}
        excluirCompraId={excluirCompraId}
        onSelect={handleAgregarEgreso}
      />
    </Modal>
  )
}
