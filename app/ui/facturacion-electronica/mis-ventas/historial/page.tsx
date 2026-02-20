'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spin, Tag, Empty, Input, Select, DatePicker, Pagination, Card } from 'antd'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, type VentaHistorialItem } from '~/lib/api/venta'
import { useRouter } from 'next/navigation'

const { RangePicker } = DatePicker

const FIELD_LABELS: Record<string, string> = {
  tipo_documento: 'Tipo Documento',
  serie: 'Serie',
  numero: 'Número',
  forma_de_pago: 'Forma de Pago',
  estado_de_venta: 'Estado',
  cliente_id: 'Cliente',
  fecha: 'Fecha',
  tipo_moneda: 'Moneda',
  numero_dias: 'N° Días',
  fecha_vencimiento: 'F. Vencimiento',
  descripcion: 'Descripción',
  productos_count: 'N° Productos',
}

const VALUE_LABELS: Record<string, Record<string, string>> = {
  tipo_documento: { '01': 'Factura', '03': 'Boleta', 'nv': 'Nota de Venta' },
  forma_de_pago: { co: 'Contado', cr: 'Crédito' },
  estado_de_venta: { cr: 'Creado', ee: 'En Espera', pr: 'Procesado', an: 'Anulado' },
  tipo_moneda: { s: 'Soles', d: 'Dólares' },
}

function formatValue(field: string, value: any): string {
  if (value === null || value === undefined) return '-'
  if (VALUE_LABELS[field]?.[value]) return VALUE_LABELS[field][value]
  return String(value)
}

function CambiosDetalle({ item }: { item: VentaHistorialItem }) {
  const antes = item.datos_anteriores
  const despues = item.datos_nuevos

  if (!antes || !despues) return <span className='text-slate-400 text-xs'>Sin detalle</span>

  const cambios = Object.keys(antes).filter(key =>
    JSON.stringify(antes[key]) !== JSON.stringify(despues[key])
  )

  if (cambios.length === 0) {
    return <span className='text-slate-400 text-xs'>Sin cambios detectados</span>
  }

  return (
    <div className='flex flex-col gap-1'>
      {cambios.map(campo => (
        <div key={campo} className='text-xs'>
          <span className='font-medium text-slate-600'>{FIELD_LABELS[campo] || campo}:</span>{' '}
          <span className='text-red-500 line-through'>{formatValue(campo, antes[campo])}</span>
          {' → '}
          <span className='text-green-600 font-medium'>{formatValue(campo, despues[campo])}</span>
        </div>
      ))}
    </div>
  )
}

function getClienteNombre(venta: VentaHistorialItem['venta']): string {
  if (!venta?.cliente) return '-'
  const c = venta.cliente
  return c.razon_social || `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.numero_documento
}

export default function HistorialVentasPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [accion, setAccion] = useState<string | undefined>(undefined)
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const perPage = 20

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_HISTORIAL_GENERAL, page, search, accion, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const filters: Record<string, any> = { page, per_page: perPage }
      if (search) filters.search = search
      if (accion) filters.accion = accion
      if (fechas?.[0]) filters.desde = fechas[0].format('YYYY-MM-DD')
      if (fechas?.[1]) filters.hasta = fechas[1].format('YYYY-MM-DD')

      const result = await ventaApi.getHistorialGeneral(filters)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
  })

  const items = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <h2 className='text-lg font-semibold text-slate-700 mb-4'>Historial de Ediciones de Ventas</h2>

        {/* Filtros */}
        <div className='flex flex-wrap gap-3 mb-4'>
          <Input.Search
            placeholder='Buscar por serie, número...'
            allowClear
            onSearch={(val) => { setSearch(val); setPage(1) }}
            style={{ width: 250 }}
          />
          <Select
            placeholder='Acción'
            allowClear
            onChange={(val) => { setAccion(val); setPage(1) }}
            style={{ width: 150 }}
            options={[
              { value: 'edicion', label: 'Edición' },
              { value: 'anulacion', label: 'Anulación' },
              { value: 'creacion', label: 'Creación' },
            ]}
          />
          <RangePicker
            onChange={(dates) => { setFechas(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null); setPage(1) }}
            format='DD/MM/YYYY'
          />
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Spin size='large' />
          </div>
        ) : items.length === 0 ? (
          <Empty description='No se encontraron registros de historial' />
        ) : (
          <>
            <div className='flex flex-col gap-3'>
              {items.map((item) => {
                const ventaLabel = item.venta
                  ? `${item.venta.serie}-${item.venta.numero}`
                  : item.venta_id

                return (
                  <Card
                    key={item.id}
                    size='small'
                    className='border-slate-200 hover:border-slate-300 transition-colors cursor-pointer'
                    onClick={() => router.push(`/ui/facturacion-electronica/mis-ventas?venta=${item.venta_id}`)}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Tag color={item.accion === 'edicion' ? 'orange' : item.accion === 'anulacion' ? 'red' : 'blue'}>
                            {item.accion.charAt(0).toUpperCase() + item.accion.slice(1)}
                          </Tag>
                          <span className='font-semibold text-sm text-slate-800'>{ventaLabel}</span>
                          {item.venta?.tipo_documento && (
                            <Tag>
                              {item.venta.tipo_documento === '01' ? 'Factura'
                                : item.venta.tipo_documento === '03' ? 'Boleta'
                                : item.venta.tipo_documento === 'nv' ? 'Nota de Venta'
                                : item.venta.tipo_documento}
                            </Tag>
                          )}
                          <span className='text-xs text-slate-500'>
                            Cliente: {getClienteNombre(item.venta)}
                          </span>
                        </div>

                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-sm text-slate-600'>
                            por <strong>{item.usuario?.name || 'Usuario desconocido'}</strong>
                          </span>
                          <span className='text-xs text-slate-400'>
                            {dayjs(item.fecha).format('DD/MM/YYYY HH:mm:ss')}
                          </span>
                        </div>

                        {item.descripcion && (
                          <p className='text-xs text-slate-500 mb-1'>{item.descripcion}</p>
                        )}

                        <CambiosDetalle item={item} />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className='flex justify-center mt-4'>
              <Pagination
                current={page}
                total={total}
                pageSize={perPage}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
                showTotal={(t) => `${t} registros`}
              />
            </div>
          </>
        )}
      </div>
    </ContenedorGeneral>
  )
}
