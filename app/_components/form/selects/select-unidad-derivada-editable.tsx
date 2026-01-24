'use client'

import { FormInstance } from 'antd'
import SelectBase from './select-base'
import { FaWeightHanging } from 'react-icons/fa6'
import { DescuentoTipo } from '~/lib/api/venta'
import type { Producto } from '~/app/_types/producto'

interface SelectUnidadDerivadaEditableProps {
  form: FormInstance
  fieldIndex: number
  productoId: number
  unidadesDerivadas: Producto['producto_en_almacenes'][number]['unidades_derivadas']
  onUpdateStore?: (data: {
    productoId: number
    unidad_derivada_id: number
    unidad_derivada_name: string
    unidad_derivada_factor: number
    precio_venta: number
    subtotal: number
  }) => void
}

export default function SelectUnidadDerivadaEditable({
  form,
  fieldIndex,
  productoId,
  unidadesDerivadas,
  onUpdateStore,
}: SelectUnidadDerivadaEditableProps) {
  // Obtener el valor actual de la unidad derivada
  const unidadDerivadaId = form.getFieldValue([
    'productos',
    fieldIndex,
    'unidad_derivada_id',
  ])

  const unidadDerivadaName = form.getFieldValue([
    'productos',
    fieldIndex,
    'unidad_derivada_name',
  ])

  // Si no hay unidades derivadas disponibles, mostrar solo el nombre
  if (!unidadesDerivadas || unidadesDerivadas.length === 0) {
    return (
      <div className='flex items-center h-full px-2'>
        <span className='text-sm'>{unidadDerivadaName || '-'}</span>
      </div>
    )
  }

  // Crear opciones para el select
  const options = unidadesDerivadas.map((ud) => ({
    value: ud.unidad_derivada.id,
    label: ud.unidad_derivada.name,
  }))

  const handleChange = (newUnidadDerivadaId: number) => {
    // Buscar la nueva unidad derivada seleccionada
    const nuevaUnidadDerivada = unidadesDerivadas.find(
      (ud) => ud.unidad_derivada.id === newUnidadDerivadaId
    )

    if (!nuevaUnidadDerivada) return

    // Actualizar todos los campos relacionados en el formulario
    form.setFieldValue(
      ['productos', fieldIndex, 'unidad_derivada_id'],
      nuevaUnidadDerivada.unidad_derivada.id
    )
    form.setFieldValue(
      ['productos', fieldIndex, 'unidad_derivada_name'],
      nuevaUnidadDerivada.unidad_derivada.name
    )
    form.setFieldValue(
      ['productos', fieldIndex, 'unidad_derivada_factor'],
      Number(nuevaUnidadDerivada.factor)
    )

    // Actualizar el precio de venta al precio público de la nueva unidad derivada
    const nuevoPrecioVenta = Number(nuevaUnidadDerivada.precio_publico ?? 0)
    form.setFieldValue(
      ['productos', fieldIndex, 'precio_venta'],
      nuevoPrecioVenta
    )

    // Recalcular subtotal
    const cantidad = Number(
      form.getFieldValue(['productos', fieldIndex, 'cantidad']) ?? 0
    )
    const recargo = Number(
      form.getFieldValue(['productos', fieldIndex, 'recargo']) ?? 0
    )
    const descuento_tipo = form.getFieldValue([
      'productos',
      fieldIndex,
      'descuento_tipo',
    ]) as DescuentoTipo
    const descuento = Number(
      form.getFieldValue(['productos', fieldIndex, 'descuento']) ?? 0
    )

    const nuevoSubtotal =
      (Number(nuevoPrecioVenta) + Number(recargo)) * Number(cantidad) -
      (descuento_tipo === DescuentoTipo.PORCENTAJE
        ? ((Number(nuevoPrecioVenta) + Number(recargo)) *
            Number(descuento) *
            Number(cantidad)) /
          100
        : Number(descuento))

    form.setFieldValue(['productos', fieldIndex, 'subtotal'], nuevoSubtotal)

    // Callback para actualizar el store externo (opcional)
    if (onUpdateStore) {
      onUpdateStore({
        productoId,
        unidad_derivada_id: nuevaUnidadDerivada.unidad_derivada.id,
        unidad_derivada_name: nuevaUnidadDerivada.unidad_derivada.name,
        unidad_derivada_factor: Number(nuevaUnidadDerivada.factor),
        precio_venta: nuevoPrecioVenta,
        subtotal: nuevoSubtotal,
      })
    }
  }

  return (
    <SelectBase
      size='small'
      variant='borderless'
      className='w-full'
      value={unidadDerivadaId}
      options={options}
      onChange={handleChange}
      prefix={<FaWeightHanging size={12} className='text-cyan-600' />}
    />
  )
}
