import {
  FormCreateProductoFormatedProps,
  FormCreateProductoProps,
} from '../_components/modals/modal-create-producto'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useStoreArchivosProducto } from '../_store/store-archivos-producto'
import { useState } from 'react'
import { App } from 'antd'
import type { Producto } from '~/app/_types/producto'
import { FormInstance } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreEditOrCopyProducto } from '../_store/store-edit-or-copy-producto'
import { useStoreFiltrosProductos } from '../_store/store-filtros-productos'
import { productosApiV2 } from '~/lib/api/producto'

export default function useCreateProducto({
  setOpen,
  form,
  onSuccess,
}: {
  setOpen: (value: boolean) => void
  form: FormInstance
  onSuccess?: (res: Producto) => void
}) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const { notification } = App.useApp()

  const img_file = useStoreArchivosProducto(state => state.img_file)
  const ficha_tecnica_file = useStoreArchivosProducto(
    state => state.ficha_tecnica_file
  )

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)

  const setFiltros = useStoreFiltrosProductos(state => state.setFiltros)

  const [loading, setLoading] = useState(false)

  async function execute(data: FormCreateProductoFormatedProps) {
    setLoading(true)

    try {
      // Llamar al API de Laravel
      const res = producto?.id
        ? await productosApiV2.update(producto.id, data)
        : await productosApiV2.create(data)

      if (res.error) {
        notification.error({
          message: 'Error',
          description: res.error.message,
        })
        setLoading(false)
        return
      }

      // Upload de archivos (igual que antes)
      const formData = new FormData()

      if (img_file) formData.append('img_file', img_file)
      if (producto?.img && producto?.id)
        formData.append('img_prev', producto.img)

      if (ficha_tecnica_file)
        formData.append('ficha_tecnica_file', ficha_tecnica_file)
      if (producto?.ficha_tecnica && producto?.id)
        formData.append('ficha_tecnica_prev', producto.ficha_tecnica)

      formData.append('cod_producto', res.data!.cod_producto!)

      setUploading(true)
      try {
        const uploadRes = await fetch('/api/producto', {
          method: 'POST',
          body: formData,
          credentials: 'include', // Incluir cookies de sesión
        })

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al subir el archivo')
        }

        notification.success({
          message: producto?.id ? 'Producto editado' : 'Producto creado',
          description: producto?.id
            ? 'Producto editado correctamente'
            : 'Producto creado correctamente',
        })
      } catch (error) {
        console.error('Error al subir archivos:', error)
        notification.warning({
          message: producto?.id ? 'Producto editado' : 'Producto creado',
          description: 'Error al subir la imagen y/o ficha técnica',
        })
      } finally {
        setUploading(false)
      }

      // Invalidar todas las queries de productos
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'productos-by-almacen' ||
          query.queryKey[0] === 'productos-search',
        refetchType: 'active',
      })

      setOpen(false)
      form.resetFields()
      setImgFile(undefined)
      setFichaTecnicaFile(undefined)
      setProducto(undefined)
      setFiltros(prev => ({
        ...prev,
        marca_id: res.data?.marca_id,
      }))

      onSuccess?.(res.data!)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Error al procesar la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  function crearProductoForm(values: FormCreateProductoProps) {
    if (values.unidades_derivadas.length < 1) {
      notification.error({
        message: 'Error',
        description: 'Debe agregar al menos una unidad derivada',
      })
      return
    }

    // Función para limpiar valores undefined y "$undefined"
    const cleanUndefinedValues = (obj: unknown): unknown => {
      if (obj === null || obj === undefined || obj === '$undefined') {
        return undefined
      }
      // Preservar objetos Dayjs sin procesarlos
      if (dayjs.isDayjs(obj)) {
        return obj
      }
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        const cleaned: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined && value !== '$undefined') {
            cleaned[key] = cleanUndefinedValues(value)
          }
        }
        return cleaned
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanUndefinedValues)
      }
      return obj
    }

    const cleanedValues = cleanUndefinedValues(values) as FormCreateProductoProps

    const dataBase = {
      ...cleanedValues,
      compra: {
        ...cleanedValues.compra,
        vencimiento: cleanedValues.compra?.vencimiento && dayjs.isDayjs(cleanedValues.compra.vencimiento)
          ? toUTCBD({
              date: cleanedValues.compra.vencimiento,
            })
          : undefined,
      },
      unidades_derivadas: cleanedValues.unidades_derivadas.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { unidad_derivada: _unidad_derivada, ...rest } = item
        return rest
      }),
      estado: cleanedValues.estado === 1,
      id: producto?.id,
    }

    // Si cod_producto está vacío o es "$undefined", dejamos que el servidor lo genere
    const data = (!dataBase.cod_producto || dataBase.cod_producto === '' || dataBase.cod_producto === '$undefined')
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { cod_producto: _cod_producto, ...rest } = dataBase
          return rest
        })()
      : dataBase

    execute(data)
  }

  return {
    crearProductoForm,
    loading: loading || uploading,
  }
}
