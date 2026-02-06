'use client'

import { useState } from 'react'
import { Card, Button, Input, Checkbox, Tabs, Spin, Empty } from 'antd'
import { FaCheckCircle, FaSearch } from 'react-icons/fa'
import ConteoDinero from '../../_components/others/conteo-dinero'
import ResumenDetalleCierre from './resumen-detalle-cierre'
import SelectSupervisor from '../../_components/selects/select-supervisor'
import ModalValidarSupervisor from './modal-validar-supervisor'
import { useCierreCaja } from '../_hooks/use-cierre-caja'
import { useCerrarCaja } from '../_hooks/use-cerrar-caja'
import { useRouter, useSearchParams } from 'next/navigation'

const { TextArea } = Input

export default function CierreCajaView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cierreId = searchParams.get('cierre_id')
  
  const { cajaActiva, loading, error, esEdicion } = useCierreCaja(cierreId || undefined)
  const { cerrarCaja, loading: loadingCierre } = useCerrarCaja()

  const [totalEfectivo, setTotalEfectivo] = useState(0)
  const [totalCuentas, setTotalCuentas] = useState(0)
  const [conteoDenominaciones, setConteoDenominaciones] = useState<Record<string, number>>({})
  const [comentarios, setComentarios] = useState('')
  const [ticketCaja, setTicketCaja] = useState(true)
  const [verCamposCiegoCierre, setVerCamposCiegoCierre] = useState(true)
  
  // Nuevos campos para reporte y supervisión
  const [emailReporte, setEmailReporte] = useState('')
  const [whatsappReporte, setWhatsappReporte] = useState('')
  const [supervisorId, setSupervisorId] = useState<string | undefined>(undefined)
  const [supervisorNombre, setSupervisorNombre] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
  const [modalSupervisorOpen, setModalSupervisorOpen] = useState(false)

  const handleSupervisorChange = (value: string | undefined, option: any) => {
    if (value) {
      setSupervisorId(value)
      setSupervisorNombre(option?.label || '')
      setSupervisorPassword('') // Limpiar contraseña anterior
      setModalSupervisorOpen(true) // Abrir modal para validar
    } else {
      setSupervisorId(undefined)
      setSupervisorNombre('')
      setSupervisorPassword('')
    }
  }

  const handleSupervisorPasswordConfirm = (password: string) => {
    setSupervisorPassword(password)
    setModalSupervisorOpen(false)
  }

  const handleSupervisorPasswordCancel = () => {
    // Si cancela, limpiar la selección
    setSupervisorId(undefined)
    setSupervisorNombre('')
    setSupervisorPassword('')
    setModalSupervisorOpen(false)
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-96'>
        <Spin size='large'>
          <div className='text-slate-600 mt-4'>Cargando información de caja...</div>
        </Spin>
      </div>
    )
  }

  if (error || !cajaActiva) {
    return (
      <div className='flex justify-center items-center h-96'>
        <Empty description={error || 'No hay caja activa'} />
      </div>
    )
  }

  const resumen = cajaActiva.resumen
  
  // Validar que resumen existe antes de continuar
  if (!resumen) {
    return (
      <div className='flex justify-center items-center h-96'>
        <Empty description='No se pudo cargar el resumen de la caja' />
      </div>
    )
  }

  const montoEsperado = resumen?.monto_esperado || 0
  const diferencia = totalEfectivo - montoEsperado
  const faltante = diferencia < 0 ? Math.abs(diferencia) : 0
  const sobrante = diferencia > 0 ? diferencia : 0

  const handleFinalizarCaja = async () => {
    if (totalEfectivo === 0) {
      return
    }

    const success = await cerrarCaja(cajaActiva.id, {
      monto_cierre_efectivo: totalEfectivo,
      total_cuentas: totalCuentas || 0,
      comentarios: comentarios || undefined,
      conteo_billetes_monedas: conteoDenominaciones,
      email_reporte: emailReporte || undefined,
      whatsapp_reporte: whatsappReporte || undefined,
      supervisor_id: supervisorId || undefined,
      supervisor_password: supervisorPassword || undefined,
    })

    if (success) {
      // No redirigir - permitir continuar operaciones
      // router.push('/ui/facturacion-electronica/mis-aperturas-cierres')
    }
  }

  return (
    <div className='p-3 space-y-2 w-full'>
      {/* Header con información de caja */}
      <Card className='bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 w-full' bodyStyle={{ padding: '12px 16px' }}>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-lg font-bold text-slate-800 mb-1'>
              Caja Chica al <span className='text-orange-600'>{new Date(cajaActiva.fecha_apertura).toLocaleString('es-PE')}</span>
            </h2>
            <div className='flex gap-4 text-xs text-slate-600'>
              <span>Estado: <strong className='text-slate-800'>{cajaActiva.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Campo de Supervisor - ARRIBA */}
      <Card className='bg-amber-50 border border-amber-200 w-full' bodyStyle={{ padding: '16px' }}>
        <div className='text-sm font-semibold text-amber-800 mb-3'>Supervisión (Opcional)</div>
        <div className='grid grid-cols-1 gap-3'>
          <div>
            <div className='text-xs font-medium text-slate-600 mb-1'>
              Supervisor (opcional)
              {supervisorId && supervisorPassword && (
                <span className='ml-2 text-green-600'>✓ Validado</span>
              )}
            </div>
            <SelectSupervisor
              value={supervisorId}
              onChange={handleSupervisorChange}
              size='small'
            />
            {supervisorId && !supervisorPassword && (
              <div className='mt-2 text-xs text-orange-600'>
                ⚠️ Debes validar la contraseña del supervisor
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de validación de supervisor */}
      <ModalValidarSupervisor
        open={modalSupervisorOpen}
        supervisorNombre={supervisorNombre}
        onConfirm={handleSupervisorPasswordConfirm}
        onCancel={handleSupervisorPasswordCancel}
      />

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
                      {/* Efectivo Inicial */}
                      <div className='flex justify-between items-center py-2 px-4 bg-blue-50 border-b border-blue-200'>
                        <span className='text-base font-semibold text-blue-700'>Efectivo Inicial</span>
                        <div className='flex items-center gap-2.5'>
                          <span className='text-base font-semibold text-blue-700 min-w-[100px] text-right'>
                            {Number(resumen?.efectivo_inicial || 0).toFixed(2)}
                          </span>
                          <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                        </div>
                      </div>

                      {/* Métodos de pago dinámicos agrupados (ej: todas las Transferencias juntas) */}
                      {resumen?.detalle_metodos_pago && resumen.detalle_metodos_pago.length > 0 ? (
                        resumen.detalle_metodos_pago.map((metodo: any, index: number) => (
                          <div key={index} className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-slate-50'>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-sm text-slate-700'>{metodo.label}</span>
                              <span className='text-xs text-slate-500'>({metodo.cantidad_transacciones})</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-slate-800 min-w-[100px] text-right'>
                                {Number(metodo.total).toFixed(2)}
                              </span>
                              <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                          <span className='text-sm text-slate-500 italic'>Sin cobros registrados</span>
                        </div>
                      )}

                      <div className='border-t border-slate-300 my-1'></div>

                      {/* Otros Ingresos */}
                      {((resumen?.total_ingresos || 0) - (resumen?.total_ventas || 0) - (resumen?.total_prestamos_recibidos || 0)) > 0 && (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-blue-50'>
                          <span className='text-base text-blue-700'>Otros Ingresos</span>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-base font-semibold text-blue-700 min-w-[100px] text-right'>
                              {((resumen?.total_ingresos || 0) - (resumen?.total_ventas || 0) - (resumen?.total_prestamos_recibidos || 0)).toFixed(2)}
                            </span>
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          </div>
                        </div>
                      )}

                      {/* Préstamos Recibidos */}
                      {(resumen?.total_prestamos_recibidos || 0) > 0 && (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-green-50'>
                          <div className='flex items-center gap-2'>
                            <span className='text-base text-green-700'>Préstamos Recibidos</span>
                            <span className='text-xs text-green-600'>({resumen?.prestamos_recibidos?.length || 0})</span>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-base font-semibold text-green-700 min-w-[100px] text-right'>
                              {(resumen?.total_prestamos_recibidos || 0).toFixed(2)}
                            </span>
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          </div>
                        </div>
                      )}

                      {/* Gastos */}
                      {((resumen?.total_egresos || 0) - (resumen?.total_prestamos_dados || 0)) > 0 && (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-red-50'>
                          <span className='text-base text-red-700'>Gastos</span>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-base font-semibold text-red-700 min-w-[100px] text-right'>
                              {((resumen?.total_egresos || 0) - (resumen?.total_prestamos_dados || 0)).toFixed(2)}
                            </span>
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          </div>
                        </div>
                      )}

                      {/* Préstamos Dados */}
                      {(resumen?.total_prestamos_dados || 0) > 0 && (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-red-50'>
                          <div className='flex items-center gap-2'>
                            <span className='text-base text-red-700'>Préstamos Dados</span>
                            <span className='text-xs text-red-600'>({resumen?.prestamos_dados?.length || 0})</span>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-base font-semibold text-red-700 min-w-[100px] text-right'>
                              {(resumen?.total_prestamos_dados || 0).toFixed(2)}
                            </span>
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          </div>
                        </div>
                      )}

                      {/* Movimientos Internos (informativo, no afecta total) */}
                      {resumen?.movimientos_internos && resumen.movimientos_internos.length > 0 && (
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 bg-blue-50'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm text-blue-700'>Movimientos Internos</span>
                            <span className='text-xs text-blue-500'>({resumen.movimientos_internos.length})</span>
                            <span className='text-xs text-blue-600 italic'>(no afecta total)</span>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-sm font-semibold text-blue-700 min-w-[100px] text-right'>
                              {resumen.movimientos_internos.reduce((sum: number, m: any) => sum + Number(m.monto), 0).toFixed(2)}
                            </span>
                            <Button size='small' type='text' icon={<FaSearch className='text-sm' />} className='h-7 w-7 p-0' />
                          </div>
                        </div>
                      )}

                      <div className='border-t border-slate-300 my-1'></div>
                      {/* Resumen Ventas */}
                      <div className='flex justify-between items-center py-2.5 px-4 bg-blue-50 border border-blue-300 rounded mt-1'>
                        <span className='text-base font-bold text-blue-800'>Resumen Ventas</span>
                        <span className='text-lg font-bold text-blue-800'>
                          {(resumen?.total_ventas || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Resumen Ingresos/Egresos */}
                      <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                        <span className='text-base text-slate-700'>Resumen Ingresos</span>
                        <span className='text-base font-semibold text-slate-800'>
                          {(resumen?.total_ingresos || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                        <span className='text-base text-slate-700'>Resumen Egresos</span>
                        <span className='text-base font-semibold text-slate-800'>
                          {(resumen?.total_egresos || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Total en Caja */}
                      <div className='flex justify-between items-center py-3 px-4 bg-slate-100 border border-slate-400 rounded mt-1'>
                        <span className='text-lg font-bold text-slate-800'>Total en Caja</span>
                        <span className='text-xl font-bold text-slate-800'>
                          {montoEsperado.toFixed(2)}
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
                        <div className='text-sm font-medium text-slate-600 mb-1'>Email para reporte (opcional)</div>
                        <Input
                          type='email'
                          placeholder='correo@ejemplo.com'
                          value={emailReporte}
                          onChange={(e) => setEmailReporte(e.target.value)}
                          size='small'
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <div className='text-sm font-medium text-slate-600 mb-1'>WhatsApp para reporte (opcional)</div>
                        <Input
                          type='tel'
                          placeholder='999999999'
                          value={whatsappReporte}
                          onChange={(e) => setWhatsappReporte(e.target.value)}
                          size='small'
                          className='text-sm'
                        />
                      </div>

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
                          <span className={`text-lg font-bold ${faltante > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {faltante > 0 ? `-${faltante.toFixed(2)}` : '0.00'}
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
                          loading={loadingCierre}
                          onClick={handleFinalizarCaja}
                          disabled={totalEfectivo === 0}
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
            children: <ResumenDetalleCierre resumen={resumen} montoEsperado={montoEsperado} />,
          },
        ]}
      />
    </div>
  )
}
