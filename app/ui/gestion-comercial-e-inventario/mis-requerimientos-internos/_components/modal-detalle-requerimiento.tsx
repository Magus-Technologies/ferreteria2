'use client'

import { Tag, Spin, Button } from 'antd'
import { FilePdfOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { FaShoppingCart, FaWrench, FaMapMarkerAlt, FaMoneyBillWave, FaRegBuilding } from 'react-icons/fa'
import RequerimientoInternoPdf from '~/components/pdf/requerimiento-interno-pdf'
import ModalPdfViewer from '~/components/modals/modal-pdf-viewer'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import type { RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import dayjs from 'dayjs'
import { useState } from 'react'

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
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const { data: empresa } = useEmpresaPublica()

  if (!requerimiento) return null

  const esOS = requerimiento.tipo_solicitud === 'OS'
  const prioridadConfig = PRIORIDAD_CONFIG[requerimiento.prioridad] || PRIORIDAD_CONFIG.MEDIA
  const estadoConfig = ESTADO_CONFIG[requerimiento.estado] || ESTADO_CONFIG.pendiente

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
                <span>Creado: {dayjs(requerimiento.created_at).format('DD/MM/YYYY HH:mm')}</span>
                <span>•</span>
                <span>Actualizado: {dayjs(requerimiento.updated_at).format('DD/MM/YYYY HH:mm')}</span>
              </div>
              <div className="flex gap-2">
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
          <div className="space-y-5 py-2">

            {/* ═══════ HERO HEADER ═══════ */}
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
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight">{requerimiento.titulo}</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{requerimiento.codigo}</p>
                </div>
              </div>
            </div>

            {/* ═══════ INFO GRID ═══════ */}
            <div className="grid grid-cols-4 gap-3">
              <InfoCard
                icon={<FaRegBuilding className="text-emerald-600" size={14} />}
                label="Área Solicitante"
                value={requerimiento.area}
              />
              <InfoCard
                icon={<CalendarOutlined className="text-emerald-600" />}
                label="Fecha Requerida"
                value={dayjs(requerimiento.fecha_requerida).format('DD/MM/YYYY')}
              />
              <InfoCard
                icon={<UserOutlined className="text-emerald-600" />}
                label="Solicitante"
                value={requerimiento.user?.name || '—'}
              />
              <InfoCard
                icon={<ClockCircleOutlined className="text-emerald-600" />}
                label="Fecha de Creación"
                value={dayjs(requerimiento.created_at).format('DD/MM/YYYY')}
              />
            </div>

            {/* ═══════ OBSERVACIONES ═══════ */}
            {requerimiento.observaciones && (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Observaciones</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic border-l-3 border-emerald-400 pl-3">
                  {requerimiento.observaciones}
                </p>
              </div>
            )}

            {/* ═══════ DETALLE OS (SERVICIO) ═══════ */}
            {esOS && requerimiento.servicio && (
              <div>
                <SectionTitle>Detalle del Servicio</SectionTitle>
                <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 space-y-4">
                  {/* Row 1: Tipo + Lugar + Duración */}
                  <div className="flex gap-8 flex-wrap">
                    {requerimiento.servicio.tipo_servicio && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Categoría de Servicio</span>
                        <Tag color="emerald" className="!rounded-md !border-none !font-bold !m-0 !w-fit">{requerimiento.servicio.tipo_servicio}</Tag>
                      </div>
                    )}
                    {requerimiento.servicio.lugar_ejecucion && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                          <FaMapMarkerAlt size={10} /> Lugar de Ejecución
                        </span>
                        <span className="font-semibold text-slate-700 text-sm">{requerimiento.servicio.lugar_ejecucion}</span>
                      </div>
                    )}
                    {requerimiento.servicio.duracion_cantidad && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Duración Estimada</span>
                        <Tag color="emerald" className="!rounded-md !border-none !font-bold !m-0 !w-fit">
                          {requerimiento.servicio.duracion_cantidad} {requerimiento.servicio.duracion_unidad}
                        </Tag>
                      </div>
                    )}
                    {requerimiento.servicio.fecha_inicio_estimada && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Fecha Inicio Estimada</span>
                        <span className="font-semibold text-slate-700 text-sm">
                          {dayjs(requerimiento.servicio.fecha_inicio_estimada).format('DD/MM/YYYY')}
                        </span>
                      </div>
                    )}
                    {requerimiento.servicio.presupuesto_referencial && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                          <FaMoneyBillWave size={10} /> Presupuesto Referencial
                        </span>
                        <span className="font-bold text-emerald-600 text-sm">S/ {requerimiento.servicio.presupuesto_referencial.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="pt-3 border-t border-emerald-100/50">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Descripción del Servicio</span>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap bg-white/60 p-3 rounded-lg border border-emerald-100/50">
                      {requerimiento.servicio.descripcion_servicio}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ DETALLE OC (PRODUCTOS) ═══════ */}
            {!esOS && requerimiento.productos && requerimiento.productos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionTitle className="!mb-0">Productos Solicitados</SectionTitle>
                  <Tag color="emerald" className="!rounded-full !px-3 !font-bold !border-none">
                    {requerimiento.productos.length} {requerimiento.productos.length === 1 ? 'Item' : 'Items'}
                  </Tag>
                </div>
                <div className="space-y-2">
                  {requerimiento.productos.map((prod, idx) => (
                    <div key={idx} className="bg-slate-50/80 hover:bg-slate-100/80 transition-colors p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
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
                        <p className="font-bold text-emerald-600">
                          {prod.cantidad} <span className="text-[10px] text-slate-400 uppercase">{prod.unidad || prod.producto?.unidad_medida?.name || 'UND'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════ PROVEEDOR SUGERIDO ═══════ */}
            {requerimiento.proveedor_sugerido && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FaRegBuilding size={16} />
                </div>
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
        )}
      </ModalForm>

      <ModalPdfViewer
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        document={<RequerimientoInternoPdf requerimiento={requerimiento} empresa={empresa} />}
        fileName={`${requerimiento.codigo}-LOG-F-03`}
        title={`PDF - ${requerimiento.codigo}`}
      />
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
