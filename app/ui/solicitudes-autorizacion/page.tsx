'use client'

import { Tabs, Tag, Empty, Spin, message } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  autorizacionesApi,
  autorizacionesKeys,
  type SolicitudAutorizacion,
} from '~/lib/api/autorizaciones'
import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'
import { FaBell, FaCheck, FaClock, FaTimes } from 'react-icons/fa'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import ModalAprobar from './_components/modal-aprobar'

dayjs.extend(relativeTime)
dayjs.locale('es')

const ACCION_COLORS: Record<string, string> = {
  crear: 'green',
  editar: 'blue',
  eliminar: 'red',
}

const ESTADO_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  pendiente: { color: 'orange', icon: <FaClock size={10} /> },
  aprobada: { color: 'green', icon: <FaCheck size={10} /> },
  rechazada: { color: 'red', icon: <FaTimes size={10} /> },
}

const MODULO_LABELS: Record<string, string> = {
  productos: 'Productos',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  ventas: 'Ventas',
  cotizaciones: 'Cotizaciones',
  compras: 'Compras',
  'vales-compra': 'Vales de Compra',
  prestamos: 'Préstamos',
  guias: 'Guías',
  entregas: 'Entregas',
  categorias: 'Categorías',
  marcas: 'Marcas',
  caja: 'Caja',
}

function SolicitudCard({
  solicitud,
  esPendiente,
  onResolver,
}: {
  solicitud: SolicitudAutorizacion
  esPendiente: boolean
  onResolver?: (s: SolicitudAutorizacion) => void
}) {
  const estadoConf = ESTADO_CONFIG[solicitud.estado] || ESTADO_CONFIG.pendiente

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-800">
              {solicitud.solicitante?.name || 'Usuario'}
            </span>
            <Tag color={ACCION_COLORS[solicitud.accion]} className="!m-0 !text-[11px]">
              {solicitud.accion.toUpperCase()}
            </Tag>
            <Tag className="!m-0 !text-[11px]">
              {MODULO_LABELS[solicitud.modulo] || solicitud.modulo}
            </Tag>
            <Tag
              color={estadoConf.color}
              icon={estadoConf.icon}
              className="!m-0 !text-[11px]"
            >
              {solicitud.estado.toUpperCase()}
            </Tag>
          </div>

          <p className="text-sm text-gray-600 mb-2">{solicitud.descripcion}</p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{dayjs(solicitud.created_at).format('DD/MM/YYYY HH:mm')}</span>
            <span>{dayjs(solicitud.created_at).fromNow()}</span>
            {solicitud.role && (
              <span>Rol: {solicitud.role.name}</span>
            )}
          </div>

          {solicitud.estado !== 'pendiente' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'} por{' '}
                <strong>{solicitud.respondido_por_user?.name || solicitud.respondidoPor?.name || '—'}</strong>
                {solicitud.respondido_at && (
                  <span> el {dayjs(solicitud.respondido_at).format('DD/MM/YYYY HH:mm')}</span>
                )}
                {solicitud.tipo_aprobacion === 'temporal' && solicitud.duracion_horas && (
                  <Tag color="blue" className="!ml-2 !text-[10px]">
                    Temporal: {solicitud.duracion_horas}h
                  </Tag>
                )}
                {solicitud.tipo_aprobacion === 'permanente' && (
                  <Tag color="green" className="!ml-2 !text-[10px]">
                    Permanente
                  </Tag>
                )}
              </div>
              {solicitud.comentario_respuesta && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  &quot;{solicitud.comentario_respuesta}&quot;
                </p>
              )}
            </div>
          )}
        </div>

        {esPendiente && onResolver && (
          <ButtonBase
            color="warning"
            size="sm"
            onClick={() => onResolver(solicitud)}
            className="whitespace-nowrap"
          >
            Resolver
          </ButtonBase>
        )}
      </div>
    </div>
  )
}

