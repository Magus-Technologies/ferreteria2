'use client'

import { Badge, Dropdown, Empty, Spin, Tag, Tabs, message } from 'antd'
import { FaBell, FaBirthdayCake } from 'react-icons/fa'
import { MdSecurity } from 'react-icons/md'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { autorizacionesApi, autorizacionesKeys, type SolicitudAutorizacion } from '~/lib/api/autorizaciones'
import { cumpleanosApi, type CumpleanosUsuario } from '~/lib/api/cumpleanos'
import { configuracionNotificacionesApi } from '~/lib/api/configuracion-notificaciones'
import { useStoreAutorizaciones } from '~/store/store-autorizaciones'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'
import ModalAprobar from '~/app/ui/solicitudes-autorizacion/_components/modal-aprobar'

dayjs.extend(relativeTime)
dayjs.locale('es')

const ACCION_COLORS: Record<string, string> = {
  crear: 'green',
  editar: 'blue',
  eliminar: 'red',
}

function SolicitudItem({ solicitud }: { solicitud: SolicitudAutorizacion }) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-800 truncate max-w-[180px]">
          {solicitud.solicitante?.name || 'Usuario'}
        </span>
        <Tag color={ACCION_COLORS[solicitud.accion]} className="!m-0 !text-[10px]">
          {solicitud.accion}
        </Tag>
      </div>
      <div className="text-xs text-gray-500 truncate max-w-[250px]">
        {solicitud.descripcion}
      </div>
      <div className="text-[10px] text-gray-400">
        {dayjs(solicitud.created_at).fromNow()}
      </div>
    </div>
  )
}

function CumpleanosItem({ cumple }: { cumple: CumpleanosUsuario }) {
  const emoji = cumple.entidad_tipo === 'cliente' ? '🛍️' : '👤'
  const tipoLabel = cumple.entidad_tipo === 'cliente' ? 'Cliente' : 'Usuario'

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="text-2xl">
        {cumple.tipo === 'hoy' ? '🎂' : '🎈'}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800 truncate max-w-[160px]">
            {cumple.nombre}
          </span>
          <Tag color={cumple.entidad_tipo === 'cliente' ? 'blue' : 'purple'} className="!m-0 !text-[10px]">
            {emoji} {tipoLabel}
          </Tag>
        </div>
        <div className="text-xs text-gray-500">
          {cumple.tipo === 'hoy'
            ? `¡Cumple ${cumple.edad} años hoy!`
            : `Cumple ${cumple.edad} años en ${cumple.dias_restantes} día${cumple.dias_restantes > 1 ? 's' : ''}`}
        </div>
        <div className="text-[10px] text-gray-400">
          {cumple.fecha_nacimiento}
        </div>
      </div>
    </div>
  )
}

