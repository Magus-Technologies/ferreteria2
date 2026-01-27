'use client'

import { useState } from 'react'
import { Card, Button, Input, Checkbox, Tabs, Alert } from 'antd'
import { FaCheckCircle, FaSearch } from 'react-icons/fa'
import ConteoDinero from '../../_components/others/conteo-dinero'

const { TextArea } = Input

export default function CierreCajaView() {
  const [totalEfectivo, setTotalEfectivo] = useState(0)
  const [totalCuentas, setTotalCuentas] = useState(0)
  const [cierreTotal, setCierreTotal] = useState(0)
  const [faltante, setFaltante] = useState(-1.00)
  const [sobrante, setSobrante] = useState(0)
  const [comentarios, setComentarios] = useState('')
  const [ticketCaja, setTicketCaja] = useState(true)
  const [enviaCorreo, setEnviaCorreo] = useState(false)
  const [verCamposCiegoCierre, setVerCamposCiegoCierre] = useState(true)

  // Datos de ejemplo para el resumen
  const resumenData = {
    aperturaCaja: 1.00,
    totalTarjetas: 0.00,
    yape: 0.00,
    izipay: 0.00,
    transferencias: 0.00,
    otros: 0.00,
    totalEfectivo: 0.00,
    totalCobros: 0.00,
    totalOtrosIngresos: 0.00,
    totalAnulados: 0.00,
    totalDevoluciones: 0.00,
    totalGastos: 0.00,
    totalPagos: 0.00,
    resumenVentas: 0.00,
    resumenIngresos: 1.00,
    resumenEgresos: 0.00,
    totalEnCaja: 1.00
  }

  return (
    <div className='p-1 space-y-1 w-full'>
      {/* Header con información de caja */}
      <Card className='bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 w-full' bodyStyle={{ padding: '12px 16px' }}>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-lg font-bold text-slate-800 mb-1'>
              Caja Chica al <span className='text-orange-600'>29/06/2025 09:32:00 a. m.</span>
            </h2>
            <div className='flex gap-4 text-xs text-slate-600'>
              <span>Anterior: <strong className='text-slate-800'>EFRAIN</strong></span>
              <span>Cajero Turno Act: <strong className='text-slate-800'>EFRAIN</strong></span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Input 
              placeholder='Supervisor' 
              size='small'
              className='w-40'
              suffix={<FaSearch className='text-slate-400' />}
            />
            <Checkbox checked={false} className='text-xs'>
              Forzar Cierre
            </Checkbox>
          </div>
        </div>
      </Card>

      {/* Tabs principales */}
      <Tabs
        defaultActiveKey='1'
        size='small'
        items={[
          {
            key: '1',
            label: 'Cuadre de efectivo y cierre de caja',
            children: (
              <div className='space-y-3'>
                <div className='grid grid-cols-[minmax(550px,1.2fr)_minmax(450px,550px)] gap-4 w-full'>
                  {/* Columna Izquierda: Resumen de Cierre */}
                <Card 
                  title={<span className='text-base font-semibold'>Resumen de Cierre</span>}
                  className='shadow-sm w-full'
                  bodyStyle={{ padding: '16px' }}
                  headStyle={{ padding: '10px 16px', minHeight: 'auto' }}
                  extra={
                    <Checkbox 
                      checked={verCamposCiegoCierre}
                      onChange={(e) => setVerCamposCiegoCierre(e.target.checked)}
                      className='text-xs'
                    >
                      Ver campos del cierre ciego
                    </Checkbox>
                  }
                >
                  <div className='space-y-0.5'>
                    {/* Componente reutilizable para filas */}
                    {[
                      { label: 'Apertura Caja', value: resumenData.aperturaCaja, hasDetail: true },
                      { label: 'Total Tarjetas', value: resumenData.totalTarjetas },
                      { label: 'Yape', value: resumenData.yape, icon: true },
                      { label: 'Izipay', value: resumenData.izipay },
                      { label: 'Transferencias', value: resumenData.transferencias },
                      { label: 'Otros', value: resumenData.otros, hasDetail: true },
                      { label: 'Total Efectivo', value: resumenData.totalEfectivo, hasDetail: true },
                    ].map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-slate-50 ${item.icon ? 'bg-purple-50' : ''}`}>
                        <div className='flex items-center gap-2.5'>
                          {item.icon && (
                            <div className='w-7 h-7 bg-purple-600 rounded flex items-center justify-center'>
                              <span className='text-white font-bold text-sm'>Y</span>
                            </div>
                          )}
                          <span className='text-base text-slate-700'>{item.label}</span>
                        </div>
                        <div className='flex items-center gap-2.5'>
                          <span className='text-base font-semibold text-slate-800 min-w-[100px] text-right'>
                            {item.value.toFixed(2)}
                          </span>
                          {item.hasDetail && (
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className='border-t border-slate-300 my-1'></div>

                    {/* Movimientos */}
                    {[
                      { label: 'Total cobros', value: resumenData.totalCobros, hasDetail: true },
                      { label: 'Total O. Ingresos', value: resumenData.totalOtrosIngresos, hasDetail: true },
                      { label: 'Total Anulados', value: resumenData.totalAnulados, hasDetail: true },
                      { label: 'Total Devoluciones', value: resumenData.totalDevoluciones, hasDetail: true },
                      { label: 'Total Gastos', value: resumenData.totalGastos, hasDetail: true },
                      { label: 'Total Pagos', value: resumenData.totalPagos, hasDetail: true },
                    ].map((item, idx) => (
                      <div key={idx} className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-slate-50'>
                        <span className='text-base text-slate-700'>{item.label}</span>
                        <div className='flex items-center gap-2.5'>
                          <span className='text-base font-semibold text-slate-800 min-w-[100px] text-right'>
                            {item.value.toFixed(2)}
                          </span>
                          {item.hasDetail && (
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Resumen Ventas */}
                    <div className='flex justify-between items-center py-2.5 px-4 bg-blue-50 border border-blue-300 rounded mt-1'>
                      <span className='text-base font-bold text-blue-800'>Resumen Ventas</span>
                      <span className='text-lg font-bold text-blue-800'>
                        {resumenData.resumenVentas.toFixed(2)}
                      </span>
                    </div>

                    {/* Resumen Ingresos/Egresos */}
                    <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                      <span className='text-base text-slate-700'>Resumen Ingresos</span>
                      <span className='text-base font-semibold text-slate-800'>
                        {resumenData.resumenIngresos.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                      <span className='text-base text-slate-700'>Resumen Egresos</span>
                      <span className='text-base font-semibold text-slate-800'>
                        {resumenData.resumenEgresos.toFixed(2)}
                      </span>
                    </div>

                    {/* Total en Caja */}
                    <div className='flex justify-between items-center py-3 px-4 bg-slate-100 border border-slate-400 rounded mt-1'>
                      <span className='text-lg font-bold text-slate-800'>Total en Caja</span>
                      <span className='text-xl font-bold text-slate-800'>
                        {resumenData.totalEnCaja.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Columna Derecha: Conteo de Efectivo */}
                <Card 
                  title={
                    <div className='flex justify-between items-center w-full'>
                      <span className='text-base font-semibold'>Conteo de Efectivo</span>
                      <div className='text-right'>
                        <div className='text-xs text-slate-500'>Total Efectivo</div>
                        <div className='text-xl font-bold text-orange-600'>
                          S/. {totalEfectivo.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  }
                  className='shadow-sm w-full'
                  bodyStyle={{ padding: '16px' }}
                  headStyle={{ padding: '10px 16px', minHeight: 'auto' }}
                >
                  <ConteoDinero onChange={setTotalEfectivo} />
                  
                  <div className='mt-3 space-y-2.5'>
                    <Checkbox 
                      checked={ticketCaja}
                      onChange={(e) => setTicketCaja(e.target.checked)}
                      className='text-sm'
                    >
                      Ticket Caja
                    </Checkbox>
                    
                    <div>
                      <div className='text-sm font-medium text-slate-600 mb-1'>Comentarios</div>
                      <TextArea
                        rows={2}
                        placeholder='Ingrese comentarios...'
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                        className='bg-yellow-50 text-sm'
                        size='small'
                      />
                    </div>

                    {/* Diferencias */}
                    <div className='bg-slate-50 rounded p-3 space-y-1.5'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-slate-700'>Diferencias</span>
                        <span className={`text-lg font-bold ${faltante < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                          {faltante.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-slate-700'>Sobrante</span>
                        <span className='text-lg font-bold text-slate-800'>
                          {sobrante.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className='flex gap-2 pt-1'>
                      <Button 
                        type='primary' 
                        icon={<FaCheckCircle />}
                        className='flex-1 bg-green-600 hover:bg-green-700 text-sm'
                        size='large'
                      >
                        Ventas Enviar
                      </Button>
                      <Button 
                        type='default'
                        className='flex-1 text-sm'
                        size='large'
                      >
                        + Ganancias
                      </Button>
                      <Button 
                        type='primary' 
                        icon={<FaCheckCircle />}
                        className='flex-1 bg-green-600 hover:bg-green-700 text-sm'
                        size='large'
                      >
                        Finalizar caja [F10]
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ),
          },
          {
            key: '2',
            label: 'Resumen detalle',
            children: <div className='p-4'>Contenido del resumen detallado...</div>,
          },
        ]}
      />
    </div>
  )
}
