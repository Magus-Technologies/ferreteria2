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

interface ProductoHistorial {
  nombre: string | null
  codigo: string | null
  costo: number
  unidades: {
    unidad: string | null
    cantidad: number
    precio: number
    descuento: number
    descuento_tipo: string
    recargo: number
  }[]
}

function TablaProductos({ productos, color }: { productos: ProductoHistorial[], color: 'red' | 'green' }) {
  const bgHeader = color === 'red' ? 'bg-red-50' : 'bg-green-50'
  const textColor = color === 'red' ? 'text-red-700' : 'text-green-700'
  const borderColor = color === 'red' ? 'border-red-200' : 'border-green-200'

  if (!productos || productos.length === 0) {
    return <span className='text-slate-400 text-xs italic'>Sin productos</span>
  }

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden`}>
      <table className='w-full text-xs'>
        <thead>
          <tr className={`${bgHeader} ${textColor}`}>
            <th className='text-left px-2 py-1.5 font-semibold'>Código</th>
            <th className='text-left px-2 py-1.5 font-semibold'>Producto</th>
            <th className='text-left px-2 py-1.5 font-semibold'>Unidad</th>
            <th className='text-right px-2 py-1.5 font-semibold'>Cant.</th>
            <th className='text-right px-2 py-1.5 font-semibold'>Precio</th>
            <th className='text-right px-2 py-1.5 font-semibold'>Dcto.</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((prod, i) =>
            prod.unidades && prod.unidades.length > 0
              ? prod.unidades.map((ud, j) => (
                  <tr key={`${i}-${j}`} className='border-t border-slate-100'>
                    {j === 0 && (
                      <>
                        <td className='px-2 py-1 font-mono text-slate-600' rowSpan={prod.unidades.length}>
                          {prod.codigo || '-'}
                        </td>
                        <td className='px-2 py-1 font-medium' rowSpan={prod.unidades.length}>
                          {prod.nombre || '-'}
                        </td>
                      </>
                    )}
                    <td className='px-2 py-1'>{ud.unidad || '-'}</td>
                    <td className='px-2 py-1 text-right'>{Number(ud.cantidad)}</td>
                    <td className='px-2 py-1 text-right'>S/ {Number(ud.precio).toFixed(2)}</td>
                    <td className='px-2 py-1 text-right'>
                      {Number(ud.descuento) > 0
                        ? `${ud.descuento_tipo === '%' ? `${ud.descuento}%` : `S/ ${Number(ud.descuento).toFixed(2)}`}`
                        : '-'}
                    </td>
                  </tr>
                ))
              : (
                  <tr key={i} className='border-t border-slate-100'>
                    <td className='px-2 py-1 font-mono text-slate-600'>{prod.codigo || '-'}</td>
                    <td className='px-2 py-1 font-medium'>{prod.nombre || '-'}</td>
                    <td className='px-2 py-1' colSpan={4}>Sin unidades</td>
                  </tr>
                )
          )}
        </tbody>
      </table>
    </div>
  )
}

function ProductosComparacion({ antes, despues }: { antes?: ProductoHistorial[], despues?: ProductoHistorial[] }) {
  if (!antes && !despues) return null

  return (
    <div className='mt-2 flex flex-col gap-2'>
      <div className='grid grid-cols-1 gap-2'>
        {antes && antes.length > 0 && (
          <div>
            <div className='text-xs font-semibold text-red-600 mb-1'>Antes:</div>
            <TablaProductos productos={antes} color='red' />
          </div>
        )}
        {despues && despues.length > 0 && (
          <div>
            <div className='text-xs font-semibold text-green-600 mb-1'>Después:</div>
            <TablaProductos productos={despues} color='green' />
          </div>
        )}
      </div>
    </div>
  )
}

function CambiosDetalle({ item }: { item: VentaHistorialItem }) {
  const antes = item.datos_anteriores
  const despues = item.datos_nuevos

  if (!antes || !despues) return <span className='text-slate-400 text-xs'>Sin detalle</span>

  // Campos simples (excluir productos que se renderizan aparte)
  const camposSimples = Object.keys(antes).filter(key => {
    if (key === 'productos') return false
    return JSON.stringify(antes[key]) !== JSON.stringify(despues[key])
  })

  // Comparar productos
  const productosAntes = antes.productos as ProductoHistorial[] | undefined
  const productosDespues = despues.productos as ProductoHistorial[] | undefined
  const productosChanged = JSON.stringify(productosAntes) !== JSON.stringify(productosDespues)

  const sinCambios = camposSimples.length === 0 && !productosChanged

  if (sinCambios) {
    return <span className='text-slate-400 text-xs'>Sin cambios detectados</span>
  }

  return (
    <div className='flex flex-col gap-1'>
      {camposSimples.map(campo => (
        <div key={campo} className='text-xs'>
          <span className='font-medium text-slate-600'>{FIELD_LABELS[campo] || campo}:</span>{' '}
          <span className='text-red-500 line-through'>{formatValue(campo, antes[campo])}</span>
          {' → '}
          <span className='text-green-600 font-medium'>{formatValue(campo, despues[campo])}</span>
        </div>
      ))}
      {productosChanged && (
        <ProductosComparacion antes={productosAntes} despues={productosDespues} />
      )}
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
      width={750}
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