export default function CampanitaAutorizaciones() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setPendientesCount = useStoreAutorizaciones((s) => s.setPendientesCount)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAutorizacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('autorizaciones')

  // === AUTORIZACIONES ===
  const { data: countData } = useQuery({
    queryKey: autorizacionesKeys.pendientesCount(),
    queryFn: async () => {
      const res = await autorizacionesApi.pendientesCount()
      return res.data?.count ?? 0
    },
    enabled: true,
  })

  const autorizacionesCount = countData ?? 0

  useEffect(() => {
    setPendientesCount(autorizacionesCount)
  }, [autorizacionesCount, setPendientesCount])

  const { data: pendientes, isLoading: isLoadingAuth } = useQuery({
    queryKey: autorizacionesKeys.pendientes(),
    queryFn: async () => {
      const res = await autorizacionesApi.pendientes()
      return (res.data || []) as SolicitudAutorizacion[]
    },
    enabled: dropdownOpen,
  })

  const authItems = (pendientes || []).slice(0, 5)

  // === CUMPLEAÑOS ===
  const { data: cumpleanosConfig } = useQuery({
    queryKey: ['configuracion-cumpleanos'],
    queryFn: async () => {
      const res = await configuracionNotificacionesApi.getCumpleanos()
      return res.data?.data ?? { habilitado: true, dias_anticipacion: 7 }
    },
    staleTime: 60000 * 5,
  })

  const diasAnticipacion = cumpleanosConfig?.dias_anticipacion ?? 7

  const { data: cumpleanosData, isLoading: isLoadingCumple } = useQuery({
    queryKey: ['cumpleanos-proximos', diasAnticipacion],
    queryFn: async () => {
      const res = await cumpleanosApi.getProximos(diasAnticipacion)
      return (res.data?.data || []) as CumpleanosUsuario[]
    },
    enabled: true,
  })

  const cumpleItems = cumpleanosData || []
  const cumpleCount = cumpleItems.length

  // === TOTAL ===
  const totalCount = autorizacionesCount + cumpleCount

  // === HANDLERS ===
  const handleClickSolicitud = (s: SolicitudAutorizacion) => {
    setDropdownOpen(false)
    setSolicitudSeleccionada(s)
    setModalOpen(true)
  }

  const invalidarQueries = () => {
    queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientes() })
    queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientesCount() })
  }

  const handleAprobar = async (data: {
    tipo_aprobacion: 'temporal' | 'permanente'
    duracion_horas?: number
    comentario?: string
  }) => {
    if (!solicitudSeleccionada) return
    setLoading(true)
    try {
      const res = await autorizacionesApi.aprobar(solicitudSeleccionada.id, data)
      if (res.data) {
        message.success('Solicitud aprobada correctamente')
        setModalOpen(false)
        setSolicitudSeleccionada(null)
        invalidarQueries()
      } else if (res.error) {
        message.error(res.error.message || 'Error al aprobar')
      }
    } catch {
      message.error('Error al aprobar solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleRechazar = async (data: { comentario?: string }) => {
    if (!solicitudSeleccionada) return
    setLoading(true)
    try {
      const res = await autorizacionesApi.rechazar(solicitudSeleccionada.id, data)
      if (res.data) {
        message.success('Solicitud rechazada')
        setModalOpen(false)
        setSolicitudSeleccionada(null)
        invalidarQueries()
      } else if (res.error) {
        message.error(res.error.message || 'Error al rechazar')
      }
    } catch {
      message.error('Error al rechazar solicitud')
    } finally {
      setLoading(false)
    }
  }

  // === RENDER TABS ===
  const tabAutorizaciones = (
    <div className="max-h-[280px] overflow-y-auto">
      {isLoadingAuth ? (
        <div className="flex justify-center py-6">
          <Spin size="small" />
        </div>
      ) : authItems.length === 0 ? (
        <div className="py-6">
          <Empty description="Sin solicitudes pendientes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {authItems.map((s) => (
            <div
              key={s.id}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleClickSolicitud(s)}
            >
              <SolicitudItem solicitud={s} />
            </div>
          ))}
        </div>
      )}

      {autorizacionesCount > 5 && (
        <div
          className="px-4 py-2 border-t border-gray-100 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => {
            setDropdownOpen(false)
            router.push('/ui/solicitudes-autorizacion')
          }}
        >
          <span className="text-xs font-semibold text-blue-600">
            Ver todas ({autorizacionesCount})
          </span>
        </div>
      )}
    </div>
  )

  const tabCumpleanos = (
    <div className="max-h-[280px] overflow-y-auto">
      {isLoadingCumple ? (
        <div className="flex justify-center py-6">
          <Spin size="small" />
        </div>
      ) : cumpleItems.length === 0 ? (
        <div className="py-6">
          <Empty description="Sin cumpleaños próximos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {cumpleItems.map((c) => (
            <div key={`${c.entidad_tipo}-${c.id}`} className="px-4 py-2 hover:bg-gray-50 transition-colors">
              <CumpleanosItem cumple={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const dropdownContent = (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-[360px] max-h-[420px] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-sm text-gray-800">Notificaciones</span>
        {totalCount > 0 && (
          <Tag color="orange" className="!m-0">{totalCount}</Tag>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        className="[&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-nav]:!px-2"
        items={[
          {
            key: 'autorizaciones',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <MdSecurity className="text-sm" />
                Autorizaciones
                {autorizacionesCount > 0 && (
                  <Badge count={autorizacionesCount} size="small" className="ml-1" />
                )}
              </span>
            ),
            children: tabAutorizaciones,
          },
          {
            key: 'cumpleanos',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <FaBirthdayCake className="text-sm" />
                Cumpleaños
                {cumpleCount > 0 && (
                  <Badge count={cumpleCount} size="small" className="ml-1" style={{ backgroundColor: '#eb2f96' }} />
                )}
              </span>
            ),
            children: tabCumpleanos,
          },
        ]}
      />
    </div>
  )

  return (
    <>
      <Dropdown
        popupRender={() => dropdownContent}
        trigger={['click']}
        placement="bottomRight"
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <button
          className="relative flex items-center justify-center p-2 rounded-full
                     hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
          aria-label="Notificaciones"
        >
          <Badge count={totalCount} size="small" offset={[-2, 2]}>
            <FaBell className="text-lg text-white" />
          </Badge>
        </button>
      </Dropdown>

      <ModalAprobar
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSolicitudSeleccionada(null)
        }}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        loading={loading}
        solicitudDescripcion={
          solicitudSeleccionada
            ? `${solicitudSeleccionada.solicitante?.name || 'Usuario'} — ${solicitudSeleccionada.accion} en ${solicitudSeleccionada.modulo}: ${solicitudSeleccionada.descripcion}`
            : undefined
        }
      />
    </>
  )
}
