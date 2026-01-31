import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { useCreatePaquete, useUpdatePaquete, usePaquete } from '~/hooks/use-paquetes'
import type { ProductoPaquete } from './table-productos-paquete'

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

      // Cargar productos del paquete
      const productosFormateados: ProductoPaquete[] = paqueteData.productos.map((p) => ({
        key: `${p.producto_id}-${p.unidad_derivada_id}`,
        producto_id: p.producto_id,
        producto_name: p.producto?.name || '',
        producto_codigo: p.producto?.cod_producto || '',
        marca_name: p.producto?.marca?.name,
        unidad_derivada_id: p.unidad_derivada_id,
        unidad_derivada_name: p.unidad_derivada?.name || '',
        cantidad: p.cantidad,
        precio_sugerido: p.precio_sugerido || undefined,
      }))
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
    // Verificar si ya existe
    const existe = productos.find((p) => p.producto_id === producto.producto_id)

    if (existe) {
      message.warning('Este producto ya está en el paquete')
      return
    }

    setProductos([...productos, producto])
    message.success('Producto agregado al paquete')
  }

  const eliminarProducto = (key: string) => {
    setProductos(productos.filter((p) => p.key !== key))
  }

  const actualizarUnidadDerivada = (key: string, unidadDerivadaId: number) => {
    setProductos(
      productos.map((p) => {
        if (p.key === key) {
          // Buscar el nombre de la nueva unidad derivada
          const unidad = p.unidades_derivadas_disponibles?.find(
            (u) => u.unidad_derivada.id === unidadDerivadaId
          )
          return {
            ...p,
            unidad_derivada_id: unidadDerivadaId,
            unidad_derivada_name: unidad?.unidad_derivada.name || p.unidad_derivada_name,
            // Forzar nuevo key para que AG Grid detecte el cambio
            key: `${p.producto_id}-${unidadDerivadaId}-${Date.now()}`,
          }
        }
        return p
      })
    )
  }

  const actualizarCantidad = (key: string, cantidad: number) => {
    setProductos(
      productos.map((p) => (p.key === key ? { ...p, cantidad } : p))
    )
  }

  const actualizarPrecio = (key: string, precio: number | undefined) => {
    setProductos(
      productos.map((p) => (p.key === key ? { ...p, precio_sugerido: precio } : p))
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
          precio_sugerido: p.precio_sugerido || null,
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
    handleSubmit,
  }
}
