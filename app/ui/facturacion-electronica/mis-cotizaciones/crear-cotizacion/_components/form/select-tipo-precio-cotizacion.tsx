'use client'

import { Form, FormInstance } from 'antd'
import SelectBase from '~/app/_components/form/selects/select-base'
import { MdPriceChange } from 'react-icons/md'
import { useStoreProductoAgregadoCotizacion } from '../../_store/store-producto-agregado-cotizacion'
import { calcularSubtotalCotizacion } from '../tables/columns-cotizar'
import type { DescuentoTipo, TipoPrecio } from '../../_types/cotizacion.types'

interface Props {
  form: FormInstance
  fieldIndex: number
  productoId: number
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

export default function SelectTipoPrecioCotizacion({
  form,
  fieldIndex,
  productoId,
}: Props) {
  const productos = useStoreProductoAgregadoCotizacion(s => s.productos)

  const productoEnStore = productos.find(p => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  const unidadDerivadaId = form.getFieldValue([
    'productos',
    fieldIndex,
    'unidad_derivada_id',
  ])
  const tipoPrecioActual =
    Form.useWatch(['productos', fieldIndex, 'tipo_precio'], form) || 'publico'
  const cantidad = Number(
    Form.useWatch(['productos', fieldIndex, 'cantidad'], form) ?? 0
  )

  const unidadDerivadaActual = unidadesDerivadas.find(
    ud => ud.unidad_derivada.id === unidadDerivadaId
  )

  if (!unidadDerivadaActual) {
    return (
      <div className='flex items-center h-full px-1'>
        <span className='text-xs text-gray-400'>-</span>
      </div>
    )
  }

  const opciones = (['publico', 'especial', 'minimo', 'ultimo'] as TipoPrecio[]).map(
    tipo => {
      const activadorKey = activadorMap[tipo]
      let disabled = false
      let label = LABELS[tipo]

      if (activadorKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    form.setFieldValue(['productos', fieldIndex, 'tipo_precio'], nuevoTipo)
    form.setFieldValue(['productos', fieldIndex, 'precio_venta'], precio)
    form.setFieldValue(['productos', fieldIndex, 'comision'], comision)

    const recargo = Number(form.getFieldValue(['productos', fieldIndex, 'recargo']) ?? 0)
    const descuento_tipo = form.getFieldValue([
      'productos',
      fieldIndex,
      'descuento_tipo',
    ]) as DescuentoTipo
    const descuento = Number(
      form.getFieldValue(['productos', fieldIndex, 'descuento']) ?? 0
    )

    const nuevoSubtotal = calcularSubtotalCotizacion({
      precio_venta: precio,
      recargo,
      descuento_tipo: descuento_tipo || 'Monto',
      descuento,
      cantidad,
    })

    form.setFieldValue(['productos', fieldIndex, 'subtotal'], Number(nuevoSubtotal))
  }

  return (
    <SelectBase
      size='small'
      variant='borderless'
      className='w-full'
      value={tipoPrecioActual}
      options={opciones}
      onChange={handleChange}
      prefix={<MdPriceChange size={14} className='text-emerald-600' />}
    />
  )
}
