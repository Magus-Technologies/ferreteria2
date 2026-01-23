'use client'

import { useState, useEffect } from 'react'
import { Input, Checkbox, Button, Spin, message } from 'antd'
import dayjs from 'dayjs'
import ConteoDinero from '../../_components/others/conteo-dinero'
import { cajaApi } from '~/lib/api/caja'

const { TextArea } = Input

export default function CierreCajaView() {
  const [conteoEfectivo, setConteoEfectivo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cajaActiva, setCajaActiva] = useState<any>(null)
  const [comentarios, setComentarios] = useState('')
  const [supervisorId, setSupervisorId] = useState<number | undefined>()
  const [forzarCierre, setForzarCierre] = useState(false)

  useEffect(() => {
    cargarCajaActiva()
  }, [])

  const cargarCajaActiva = async () => {
    try {
      setLoading(true)
      const response = await cajaApi.cajaActiva()

      if (response.error) {
        message.error(response.error.message || 'Error al cargar la caja activa')
        return
      }

      if (!response.data?.data) {
        message.warning('No tienes una caja abierta')
        return
      }

      setCajaActiva(response.data.data)
    } catch (error) {
      console.error('Error al cargar caja activa:', error)
      message.error('Error al cargar los datos de la caja')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-96'>
        <Spin size='large' />
      </div>
    )
  }

  if (!cajaActiva) {
    return (
      <div className='bg-white p-6 rounded-lg shadow text-center'>
        <p className='text-lg text-slate-600'>No tienes una caja abierta</p>
        <p className='text-sm text-slate-500 mt-2'>Debes aperturar una caja antes de poder cerrarla</p>
      </div>
    )
  }

  const resumen = cajaActiva.resumen || {}
  const totalEfectivo = conteoEfectivo
  const metodosPago = resumen.detalle_metodos_pago || []
  const montoEsperado = resumen.monto_esperado || 0

  // Calcular total de cuentas (todos los métodos excepto efectivo)
  const totalCuentas = metodosPago.reduce((total: number, metodo: any) => {
    // Excluir efectivo del total de cuentas
    const esEfectivo = metodo.metodo_pago?.toLowerCase().includes('efectivo') ||
      metodo.metodo_pago?.toLowerCase().includes('cch')
    if (!esEfectivo) {
      return total + (Number(metodo.total) || 0)
    }
    return total
  }, 0)

  const cierreTotal = totalEfectivo + totalCuentas
  const diferencias = cierreTotal - montoEsperado
  const sobrante = diferencias > 0 ? diferencias : 0
  const faltante = diferencias < 0 ? Math.abs(diferencias) : 0

  const handleCerrarCaja = async () => {
    try {
      if (Math.abs(diferencias) > 10 && !supervisorId) {
        message.warning('Las diferencias superan los 10 soles. Se requiere autorización de supervisor.')
        return
      }

      const payload = {
        monto_cierre_efectivo: totalEfectivo,
        total_cuentas: totalCuentas,
        comentarios: comentarios || undefined,
        supervisor_id: supervisorId,
        forzar_cierre: forzarCierre,
      }

      const response = await cajaApi.cerrar(cajaActiva.id, payload)

      if (response.error) {
        message.error(response.error.message || 'Error al cerrar la caja')
        return
      }

      message.success('Caja cerrada exitosamente')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error al cerrar caja:', error)
      message.error('Error inesperado al cerrar la caja')
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-slate-200'>
      <div className='p-6'>
        {/* Header */}
        <div className='mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-bold text-slate-800'>
                {cajaActiva.sub_caja_chica?.nombre || 'Caja Chica'}
              </h2>
              <p className='text-sm text-slate-600 mt-1'>
                Apertura: {dayjs(cajaActiva.fecha_apertura).format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-slate-500'>Cajero</p>
              <p className='text-sm font-semibold text-slate-700'>{cajaActiva.user?.name || 'N/A'}</p>
            </div>
          </div>

          <div className='mt-3 flex items-center gap-4'>
            <div className='flex-1'>
              <label className='text-xs text-slate-600 font-medium'>Supervisor (opcional)</label>
              <Input
                className='mt-1'
                size='small'
                placeholder='ID del supervisor'
                type='number'
                onChange={(e) => setSupervisorId(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <Checkbox
              className='text-xs'
              checked={forzarCierre}
              onChange={(e) => setForzarCierre(e.target.checked)}
            >
              Forzar Cierre
            </Checkbox>
          </div>
        </div>

        <div className='grid grid-cols-12 gap-6'>
          {/* Resumen Izquierdo */}
          <div className='col-span-4 space-y-3'>
            <h3 className='text-sm font-bold text-slate-700 mb-3 pb-2 border-b-2 border-slate-200'>
              Resumen de Cierre
            </h3>

            <div className='flex justify-between items-center py-2 px-3 bg-rose-50 rounded-lg border border-rose-200'>
              <span className='text-sm font-semibold text-rose-700'>Apertura Caja</span>
              <span className='text-sm font-bold text-rose-700'>
                S/ {parseFloat(cajaActiva.monto_apertura).toFixed(2)}
              </span>
            </div>

            {/* Métodos de pago */}
            <div className='space-y-2'>
              <h4 className='text-xs font-bold text-slate-600 uppercase tracking-wide mb-2'>
                Detalle por Método de Pago
              </h4>
              {metodosPago.length === 0 ? (
                <p className='text-sm text-slate-500 italic py-2'>No hay métodos de pago registrados</p>
              ) : (
                metodosPago.map((metodo: any) => {
                  const esEfectivo = metodo.metodo_pago?.toLowerCase().includes('efectivo') ||
                    metodo.metodo_pago?.toLowerCase().includes('cch')

                  return (
                    <div
                      key={metodo.metodo_pago_id}
                      className={`py-2 px-3 rounded-lg border ${esEfectivo
                        ? 'bg-white border-slate-200'
                        : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                      <div className='flex justify-between items-center'>
                        <div className='flex-1'>
                          <span className={`text-sm font-medium ${esEfectivo ? 'text-slate-700' : 'text-blue-700'
                            }`}>
                            {metodo.metodo_pago || 'Desconocido'}
                          </span>
                          <div className='text-xs text-slate-500 mt-0.5'>
                            {metodo.cantidad_transacciones} transacciones
                          </div>
                          {metodo.sub_cajas && metodo.sub_cajas.length > 0 && (
                            <div className='text-xs text-slate-400 mt-0.5'>
                              {metodo.sub_cajas.join(', ')}
                            </div>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${esEfectivo ? 'text-slate-800' : 'text-blue-700'
                          }`}>
                          S/ {(Number(metodo.total) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className='flex justify-between items-center py-2 px-3 border-t-2 border-slate-300 mt-3'>
              <span className='text-sm font-bold text-slate-700'>Total Efectivo</span>
              <span className='text-sm font-bold text-slate-800'>
                S/ {totalEfectivo.toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-200'>
              <span className='text-sm font-bold text-emerald-700'>Total Ingresos</span>
              <span className='text-sm font-bold text-emerald-700'>
                S/ {(resumen.total_ingresos || 0).toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between items-center py-2 px-3 bg-rose-50 rounded-lg border border-rose-200'>
              <span className='text-sm font-bold text-rose-700'>Total Egresos</span>
              <span className='text-sm font-bold text-rose-700'>
                S/ {(resumen.total_egresos || 0).toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between items-center py-3 px-3 bg-slate-100 rounded-lg border-2 border-slate-300 mt-3'>
              <span className='text-base font-bold text-slate-800'>Monto Esperado</span>
              <span className='text-base font-bold text-slate-900'>
                S/ {montoEsperado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Conteo y Totales */}
          <div className='col-span-8'>
            <div className='grid grid-cols-12 gap-4'>
              <div className='col-span-7'>
                <ConteoDinero onChange={(value) => setConteoEfectivo(value)} />
                <div className='mt-4'>
                  <label className='text-sm font-semibold text-slate-700 mb-2 block'>
                    Comentarios
                  </label>
                  <TextArea
                    rows={4}
                    placeholder='Comentarios opcionales...'
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    className='resize-none'
                  />
                </div>
              </div>

              <div className='col-span-5 space-y-3'>
                <div className='flex justify-between items-center py-3 px-4 bg-amber-100 rounded-lg border-2 border-amber-300'>
                  <span className='font-bold text-slate-700'>Total Efectivo</span>
                  <span className='text-xl font-bold text-amber-700'>
                    S/ {totalEfectivo.toFixed(2)}
                  </span>
                </div>

                <div className='flex justify-between items-center py-2 px-4 bg-slate-50 rounded-lg border border-slate-200'>
                  <span className='font-medium text-slate-600'>Total Cuentas</span>
                  <span className='font-bold text-slate-700'>
                    S/ {totalCuentas.toFixed(2)}
                  </span>
                </div>

                <div className='flex justify-between items-center py-3 px-4 bg-blue-50 rounded-lg border-2 border-blue-300'>
                  <span className='font-bold text-slate-700'>Cierre Total</span>
                  <span className='text-xl font-bold text-blue-700'>
                    S/ {cierreTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con diferencias y acciones */}
      <div className='px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg'>
        <div className='flex justify-between items-center'>
          <div className='flex gap-6'>
            <div className='flex items-center gap-3'>
              <span className='font-bold text-slate-700'>Diferencias</span>
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${diferencias < 0
                ? 'bg-red-500 text-white'
                : diferencias > 0
                  ? 'bg-amber-400 text-slate-800'
                  : 'bg-emerald-500 text-white'
                }`}>
                S/ {diferencias.toFixed(2)}
              </div>
            </div>

            {sobrante > 0 && (
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-slate-600'>Sobrante:</span>
                <span className='text-sm font-bold text-amber-600'>S/ {sobrante.toFixed(2)}</span>
              </div>
            )}

            {faltante > 0 && (
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-slate-600'>Faltante:</span>
                <span className='text-sm font-bold text-red-600'>S/ {faltante.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className='flex gap-3'>
            <Button type='default' className='border-slate-300'>
              Ventas Enviar
            </Button>
            <Button type='default' className='border-slate-300'>
              Ganancias
            </Button>
            <Button
              type='primary'
              size='large'
              className='bg-blue-600 hover:bg-blue-700 px-8'
              onClick={handleCerrarCaja}
            >
              Finalizar Caja [F10]
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
