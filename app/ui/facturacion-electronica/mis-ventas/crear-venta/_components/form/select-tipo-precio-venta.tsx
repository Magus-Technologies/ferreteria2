'use client'

import { Form, FormInstance } from 'antd'
import SelectBase from '~/app/_components/form/selects/select-base'
import { MdPriceChange } from 'react-icons/md'
import { DescuentoTipo } from '~/lib/api/venta'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import { calcularSubtotalVenta } from '../tables/columns-vender'

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

interface SelectTipoPrecioVentaProps {
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

export default function SelectTipoPrecioVenta({
  form,
  fieldIndex,
  productoId,
}: SelectTipoPrecioVentaProps) {
  const productosVenta = useStoreProductoAgregadoVenta((store) => store.productos)

  const productoEnStore = productosVenta.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  const unidadDerivadaId = form.getFieldValue(['productos', fieldIndex, 'unidad_derivada_id'])
  const tipoPrecioActual = Form.useWatch(['productos', fieldIndex, 'tipo_precio'], form) || 'publico'
  const cantidad = Number(Form.useWatch(['productos', fieldIndex, 'cantidad'], form) ?? 0)

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
    let disabled = false
    let label = tipo === 'publico' ? 'Público' : tipo === 'especial' ? 'Especial' : tipo === 'minimo' ? 'Mínimo' : 'Último'

    if (activadorKey) {
      const activador = Number((unidadDerivadaActual as any)[activadorKey] ?? 0)
      if (activador > 0 && cantidad < activador) {
        disabled = true
        label += ` (mín. ${activador})`
      }
    }

    return { value: tipo, label, disabled }
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

    form.setFieldValue(['productos', fieldIndex, 'tipo_precio'], nuevoTipo)
    form.setFieldValue(['productos', fieldIndex, 'precio_venta'], precio)
    form.setFieldValue(['productos', fieldIndex, 'comision'], comision)

    // Recalcular subtotal
    const recargo = Number(form.getFieldValue(['productos', fieldIndex, 'recargo']) ?? 0)
    const descuento_tipo = form.getFieldValue(['productos', fieldIndex, 'descuento_tipo']) as DescuentoTipo
    const descuento = Number(form.getFieldValue(['productos', fieldIndex, 'descuento']) ?? 0)

    const nuevoSubtotal = calcularSubtotalVenta({
      precio_venta: precio,
      recargo,
      descuento_tipo,
      descuento,
      cantidad,
    })

    form.setFieldValue(['productos', fieldIndex, 'subtotal'], nuevoSubtotal)
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
