'use client'

import { Modal, Spin, Tag, Empty } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, type VentaHistorialItem } from '~/lib/api/venta'
import dayjs from 'dayjs'

// Mapa de labels para campos
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

  // Encontrar campos que cambiaron
  const cambios = Object.keys(antes).filter(key => {
    return JSON.stringify(antes[key]) !== JSON.stringify(despues[key])
  })

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

export default function ModalHistorialVenta({
  open,
  onClose,
  ventaId,
  ventaSerie,
  ventaNumero,
}: {
  open: boolean
  onClose: () => void
  ventaId: string
  ventaSerie?: string
  ventaNumero?: number
}) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTA_HISTORIAL, ventaId],
    queryFn: async () => {
      const result = await ventaApi.getHistorial(ventaId)
      if (result.error) throw new Error(result.error.message)
      return result.data!.data
    },
    enabled: open && !!ventaId,
  })

  const titulo = ventaSerie && ventaNumero
    ? `Historial de Edición - ${ventaSerie}-${ventaNumero}`
    : 'Historial de Edición'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={titulo}
      footer={null}
      width={700}
      destroyOnHidden
    >
      {isLoading ? (
        <div className='flex justify-center py-8'>
          <Spin size='large' />
        </div>
      ) : !data || data.length === 0 ? (
        <Empty description='No hay registros de edición' />
      ) : (
        <div className='flex flex-col gap-3 max-h-[60vh] overflow-y-auto'>
          {data.map((item) => (
            <div key={item.id} className='border border-slate-200 rounded-lg p-3'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <Tag color={item.accion === 'edicion' ? 'orange' : item.accion === 'anulacion' ? 'red' : 'blue'}>
                    {item.accion.charAt(0).toUpperCase() + item.accion.slice(1)}
                  </Tag>
                  <span className='text-sm font-medium text-slate-700'>
                    {item.usuario?.name || 'Usuario desconocido'}
                  </span>
                </div>
                <span className='text-xs text-slate-400'>
                  {dayjs(item.fecha).format('DD/MM/YYYY HH:mm:ss')}
                </span>
              </div>
              {item.descripcion && (
                <p className='text-xs text-slate-500 mb-2'>{item.descripcion}</p>
              )}
              <CambiosDetalle item={item} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
