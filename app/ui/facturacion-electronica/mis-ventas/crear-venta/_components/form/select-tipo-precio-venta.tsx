'use client'

import SelectBase from '~/app/_components/form/selects/select-base'
import { MdPriceChange } from 'react-icons/md'
import { DescuentoTipo } from '~/lib/api/venta'
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
} from '../../_store/store-producto-agregado-venta'
import { calcularSubtotalVenta } from '../tables/calcular-subtotal-venta'

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

interface SelectTipoPrecioVentaProps {
  row: ValuesCardAgregarProductoVenta
}

const activadorMap: Record<TipoPrecio, string | null> = {
  publico: null,
  especial: 'activador_especial',
  minimo: 'activador_minimo',
  ultimo: 'activador_ultimo',
}

// Análogo a select-unidad-derivada-venta.tsx: recibe la fila del carrito
// directamente en vez de form+fieldIndex, ya que la tabla de venta dejó de
// vivir en Ant Design Form.
export default function SelectTipoPrecioVenta({ row }: SelectTipoPrecioVentaProps) {
  const productoId = row.producto_id
  const productosVenta = useStoreProductoAgregadoVenta((store) => store.productos)
  const setCarrito = useStoreProductoAgregadoVenta((store) => store.setCarrito)

  const productoEnStore = productosVenta.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  const unidadDerivadaId = row.unidad_derivada_id
  const tipoPrecioActual = (row.tipo_precio || 'publico') as TipoPrecio
  const cantidad = Number(row.cantidad ?? 0)

  // Buscar la unidad derivada actual
  const unidadDerivadaActual = unidadesDerivadas.find(
    (ud) => ud.unidad_derivada.id === unidadDerivadaId
  )

  if (!unidadDerivadaActual) {
    return (
      <div className='flex items-center h-full px-1'>
        <span className='text-xs text-gray-400'>-</span>
      </div>
    )
  }

  // Generar opciones con lógica de activadores
  const opciones = (['publico', 'especial', 'minimo', 'ultimo'] as TipoPrecio[]).map((tipo) => {
    const activadorKey = activadorMap[tipo]
    let label = tipo === 'publico' ? 'Público' : tipo === 'especial' ? 'Ferretería' : tipo === 'minimo' ? 'Mínimo' : 'Final'

    if (activadorKey) {
      const activador = Number((unidadDerivadaActual as any)[activadorKey] ?? 0)
      if (activador > 0) {
        label += ` (${activador} und)`
      }
    }

    return { value: tipo, label }
  })

  const handleChange = (nuevoTipo: TipoPrecio) => {
    const precios: Record<TipoPrecio, { precio: number; comision: number }> = {
      publico: {
        precio: Number(unidadDerivadaActual.precio_publico ?? 0),
        comision: Number(unidadDerivadaActual.comision_publico ?? 0),
      },
      especial: {
        precio: Number(unidadDerivadaActual.precio_especial ?? 0),
        comision: Number(unidadDerivadaActual.comision_especial ?? 0),
      },
      minimo: {
        precio: Number(unidadDerivadaActual.precio_minimo ?? 0),
        comision: Number(unidadDerivadaActual.comision_minimo ?? 0),
      },
      ultimo: {
        precio: Number(unidadDerivadaActual.precio_ultimo ?? 0),
        comision: Number(unidadDerivadaActual.comision_ultimo ?? 0),
      },
    }

    const { precio, comision } = precios[nuevoTipo]

    const recargo = Number(row.recargo ?? 0)
    const descuento_tipo = row.descuento_tipo as DescuentoTipo
    const descuento = Number(row.descuento ?? 0)

    const nuevoSubtotal = calcularSubtotalVenta({
      precio_venta: precio,
      recargo,
      descuento_tipo,
      descuento,
      cantidad,
    })

    setCarrito((prev) =>
      prev.map((r) =>
        r._row_id === row._row_id
          ? { ...r, tipo_precio: nuevoTipo, precio_venta: precio, comision, subtotal: nuevoSubtotal }
          : r
      )
    )
  }

  const nextHint = (() => {
    const cant = Number(cantidad || 0)
    if (!unidadDerivadaActual || cant < 1) return null
    const tiers = [
      { key: 'precio_especial', activadorKey: 'activador_especial' },
      { key: 'precio_minimo', activadorKey: 'activador_minimo' },
      { key: 'precio_ultimo', activadorKey: 'activador_ultimo' },
    ] as const
    const next = tiers
      .map((t) => ({
        activador: Number((unidadDerivadaActual as any)[t.activadorKey] ?? 0),
        precio: Number((unidadDerivadaActual as any)[t.key] ?? 0),
      }))
      .find((t) => t.activador > 0 && cant < t.activador)
    if (!next) return null
    return `Llevando ${next.activador} → S/${next.precio.toFixed(2)}`
  })()

  return (
    <div className='flex flex-col gap-0.5 w-full'>
      <SelectBase
        size='small'
        variant='borderless'
        className='w-full'
        value={tipoPrecioActual}
        options={opciones}
        onChange={handleChange}
        prefix={<MdPriceChange size={14} className='text-emerald-600' />}
      />
      {nextHint && (
        <span className='text-emerald-600 text-[10px] leading-tight px-1'>
          {nextHint}
        </span>
      )}
    </div>
  )
}
