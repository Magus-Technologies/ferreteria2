'use client'

import { Tag, Spin, Button, Modal, Tooltip, message, Tabs } from 'antd'
import { FilePdfOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { FaShoppingCart, FaWrench, FaMapMarkerAlt, FaMoneyBillWave, FaRegBuilding, FaDownload, FaPrint, FaCar, FaCalendarTimes, FaHourglassHalf } from 'react-icons/fa'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { getAuthToken } from '~/lib/api'
import type { RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import { useState, useEffect } from 'react'
import SelectBase from '~/app/_components/form/selects/select-base'
import { cargosHierarchyApi } from '~/lib/api/cargos-hierarchy'
import { useAuth } from '~/lib/auth-context'

/**
 * Calcula el fin de un servicio según su inicio + duración (igual lógica que
 * el backend en BloqueMantenimientoCalculator).
 */
function calcularFinServicio(inicioStr: string | null | undefined, cantidad: number | null | undefined, unidad: string | null | undefined): dayjs.Dayjs | null {
  if (!inicioStr) return null
  const start = dayjs(inicioStr)
  if (!cantidad || !unidad) return start.add(2, 'hour')
  const cant = Number(cantidad)
  const uni = String(unidad).toLowerCase()
  if (uni === 'dias' || uni === 'día' || uni === 'dia') {
    return start.add(Math.max(cant - 1, 0), 'day').endOf('day')
  }
  if (uni === 'horas' || uni === 'hora') return start.add(cant, 'hour')
  if (uni === 'minutos' || uni === 'minuto') return start.add(cant, 'minute')
  return start.add(2, 'hour')
}

/**
 * Formatea una duración (cantidad + unidad) en texto legible:
 *  120 minutos → "2h 0m"
 *  3 dias      → "3 días"
 */
function formatDuracion(cantidad: number | null | undefined, unidad: string | null | undefined): string {
  if (!cantidad || !unidad) return '—'
  const cant = Number(cantidad)
  const uni = String(unidad).toLowerCase()
  if (uni === 'minutos' || uni === 'minuto') {
    if (cant < 60) return `${cant} min`
    const h = Math.floor(cant / 60)
    const m = cant % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }
  if (uni === 'horas' || uni === 'hora') return `${cant}h`
  if (uni === 'dias' || uni === 'día' || uni === 'dia') return `${cant} día${cant === 1 ? '' : 's'}`
  return `${cant} ${unidad}`
}

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string; text: string }> = {
  BAJA: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' },
  MEDIA: { color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700' },
  ALTA: { color: 'red', bg: 'bg-red-50', text: 'text-red-700' },
  URGENTE: { color: 'volcano', bg: 'bg-red-50', text: 'text-red-700' },
}

const ESTADO_CONFIG: Record<string, { color: string; label: string }> = {
  pendiente: { color: 'processing', label: 'PENDIENTE' },
  aprobado: { color: 'success', label: 'APROBADO' },
  rechazado: { color: 'error', label: 'RECHAZADO' },
  anulado: { color: 'default', label: 'ANULADO' },
}

interface ModalDetalleRequerimientoProps {
  open: boolean
  requerimiento: RequerimientoInterno | null
  loading?: boolean
  onClose: () => void
}

export default function ModalDetalleRequerimiento({
  open,
  requerimiento,
  loading = false,
  onClose,
}: ModalDetalleRequerimientoProps) {
  const { user } = useAuth()
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [docPdfUrl, setDocPdfUrl] = useState<string | null>(null)
  const [docPdfLoading, setDocPdfLoading] = useState(false)
  const [escalationModalOpen, setEscalationModalOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<number | null>(null)
  const [parentCargoInfo, setParentCargoInfo] = useState<{ id: number; descripcion: string } | null>(null)
  const [escalationLoading, setEscalationLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [servicioModalOpen, setServicioModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Cargar cargo padre del requerimiento para escalación
  useEffect(() => {
    if (escalationModalOpen && requerimiento) {
      loadParentCargoForEscalation()
    }
  }, [escalationModalOpen, requerimiento])

  useEffect(() => {
    if (!loading && requerimiento) {
      const esOS = requerimiento.tipo_solicitud?.toLowerCase() === 'os'
      const tieneProductos = requerimiento.productos && requerimiento.productos.length > 0
      if (!esOS && tieneProductos) {
        setActiveTab('productos')
      } else {
        setActiveTab('general')
      }
    }
  }, [loading, requerimiento])

  const loadParentCargoForEscalation = async () => {
    try {
      const result = await cargosHierarchyApi.getAllCargos()
      const allCargos = result.data?.data || []
      
      // Encontrar el cargo del REQUERIMIENTO (no del usuario)
      const reqCargoObj = allCargos.find((c) => c.descripcion?.toLowerCase() === requerimiento?.cargo?.toLowerCase())
      const parentCode = reqCargoObj?.parent || null

      if (parentCode) {
        // Buscar el cargo padre por código
        const parentCargoObj = allCargos.find((c) => c.codigo === parentCode)
        if (parentCargoObj) {
          setParentCargoInfo({
            id: parentCargoObj.id,
            descripcion: parentCargoObj.descripcion
          })
          setSelectedCargo(parentCargoObj.id)
        }
      }
    } catch (error) {
      message.error('Error al cargar cargo superior')
      console.error(error)
    }
  }

  const handleAprobar = async () => {
    if (!requerimiento) return

    setApprovalLoading(true)
    try {
      await requerimientoInternoApi.aprobar(requerimiento.id)
      message.success('Requerimiento aprobado correctamente')
      onClose()
    } catch (error) {
      message.error('Error al aprobar el requerimiento')
      console.error(error)
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleEscalar = async () => {
    if (!requerimiento || !selectedCargo) {
      message.warning('Selecciona un cargo para escalar')
      return
    }

    setEscalationLoading(true)
    try {
      await requerimientoInternoApi.pasarAprobacion(requerimiento.id, {
        to_cargo_id: selectedCargo,
        reason: 'Escalado para revisión'
      })
      message.success('Requerimiento escalado correctamente')
      setEscalationModalOpen(false)
      setSelectedCargo(null)
      onClose()
    } catch (error) {
      message.error('Error al escalar el requerimiento')
      console.error(error)
    } finally {
      setEscalationLoading(false)
    }
  }

  // Verificar si el usuario actual puede aprobar
  const canApprove = requerimiento && 
    requerimiento.approval_state === 'en_revision' &&
    requerimiento.assigned_cargo_id &&
    user?.cargo === requerimiento.cargo

  if (!requerimiento) return null

  const esOS = requerimiento.tipo_solicitud === 'OS'
  const prioridadConfig = PRIORIDAD_CONFIG[requerimiento.prioridad] || PRIORIDAD_CONFIG.MEDIA
  const estadoConfig = ESTADO_CONFIG[requerimiento.estado] || ESTADO_CONFIG.pendiente

  const esHoras = requerimiento.duracion_unidad === 'horas'
  const esSemanas = requerimiento.duracion_unidad === 'semanas'

  const fechaFin = requerimiento.duracion_cantidad && requerimiento.fecha_requerida
    ? dayjs(requerimiento.fecha_requerida).add(
        Number(requerimiento.duracion_cantidad),
        esHoras ? 'hour' : esSemanas ? 'week' : 'day'
      ).format('DD/MM/YYYY')
    : null

  // ─────────────────────────────────────────────────────────────────
  // Cálculo del bloque de calendario derivado de los servicios.
  // Toma el inicio más temprano y el fin más tardío de todos los servicios
  // (misma lógica que BloqueMantenimientoCalculator del backend).
  // ─────────────────────────────────────────────────────────────────
  const tieneVehiculoBloqueo = esOS && Boolean(requerimiento.vehiculo_id) && Boolean(requerimiento.afecta_calendario)
  const serviciosLista = requerimiento.servicios ?? []

  const bloqueRangos = serviciosLista
    .map((srv) => {
      const inicio = srv.fecha_inicio_estimada ? dayjs(srv.fecha_inicio_estimada) : null
      const fin = calcularFinServicio(srv.fecha_inicio_estimada ?? null, srv.duracion_cantidad ?? null, srv.duracion_unidad ?? null)
      return inicio && fin ? { inicio, fin } : null
    })
    .filter((r): r is { inicio: dayjs.Dayjs; fin: dayjs.Dayjs } => r !== null)

  const bloqueInicio = bloqueRangos.length > 0 ? bloqueRangos.reduce((min, r) => (r.inicio.isBefore(min) ? r.inicio : min), bloqueRangos[0].inicio) : null
  const bloqueFin = bloqueRangos.length > 0 ? bloqueRangos.reduce((max, r) => (r.fin.isAfter(max) ? r.fin : max), bloqueRangos[0].fin) : null
  const bloqueDuracionMin = bloqueInicio && bloqueFin ? bloqueFin.diff(bloqueInicio, 'minute') : 0
  const bloqueDuracionTexto = (() => {
    if (!bloqueDuracionMin) return '—'
    const dias = Math.floor(bloqueDuracionMin / (60 * 24))
    const horas = Math.floor((bloqueDuracionMin % (60 * 24)) / 60)
    const mins = bloqueDuracionMin % 60
    const partes: string[] = []
    if (dias > 0) partes.push(`${dias} día${dias === 1 ? '' : 's'}`)
    if (horas > 0) partes.push(`${horas}h`)
    if (mins > 0 && dias === 0) partes.push(`${mins}m`)
    return partes.join(' ') || `${bloqueDuracionMin}m`
  })()

  return (
    <>
      <ModalForm
        open={open}
        setOpen={(isOpen) => {
          if (!isOpen) onClose()
        }}
        modalProps={{
          title: (
            <div className="flex items-center justify-between pr-8">
              <div>
                <TitleForm className="!pb-0">Detalle del Requerimiento</TitleForm>
                <span className="text-xs text-slate-400 font-mono tracking-wider">{requerimiento.codigo}</span>
              </div>
              <Tag color={estadoConfig.color} className="!font-bold !text-xs !rounded-full !px-3 !border-none">
                {estadoConfig.label}
              </Tag>
            </div>
          ),
          width: 900,
          centered: true,
          footer: (
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] text-slate-400 space-x-4">
                <span>Creado: {formatFechaPeru(requerimiento.created_at, 'DD/MM/YYYY HH:mm')}</span>
                <span>•</span>
                <span>Actualizado: {formatFechaPeru(requerimiento.updated_at, 'DD/MM/YYYY HH:mm')}</span>
              </div>
              <div className="flex gap-2">
                {canApprove && (
                  <>
                    <Tooltip title="Escalar a cargo superior para revisión">
                      <Button
                        icon={<QuestionCircleOutlined />}
                        onClick={() => setEscalationModalOpen(true)}
                        className="!rounded-lg !border-amber-600 !text-amber-600 hover:!border-amber-700 hover:!text-amber-700"
                      >
                        Escalar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Aprobar este requerimiento">
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleAprobar}
                        loading={approvalLoading}
                        className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg"
                      >
                        Aprobar
                      </Button>
                    </Tooltip>
                  </>
                )}
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => setPdfModalOpen(true)}
                  className="!rounded-lg !border-emerald-600 !text-emerald-600 hover:!border-emerald-700 hover:!text-emerald-700"
                >
                  Ver PDF
                </Button>
                <Button
                  type="primary"
                  onClick={onClose}
                  className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ),
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spin size="large" />
            <span className="text-slate-400 text-sm">Cargando información...</span>
          </div>
        ) : (
          <Tabs
            type="card"
            size="small"
            activeKey={activeTab}
            onChange={setActiveTab}
            className="!-mt-1"
            items={[
              ...(!esOS && requerimiento.productos && requerimiento.productos.length > 0 ? [{
                key: 'productos',
                label: <span className="flex items-center gap-1.5 text-xs"><FaShoppingCart size={12} /> Productos</span>,
                children: (
                  <div className="space-y-2">
                    {requerimiento.productos.map((prod, idx) => (
                      <div key={idx} className="bg-slate-50/80 hover:bg-slate-100/80 transition-colors p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{prod.producto?.name || '—'}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{prod.producto?.cod_producto || '—'}</p>
                        </div>
                        {prod.producto?.marca?.name && (
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Marca</p>
                            <p className="text-xs text-slate-600 font-medium">{prod.producto.marca.name}</p>
                          </div>
                        )}
                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Cantidad</p>
                          <p className="font-bold text-emerald-600">{prod.cantidad} <span className="text-[10px] text-slate-400 uppercase">{prod.unidad || prod.producto?.unidad_medida?.name || 'UND'}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              }] : []),
              {
                key: 'general',
                label: <span className="flex items-center gap-1.5 text-xs"><UserOutlined /> General</span>,
                children: (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 rounded-2xl border border-emerald-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                          {esOS ? <FaWrench size={20} /> : <FaShoppingCart size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag color={esOS ? 'green' : 'blue'} className="!rounded-full !px-3 !font-bold !text-[10px] !border-none !m-0">
                              {esOS ? 'ORDEN DE SERVICIO' : 'ORDEN DE COMPRA'}
                            </Tag>
                            <Tag color={prioridadConfig.color} className="!rounded-full !px-3 !font-bold !text-[10px] !border-none !m-0">
                              {requerimiento.prioridad}
                            </Tag>
{esOS && requerimiento.servicios && requerimiento.servicios.length > 0 && (
                              <Button
                                icon={<FaWrench size={14} />}
                                onClick={() => setServicioModalOpen(true)}
                                className="!rounded-lg !text-sm !h-9 !px-5 !bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-700 hover:!border-emerald-700 !font-semibold"
                              >
                                {requerimiento.servicios.length} Servicio(s)
                              </Button>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight">{requerimiento.titulo}</h2>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{requerimiento.codigo}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <InfoCard icon={<FaRegBuilding className="text-emerald-600" size={14} />} label="Cargo" value={requerimiento.cargo} />
                      <InfoCard icon={<CalendarOutlined className="text-emerald-600" />} label={esOS ? "Fecha Inicio" : "Fecha Requerida"} value={dayjs(requerimiento.fecha_requerida).format('DD/MM/YYYY')} />
                      {esOS && fechaFin ? (
                        <InfoCard icon={<CalendarOutlined className="text-emerald-600" />} label="Fecha Término" value={fechaFin} />
                      ) : (
                        <InfoCard icon={<UserOutlined className="text-emerald-600" />} label="Solicitante" value={requerimiento.user?.name || '—'} />
                      )}
                      {!esOS && (
                        <InfoCard icon={<UserOutlined className="text-emerald-600" />} label="Solicitante" value={requerimiento.user?.name || '—'} />
                      )}
                    </div>

                    {tieneVehiculoBloqueo && (
                      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <SectionTitle className="!mb-0 !text-amber-800"><FaCar className="text-amber-600 inline mr-1" size={14} /> Vehículo y Bloqueo de Calendario</SectionTitle>
                          {requerimiento.approval_state === 'aprobado' ? (
                            <Tag color="error" className="!font-bold !rounded-full !px-3 !border-none">VEHÍCULO BLOQUEADO</Tag>
                          ) : (
                            <Tag color="warning" className="!font-bold !rounded-full !px-3 !border-none">BLOQUEO PROGRAMADO (no aprobado)</Tag>
                          )}
                        </div>
                        {requerimiento.vehiculo && (
                          <div className="grid grid-cols-3 gap-3">
                            <InfoCard icon={<FaCar className="text-amber-600" size={14} />} label="Vehículo" value={requerimiento.vehiculo.name || '—'} />
                            <InfoCard icon={<FaRegBuilding className="text-amber-600" size={14} />} label="Placa" value={requerimiento.vehiculo.placa || '—'} />
                            <InfoCard icon={<FaWrench className="text-amber-600" size={14} />} label="Tipo" value={requerimiento.vehiculo.tipo || '—'} />
                          </div>
                        )}
                        {bloqueInicio && bloqueFin ? (
                          <div className="grid grid-cols-3 gap-3 bg-white/70 p-3 rounded-xl border border-amber-100">
                            <div className="flex flex-col gap-1 items-center text-center">
                              <FaCalendarTimes className="text-amber-600" size={16} />
                              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Fuera de servicio desde</span>
                              <span className="font-bold text-slate-800 text-sm">{bloqueInicio.format('DD/MM/YYYY')}</span>
                              <span className="text-xs text-slate-500 font-mono">{bloqueInicio.format('HH:mm')}</span>
                            </div>
                            <div className="flex flex-col gap-1 items-center text-center">
                              <FaCalendarTimes className="text-rose-600" size={16} />
                              <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Fuera de servicio hasta</span>
                              <span className="font-bold text-slate-800 text-sm">{bloqueFin.format('DD/MM/YYYY')}</span>
                              <span className="text-xs text-slate-500 font-mono">{bloqueFin.format('HH:mm')}</span>
                            </div>
                            <div className="flex flex-col gap-1 items-center text-center">
                              <FaHourglassHalf className="text-emerald-600" size={16} />
                              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Duración total</span>
                              <span className="font-bold text-emerald-700 text-base">{bloqueDuracionTexto}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/70 p-3 rounded-xl border border-amber-100 text-xs text-amber-700 italic text-center">
                            No se podrá calcular el bloqueo hasta que cada servicio tenga fecha de inicio y duración definidas.
                          </div>
                        )}
                      </div>
                    )}

                    {requerimiento.observaciones && (
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Observaciones</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic border-l-3 border-emerald-400 pl-3">{requerimiento.observaciones}</p>
                      </div>
                    )}

                    {requerimiento.proveedor_sugerido && (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><FaRegBuilding size={16} /></div>
                        <div className="flex-1">
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Proveedor Sugerido</p>
                          <p className="font-bold text-slate-800 text-sm">{requerimiento.proveedor_sugerido.razon_social}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-blue-500 font-bold uppercase">RUC</p>
                          <p className="text-sm text-slate-700 font-mono">{requerimiento.proveedor_sugerido.ruc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </ModalForm>

      <Modal
        open={pdfModalOpen}
        onCancel={() => {
          setPdfModalOpen(false)
          if (docPdfUrl) { URL.revokeObjectURL(docPdfUrl); setDocPdfUrl(null) }
        }}
        width={900}
        centered
        title={`PDF - ${requerimiento.codigo}`}
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Tooltip title="Descargar PDF">
                <ButtonBase
                  disabled={!docPdfUrl}
                  onClick={() => {
                    if (!docPdfUrl) return
                    const a = document.createElement('a')
                    a.href = docPdfUrl
                    a.download = `${requerimiento.codigo}-LOG-F-03.pdf`
                    a.click()
                  }}
                >
                  <FaDownload />
                </ButtonBase>
              </Tooltip>
              <Tooltip title="Imprimir">
                <ButtonBase
                  disabled={!docPdfUrl}
                  onClick={() => {
                    if (!docPdfUrl) return
                    const w = window.open(docPdfUrl)
                    w?.addEventListener('load', () => w.print())
                  }}
                >
                  <FaPrint />
                </ButtonBase>
              </Tooltip>
            </div>
            <Button type="primary" onClick={() => { setPdfModalOpen(false); if (docPdfUrl) { URL.revokeObjectURL(docPdfUrl); setDocPdfUrl(null) } }} className={classOkButtonModal}>
              Cerrar
            </Button>
          </div>
        }
        afterOpenChange={async (open) => {
          if (open && requerimiento) {
            setDocPdfLoading(true)
            try {
              const token = getAuthToken()
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/requerimiento-interno/${requerimiento.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!res.ok) throw new Error('Error al generar PDF')
              const blob = await res.blob()
              setDocPdfUrl(URL.createObjectURL(blob))
            } catch { setDocPdfUrl(null) } finally { setDocPdfLoading(false) }
          }
        }}
      >
        {docPdfLoading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : docPdfUrl ? (
          <iframe src={docPdfUrl} className="w-full" style={{ height: '70vh' }} />
        ) : (
          <div className="flex justify-center py-12 text-slate-400">No se pudo cargar el PDF</div>
        )}
      </Modal>

      <Modal
        open={escalationModalOpen}
        onCancel={() => {
          setEscalationModalOpen(false)
          setSelectedCargo(null)
          setParentCargoInfo(null)
        }}
        title="Escalar Requerimiento"
        centered
        width={500}
        footer={[
          <Button key="cancel" onClick={() => { setEscalationModalOpen(false); setSelectedCargo(null); setParentCargoInfo(null) }}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={escalationLoading}
            onClick={handleEscalar}
            disabled={!selectedCargo || !parentCargoInfo}
            className={classOkButtonModal}
          >
            Escalar
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Nota:</strong> Este requerimiento será escalado al cargo superior en la jerarquía para su revisión y aprobación.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cargo Actual</label>
              <div className="text-sm font-semibold text-slate-700">{requerimiento?.cargo || '—'}</div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                ↑
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Escalado a</label>
              {parentCargoInfo ? (
                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded border border-emerald-200">
                  {parentCargoInfo.descripcion}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No hay cargo superior disponible</div>
              )}
            </div>
          </div>

          {parentCargoInfo && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-emerald-800">
              ✓ El requerimiento será enviado a <strong>{parentCargoInfo.descripcion}</strong> para su aprobación
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={servicioModalOpen}
        onCancel={() => setServicioModalOpen(false)}
        title={`Servicios - ${requerimiento.codigo}`}
        width={700}
        centered
        footer={<Button onClick={() => setServicioModalOpen(false)} type="primary">Cerrar</Button>}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {requerimiento.servicios && requerimiento.servicios.length > 0 ? (
            requerimiento.servicios.map((srv, idx) => {
              const inicioDayjs = srv.fecha_inicio_estimada ? dayjs(srv.fecha_inicio_estimada) : null
              const finDayjs = calcularFinServicio(srv.fecha_inicio_estimada ?? null, srv.duracion_cantidad ?? null, srv.duracion_unidad ?? null)
              return (
              <div key={idx} className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 space-y-4">
                <div className="flex gap-8 flex-wrap">
                  {srv.tipo_servicio && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Categoría</span>
                      <Tag color="emerald" className="!rounded-md !border-none !font-bold !m-0 !w-fit">{srv.tipo_servicio}</Tag>
                    </div>
                  )}
                  {srv.lugar_ejecucion && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1"><FaMapMarkerAlt size={10} /> Lugar</span>
                      <span className="font-semibold text-slate-700 text-sm">{srv.lugar_ejecucion}</span>
                    </div>
                  )}
                  {srv.presupuesto_referencial && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1"><FaMoneyBillWave size={10} /> Presupuesto</span>
                      <span className="font-bold text-emerald-600 text-sm">S/ {Number(srv.presupuesto_referencial).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {(inicioDayjs || srv.duracion_cantidad) && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-100/50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1"><CalendarOutlined /> Inicio</span>
                      <span className="font-semibold text-slate-700 text-sm">{inicioDayjs ? inicioDayjs.format('DD/MM/YYYY HH:mm') : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1"><FaCalendarTimes size={10} /> Fin estimado</span>
                      <span className="font-semibold text-slate-700 text-sm">{finDayjs ? finDayjs.format('DD/MM/YYYY HH:mm') : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1"><FaHourglassHalf size={10} /> Duración</span>
                      <span className="font-bold text-emerald-600 text-sm">{formatDuracion(srv.duracion_cantidad ?? null, srv.duracion_unidad ?? null)}</span>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-emerald-100/50">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Descripción / Tareas</span>
                  <p className="text-sm text-slate-800 font-medium mt-1 leading-relaxed">{srv.descripcion_servicio}</p>
                  {srv.detalles && (
                    <div className="mt-2 p-3 bg-white/60 rounded-lg border border-emerald-100/50 text-[11px] text-slate-500 italic">{srv.detalles}</div>
                  )}
                </div>
              </div>
              )
            })
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">No hay servicios registrados</div>
          )}
        </div>
      </Modal>
    </>
  )
}

/* ────────── Sub-components ────────── */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
      <div className="mb-1">{icon}</div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{label}</p>
      <p className="font-bold text-slate-700 text-sm truncate w-full">{value}</p>
    </div>
  )
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2 ${className}`}>
      <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block" />
      {children}
    </h3>
  )
}
