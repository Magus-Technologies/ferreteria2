'use client'

import SelectBase from '~/app/_components/form/selects/select-base'
import { FaWeightHanging } from 'react-icons/fa6'
import { DescuentoTipo } from '~/lib/api/venta'
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
} from '../../_store/store-producto-agregado-venta'

interface SelectUnidadDerivadaVentaProps {
  row: ValuesCardAgregarProductoVenta
}

// Análogo a SelectUnidadDerivadaEditable (app/_components/form/selects/), pero
// sin `form`+`fieldIndex`: la tabla de venta dejó de vivir en Ant Design Form
// (ver store-producto-agregado-venta.ts), así que este wrapper lee/escribe
// directo sobre la fila del carrito en Zustand. No se toca el componente
// compartido porque cotización sigue usando Form.List.
export default function SelectUnidadDerivadaVenta({
  row,
}: SelectUnidadDerivadaVentaProps) {
  const productoId = row.producto_id
  const productosVenta = useStoreProductoAgregadoVenta(
    (store) => store.productos
  )
  const setProductosVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductos
  )
  const setCarrito = useStoreProductoAgregadoVenta((store) => store.setCarrito)

  const productoEnStore = productosVenta.find(
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
    const descuento_tipo = row.descuento_tipo as DescuentoTipo
    const descuento = Number(row.descuento ?? 0)
    const nuevoSubtotal =
      (nuevoPrecioVenta + recargo) * cantidad -
      (descuento_tipo === DescuentoTipo.PORCENTAJE
        ? ((nuevoPrecioVenta + recargo) * descuento * cantidad) / 100
        : descuento)

    const patch = {
      unidad_derivada_id: nuevaUnidadDerivada.unidad_derivada.id,
      unidad_derivada_name: nuevaUnidadDerivada.unidad_derivada.name,
      unidad_derivada_factor: Number(nuevaUnidadDerivada.factor),
      precio_venta: nuevoPrecioVenta,
      // Resetear tipo de precio a público al cambiar unidad derivada
      tipo_precio: 'publico',
      subtotal: nuevoSubtotal,
    }

    setCarrito((prev) =>
      prev.map((r) => (r._row_id === row._row_id ? { ...r, ...patch } : r))
    )

    // Callback para actualizar el catálogo (SelectTipoPrecioVenta lee de acá)
    setProductosVenta((prev) =>
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
