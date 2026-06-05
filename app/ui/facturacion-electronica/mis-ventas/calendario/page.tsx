'use client'

import { Suspense, lazy, useState } from 'react'
import { Spin, Badge, Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { FaCalendar, FaArrowLeft, FaTruck, FaUser, FaMapMarkerAlt, FaBox, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { useRouter } from 'next/navigation'
import { EntregaEvent } from '~/app/_components/calendar/event-entrega'
import { useQuery } from '@tanstack/react-query'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import { vehiculosApi } from '~/lib/api/catalogos'

const CalendarProgramacionEntregas = lazy(
  () => import('~/app/_components/calendar/calendar-programacion-entregas')
)

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-[600px]">
    <Spin size="large" />
  </div>
)

// Estado a color/label
const ESTADO_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pe: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ec: { label: 'En Camino', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  en: { label: 'Entregado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  ca: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

function PanelDetalleEntrega({ entregaId, evento }: { entregaId: number; evento: EntregaEvent }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'detalle', entregaId],
    queryFn: async () => {
      const res = await entregasNuevasApi.obtener(entregaId)
  
      if (res.error) throw new Error(res.error.message)
      const payload = res.data as any
      const entrega = payload?.data ?? payload
      return entrega
    },
    enabled: !!entregaId,
    staleTime: 0,
  })

  const estadoCodigo = data?.estado_entrega_codigo ?? data?.estado_entrega?.codigo ?? data?.estado_entrega ?? 'pe'
  const estado = ESTADO_INFO[estadoCodigo]
  const vehiculo = data?.vehiculo ?? (data?.vehiculo_id ? {
    name: data?.vehiculo_name,
    placa: data?.vehiculo_placa,
  } : null)
  const despachador = data?.despachador ?? data?.chofer ?? (data?.chofer_id ? {
    name: data?.chofer_name,
  } : null)
  const productos = data?.productos_entregados ?? data?.productosEntregados ?? data?.detalles ?? []

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header del panel */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: evento.resource.color, filter: 'brightness(0.9)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <FaTruck size={16} />
          <span className="font-bold text-sm">Entrega #{entregaId}</span>
        </div>
        <div className="text-base font-bold">
          {dayjs(evento.start).format('dddd D [de] MMMM')}
        </div>
        <div className="text-sm opacity-90">
          {dayjs(evento.start).format('HH:mm')} — {dayjs(evento.end).format('HH:mm')}
        </div>
      </div>

      {isError && (
        <div className="text-xs text-red-500 px-2 py-1 bg-red-50 rounded border border-red-200">
          Error al cargar detalle completo.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <>
          {/* Estado */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${estado.bg} ${estado.color}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {estado.label}
          </div>

          {/* Unidad */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Unidad</span>
            <div className="flex items-center gap-2 text-slate-700">
              <FaTruck size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium">
                {vehiculo
                  ? `${vehiculo.name}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}`
                  : evento.resource.vehiculo_nombre || 'Sin asignar'}
              </span>
            </div>
            {vehiculo?.tipo && (
              <div className="flex items-center gap-2 ml-5">
                <FaTruck size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">
                  {vehiculo.tipo}
                </span>
              </div>
            )}
            {vehiculo?.placa && (
              <div className="flex items-center gap-2 ml-5">
                <FaIdCard size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">{vehiculo.placa}</span>
              </div>
            )}
          </div>

          {/* Despachador */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Despachador</span>
            <div className="flex items-center gap-2 text-slate-700">
              <FaUser size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium">
                {despachador?.name || evento.resource.chofer_nombre || 'Sin asignar'}
              </span>
            </div>
            {(despachador?.telefono || despachador?.celular) && (
              <div className="flex items-center gap-2 ml-5">
                <FaPhone size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">
                  {despachador.celular || despachador.telefono}
                </span>
              </div>
            )}
            {despachador?.email && (
              <div className="flex items-center gap-2 ml-5">
                <FaEnvelope size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">{despachador.email}</span>
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cliente</span>
            <div className="flex items-center gap-2 text-slate-700">
              <FaUser size={13} className="text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium">{evento.resource.cliente_nombre}</span>
            </div>
            {data?.venta?.cliente?.numero_documento && (
              <div className="flex items-center gap-2 ml-5">
                <FaIdCard size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">{data.venta.cliente.numero_documento}</span>
              </div>
            )}
            {data?.venta?.cliente?.telefono && (
              <div className="flex items-center gap-2 ml-5">
                <FaPhone size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">{data.venta.cliente.telefono}</span>
              </div>
            )}
            {data?.venta?.cliente?.email && (
              <div className="flex items-center gap-2 ml-5">
                <FaEnvelope size={10} className="text-slate-400" />
                <span className="text-xs text-slate-500">{data.venta.cliente.email}</span>
              </div>
            )}
            {data?.venta?.serie && (
              <span className="text-xs text-slate-400 ml-5">
                {data.venta.tipo_documento === '01' ? 'Factura' : data.venta.tipo_documento === '03' ? 'Boleta' : data.venta.tipo_documento === 'nv' ? 'Nota de Venta' : 'Venta'}: {data.venta.serie}-{String(data.venta.numero).padStart(8, '0')}
              </span>
            )}
          </div>

          {/* Dirección */}
          {data?.direccion_entrega && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dirección</span>
              <div className="flex items-start gap-2 text-slate-700">
                <FaMapMarkerAlt size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{data.direccion_entrega}</span>
              </div>
            </div>
          )}

          {/* Productos */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <FaBox size={11} />
              Productos a Entregar
            </span>
            <div className="flex flex-col gap-1.5">
              {productos.length > 0 ? (
                productos.map((p: any, i: number) => {
                  const unidadDV = p.unidad_derivada_venta ?? p.unidadDerivadaVenta
                  const producto = unidadDV?.producto_almacen_venta?.producto_almacen?.producto
                    ?? unidadDV?.productoAlmacenVenta?.productoAlmacen?.producto
                    ?? p.producto
                  const unidad = unidadDV?.unidad_derivada_inmutable ?? unidadDV?.unidadDerivadaInmutable
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {producto?.name || 'Producto'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {unidad?.name || ''}
                        </span>
                      </div>
                      <Badge
                        count={`x${p.cantidad_entregada ?? p.cantidad ?? 0}`}
                        style={{ backgroundColor: '#f59e0b', fontSize: 11, fontWeight: 700 }}
                      />
                    </div>
                  )
                })
              ) : (
                <span className="text-xs text-slate-400 italic">Sin productos registrados</span>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {data?.observaciones && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Observaciones</span>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                {data.observaciones}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CalendarioEntregasPage() {
  const router = useRouter()
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EntregaEvent | null>(null)
  const [vehiculoIds, setVehiculoIds] = useState<number[]>([])
  const { data: vehiculos = [], isLoading: cargandoVehiculos } = useQuery({
    queryKey: [QueryKeys.VEHICULOS, 'calendario-filtro'],
    queryFn: async () => {
      const res = await vehiculosApi.getAll({ estado: true })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })

  return (
    <ContenedorGeneral className="h-full">
      <div className="w-full flex flex-col gap-4 flex-1 min-h-0">
        <TituloModulos
          title="Calendario de Entregas Programadas"
          icon={<FaCalendar className="text-amber-600" />}
        >
          <ButtonBase
            color="default"
            size="md"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <FaArrowLeft />
            Volver
          </ButtonBase>
        </TituloModulos>

        <div
          className="grid gap-4 flex-1 min-h-0"
          style={{
            gridTemplateColumns: eventoSeleccionado ? '1fr 300px' : '1fr',
          }}
        >
          {/* Calendario */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-hidden">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-5 text-xs">
                <span className="font-semibold text-slate-700">Leyenda:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-amber-400" />
                  <span className="text-gray-600">Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-blue-500" />
                  <span className="text-gray-600">En Camino</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-emerald-500" />
                  <span className="text-gray-600">Entregado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-red-500" />
                  <span className="text-gray-600">Cancelado</span>
                </div>
              </div>
              <Select
                mode="multiple"
                allowClear
                showSearch
                loading={cargandoVehiculos}
                value={vehiculoIds}
                placeholder="Filtrar por vehículo(s)"
                className="w-full lg:w-[280px]"
                optionFilterProp="label"
                maxTagCount="responsive"
                options={vehiculos.map((vehiculo) => ({
                  value: vehiculo.id,
                  label: `${vehiculo.name}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}`,
                }))}
                onChange={(value) => {
                  setVehiculoIds(Array.isArray(value) ? value : [])
                  setEventoSeleccionado(null)
                }}
              />
            </div>
            <Suspense fallback={<ComponentLoading />}>
              <CalendarProgramacionEntregas
                onSelectEvent={(event) => {
                  if (event.id === -1) return
                  setEventoSeleccionado(event)
                }}
                onSelectSlot={() => setEventoSeleccionado(null)}
                soloProgramadasActivas={false}
                vehiculo_ids={vehiculoIds}
              />
            </Suspense>
          </div>

          {/* Panel lateral de detalle */}
          {eventoSeleccionado && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-hidden flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Detalle de Entrega</span>
                <button
                  onClick={() => setEventoSeleccionado(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <PanelDetalleEntrega
                entregaId={eventoSeleccionado.id}
                evento={eventoSeleccionado}
              />
            </div>
          )}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
