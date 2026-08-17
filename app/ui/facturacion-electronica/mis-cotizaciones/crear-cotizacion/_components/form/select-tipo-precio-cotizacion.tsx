'use client'

import SelectBase from '~/app/_components/form/selects/select-base'
import { MdPriceChange } from 'react-icons/md'
import {
  useStoreProductoAgregadoCotizacion,
  ProductoCotizacionConUnidades,
} from '../../_store/store-producto-agregado-cotizacion'
import { calcularSubtotalCotizacion } from '../tables/columns-cotizar'
import type { TipoPrecio } from '../../_types/cotizacion.types'

interface Props {
  row: ProductoCotizacionConUnidades
}

const activadorMap: Record<TipoPrecio, string | null> = {
  publico: null,
  especial: 'activador_especial',
  minimo: 'activador_minimo',
  ultimo: 'activador_ultimo',
}

const LABELS: Record<TipoPrecio, string> = {
  publico: 'Público',
  especial: 'Ferretería',
  minimo: 'Mínimo',
  ultimo: 'Final',
}

// Análogo a select-unidad-derivada-cotizacion.tsx: recibe la fila del
// carrito en vez de form+fieldIndex.
export default function SelectTipoPrecioCotizacion({ row }: Props) {
  const productoId = row.producto_id
  const productos = useStoreProductoAgregadoCotizacion((s) => s.productos)
  const setCarrito = useStoreProductoAgregadoCotizacion((s) => s.setCarrito)

  const productoEnStore = productos.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  const unidadDerivadaId = row.unidad_derivada_id
  const tipoPrecioActual = (row.tipo_precio || 'publico') as TipoPrecio
  const cantidad = Number(row.cantidad ?? 0)

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

  const opciones = (['publico', 'especial', 'minimo', 'ultimo'] as TipoPrecio[]).map(
    (tipo) => {
      const activadorKey = activadorMap[tipo]
      let disabled = false
      let label = LABELS[tipo]

      if (activadorKey) {
        const activador = Number((unidadDerivadaActual as any)[activadorKey] ?? 0)
        if (activador > 0 && cantidad < activador) {
          disabled = true
          label += ` (mín. ${activador})`
        }
      }

      return { value: tipo, label, disabled }
    }
  )

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
    const descuento_tipo = row.descuento_tipo || 'Monto'
    const descuento = Number(row.descuento ?? 0)

    const nuevoSubtotal = Number(
      calcularSubtotalCotizacion({
        precio_venta: precio,
        recargo,
        descuento_tipo,
        descuento,
        cantidad,
      })
    )

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
    if (cant < 1) return null
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
