'use client'

import { Badge, Dropdown, Empty, Spin, Tag, Tabs, message } from 'antd'
import { FaBell, FaBirthdayCake, FaCalendarAlt } from 'react-icons/fa'
import { MdSecurity } from 'react-icons/md'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { autorizacionesApi, autorizacionesKeys, type SolicitudAutorizacion } from '~/lib/api/autorizaciones'
import { cumpleanosApi, type CumpleanosUsuario } from '~/lib/api/cumpleanos'
import { configuracionNotificacionesApi } from '~/lib/api/configuracion-notificaciones'
import { ventaApi } from '~/lib/api/venta'
import { compraApi } from '~/lib/api/compra'
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

  // === VENCIMIENTOS ===
  const { data: vencimientosConfig } = useQuery({
    queryKey: ['configuracion-vencimientos'],
    queryFn: async () => {
      const res = await configuracionNotificacionesApi.getVencimientos()
      return res.data?.data ?? { habilitado: true, dias_anticipacion: 7 }
    },
    staleTime: 60000 * 5,
  })

  const diasVencimiento = vencimientosConfig?.dias_anticipacion ?? 7

  type VencimientoItem = {
    key: string
    id: string
    tipo: 'cobrar' | 'pagar'
    serie: string
    numero: string
    contraparte: string
    fechaVencimiento: string
    saldo: number
  }

  const { data: vencimientosData, isLoading: isLoadingVenc } = useQuery<VencimientoItem[]>({
    queryKey: ['vencimientos-proximos', diasVencimiento],
    queryFn: async () => {
      const [ventasRes, comprasRes] = await Promise.all([
        ventaApi.getVentasPorCobrar({ dias: diasVencimiento, per_page: 500 }),
        compraApi.getComprasPorPagar({ dias: diasVencimiento, per_page: 500 }),
      ])

      const ventas = ((ventasRes.data?.data || []) as any[])
        .filter((v) => v.fecha_vencimiento)
        .map<VencimientoItem>((v) => {
          const totalProductos = (v.productos_por_almacen || []).reduce((s: number, p: any) => {
            const sub = (p.unidades_derivadas || []).reduce((ss: number, u: any) => {
              const base = Number(u.precio) * Number(u.cantidad) + Number(u.recargo || 0)
              const desc = Number(u.descuento || 0)
              return ss + (u.descuento_tipo === '%' ? base - (base * desc) / 100 : base - desc)
            }, 0)
            return s + sub
          }, 0)
          const saldo = totalProductos - Number(v.total_cobrado || 0)
          return {
            key: `v-${v.id}`,
            id: v.id,
            tipo: 'cobrar',
            serie: v.serie || '-',
            numero: v.numero || '-',
            contraparte:
              v.cliente?.razon_social ||
              [v.cliente?.nombres, v.cliente?.apellidos].filter(Boolean).join(' ') ||
              'Cliente',
            fechaVencimiento: v.fecha_vencimiento,
            saldo,
          }
        })

      const compras = ((comprasRes.data?.data || []) as any[])
        .filter((c) => c.fecha_vencimiento)
        .map<VencimientoItem>((c) => {
          const totalCompra = (c.productos_por_almacen || []).reduce((s: number, p: any) => {
            const sub = (p.unidades_derivadas || []).reduce((ss: number, u: any) => {
              return ss + Number(u.precio || 0) * Number(u.cantidad || 0)
            }, 0)
            return s + sub
          }, 0)
          const saldo = totalCompra - Number(c.total_pagado || 0)
          return {
            key: `c-${c.id}`,
            id: c.id,
            tipo: 'pagar',
            serie: c.serie || '-',
            numero: c.numero || '-',
            contraparte: c.proveedor?.razon_social || 'Proveedor',
            fechaVencimiento: c.fecha_vencimiento,
            saldo,
          }
        })

      return [...ventas, ...compras].sort((a, b) =>
        dayjs(a.fechaVencimiento).diff(dayjs(b.fechaVencimiento))
      )
    },
    enabled: true,
    staleTime: 60000 * 2,
  })

  const vencimientosItems = vencimientosData || []
  const vencimientosCount = vencimientosItems.length

  // === TOTAL ===
  const totalCount = autorizacionesCount + cumpleCount + vencimientosCount

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

  const tabVencimientos = (
    <div className="max-h-[280px] overflow-y-auto">
      {isLoadingVenc ? (
        <div className="flex justify-center py-6">
          <Spin size="small" />
        </div>
      ) : vencimientosItems.length === 0 ? (
        <div className="py-6">
          <Empty description="Sin vencimientos próximos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {vencimientosItems.slice(0, 10).map((v) => {
            const diasRest = dayjs(v.fechaVencimiento).startOf('day').diff(dayjs().startOf('day'), 'day')
            const vencido = diasRest < 0
            return (
              <div
                key={v.key}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setDropdownOpen(false)
                  router.push(
                    v.tipo === 'cobrar'
                      ? '/ui/gestion-contable-y-financiera/ventas-por-cobrar'
                      : '/ui/gestion-contable-y-financiera/compras-por-pagar'
                  )
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Tag color={v.tipo === 'cobrar' ? 'green' : 'red'} className="!m-0 !text-[10px]">
                      {v.tipo === 'cobrar' ? 'Por Cobrar' : 'Por Pagar'}
                    </Tag>
                    <span className="font-semibold text-sm text-gray-800 truncate max-w-[160px]">
                      {v.contraparte}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {v.serie}-{v.numero} · S/. {v.saldo.toFixed(2)}
                  </div>
                  <div className={`text-[10px] ${vencido ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {vencido
                      ? `Vencido hace ${Math.abs(diasRest)} día${Math.abs(diasRest) === 1 ? '' : 's'}`
                      : diasRest === 0
                        ? 'Vence hoy'
                        : `Vence en ${diasRest} día${diasRest === 1 ? '' : 's'}`}
                    {' · '}
                    {dayjs(v.fechaVencimiento).format('DD/MM/YYYY')}
                  </div>
                </div>
              </div>
            )
          })}
          {vencimientosItems.length > 10 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center text-xs text-gray-500">
              y {vencimientosItems.length - 10} más...
            </div>
          )}
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
          {
            key: 'vencimientos',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <FaCalendarAlt className="text-sm" />
                Vencimientos
                {vencimientosCount > 0 && (
                  <Badge count={vencimientosCount} size="small" className="ml-1" style={{ backgroundColor: '#fa8c16' }} />
                )}
              </span>
            ),
            children: tabVencimientos,
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
