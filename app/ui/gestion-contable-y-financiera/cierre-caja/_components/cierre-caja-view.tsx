'use client'

import { useState, useEffect, useRef } from 'react'
import { useRealtime } from '~/hooks/use-realtime'
import { subscribeModelChanged } from '~/lib/realtime-bus'
import { Card, Button, Input, InputNumber, Checkbox, Tabs, Spin, Empty, message, Modal } from 'antd'
import { FaCheckCircle, FaSearch } from 'react-icons/fa'
import ConteoDinero from '../../gestion-cajas/_components/conteo-dinero'
import ResumenDetalleCierre from './resumen-detalle-cierre'
import SelectSupervisor from '../../gestion-cajas/_components/select-supervisor'
import ModalValidarSupervisor from './modal-validar-supervisor'
import ModalTicketCierre from './modal-ticket-cierre'
import ModalDetalleCierre from './modal-detalle-cierre'
import { useCierreCaja } from '../_hooks/use-cierre-caja'
import { useCerrarCaja } from '../_hooks/use-cerrar-caja'
import { apiRequest, getAuthToken } from '../../../../../lib/api'
import { cierreCajaApi } from '../../../../../lib/api/cierre-caja'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import dayjs from 'dayjs'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

const { TextArea } = Input

export default function CierreCajaView() {
  const router = useRouter()
  // Ruta actual, para que los redirects se queden en ESTE módulo. Esta vista es
  // una copia de la de facturacion-electronica y arrastraba esa ruta hardcodeada,
  // así que al cerrar caja desde gestión contable te sacaba al otro módulo.
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const cierreId = searchParams.get('cierre_id')
  const isReCierre = searchParams.get('re_cierre') === 'true'
  const supervisorValidadoUrl = searchParams.get('supervisor_validado') === 'true'
  const supervisorIdUrl = searchParams.get('supervisor_id')

  const { cajaActiva, loading, error, esEdicion, recargar } = useCierreCaja(cierreId || undefined)
  const { cerrarCaja, loading: loadingCierre } = useCerrarCaja()
  const { data: empresaData } = useEmpresaPublica()

  // Tiempo real: conectar el canal y refrescar el cierre cuando ocurran movimientos
  // que afectan el resumen (ventas, gastos, ingresos, préstamos, caja), sin recargar la página.
  useRealtime()
  const recargarRef = useRef(recargar)
  recargarRef.current = recargar
  // Justo al cerrar la caja, el propio cierre dispara un evento realtime de módulo
  // "cajas". Si ese evento llega ANTES de que el router.replace(...?cierre_id=)
  // termine de propagar el nuevo cierreId, el listener de abajo (suscrito cuando
  // cierreId aún era undefined) recarga vía "caja activa" -> 404 "No tienes caja
  // abierta" -> pisa toda la vista (incluido el ticket que se acaba de abrir).
  // Este ref corta esa carrera: una vez finalizado el arqueo, se ignoran refrescos.
  const arqueoFinalizadoRef = useRef(false)
  useEffect(() => {
    if (cierreId) return // en modo edición (cierre cerrado) es un snapshot, no auto-refresca
    const MODULOS_CIERRE = [
      'ventas', 'gastos', 'ingresos', 'prestamos', 'prestamos-vendedores', 'cajas',
    ]
    const unsub = subscribeModelChanged((ev) => {
      if (arqueoFinalizadoRef.current) return
      if (MODULOS_CIERRE.includes(ev.module)) {
        recargarRef.current()
      }
    })
    return unsub
  }, [cierreId])

  const [totalEfectivo, setTotalEfectivo] = useState(0)
  const [totalCuentas, setTotalCuentas] = useState(0)
  const [conteoDenominaciones, setConteoDenominaciones] = useState<Record<string, number> | null>(null)

  // ELIMINADO: arqueoFinalizado ya no se usa, se reemplaza por cajaYaFinalizada del backend
  const [comentarios, setComentarios] = useState('')
  const [ticketCaja, setTicketCaja] = useState(true)
  const [verCamposCiegoCierre, setVerCamposCiegoCierre] = useState(true)
  const [arqueoFinalizado, setArqueoFinalizado] = useState(false)
  const [montoDejarApertura, setMontoDejarApertura] = useState<number>(0)

  // Nuevos campos para reporte y supervisión
  const [emailReporte, setEmailReporte] = useState('')
  const [whatsappReporte, setWhatsappReporte] = useState('')
  const [supervisorId, setSupervisorId] = useState<string | undefined>(undefined)
  const [supervisorNombre, setSupervisorNombre] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
  const [modalExitoOpen, setModalExitoOpen] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState('')

  // Supervisión - Si viene de re-cierre con supervisor validado, pre-cargar
  const [modalSupervisorOpen, setModalSupervisorOpen] = useState(false)
  const [validandoSupervisor, setValidandoSupervisor] = useState(false)
  const [supervisorValidado, setSupervisorValidado] = useState(supervisorValidadoUrl)
  const [enviandoTicket, setEnviandoTicket] = useState(false)
  const [modalTicketOpen, setModalTicketOpen] = useState(false)

  // Si viene de re-cierre con supervisor validado, pre-cargar el ID
  useEffect(() => {
    if (isReCierre && supervisorValidadoUrl && supervisorIdUrl) {
      setSupervisorId(supervisorIdUrl)
      setSupervisorValidado(true)
      console.log('✅ Supervisor pre-cargado desde URL:', supervisorIdUrl)
    }
  }, [isReCierre, supervisorValidadoUrl, supervisorIdUrl])

  // Estados para modal de detalle (lupa)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [detalleTipo, setDetalleTipo] = useState<string | null>(null)

  const handleOpenDetalle = (tipo: string) => {
    setDetalleTipo(tipo)
    setModalDetalleOpen(true)
  }

  // Cargar datos guardados cuando la caja ya está cerrada (persiste al refrescar)
  // En modo re-cierre, cargar datos del cierre anterior como referencia
  useEffect(() => {
    if (cajaActiva && cajaActiva.estado === 'cerrada') {
      // Cargar monto de efectivo del cierre
      if (cajaActiva.monto_cierre_efectivo) {
        setTotalEfectivo(Number(cajaActiva.monto_cierre_efectivo))
      }
      // Cargar comentarios
      if (cajaActiva.comentarios) {
        setComentarios(cajaActiva.comentarios)
      }
      // Cargar email
      if (cajaActiva.email_reporte) {
        setEmailReporte(cajaActiva.email_reporte)
      }
      // Cargar whatsapp
      if (cajaActiva.whatsapp_reporte) {
        setWhatsappReporte(cajaActiva.whatsapp_reporte)
      }
      // Cargar monto a dejar para apertura
      if (cajaActiva.monto_dejar_apertura) {
        setMontoDejarApertura(Number(cajaActiva.monto_dejar_apertura))
      }
      // Cargar conteo de billetes y monedas
      if (cajaActiva.conteo_billetes_monedas) {
        try {
          const conteo = typeof cajaActiva.conteo_billetes_monedas === 'string'
            ? JSON.parse(cajaActiva.conteo_billetes_monedas)
            : cajaActiva.conteo_billetes_monedas
          setConteoDenominaciones(conteo)
        } catch (e) {
          console.warn('Error al parsear conteo_billetes_monedas:', e)
        }
      }
    }
  }, [cajaActiva])

  const handleSupervisorChange = (value: string | undefined, option: any) => {
    if (value) {
      setSupervisorId(value)
      setSupervisorNombre(option?.label || '')
      setSupervisorPassword('') // Limpiar contraseña anterior
      
      // CORREGIDO: En modo re-cierre con supervisor ya validado, no pedir contraseña nuevamente
      if (isReCierre && supervisorValidadoUrl && value === supervisorIdUrl) {
        setSupervisorValidado(true)
        console.log('✅ Supervisor ya validado, no se requiere contraseña')
      } else {
        setModalSupervisorOpen(true) // Abrir modal para validar
      }
    } else {
      setSupervisorId(undefined)
      setSupervisorNombre('')
      setSupervisorPassword('')
    }
  }

  const handleSupervisorPasswordConfirm = async (password: string) => {
    if (!supervisorId) return

    setValidandoSupervisor(true)
    try {
      console.log('🔐 Validando supervisor con ID:', supervisorId)
      const response: any = await apiRequest('/cajas/cierre/validar-supervisor', {
        method: 'POST',
        data: {
          supervisor_id: supervisorId,
          supervisor_password: password
        }
      })

      // El apiRequest envuelve el JSON en { data: body } o { error: ... }
      const resData = response?.data;
      console.log('📥 Respuesta de validación:', resData)

      if (resData && resData.success) {
        console.log('✅ Supervisor validado, guardando contraseña')
        setSupervisorPassword(password)
        setSupervisorValidado(true)
        setModalSupervisorOpen(false)
        message.success('Supervisor autorizado correctamente')
        console.log('🔍 Estado después de validar:', { supervisorId, password: '***' })
      } else {
        const errorMsg = resData?.message || response?.error?.message || 'Contraseña de supervisor incorrecta'
        message.error(errorMsg)
      }
    } catch (error: any) {
      console.error('❌ Error al validar supervisor:', error)
      message.error('Error al conectar con el servidor para validar supervisor')
    } finally {
      setValidandoSupervisor(false)
    }
  }

  const handleSupervisorPasswordCancel = () => {
    // Si cancela, limpiar la selección
    setSupervisorId(undefined)
    setSupervisorNombre('')
    setSupervisorPassword('')
    setModalSupervisorOpen(false)
  }

  const handleEnviarTicket = async () => {
    if (!emailReporte) {
      message.warning('Por favor ingrese un email para enviar el ticket')
      return
    }

    if (!cajaActiva?.id) {
      message.error('No hay caja activa para enviar el ticket')
      return
    }

    if (!empresaData) {
      message.error('No se pudieron cargar los datos de la empresa')
      return
    }

    try {
      setEnviandoTicket(true)

      // Generar el PDF desde el backend
      const token = getAuthToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const pdfRes = await fetch(`${API_URL}/pdf/cierre-caja/${cajaActiva.id}?formato=ticket`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      })
      if (!pdfRes.ok) throw new Error(`Error PDF: ${pdfRes.status}`)
      const pdfBlob = await pdfRes.blob()

      // Enviar el PDF al backend
      await cierreCajaApi.enviarTicketEmail(cajaActiva.id, emailReporte, pdfBlob)

      // Guardar el email y mostrar modal de éxito
      setEmailEnviado(emailReporte)
      setModalExitoOpen(true)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Error al enviar el ticket'
      message.error(errorMsg)
      console.error('Error al enviar ticket:', error)
    } finally {
      setEnviandoTicket(false)
    }
  }

  const handleVerTicket = () => {
    setModalTicketOpen(true)
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

  // Solo mostramos el estado vacío si NUNCA se cargó nada; un error de fondo
  // transitorio (ej. una recarga en tiempo real que llega justo al cerrar,
  // ver el efecto de arriba) no debe borrar una caja ya cargada en pantalla.
  if (!cajaActiva) {
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

  // Calcular el efectivo esperado (solo el método "Efectivo")
  const efectivoEsperado = resumen.detalle_metodos_pago
    ?.filter((metodo: any) =>
      metodo.label?.toLowerCase().includes('efectivo')
    )
    .reduce((sum: number, metodo: any) => sum + Number(metodo.total), 0) || 0

  // Monto esperado de EFECTIVO: usar el del BACKEND, que ya incluye TODO (efectivo inicial
  // + ventas efectivo + ingresos extras + préstamos recibidos − gastos efectivo − préstamos
  // dados). Antes el front lo recalculaba a medias e ignoraba ingresos extras/gastos.
  const montoEsperado = resumen.monto_esperado != null
    ? Number(resumen.monto_esperado)
    : (resumen.efectivo_inicial || 0) + efectivoEsperado
  const diferencia = totalEfectivo - montoEsperado
  const faltante = diferencia < 0 ? Math.abs(diferencia) : 0
  const sobrante = diferencia > 0 ? diferencia : 0

  // Señal de que se tipeó el monto trasladado a bóveda en vez del remanente.
  // Solo tiene sentido avisarlo si además sobra plata: si el traslado fue de
  // S/50 y el remanente da S/50, la coincidencia es casual y no es un error.
  const totalTrasladosBoveda = Number(resumen?.total_traslados_boveda || 0)
  const coincideConTrasladoBoveda =
    totalTrasladosBoveda > 0 &&
    sobrante > 0 &&
    Math.abs(totalEfectivo - totalTrasladosBoveda) < 0.01

  // Otros ingresos de la sesión (incluye TRASLADOS DE EFECTIVO recibidos) y
  // gastos (pagos de compra, etc., sin los traslados a bóveda que tienen su
  // propia línea). El backend no envía total_otros_ingresos/total_gastos, por
  // eso se calculan desde los detalles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detalleIngresosList = Object.values(resumen?.detalle_ingresos || {}) as any[]
  const totalOtrosIngresos = detalleIngresosList.reduce((s, i) => s + Number(i?.monto || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detalleEgresosList = Object.values(resumen?.detalle_egresos || {}) as any[]

  // Se separa por el campo `tipo` que manda el backend, no por el texto del
  // concepto (antes: `concepto.startsWith('TRASLADO A B')`, que solo apartaba
  // los traslados a bóveda). Los traslados de efectivo ya no llegan acá: el
  // backend no los cuenta como egreso del vendedor, porque salen del pozo
  // cerrado de la sub-caja y no de su sesión.
  const egresosSinBoveda = detalleEgresosList.filter((e) => e?.tipo !== 'traslado_boveda')

  const totalGastosSesion = egresosSinBoveda.reduce((s, e) => s + Number(e?.monto || 0), 0)

  const handleFinalizarCaja = async () => {
    if (totalEfectivo === 0 || (cajaYaFinalizada && !isReCierre)) {
      return
    }

    // Preparar datos
    const dataCierre: any = {
      monto_cierre_efectivo: totalEfectivo,
      total_cuentas: totalCuentas || 0,
      comentarios: comentarios || undefined,
      conteo_billetes_monedas: conteoDenominaciones || undefined,
      email_reporte: emailReporte || undefined,
      whatsapp_reporte: whatsappReporte || undefined,
      monto_dejar_apertura: montoDejarApertura > 0 ? montoDejarApertura : undefined,
    }

    // CORREGIDO: Solo incluir supervisor si tenemos el password
    // En modo re-cierre con supervisor pre-validado, NO enviar supervisor_id
    // porque el backend ya lo tiene registrado del cierre anterior
    if (supervisorId && supervisorPassword) {
      dataCierre.supervisor_id = supervisorId
      dataCierre.supervisor_password = supervisorPassword
      console.log('🔍 Enviando supervisor:', { supervisorId, supervisorNombre, tienePassword: true })
    } else {
      console.log('⚠️ No se envía supervisor (no validado con password en esta sesión)')
    }

    console.log('📤 Datos de cierre a enviar:', dataCierre)

    // Pasar cajaActiva y empresaData para el envío automático del PDF
    const success = await cerrarCaja(cajaActiva.id, dataCierre, cajaActiva, empresaData, isReCierre)

    if (success) {
      arqueoFinalizadoRef.current = true
      setArqueoFinalizado(true)
      // Mostrar automáticamente el ticket de cierre (si el usuario dejó activo "Ticket Caja")
      if (ticketCaja) {
        setModalTicketOpen(true)
      }
      // En re-cierre esto además quita `re_cierre=true` de la URL para que la
      // vista vuelva a modo solo lectura; en cierre normal persiste el ID para
      // que no se pierda al recargar. Se usa `pathname` en vez de una ruta fija
      // para no saltar de módulo.
      router.replace(`${pathname}?cierre_id=${cajaActiva.id}`)
    }
  }

  // Determinar si la caja ya fue finalizada previamente (viene cerrada del backend)
  const cajaYaFinalizada = cajaActiva.estado === 'cerrada';

  // CORREGIDO: El resumen se muestra SIEMPRE que la caja esté cerrada, sin importar la fecha
  // Solo en modo re-cierre se permite editar
  // CORREGIDO: El resumen se muestra SIEMPRE
  const mostrarResumen = true;

  // CORREGIDO: Si está finalizado (y NO es re-cierre), TODO está bloqueado basado ÚNICAMENTE en el backend
  // En modo Re-Cierre se permite editar el conteo
  const isFormDisabled = (arqueoFinalizado || cajaYaFinalizada) && !isReCierre;

  // DEBUG: Logs para verificar el estado
  console.log('🔍 Estado de cierre:', {
    'cajaActiva.estado': cajaActiva.estado,
    cajaYaFinalizada,
    isReCierre,
    mostrarResumen,
    isFormDisabled,
    'tiene resumen': !!resumen
  });

  return (
    <div className='p-3 space-y-2 w-full'>
      {/* Header con información de caja */}
      <Card className='bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 w-full' bodyStyle={{ padding: '12px 16px' }}>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-lg font-bold text-slate-800 mb-1'>
              {cajaActiva.sub_caja_chica?.nombre || cajaActiva.caja_principal?.nombre || 'Caja'} al <span className='text-orange-600'>{new Date(cajaActiva.fecha_apertura).toLocaleString('es-PE')}</span>
            </h2>
            <div className='flex gap-4 text-xs text-slate-600'>
              <span>Usuario: <strong className='text-slate-800'>{cajaActiva.user?.name || 'N/A'}</strong></span>
              <span>Estado: <strong className='text-slate-800'>{cajaActiva.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Campo de Supervisor - ARRIBA */}
      <ConfigurableElement componentId='cierre-caja.supervisor' label='Sección de Supervisión'>
      <Card className='bg-amber-50 border border-amber-200 w-full' bodyStyle={{ padding: '16px' }}>
        <div className='text-sm font-semibold text-amber-800 mb-3'>Supervisión (Opcional)</div>
        <div className='grid grid-cols-1 gap-3'>
          <div>
            <div className='text-xs font-medium text-slate-600 mb-1'>
              Supervisor (opcional)
              {supervisorId && supervisorValidado && (
              <span className='ml-2 text-green-600'>✓ Validado</span>
              )}
            </div>
            <SelectSupervisor
              value={supervisorId}
              onChange={handleSupervisorChange}
              size='small'
              disabled={cajaYaFinalizada && !isReCierre}
            />
            {supervisorId && !supervisorValidado && (
              <div className='mt-2 text-xs text-orange-600'>
                ⚠️ Debes validar la contraseña del supervisor
              </div>
            )}
          </div>
        </div>
      </Card>
      </ConfigurableElement>

      {/* Modal de validación de supervisor */}
      <ModalValidarSupervisor
        open={modalSupervisorOpen}
        supervisorNombre={supervisorNombre}
        onConfirm={handleSupervisorPasswordConfirm}
        onCancel={handleSupervisorPasswordCancel}
        loading={validandoSupervisor}
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
                <div className={`grid ${mostrarResumen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'} gap-4 w-full`}>
                  {/* Columna Izquierda: Resumen de Cierre */}
                  {mostrarResumen && (
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
                        <div className='flex justify-between items-center py-2 px-4 bg-amber-50 border-b border-amber-200'>
                          <span className='text-base font-semibold text-amber-700'>Apertura</span>
                          <div className='flex items-center gap-2.5'>
                            <span className='text-base font-semibold text-amber-700 min-w-[100px] text-right'>
                              {Number(resumen?.efectivo_inicial || 0).toFixed(2)}
                            </span>
                            <Button
                              size='small'
                              type='text'
                              icon={<FaSearch className='text-sm text-amber-600' />}
                              className='h-7 w-7 p-0'
                              onClick={() => handleOpenDetalle('apertura')}
                            />
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
                                <Button
                                  size='small'
                                  type='text'
                                  icon={<FaSearch className='text-sm text-amber-600' />}
                                  className='h-7 w-7 p-0'
                                  onClick={() => handleOpenDetalle(`metodo:${metodo.label}`)}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                            <span className='text-sm text-slate-500 italic'>Sin cobros registrados</span>
                          </div>
                        )}

                        <div className='border-t border-slate-300 my-1'></div>

                        {/* Otros Ingresos (incluye traslados de efectivo recibidos) */}
                        {totalOtrosIngresos > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-emerald-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-base text-emerald-700'>Otros Ingresos / Traslados Recibidos</span>
                              <span className='text-xs text-emerald-600'>({detalleIngresosList.length})</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-emerald-700 min-w-[100px] text-right'>
                                {totalOtrosIngresos.toFixed(2)}
                              </span>
                              <button
                                type='button'
                                className='h-7 w-7 p-0 flex items-center justify-center hover:bg-emerald-100 rounded'
                                onClick={() => handleOpenDetalle('otros_ingresos')}
                              >
                                <FaSearch className='text-sm text-emerald-600' />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* INGRESOS EXTRAS (NUEVO) */}
                        {(resumen?.total_ingresos_extras || 0) > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-green-50'>
                            <span className='text-base font-semibold text-green-700'>Ingresos Extras</span>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-green-700 min-w-[100px] text-right'>
                                {(resumen.total_ingresos_extras || 0).toFixed(2)}
                              </span>
                              <button
                                type='button'
                                className='h-7 w-7 p-0 flex items-center justify-center hover:bg-green-100 rounded'
                                onClick={() => handleOpenDetalle('ingreso_extra')}
                              >
                                <FaSearch className='text-sm text-green-600' />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Préstamos Recibidos */}
                        {(resumen?.total_prestamos_recibidos || 0) > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-amber-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-base text-amber-700'>Préstamos Recibidos</span>
                              <span className='text-xs text-amber-600'>({resumen?.prestamos_recibidos?.length || 0})</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-amber-700 min-w-[100px] text-right'>
                                {(resumen?.total_prestamos_recibidos || 0).toFixed(2)}
                              </span>
                              <button
                                type='button'
                                className='h-7 w-7 p-0 flex items-center justify-center hover:bg-slate-200 rounded'
                                onClick={() => handleOpenDetalle('prestamos_recibidos')}
                              >
                                <FaSearch className='text-sm text-amber-600' />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Gastos / Pagos de la sesión (sin traslados a bóveda, que tienen su línea) */}
                        {totalGastosSesion > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-red-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-base text-red-700'>Gastos / Pagos</span>
                              <span className='text-xs text-red-500'>({egresosSinBoveda.length})</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-red-700 min-w-[100px] text-right'>
                                {totalGastosSesion.toFixed(2)}
                              </span>
                              <button
                                type='button'
                                className='h-7 w-7 p-0 flex items-center justify-center hover:bg-red-100 rounded'
                                onClick={() => handleOpenDetalle('gastos')}
                              >
                                <FaSearch className='text-sm text-red-600' />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* GASTOS EXTRAS (NUEVO) */}
                        {(resumen?.total_gastos_extras || 0) > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-orange-50'>
                            <span className='text-base font-semibold text-orange-700'>Gastos Extras</span>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-orange-700 min-w-[100px] text-right'>
                                {(resumen.total_gastos_extras || 0).toFixed(2)}
                              </span>
                              <button
                                type='button'
                                className='h-7 w-7 p-0 flex items-center justify-center hover:bg-orange-100 rounded'
                                onClick={() => handleOpenDetalle('gasto_extra')}
                              >
                                <FaSearch className='text-sm text-orange-600' />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Préstamos Dados */}
                        {(resumen?.total_prestamos_dados || 0) > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 hover:bg-orange-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-base text-orange-700'>Préstamos Dados</span>
                              <span className='text-xs text-orange-600'>({resumen?.prestamos_dados?.length || 0})</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-semibold text-orange-700 min-w-[100px] text-right'>
                                {(resumen?.total_prestamos_dados || 0).toFixed(2)}
                              </span>
                              <Button
                                size='small'
                                type='text'
                                icon={<FaSearch className='text-sm text-orange-600' />}
                                className='h-7 w-7 p-0'
                                onClick={() => handleOpenDetalle('prestamos_dados')}
                              />
                            </div>
                          </div>
                        )}

                        <div className='border-t border-slate-300 my-1'></div>
                        {/* Resumen Ventas */}
                        <div className='flex justify-between items-center py-2.5 px-4 bg-amber-50 border border-amber-300 rounded mt-1'>
                          <span className='text-base font-bold text-amber-800'>Resumen Ventas</span>
                          <span className='text-lg font-bold text-amber-800'>
                            {(resumen?.total_ventas || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Resumen Ingresos/Egresos (TODOS los métodos: efectivo + digital) */}
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
                        {/* SOLO EFECTIVO, redondeado a 0.10 (para cuadrar el efectivo físico) */}
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                          <span className='text-base font-medium text-emerald-700'>Resumen Ingreso Total Efectivo</span>
                          <span className='text-base font-semibold text-emerald-700'>
                            {(resumen?.resumen_ingresos_efectivo ?? resumen?.total_ingresos ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100'>
                          <span className='text-base font-medium text-emerald-700'>Resumen Egreso Total Efectivo</span>
                          <span className='text-base font-semibold text-emerald-700'>
                            {(resumen?.resumen_egresos_efectivo ?? resumen?.total_egresos ?? 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Traslados a Bóveda (resta del total: el efectivo sale físicamente) */}
                        {(resumen?.total_traslados_boveda || 0) > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 bg-blue-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-semibold text-blue-700'>Traslados a Bóveda</span>
                              <span className='text-xs text-blue-500'>({resumen?.traslados_boveda?.length || 0})</span>
                              <span className='text-xs text-blue-600 italic'>(resta del total)</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-base font-bold text-blue-700 min-w-[100px] text-right'>
                                {(resumen?.total_traslados_boveda || 0).toFixed(2)}
                              </span>
                              <Button
                                size='small'
                                type='text'
                                icon={<FaSearch className='text-sm text-blue-600' />}
                                className='h-7 w-7 p-0'
                                onClick={() => handleOpenDetalle('traslados_boveda')}
                              />
                            </div>
                          </div>
                        )}

                        {/* Movimientos Internos (informativo, no afecta total) */}
                        {resumen?.movimientos_internos && resumen.movimientos_internos.length > 0 && (
                          <div className='flex justify-between items-center py-2 px-4 border-b border-slate-100 bg-amber-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm text-amber-700'>Movimientos Internos</span>
                              <span className='text-xs text-amber-500'>({resumen.movimientos_internos.length})</span>
                              <span className='text-xs text-amber-600 italic'>(no afecta total)</span>
                            </div>
                            <div className='flex items-center gap-2.5'>
                              <span className='text-sm font-semibold text-amber-700 min-w-[100px] text-right'>
                                {resumen.movimientos_internos.reduce((sum: number, m: any) => sum + Number(m.monto), 0).toFixed(2)}
                              </span>
                              <Button
                                size='small'
                                type='text'
                                icon={<FaSearch className='text-sm text-amber-600' />}
                                className='h-7 w-7 p-0'
                                onClick={() => handleOpenDetalle('movimientos_internos')}
                              />
                            </div>
                          </div>
                        )}

                        {/* Total en Caja */}
                        <div className='flex justify-between items-center py-3 px-4 bg-slate-100 border border-slate-400 rounded mt-1'>
                          <span className='text-lg font-bold text-slate-800'>Total en Caja</span>
                          <span className='text-xl font-bold text-slate-800'>
                            {montoEsperado.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

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
                    className='shadow-sm w-full mt-8'
                    bodyStyle={{ padding: '16px' }}
                    headStyle={{ padding: '10px 16px', minHeight: 'auto' }}
                  >
                    <ConteoDinero
                      disabled={isFormDisabled}
                      onChange={(total, conteo) => {
                        console.log('📊 ConteoDinero onChange recibido:', { total, conteo })
                        setTotalEfectivo(total)
                        setConteoDenominaciones(conteo)
                      }} />

                    <div className='mt-4 pt-3 border-t border-dashed border-slate-300'>
                      <div className='text-sm font-semibold text-slate-700 mb-2'>Dejar efectivo para próxima apertura</div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-slate-500'>S/</span>
                        <InputNumber
                          value={montoDejarApertura}
                          onChange={(val) => setMontoDejarApertura(val ?? 0)}
                          min={0}
                          max={totalEfectivo}
                          size='small'
                          className='w-full'
                          disabled={isFormDisabled}
                        />
                      </div>
                      <div className='text-xs text-slate-400 mt-1'>
                        Monto máximo: S/ {totalEfectivo.toFixed(2)}
                      </div>
                    </div>

                    <div className='mt-3 space-y-2.5'>
                      <Checkbox
                        checked={ticketCaja}
                        onChange={(e) => setTicketCaja(e.target.checked)}
                        className='text-sm'
                        disabled={isFormDisabled}
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
                          disabled={isFormDisabled}
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
                          disabled={isFormDisabled}
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
                          disabled={isFormDisabled}
                        />
                      </div>

                      {/* Diferencias (Se muestra siempre para transparencia total) */}
                      {true && (
                        <div className='bg-slate-50 rounded p-3 space-y-1.5'>
                          <div className='flex justify-between items-center'>
                            <span className='text-sm font-medium text-slate-700'>Diferencias</span>
                            <span className={`text-lg font-bold ${faltante > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                              {faltante > 0 ? `-${faltante.toFixed(2)}` : '0.00'}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-sm font-medium text-slate-700'>Sobrante</span>
                            <span className={`text-lg font-bold ${sobrante > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                              {sobrante.toFixed(2)}
                            </span>
                          </div>

                          {/* El error que motivó esto: se cerró tipeando el monto que
                              acababa de trasladarse a la bóveda (plata que YA NO está
                              en el cajón) en vez del remanente, y quedó grabado un
                              sobrante de S/10,100.80 que nunca existió. */}
                          {coincideConTrasladoBoveda && (
                            <div className='rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800'>
                              <strong>Revisa el monto.</strong> Lo que ingresaste coincide con
                              lo que trasladaste a la bóveda en esta sesión
                              (S/ {(resumen?.total_traslados_boveda || 0).toFixed(2)}). Esa plata
                              ya salió del cajón: acá va solo el efectivo que te queda, que según
                              el sistema es S/ {montoEsperado.toFixed(2)}.
                            </div>
                          )}

                          {sobrante > 0 && !coincideConTrasladoBoveda && (
                            <div className='rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                              Vas a cerrar con S/ {sobrante.toFixed(2)} de más sobre lo esperado
                              (S/ {montoEsperado.toFixed(2)}). Si no es correcto, revisa el conteo
                              antes de finalizar.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className='space-y-2 pt-1'>
                        <div className='flex gap-2'>
                          <ConfigurableElement
                            componentId='cierre-caja.boton-enviar-ventas'
                            label='Botón Ventas Enviar'
                          >
                            <Button
                              type='primary'
                              icon={<FaCheckCircle />}
                              className='flex-1 bg-amber-600 hover:bg-amber-700 text-sm'
                              size='large'
                              loading={enviandoTicket}
                              onClick={handleEnviarTicket}
                              disabled={!emailReporte}
                            >
                              Ventas Enviar
                            </Button>
                          </ConfigurableElement>
                          <ConfigurableElement
                            componentId='cierre-caja.boton-ganancias'
                            label='Botón + Ganancias'
                          >
                            <Button
                              type='default'
                              className='flex-1 text-sm'
                              size='large'
                            >
                              + Ganancias
                            </Button>
                          </ConfigurableElement>
                        </div>
                        <div className='flex gap-2'>
                          <ConfigurableElement
                            componentId='cierre-caja.boton-ver-ticket'
                            label='Botón Ver Ticket'
                          >
                            <Button
                              type='default'
                              className='flex-1 text-sm border-amber-400 text-amber-600 hover:bg-amber-50'
                              size='large'
                              onClick={handleVerTicket}
                            >
                              Ver Ticket
                            </Button>
                          </ConfigurableElement>

                          {/* Estado 1: Caja abierta - Botón Finalizar */}
                          {!cajaYaFinalizada && !arqueoFinalizado && !isReCierre && (
                            <ConfigurableElement
                              componentId='cierre-caja.boton-finalizar'
                              label='Botón Finalizar Caja'
                            >
                              <Button
                                type='primary'
                                icon={<FaCheckCircle />}
                                className='flex-1 text-sm bg-green-600 hover:bg-green-700'
                                size='large'
                                loading={loadingCierre}
                                onClick={handleFinalizarCaja}
                                disabled={totalEfectivo === 0}
                              >
                                Finalizar caja [F10]
                              </Button>
                            </ConfigurableElement>
                          )}

                          {/* Estado 2: Caja cerrada (solo lectura) - Botón Volver (SIEMPRE visible cuando está cerrada) */}
                          {(cajaYaFinalizada || arqueoFinalizado) && !isReCierre && (
                            <Button
                              type='primary'
                              className='flex-1 text-sm bg-amber-600 hover:bg-amber-700'
                              size='large'
                              onClick={() => router.push('/ui/gestion-contable-y-financiera/mis-aperturas-cierres')}
                            >
                              Volver al Historial
                            </Button>
                          )}

                          {/* Estado 3: Re-Cierre - Botón Re-Cerrar */}
                          {isReCierre && (
                            <ConfigurableElement
                              componentId='cierre-caja.boton-re-cerrar'
                              label='Botón Re-Cerrar Caja'
                            >
                              <Button
                                type='primary'
                                icon={<FaCheckCircle />}
                                className='flex-1 text-sm bg-orange-600 hover:bg-orange-700'
                                size='large'
                                loading={loadingCierre}
                                onClick={handleFinalizarCaja}
                                disabled={totalEfectivo === 0}
                              >
                                Re-Cerrar Caja
                              </Button>
                            </ConfigurableElement>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ),
          },
          ...(mostrarResumen ? [{
            key: '2',
            label: 'Resumen detalle',
            children: <ResumenDetalleCierre resumen={resumen} montoEsperado={montoEsperado} aperturaId={cajaActiva.id} />,
          }] : []),
        ]}
      />

      {/* Modal de Ticket de Cierre */}
      <ModalTicketCierre
        open={modalTicketOpen}
        setOpen={setModalTicketOpen}
        data={cajaActiva}
      />

      {/* Modal de Detalle (Lupa) */}
      <ModalDetalleCierre
        open={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        tipo={detalleTipo}
        resumen={resumen}
        aperturaId={cajaActiva?.id}
      />

      {/* Modal de Éxito al Enviar */}
      <Modal
        open={modalExitoOpen}
        onOk={() => setModalExitoOpen(false)}
        onCancel={() => setModalExitoOpen(false)}
        footer={[
          <Button key='ok' type='primary' onClick={() => setModalExitoOpen(false)}>
            Entendido
          </Button>
        ]}
        width={500}
        centered
      >
        <div className='text-center py-4'>
          <div className='mb-4'>
            <FaCheckCircle className='text-6xl text-green-500 mx-auto' />
          </div>
          <h2 className='text-2xl font-bold text-slate-800 mb-3'>
            ¡Ticket enviado exitosamente!
          </h2>
          <p className='text-base text-slate-600 mb-2'>
            El ticket de cierre de caja ha sido enviado correctamente a:
          </p>
          <p className='text-lg font-semibold text-blue-600 mb-4'>
            {emailEnviado}
          </p>
          <p className='text-sm text-slate-500'>
            Por favor, revise su bandeja de entrada. Si no lo encuentra, verifique la carpeta de spam.
          </p>
        </div>
      </Modal>
    </div>
  )
}
