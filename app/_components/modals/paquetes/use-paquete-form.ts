import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { useCreatePaquete, useUpdatePaquete, usePaquete } from '~/hooks/use-paquetes'
import type { ProductoPaquete, TipoPrecioPaquete } from './table-productos-paquete'

export function usePaqueteForm(
  paqueteId: number | undefined,
  open: boolean,
  onClose: () => void,
  onSuccess?: () => void
) {
  const [form] = Form.useForm()
  const [productos, setProductos] = useState<ProductoPaquete[]>([])

  const isEditing = !!paqueteId

  // Hooks de mutación
  const { mutate: crear, isPending: isCreating } = useCreatePaquete()
  const { mutate: actualizar, isPending: isUpdating } = useUpdatePaquete()

  // Cargar paquete si es edición
  const { data: paqueteData, isLoading: isLoadingPaquete } = usePaquete(
    paqueteId,
    isEditing && open
  )

  // Cargar datos del paquete al editar
  useEffect(() => {
    if (isEditing && paqueteData && open) {
      form.setFieldsValue({
        nombre: paqueteData.nombre,
      })

      const productosFormateados: ProductoPaquete[] = paqueteData.productos.map((p) => {
        const productoAny = p.producto as any
        const productoEnAlmacen = productoAny?.producto_en_almacenes?.[0]
        const costo = productoEnAlmacen?.costo
          ? Number(productoEnAlmacen.costo)
          : undefined
        const unidades_derivadas_disponibles = productoEnAlmacen?.unidades_derivadas?.map((ud: any) => ({
          unidad_derivada: ud.unidad_derivada || { id: ud.unidad_derivada_id, name: '' },
          factor: ud.factor,
          precio_publico: ud.precio_publico,
          precio_especial: ud.precio_especial,
          precio_minimo: ud.precio_minimo,
          precio_ultimo: ud.precio_ultimo,
        })) || []
        return {
          key: `${p.producto_id}-${p.unidad_derivada_id}`,
          producto_id: p.producto_id,
          producto_name: p.producto?.name || '',
          producto_codigo: p.producto?.cod_producto || '',
          marca_name: p.producto?.marca?.name,
          unidad_derivada_id: p.unidad_derivada_id,
          unidad_derivada_name: p.unidad_derivada?.name || '',
          cantidad: p.cantidad,
          precio_publico: p.precio_publico != null ? Number(p.precio_publico) : undefined,
          precio_especial: p.precio_especial != null ? Number(p.precio_especial) : undefined,
          precio_minimo: p.precio_minimo != null ? Number(p.precio_minimo) : undefined,
          precio_ultimo: p.precio_ultimo != null ? Number(p.precio_ultimo) : undefined,
          descuento_publico: (p as any).descuento_publico != null ? Number((p as any).descuento_publico) : 0,
          descuento_especial: (p as any).descuento_especial != null ? Number((p as any).descuento_especial) : 0,
          descuento_minimo: (p as any).descuento_minimo != null ? Number((p as any).descuento_minimo) : 0,
          descuento_ultimo: (p as any).descuento_ultimo != null ? Number((p as any).descuento_ultimo) : 0,
          tipo_precio_vista: ((p as any).tipo_precio || 'publico') as TipoPrecioPaquete,
          costo,
          unidades_derivadas_disponibles,
        }
      })
      setProductos(productosFormateados)
    }
  }, [isEditing, paqueteData, open, form])

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setProductos([])
    }
  }, [open, form])

  const agregarProducto = (producto: ProductoPaquete) => {
    const existe = productos.find((p) => p.producto_id === producto.producto_id)

    if (existe) {
      message.warning('Este producto ya está en el paquete')
      return
    }

    setProductos((prev) => [...prev, producto])
    message.success('Producto agregado al paquete')
  }

  const eliminarProducto = (key: string) => {
    setProductos((prev) => prev.filter((p) => p.key !== key))
  }

  const actualizarUnidadDerivada = (key: string, unidadDerivadaId: number) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.key === key) {
          const unidad = p.unidades_derivadas_disponibles?.find(
            (u) => u.unidad_derivada.id === unidadDerivadaId
          )
          return {
            ...p,
            unidad_derivada_id: unidadDerivadaId,
            unidad_derivada_name: unidad?.unidad_derivada.name || p.unidad_derivada_name,
          }
        }
        return p
      })
    )
  }

  const actualizarCantidad = (key: string, cantidad: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, cantidad } : p))
    )
  }

  const actualizarPrecio = (key: string, tipo: TipoPrecioPaquete, precio: number | undefined) => {
    const precioKey = `precio_${tipo}` as keyof ProductoPaquete
    setProductos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [precioKey]: precio } : p))
    )
  }

  const actualizarTipoPrecio = (key: string, tipo: TipoPrecioPaquete) => {
    setProductos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, tipo_precio_vista: tipo } : p))
    )
  }

  const actualizarDescuento = (key: string, tipo: TipoPrecioPaquete, descuento: number | undefined) => {
    const descuentoKey = `descuento_${tipo}` as keyof ProductoPaquete
    setProductos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [descuentoKey]: descuento } : p))
    )
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (productos.length === 0) {
        message.error('Debes agregar al menos un producto')
        return
      }

      const data = {
        nombre: values.nombre,
        descripcion: null,
        activo: true,
        productos: productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          cantidad: p.cantidad,
          tipo_precio: p.tipo_precio_vista,
          precio_publico: p.precio_publico ?? null,
          precio_especial: p.precio_especial ?? null,
          precio_minimo: p.precio_minimo ?? null,
          precio_ultimo: p.precio_ultimo ?? null,
          descuento_publico: p.descuento_publico ?? 0,
          descuento_especial: p.descuento_especial ?? 0,
          descuento_minimo: p.descuento_minimo ?? 0,
          descuento_ultimo: p.descuento_ultimo ?? 0,
        })),
      }

      if (isEditing && paqueteId) {
        actualizar(
          { id: paqueteId, data },
          {
            onSuccess: () => {
              onSuccess?.()
              onClose()
            },
          }
        )
      } else {
        crear(data, {
          onSuccess: () => {
            onSuccess?.()
            onClose()
          },
        })
      }
    } catch (error) {
      console.error('Error en validación:', error)
    }
  }

  return {
    form,
    productos,
    isEditing,
    isLoadingPaquete,
    isPending: isCreating || isUpdating,
    agregarProducto,
    eliminarProducto,
    actualizarUnidadDerivada,
    actualizarCantidad,
    actualizarPrecio,
    actualizarTipoPrecio,
    actualizarDescuento,
    handleSubmit,
  }
}
