'use client'

import { FormInstance } from 'antd'
import SelectUnidadDerivadaEditable from '~/app/_components/form/selects/select-unidad-derivada-editable'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

interface SelectUnidadDerivadaVentaProps {
  form: FormInstance
  fieldIndex: number
  productoId: number
}

export default function SelectUnidadDerivadaVenta({
  form,
  fieldIndex,
  productoId,
}: SelectUnidadDerivadaVentaProps) {
  const productosVenta = useStoreProductoAgregadoVenta(
    (store) => store.productos
  )
  const setProductosVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductos
  )

  // Buscar el producto en el store para obtener sus unidades derivadas
  const productoEnStore = productosVenta.find(
    (p) => p.producto_id === productoId
  )

  // Obtener las unidades derivadas disponibles
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []

  // Callback para actualizar el store cuando cambia la unidad derivada
  const handleUpdateStore = (data: {
    productoId: number
    unidad_derivada_id: number
    unidad_derivada_name: string
    unidad_derivada_factor: number
    precio_venta: number
    subtotal: number
  }) => {
    setProductosVenta((prev) =>
      prev.map((p) =>
        p.producto_id === data.productoId
          ? {
              ...p,
              unidad_derivada_id: data.unidad_derivada_id,
              unidad_derivada_name: data.unidad_derivada_name,
              unidad_derivada_factor: data.unidad_derivada_factor,
              precio_venta: data.precio_venta,
              subtotal: data.subtotal,
            }
          : p
      )
    )
  }

  return (
    <SelectUnidadDerivadaEditable
      form={form}
      fieldIndex={fieldIndex}
      productoId={productoId}
      unidadesDerivadas={unidadesDerivadas}
      onUpdateStore={handleUpdateStore}
    />
  )
}
