'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App, Checkbox } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useEffect } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import { FaMoneyBillWave } from 'react-icons/fa'

interface ModalCobroMultipleProps {
  open: boolean
  setOpen: (open: boolean) => void
}

// Tipo para la distribución interna
interface VentaConDistribucion extends VentaCompleta {
  _totalVenta: number
  _totalCobrado: number
  _saldoPendiente: number
  _montoAPagar: number
  _seleccionada: boolean
}

// Calcular total de una venta desde sus productos
function calcularTotalVenta(venta: VentaCompleta): number {
  return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
    for (const u of item.unidades_derivadas ?? []) {
      const precio = Number(u.precio ?? 0)
      const cantidad = Number(u.cantidad ?? 0)
      const descuento = Number(u.descuento ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += bonificacion ? 0 : (precio * cantidad) - descuento
    }
    return acc
  }, 0)
}

export default function ModalCobroMultiple({ open, setOpen }: ModalCobroMultipleProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [clienteId, setClienteId] = useState<number | undefined>()
  const [ventasDistribucion, setVentasDistribucion] = useState<VentaConDistribucion[]>([])
  const [montoTotal, setMontoTotal] = useState<number>(0)

  // Obtener ventas pendientes del cliente
  const { data: ventasData, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'cobro-multiple', clienteId],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({
        cliente_id: clienteId,
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data?.data || []
    },
    enabled: open && !!clienteId,
  })

  // Inicializar distribución cuando llegan las ventas
  useEffect(() => {
    if (!ventasData?.length) {
      setVentasDistribucion([])
      return
    }
    const ventas: VentaConDistribucion[] = ventasData.map((v: VentaCompleta) => {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      return {
        ...v,
        _totalVenta: total,
        _totalCobrado: cobrado,
        _saldoPendiente: total - cobrado,
        _montoAPagar: 0,
        _seleccionada: true,
      }
    })
    // Ordenar por fecha (más antigua primero)
    ventas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    setVentasDistribucion(ventas)
  }, [ventasData])

  // Distribuir automáticamente cuando cambia el monto
  const distribuirMonto = useCallback((monto: number, ventas: VentaConDistribucion[]) => {
    let restante = monto
    const nuevas = ventas.map(v => {
      if (!v._seleccionada || restante <= 0) {
        return { ...v, _montoAPagar: 0 }
      }
      const pagar = Math.min(restante, v._saldoPendiente)
      restante -= pagar
      return { ...v, _montoAPagar: Number(pagar.toFixed(2)) }
    })
    setVentasDistribucion(nuevas)
  }, [])

  // Cuando cambia el monto total, redistribuir
  const handleMontoChange = useCallback((value: number | null) => {
    const monto = value || 0
    setMontoTotal(monto)
    distribuirMonto(monto, ventasDistribucion)
  }, [ventasDistribucion, distribuirMonto])

  // Toggle selección de una venta
  const toggleVenta = useCallback((ventaId: string) => {
    setVentasDistribucion(prev => {
      const nuevas = prev.map(v =>
        v.id === ventaId ? { ...v, _seleccionada: !v._seleccionada } : v
      )
      // Redistribuir con las nuevas selecciones
      let restante = montoTotal
      return nuevas.map(v => {
        if (!v._seleccionada || restante <= 0) {
          return { ...v, _montoAPagar: 0 }
        }
        const pagar = Math.min(restante, v._saldoPendiente)
        restante -= pagar
        return { ...v, _montoAPagar: Number(pagar.toFixed(2)) }
      })
    })
  }, [montoTotal])

  // Editar monto manual de una venta
  const handleMontoManual = useCallback((ventaId: string, monto: number) => {
    setVentasDistribucion(prev => prev.map(v =>
      v.id === ventaId
        ? { ...v, _montoAPagar: Math.min(monto, v._saldoPendiente) }
        : v
    ))
  }, [])

  // Totales calculados
  const totalDeudaCliente = useMemo(() =>
    ventasDistribucion.reduce((sum, v) => sum + v._saldoPendiente, 0), [ventasDistribucion])

  const totalDistribuido = useMemo(() =>
    ventasDistribucion.reduce((sum, v) => sum + v._montoAPagar, 0), [ventasDistribucion])

  const montoSinDistribuir = montoTotal - totalDistribuido

  // Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!clienteId || !user?.id) throw new Error('Datos incompletos')
      const values = await form.validateFields()

      const distribucion = ventasDistribucion
        .filter(v => v._montoAPagar > 0)
        .map(v => ({ venta_id: v.id, monto: v._montoAPagar }))

      if (distribucion.length === 0) throw new Error('No hay montos asignados')

      return ventaApi.storeCobroMultiple({
        cliente_id: clienteId,
        despliegue_de_pago_id: String(extractDesplieguePagoId(values.despliegue_de_pago_id)),
        monto_total: montoTotal,
        fecha: dayjs(values.fecha).format('YYYY-MM-DD'),
        observacion: values.observacion || undefined,
        numero_operacion: values.numero_operacion || undefined,
        user_id: user.id,
        distribucion,
      })
    },
    onSuccess: (result) => {
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Cobro múltiple registrado')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      handleClose()
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al registrar cobro múltiple')
    },
  })

  const handleClose = useCallback(() => {
    form.resetFields()
    setClienteId(undefined)
    setVentasDistribucion([])
    setMontoTotal(0)
    setOpen(false)
  }, [form, setOpen])

  const tipoDocMap: Record<string, string> = { '01': 'FAC', '03': 'BOL', 'nv': 'NV' }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaMoneyBillWave className='text-emerald-600' size={20} />
          <span>Cobro Múltiple por Cliente</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      onOk={() => mutation.mutate()}
      okText='Registrar Cobro'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: totalDistribuido <= 0 || Math.abs(montoSinDistribuir) > 0.01 }}
      width={1100}
      destroyOnHidden
    >
      {/* Selección de cliente y datos del cobro */}
      <div className='grid grid-cols-5 gap-3 mb-4'>
        <div className='col-span-2'>
          <LabelBase label='Cliente:' orientation='column'>
            <SelectClientes
              propsForm={{ name: 'cliente_id', rules: [{ required: true, message: 'Requerido' }] }}
              placeholder='Buscar cliente...'
              form={form}
              onChange={(value) => {
                setClienteId(value)
                setMontoTotal(0)
                form.setFieldValue('monto_total', undefined)
              }}
            />
          </LabelBase>
        </div>
        <LabelBase label='Modo Pago:' orientation='column'>
          <SelectDespliegueDePago
            propsForm={{ name: 'despliegue_de_pago_id', rules: [{ required: true, message: 'Requerido' }] }}
            placeholder='Método'
          />
        </LabelBase>
        <LabelBase label='Fecha:' orientation='column'>
          <Form.Item name='fecha' rules={[{ required: true, message: '' }]} noStyle initialValue={dayjs()}>
            <DatePicker className='w-full' format='DD/MM/YYYY' />
          </Form.Item>
        </LabelBase>
        <LabelBase label='N° Operación:' orientation='column'>
          <Form.Item name='numero_operacion' noStyle>
            <Input placeholder='Opcional' />
          </Form.Item>
        </LabelBase>
      </div>

      {/* Monto total y resumen */}
      {clienteId && (
        <>
          <div className='flex items-center gap-4 mb-4 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200'>
            <div className='flex-1'>
              <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Deuda Total del Cliente</span>
              <span className='text-2xl font-bold text-red-600'>S/. {totalDeudaCliente.toFixed(2)}</span>
            </div>
            <div className='flex-1'>
              <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Monto que Paga</span>
              <InputNumber
                className='w-full !text-xl !font-bold'
                prefix='S/.'
                precision={2}
                min={0.01}
                max={totalDeudaCliente}
                placeholder='0.00'
                size='large'
                value={montoTotal || undefined}
                onChange={handleMontoChange}
              />
            </div>
            <div className='flex-1 text-center'>
              <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Distribuido</span>
              <span className={`text-2xl font-bold ${Math.abs(montoSinDistribuir) < 0.01 ? 'text-emerald-600' : 'text-orange-500'}`}>
                S/. {totalDistribuido.toFixed(2)}
              </span>
              {Math.abs(montoSinDistribuir) >= 0.01 && (
                <span className='text-xs text-orange-500 block'>
                  Sin asignar: S/. {montoSinDistribuir.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Tabla de ventas pendientes */}
          <div className='border rounded-lg overflow-hidden'>
            <div className='bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 grid grid-cols-12 gap-2 items-center'>
              <div className='col-span-1'></div>
              <div className='col-span-2'>Documento</div>
              <div className='col-span-2'>Fecha</div>
              <div className='col-span-1 text-right'>Total</div>
              <div className='col-span-1 text-right'>Pagado</div>
              <div className='col-span-2 text-right'>Saldo Pend.</div>
              <div className='col-span-3 text-center'>Monto a Pagar</div>
            </div>
            <div className='max-h-[300px] overflow-y-auto divide-y'>
              {isLoading && (
                <div className='text-center py-8 text-gray-400'>Cargando ventas pendientes...</div>
              )}
              {!isLoading && ventasDistribucion.length === 0 && (
                <div className='text-center py-8 text-gray-400'>
                  {clienteId ? 'Este cliente no tiene ventas pendientes' : 'Seleccione un cliente'}
                </div>
              )}
              {ventasDistribucion.map((v, idx) => (
                <div
                  key={v.id}
                  className={`px-4 py-2.5 grid grid-cols-12 gap-2 items-center text-sm transition-colors ${
                    v._montoAPagar > 0 ? 'bg-emerald-50' : v._seleccionada ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className='col-span-1'>
                    <Checkbox
                      checked={v._seleccionada}
                      onChange={() => toggleVenta(v.id)}
                    />
                  </div>
                  <div className='col-span-2'>
                    <span className='text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold mr-1'>
                      {tipoDocMap[v.tipo_documento] || v.tipo_documento}
                    </span>
                    <span className='font-semibold'>{v.serie}-{v.numero}</span>
                  </div>
                  <div className='col-span-2 text-gray-500'>
                    {dayjs(v.fecha).format('DD/MM/YYYY')}
                    {v.fecha_vencimiento && (
                      <span className={`ml-1 text-[10px] ${dayjs(v.fecha_vencimiento).isBefore(dayjs()) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        (Venc: {dayjs(v.fecha_vencimiento).format('DD/MM')})
                      </span>
                    )}
                  </div>
                  <div className='col-span-1 text-right font-medium'>
                    {v._totalVenta.toFixed(2)}
                  </div>
                  <div className='col-span-1 text-right text-emerald-600'>
                    {v._totalCobrado.toFixed(2)}
                  </div>
                  <div className='col-span-2 text-right font-bold text-red-600'>
                    S/. {v._saldoPendiente.toFixed(2)}
                  </div>
                  <div className='col-span-3'>
                    <InputNumber
                      className='w-full'
                      prefix='S/.'
                      precision={2}
                      min={0}
                      max={v._saldoPendiente}
                      value={v._montoAPagar}
                      onChange={(val) => handleMontoManual(v.id, val || 0)}
                      disabled={!v._seleccionada}
                      size='small'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observación */}
          <div className='mt-3'>
            <LabelBase label='Observación:' orientation='column'>
              <Form.Item name='observacion' noStyle>
                <Input placeholder='Observaciones (opcional)' maxLength={500} />
              </Form.Item>
            </LabelBase>
          </div>

          {/* Resumen final */}
          <div className='flex justify-between mt-4 bg-gray-50 rounded-lg p-3 text-sm font-bold border border-gray-200'>
            <span>Ventas: <span className='text-blue-700'>{ventasDistribucion.filter(v => v._montoAPagar > 0).length}</span></span>
            <span>Total Deuda: <span className='text-red-600'>S/. {totalDeudaCliente.toFixed(2)}</span></span>
            <span>Pagando: <span className='text-emerald-600 text-lg'>S/. {totalDistribuido.toFixed(2)}</span></span>
            <span>Resta: <span className='text-orange-600'>S/. {(totalDeudaCliente - totalDistribuido).toFixed(2)}</span></span>
          </div>
        </>
      )}
    </Modal>
  )
}
