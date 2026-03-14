'use client'

import { Badge, Dropdown, Empty, Spin, Tag, message } from 'antd'
import { FaBell } from 'react-icons/fa'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { autorizacionesApi, autorizacionesKeys, type SolicitudAutorizacion } from '~/lib/api/autorizaciones'
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

export default function CampanitaAutorizaciones() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setPendientesCount = useStoreAutorizaciones((s) => s.setPendientesCount)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAutorizacion | null>(null)
  const [loading, setLoading] = useState(false)

  // Polling de pendientes cada 30s - solo cuando el dropdown está abierto
  const { data: countData } = useQuery({
    queryKey: autorizacionesKeys.pendientesCount(),
    queryFn: async () => {
      const res = await autorizacionesApi.pendientesCount()
      return res.data?.count ?? 0
    },
    refetchInterval: dropdownOpen ? 30000 : false,
    enabled: true,
  })

  const count = countData ?? 0

  useEffect(() => {
    setPendientesCount(count)
  }, [count, setPendientesCount])

  // Cargar lista rápida de pendientes para el dropdown - solo cuando está abierto
  const { data: pendientes, isLoading } = useQuery({
    queryKey: autorizacionesKeys.pendientes(),
    queryFn: async () => {
      const res = await autorizacionesApi.pendientes()
      return (res.data || []) as SolicitudAutorizacion[]
    },
    refetchInterval: dropdownOpen ? 30000 : false,
    enabled: dropdownOpen,
  })

  const items = (pendientes || []).slice(0, 5)

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

  const dropdownContent = (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-[320px] max-h-[400px] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-sm text-gray-800">Solicitudes Pendientes</span>
        {count > 0 && (
          <Tag color="orange" className="!m-0">{count}</Tag>
        )}
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spin size="small" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-6">
            <Empty
              description="Sin solicitudes pendientes"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((s) => (
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
      </div>

      {count > 0 && (
        <div
          className="px-4 py-2.5 border-t border-gray-100 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => {
            setDropdownOpen(false)
            router.push('/ui/solicitudes-autorizacion')
          }}
        >
          <span className="text-xs font-semibold text-blue-600">
            Ver todas ({count})
          </span>
        </div>
      )}
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
          aria-label="Solicitudes de autorización"
        >
          <Badge count={count} size="small" offset={[-2, 2]}>
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