function ListaSolicitudes({
  solicitudes,
  loading,
  esPendiente,
  onResolver,
}: {
  solicitudes: SolicitudAutorizacion[]
  loading: boolean
  esPendiente: boolean
  onResolver?: (s: SolicitudAutorizacion) => void
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <Empty
        description={esPendiente ? 'Sin solicitudes pendientes' : 'Sin solicitudes'}
        className="py-12"
      />
    )
  }

  return (
    <div className="space-y-3">
      {solicitudes.map((s) => (
        <SolicitudCard
          key={s.id}
          solicitud={s}
          esPendiente={esPendiente}
          onResolver={onResolver}
        />
      ))}
    </div>
  )
}

export default function PageSolicitudesAutorizacion() {
  const queryClient = useQueryClient()
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudAutorizacion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [resolviendo, setResolviendo] = useState(false)

  // Pendientes (como aprobador)
  const { data: pendientes = [], isLoading: loadingPendientes } = useQuery({
    queryKey: autorizacionesKeys.pendientes(),
    queryFn: async () => {
      const res = await autorizacionesApi.pendientes()
      return (res.data || []) as SolicitudAutorizacion[]
    },
  })

  // Mis solicitudes (como solicitante)
  const { data: misSolicitudes = [], isLoading: loadingMias } = useQuery({
    queryKey: autorizacionesKeys.misSolicitudes(),
    queryFn: async () => {
      const res = await autorizacionesApi.misSolicitudes()
      return (res.data || []) as SolicitudAutorizacion[]
    },
  })

  const handleResolver = (solicitud: SolicitudAutorizacion) => {
    setSelectedSolicitud(solicitud)
    setModalOpen(true)
  }

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientes() })
    queryClient.invalidateQueries({ queryKey: autorizacionesKeys.misSolicitudes() })
    queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientesCount() })
  }

  const handleAprobar = async (data: {
    tipo_aprobacion: 'temporal' | 'permanente'
    duracion_horas?: number
    comentario?: string
  }) => {
    if (!selectedSolicitud) return
    setResolviendo(true)
    try {
      const res = await autorizacionesApi.aprobar(selectedSolicitud.id, data)
      if (res.data) {
        message.success('Solicitud aprobada')
        setModalOpen(false)
        invalidar()
      } else {
        message.error(res.error?.message || 'Error al aprobar')
      }
    } catch {
      message.error('Error al aprobar')
    } finally {
      setResolviendo(false)
    }
  }

  const handleRechazar = async (data: { comentario?: string }) => {
    if (!selectedSolicitud) return
    setResolviendo(true)
    try {
      const res = await autorizacionesApi.rechazar(selectedSolicitud.id, data)
      if (res.data) {
        message.success('Solicitud rechazada')
        setModalOpen(false)
        invalidar()
      } else {
        message.error(res.error?.message || 'Error al rechazar')
      }
    } catch {
      message.error('Error al rechazar')
    } finally {
      setResolviendo(false)
    }
  }

  const tabItems = [
    {
      key: 'pendientes',
      label: (
        <span className="flex items-center gap-2">
          Pendientes
          {pendientes.length > 0 && (
            <Tag color="orange" className="!m-0">{pendientes.length}</Tag>
          )}
        </span>
      ),
      children: (
        <ListaSolicitudes
          solicitudes={pendientes}
          loading={loadingPendientes}
          esPendiente
          onResolver={handleResolver}
        />
      ),
    },
    {
      key: 'mis-solicitudes',
      label: 'Mis Solicitudes',
      children: (
        <ListaSolicitudes
          solicitudes={misSolicitudes}
          loading={loadingMias}
          esPendiente={false}
        />
      ),
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <TituloModulos
        title="Solicitudes de Autorización"
        icon={<FaBell className="text-amber-600" />}
      />

      <div className="mt-4">
        <Tabs items={tabItems} defaultActiveKey="pendientes" />
      </div>

      <ModalAprobar
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        loading={resolviendo}
        solicitudDescripcion={selectedSolicitud?.descripcion}
      />
    </div>
  )
}
