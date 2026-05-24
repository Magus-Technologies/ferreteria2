'use client'

import { Badge, Dropdown, Empty, Spin, Tag, Tabs, message } from 'antd'
import { FaBell, FaBirthdayCake, FaCalendarAlt } from 'react-icons/fa'
import { MdSecurity } from 'react-icons/md'
import { DollarOutlined, WarningOutlined, FileTextOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { consultaTipoDeCambio } from '~/app/_actions/consulta-tipo-de-cambio'
import { autorizacionesApi, autorizacionesKeys, type SolicitudAutorizacion } from '~/lib/api/autorizaciones'
import { cumpleanosApi, type CumpleanosUsuario } from '~/lib/api/cumpleanos'
import { configuracionNotificacionesApi } from '~/lib/api/configuracion-notificaciones'
import { ventaApi } from '~/lib/api/venta'
import { compraApi } from '~/lib/api/compra'
import { prestamoVendedorApi, type SolicitudEfectivo } from '~/lib/api/prestamo-vendedor'
import { facturacionElectronicaApi, type ComprobanteElectronico } from '~/lib/api/facturacion-electronica'
import { requerimientoInternoApi, type RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { useStoreAutorizaciones } from '~/store/store-autorizaciones'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'
import { formatFechaPeru } from '~/utils/fechas'
import ModalAprobar from '~/app/ui/solicitudes-autorizacion/_components/modal-aprobar'
import ModalAprobarSolicitudEfectivo from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-aprobar-solicitud-efectivo'

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
  const [openAprobarPrestamo, setOpenAprobarPrestamo] = useState(false)
  const [selectedPrestamo, setSelectedPrestamo] = useState<SolicitudEfectivo | null>(null)

  // === TIPO DE CAMBIO ===
  const { data: tipoDeCambio } = useQuery({
    queryKey: ['tipo-cambio-header'],
    queryFn: async () => {
      const res = await consultaTipoDeCambio()
      return res.data
    },
    staleTime: 1000 * 60 * 30,
  })

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
        ventaApi.getVentasPorCobrar({ dias: diasVencimiento, per_page: 200 }),
        compraApi.getComprasPorPagar({ dias: diasVencimiento, per_page: 100 }),
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

  // === PRÉSTAMOS / SOLICITUDES DE EFECTIVO ===
  const { data: prestamosData, refetch: refetchPrestamos } = useQuery({
    queryKey: ['solicitudes-efectivo-pendientes'],
    queryFn: async () => await prestamoVendedorApi.solicitudesPendientes(),
  })

  const solicitudesPrestamo = useMemo(
    () => (Array.isArray((prestamosData?.data as any)?.data) ? (prestamosData?.data as any).data : []) as SolicitudEfectivo[],
    [prestamosData]
  )
  const prestamosCount = solicitudesPrestamo.length

  // === ALERTAS SUNAT ===
  const { data: sunatData } = useQuery({
    queryKey: ['sunat-alertas-pendientes'],
    queryFn: async () => await facturacionElectronicaApi.getPendientesAlerta(),
  })

  const alertasSunat = useMemo(
    () => (Array.isArray((sunatData?.data as any)?.data) ? (sunatData?.data as any).data : []) as ComprobanteElectronico[],
    [sunatData]
  )
  const sunatCount = alertasSunat.length

  // === REQUERIMIENTOS INTERNOS ===
  const { data: reqData } = useQuery({
    queryKey: ['requerimientos-internos-pendientes'],
    queryFn: async () => await requerimientoInternoApi.getAll({ estado: 'pendiente', per_page: 20 }),
  })

  const requerimientos = useMemo(
    () => (Array.isArray(reqData?.data?.data) ? reqData.data.data : []) as RequerimientoInterno[],
    [reqData]
  )
  const requerimientosCount = requerimientos.length

  // === TOTAL ===
  const totalCount =
    autorizacionesCount +
    cumpleCount +
    vencimientosCount +
    prestamosCount +
    sunatCount +
    requerimientosCount

  // === HANDLERS PRÉSTAMOS ===
  const handleAprobarPrestamo = (solicitud: SolicitudEfectivo) => {
    setSelectedPrestamo(solicitud)
    setOpenAprobarPrestamo(true)
  }

  const handleRechazarPrestamo = async (solicitudId: string) => {
    await prestamoVendedorApi.rechazarSolicitud(solicitudId)
    refetchPrestamos()
  }

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
  const tabPrestamos = (
    <div className="max-h-[280px] overflow-y-auto p-2 space-y-2">
      {solicitudesPrestamo.length === 0 ? (
        <div className="py-6">
          <Empty description="No hay solicitudes hoy" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        solicitudesPrestamo.map((solicitud) => (
          <div
            key={solicitud.id}
            className="border rounded-lg p-3 space-y-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{solicitud.vendedor_solicitante.name}</p>
                <p className="text-xs text-slate-500">Solicita efectivo</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">
                S/ {solicitud.monto_solicitado.toFixed(2)}
              </p>
            </div>
            {solicitud.motivo && (
              <p className="text-xs text-gray-600 italic">"{solicitud.motivo}"</p>
            )}
            <div className="text-xs text-gray-400">
              {formatFechaPeru(solicitud.created_at, 'DD MMM, HH:mm')}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleAprobarPrestamo(solicitud)}
                className="flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleRechazarPrestamo(solicitud.id)}
                className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const tabRequerimientos = (
    <div className="max-h-[280px] overflow-y-auto p-2 space-y-2">
      {requerimientos.length === 0 ? (
        <div className="py-6">
          <Empty description="Sin requerimientos pendientes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        requerimientos.map((req) => (
          <div
            key={req.id}
            className="border border-blue-50 rounded-lg p-3 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => {
              setDropdownOpen(false)
              router.push('/ui/gestion-comercial-e-inventario/mis-ordenes-de-servicio')
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                  {req.codigo}
                </p>
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {req.titulo}
                </p>
              </div>
              <Tag
                color={req.prioridad === 'URGENTE' || req.prioridad === 'ALTA' ? 'red' : 'blue'}
                className="text-[9px] uppercase m-0 leading-3"
              >
                {req.prioridad}
              </Tag>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-slate-500 font-medium">Cargo: {req.cargo}</p>
              <p className="text-[10px] text-slate-400 italic">{dayjs(req.created_at).fromNow()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const tabSunat = (
    <div className="max-h-[280px] overflow-y-auto p-2 space-y-2">
      <div className="bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-800">
        Documentos próximos a vencer que deben enviarse pronto.
      </div>
      {alertasSunat.length === 0 ? (
        <div className="py-6">
          <Empty description="Todo al día con SUNAT" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        alertasSunat.map((doc) => (
          <div
            key={doc.id}
            className="border border-red-100 rounded-lg p-3 space-y-1 hover:bg-red-50 transition-colors cursor-pointer"
            onClick={() => {
              setDropdownOpen(false)
              router.push('/ui/facturacion-electronica/mis-ventas')
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-red-600">
                  {doc.tipo_comprobante === '01' ? 'Factura' : 'Boleta'} {doc.serie}-{doc.correlativo}
                </p>
                <p className="text-xs text-gray-700">
                  {doc.cliente_razon_social || doc.cliente?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">S/ {Number(doc.total).toFixed(2)}</p>
                {(() => {
                  const limit = doc.tipo_comprobante === '01' ? 3 : 7
                  const diff = dayjs().startOf('day').diff(dayjs(doc.fecha_emision).startOf('day'), 'day')
                  const remaining = limit - diff
                  let text = ''
                  if (remaining <= 0) text = 'Vence Hoy'
                  else if (remaining === 1) text = 'Vence Mañana'
                  else text = `Vence en ${remaining} días`
                  return <p className="text-[10px] text-red-500 font-bold uppercase">{text}</p>
                })()}
              </div>
            </div>
            <div className="text-[10px] text-gray-400">
              Emitido: {dayjs(doc.fecha_emision).format('DD/MM/YYYY')}
            </div>
          </div>
        ))
      )}
    </div>
  )

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
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-[420px] max-h-[480px] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-800">Notificaciones</span>
          {tipoDeCambio && tipoDeCambio > 1 && (
            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
              $ {tipoDeCambio.toFixed(3)}
            </span>
          )}
        </div>
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
          {
            key: 'prestamos',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <DollarOutlined className="text-sm" />
                Préstamos
                {prestamosCount > 0 && (
                  <Badge count={prestamosCount} size="small" className="ml-1" style={{ backgroundColor: '#10b981' }} />
                )}
              </span>
            ),
            children: tabPrestamos,
          },
          {
            key: 'requerimientos',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <FileTextOutlined className="text-sm" />
                Requerimientos
                {requerimientosCount > 0 && (
                  <Badge count={requerimientosCount} size="small" className="ml-1" style={{ backgroundColor: '#3b82f6' }} />
                )}
              </span>
            ),
            children: tabRequerimientos,
          },
          {
            key: 'sunat',
            label: (
              <span className="flex items-center gap-1.5 text-xs">
                <WarningOutlined className="text-sm" />
                SUNAT
                {sunatCount > 0 && (
                  <Badge count={sunatCount} size="small" className="ml-1" status="error" />
                )}
              </span>
            ),
            children: tabSunat,
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

      {selectedPrestamo && (
        <ModalAprobarSolicitudEfectivo
          solicitudId={selectedPrestamo.id}
          open={openAprobarPrestamo}
          setOpen={setOpenAprobarPrestamo}
          montoSolicitado={selectedPrestamo.monto_solicitado}
          solicitanteNombre={selectedPrestamo.vendedor_solicitante.name}
          onSuccess={() => refetchPrestamos()}
        />
      )}
    </>
  )
}
