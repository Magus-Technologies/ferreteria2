'use client'

import SelectBase from '~/app/_components/form/selects/select-base'
import { FaWeightHanging } from 'react-icons/fa6'
import {
  useStoreProductoAgregadoCotizacion,
  ProductoCotizacionConUnidades,
} from '../../_store/store-producto-agregado-cotizacion'

interface SelectUnidadDerivadaCotizacionProps {
  row: ProductoCotizacionConUnidades
}

// Análogo a select-unidad-derivada-venta.tsx: recibe la fila del carrito
// directamente en vez de form+fieldIndex, ya que la tabla de cotización dejó
// de vivir en Ant Design Form. No se toca el componente compartido
// (SelectUnidadDerivadaEditable) porque nada más lo sigue usando con form.
export default function SelectUnidadDerivadaCotizacion({
  row,
}: SelectUnidadDerivadaCotizacionProps) {
  const productoId = row.producto_id
  const productosCotizacion = useStoreProductoAgregadoCotizacion(
    (store) => store.productos
  )
  const setProductosCotizacion = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductos
  )
  const setCarrito = useStoreProductoAgregadoCotizacion((store) => store.setCarrito)

  const productoEnStore = productosCotizacion.find(
    (p) => p.producto_id === productoId
  )
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  if (!unidadesDerivadas || unidadesDerivadas.length === 0) {
    return (
      <div className='flex items-center h-full px-2'>
        <span className='text-sm'>{row.unidad_derivada_name || '-'}</span>
      </div>
    )
  }

  const options = unidadesDerivadas.map((ud) => ({
    value: ud.unidad_derivada.id,
    label: ud.unidad_derivada.name,
  }))

  const handleChange = (newUnidadDerivadaId: number) => {
    const nuevaUnidadDerivada = unidadesDerivadas.find(
      (ud) => ud.unidad_derivada.id === newUnidadDerivadaId
    )
    if (!nuevaUnidadDerivada) return

    const nuevoPrecioVenta = Number(nuevaUnidadDerivada.precio_publico ?? 0)
    const cantidad = Number(row.cantidad ?? 0)
    const recargo = Number(row.recargo ?? 0)
    const descuento_tipo = row.descuento_tipo || 'Monto'
    const descuento = Number(row.descuento ?? 0)
    const nuevoSubtotal =
      (nuevoPrecioVenta + recargo) * cantidad -
      (descuento_tipo === 'Porcentaje'
        ? ((nuevoPrecioVenta + recargo) * descuento * cantidad) / 100
        : descuento)

    const patch = {
      unidad_derivada_id: nuevaUnidadDerivada.unidad_derivada.id,
      unidad_derivada_name: nuevaUnidadDerivada.unidad_derivada.name,
      unidad_derivada_factor: Number(nuevaUnidadDerivada.factor),
      precio_venta: nuevoPrecioVenta,
      // Resetear tipo de precio a público al cambiar unidad derivada
      tipo_precio: 'publico' as const,
      subtotal: nuevoSubtotal,
    }

    setCarrito((prev) =>
      prev.map((r) => (r._row_id === row._row_id ? { ...r, ...patch } : r))
    )

    // Callback para actualizar el catálogo (SelectTipoPrecioCotizacion lee de acá)
    setProductosCotizacion((prev) =>
      prev.map((p) => (p.producto_id === productoId ? { ...p, ...patch } : p))
    )
  }

  return (
    <SelectBase
      size='small'
      variant='borderless'
      className='w-full'
      value={row.unidad_derivada_id}
      options={options}
      onChange={handleChange}
      prefix={<FaWeightHanging size={12} className='text-cyan-600' />}
    />
  )
}
