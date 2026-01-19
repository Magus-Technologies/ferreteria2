'use client'

import { useState, useEffect } from 'react'
import { Input, Checkbox, Button, Table, Spin, message } from 'antd'
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
        <Spin size='large' tip='Cargando datos de la caja...' />
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
  const resumenVentas = resumen.resumen_ventas || 0
  const totalEnCaja = resumen.total_en_caja || 0
  const totalCuentas = (resumen.total_tarjetas || 0) + (resumen.total_yape || 0) + (resumen.total_izipay || 0) + (resumen.total_transferencias || 0) + (resumen.total_otros || 0)
  const cierreTotal = totalEfectivo + totalCuentas
  const diferencias = cierreTotal - totalEnCaja
  const sobrante = diferencias > 0 ? diferencias : 0
  const faltante = diferencias < 0 ? Math.abs(diferencias) : 0

  const columnasConceptos = [
    { title: '#', dataIndex: 'numero', key: 'numero', width: 50 },
    { title: 'CONCEPTO', dataIndex: 'concepto', key: 'concepto' },
    { title: 'NUMERO', dataIndex: 'numeroDoc', key: 'numeroDoc', width: 100 },
    { title: 'CANT', dataIndex: 'cantidad', key: 'cantidad', width: 100 },
  ]

  const datosConceptos = Array.from({ length: 7 }, (_, i) => ({
    key: i + 1,
    numero: i + 1,
    concepto: '',
    numeroDoc: '',
    cantidad: '',
  }))

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
    <div className='bg-white p-6 rounded-lg shadow'>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-3 space-y-2'>
          <div className='text-sm font-semibold mb-4 text-slate-700'>Resumen de Cierre</div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-rose-600 font-semibold'>Apertura Caja</span>
            <Input className='w-24 text-right' value={parseFloat(cajaActiva.monto_apertura).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total Tarjetas</span>
            <Input className='w-24 text-right' value={(resumen.total_tarjetas || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center bg-purple-100 px-2 py-1 rounded'>
            <span className='text-sm font-semibold'>Yape</span>
            <Input className='w-24 text-right' value={(resumen.total_yape || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center bg-blue-100 px-2 py-1 rounded'>
            <span className='text-sm font-semibold'>Izipay</span>
            <Input className='w-24 text-right' value={(resumen.total_izipay || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center bg-green-100 px-2 py-1 rounded'>
            <span className='text-sm font-semibold'>Transferencias</span>
            <Input className='w-24 text-right' value={(resumen.total_transferencias || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center bg-gray-100 px-2 py-1 rounded'>
            <span className='text-sm font-semibold'>Otros</span>
            <Input className='w-24 text-right' value={(resumen.total_otros || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center border-t pt-2'>
            <span className='text-sm font-bold'>Total Efectivo</span>
            <Input className='w-24 text-right font-bold' value={totalEfectivo.toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total cobros</span>
            <Input className='w-24 text-right' value={(resumen.total_cobros || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total O. Ingresos</span>
            <Input className='w-24 text-right' value={(resumen.total_otros_ingresos || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total Anulados</span>
            <Input className='w-24 text-right' value={(resumen.total_anulados || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total Devoluciones</span>
            <Input className='w-24 text-right' value={(resumen.total_devoluciones || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total Gastos</span>
            <Input className='w-24 text-right' value={(resumen.total_gastos || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Total Pagos</span>
            <Input className='w-24 text-right' value={(resumen.total_pagos || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center bg-blue-600 text-white px-2 py-1 rounded'>
            <span className='text-sm font-bold'>Resumen Ventas</span>
            <Input className='w-24 text-right font-bold bg-blue-600 text-white border-white' value={resumenVentas.toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-rose-600'>Resumen Ingresos</span>
            <Input className='w-24 text-right' value={(resumen.resumen_ingresos || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-rose-600'>Resumen Egresos</span>
            <Input className='w-24 text-right' value={(resumen.resumen_egresos || 0).toFixed(2)} readOnly />
          </div>
          <div className='flex justify-between items-center border-t-2 border-black pt-2'>
            <span className='text-sm font-bold'>Total en Caja</span>
            <Input className='w-24 text-right font-bold' value={totalEnCaja.toFixed(2)} readOnly />
          </div>
        </div>

        <div className='col-span-9'>
          <div className='mb-3 p-2 bg-white rounded border border-gray-300'>
            <div className='flex items-center justify-between'>
              <div>
                <span className='font-bold text-rose-600'>
                  {cajaActiva.sub_caja_chica?.nombre || 'Caja Chica'} al{' '}
                </span>
                <span className='font-bold text-blue-600'>
                  {dayjs(cajaActiva.fecha_apertura).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              <div className='flex items-center gap-6 text-sm'>
                <div>
                  <span className='text-slate-600'>Anterior </span>
                  <span className='font-semibold text-blue-600'>
                    {cajaActiva.user?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-slate-600'>Cajero Turno Act </span>
                  <span className='font-semibold text-blue-600'>
                    {cajaActiva.user?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <span className='text-sm text-slate-700 font-semibold'>Supervisa:</span>
              <Input 
                className='flex-1 max-w-md' 
                size='small' 
                placeholder='ID del supervisor (opcional)' 
                type='number'
                onChange={(e) => setSupervisorId(e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <span className='text-xs text-slate-500'>🔑 [F1]</span>
              <Checkbox 
                className='text-xs ml-4'
                checked={forzarCierre}
                onChange={(e) => setForzarCierre(e.target.checked)}
              >
                Forzar Cierre (Click para cambiar)
              </Checkbox>
            </div>
          </div>

          <div className='grid grid-cols-12 gap-4'>
            <div className='col-span-7'>
              <ConteoDinero onChange={(value) => setConteoEfectivo(value)} />
              <div className='mt-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-sm font-semibold'>Comentarios</span>
                  <Checkbox>Ticket Caja</Checkbox>
                </div>
                <TextArea 
                  rows={4} 
                  placeholder='Comentarios opcionales...'
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                />
              </div>
            </div>

            <div className='col-span-5'>
              <Table
                columns={columnasConceptos}
                dataSource={datosConceptos}
                pagination={false}
                size='small'
                bordered
                className='mb-4'
              />
              
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='font-bold'>Total Efectivo</span>
                  <div className='w-32 bg-yellow-300 text-center py-2 rounded font-bold text-lg'>
                    {totalEfectivo.toFixed(2)}
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='font-bold'>Total Cuentas</span>
                  <Input className='w-32 text-right' value={totalCuentas.toFixed(2)} readOnly />
                </div>
                <div className='flex justify-between items-center'>
                  <span className='font-bold'>Cierre Total</span>
                  <Input className='w-32 text-right' value={cierreTotal.toFixed(2)} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='mt-6 p-4 bg-gray-50 rounded border'>
        <div className='flex justify-between items-center'>
          <div className='flex gap-6'>
            <div className='flex items-center gap-2'>
              <span className='font-bold'>Diferencias</span>
              <div className={`w-32 text-center py-2 rounded font-bold ${diferencias < 0 ? 'bg-red-500 text-white' : diferencias > 0 ? 'bg-yellow-300' : 'bg-green-500 text-white'}`}>
                {diferencias.toFixed(2)}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-bold'>Sobrante</span>
              <Input className='w-24 text-right' value={sobrante.toFixed(2)} readOnly />
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-bold'>Faltante</span>
              <Input className='w-24 text-right' value={faltante.toFixed(2)} readOnly />
            </div>
          </div>
          
          <div className='flex gap-2'>
            <Button type='default'>Ventas Enviar</Button>
            <Button type='default'>Ganancias</Button>
            <Button 
              type='primary' 
              size='large' 
              className='bg-blue-600'
              onClick={handleCerrarCaja}
            >
              Finalizar caja [F10]
            </Button>
          </div>
        </div>
      </div>

      <div className='mt-4 flex gap-4 text-xs'>
        <div className='flex items-center gap-1'>
          <div className='w-4 h-4 bg-red-500'></div>
          <span>Diferencias Negativas</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-4 h-4 bg-gray-400'></div>
          <span>Óptimo</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-4 h-4 bg-yellow-300'></div>
          <span>Diferencias Positiva</span>
        </div>
      </div>
    </div>
  )
}
