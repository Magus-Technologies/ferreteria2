'use client'

import { FormInstance } from 'antd'
import SelectBase from '~/app/_components/form/selects/select-base'
import { FaWeightHanging } from 'react-icons/fa6'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { onChangeCostoTablaCompras } from '../tables/columns-comprar'

interface SelectUnidadDerivadaCompraProps {
  form: FormInstance
  fieldIndex: number
  productoId: number
  disabled?: boolean
}

export default function SelectUnidadDerivadaCompra({
  form,
  fieldIndex,
  productoId,
  disabled = false,
}: SelectUnidadDerivadaCompraProps) {
  const productosCompra = useStoreProductoAgregadoCompra(
    (store) => store.productos
  )
  const setProductosCompra = useStoreProductoAgregadoCompra(
    (store) => store.setProductos
  )

  // Buscar el producto en el store para obtener sus unidades derivadas
  const productoEnStore = productosCompra.find(
    (p) => p.producto_id === productoId
  )

  // Obtener las unidades derivadas disponibles
  const unidadesDerivadas = (productoEnStore as any)?.unidades_derivadas_disponibles || []

  // Si no hay unidades derivadas disponibles, mostrar solo el nombre como texto
  if (!unidadesDerivadas || unidadesDerivadas.length === 0) {
    const unidadDerivadaName = form.getFieldValue([
      'productos',
      fieldIndex,
      'unidad_derivada_name',
    ])
    return (
      <div className='flex items-center h-full px-2 bg-gray-50 rounded border border-transparent'>
        <span className='text-xs text-slate-500 font-medium'>{unidadDerivadaName || '-'}</span>
      </div>
    )
  }

  // Crear opciones para el select
  const options = unidadesDerivadas.map((ud: any) => ({
    value: ud.unidad_derivada.id,
    label: ud.unidad_derivada.name,
  }))

  const handleChange = (newUnidadDerivadaId: number) => {
    // Buscar la nueva unidad derivada seleccionada
    const nuevaUnidadDerivada = unidadesDerivadas.find(
      (ud: any) => ud.unidad_derivada.id === newUnidadDerivadaId
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

    // Al cambiar la unidad, el precio de compra debe recalcularse basado en el costo_actual * nuevo_factor
    // o simplemente mantenerse si el usuario quiere editarlo. 
    // Pero usualmente se ajusta al factor.
    const costoActual = form.getFieldValue(['productos', fieldIndex, 'costo_actual']) || 0
    const nuevoFactor = Number(nuevaUnidadDerivada.factor)
    const nuevoPrecioCompra = costoActual * nuevoFactor

    form.setFieldValue(
      ['productos', fieldIndex, 'precio_compra'],
      nuevoPrecioCompra
    )

    // Recalcular subtotal
    const cantidad = Number(
      form.getFieldValue(['productos', fieldIndex, 'cantidad']) ?? 0
    )
    const flete = Number(
      form.getFieldValue(['productos', fieldIndex, 'flete']) ?? 0
    )
    
    const nuevoSubtotal = (nuevoPrecioCompra * cantidad) + flete
    form.setFieldValue(['productos', fieldIndex, 'subtotal'], nuevoSubtotal)

    // Sincronizar con el store para que los cambios se mantengan
    setProductosCompra((prev) =>
      prev.map((p) =>
        p.producto_id === productoId
          ? {
              ...p,
              unidad_derivada_id: nuevaUnidadDerivada.unidad_derivada.id,
              unidad_derivada_name: nuevaUnidadDerivada.unidad_derivada.name,
              unidad_derivada_factor: nuevoFactor,
              precio_compra: nuevoPrecioCompra,
              subtotal: nuevoSubtotal,
            }
          : p
      )
    )

    // Disparar lógica de ajuste de otros productos (si aplica)
    onChangeCostoTablaCompras({
        form,
        value: fieldIndex,
        costo: nuevoPrecioCompra,
        producto_id: productoId
    })
  }

  const unidadDerivadaId = form.getFieldValue([
    'productos',
    fieldIndex,
    'unidad_derivada_id',
  ])

  return (
    <SelectBase
      size='small'
      variant='borderless'
      className='w-full bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
      value={unidadDerivadaId}
      options={options}
      onChange={handleChange}
      disabled={disabled}
      prefix={<FaWeightHanging size={12} className='text-cyan-600' />}
    />
  )
}
