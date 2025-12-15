import { useServerMutation } from '~/hooks/use-server-mutation'
import {
  FormCreateProductoFormatedProps,
  FormCreateProductoProps,
} from '../_components/modals/modal-create-producto'
import { createProducto, editarProducto } from '~/app/_actions/producto'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useStoreArchivosProducto } from '../_store/store-archivos-producto'
import { useState } from 'react'
import { App } from 'antd'
import { Producto } from '@prisma/client'
import { FormInstance } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreEditOrCopyProducto } from '../_store/store-edit-or-copy-producto'
import { useStoreFiltrosProductos } from '../_store/store-filtros-productos'

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

  const { execute, loading } = useServerMutation<
    FormCreateProductoFormatedProps,
    Producto
  >({
    action: producto?.id ? editarProducto : createProducto,
    onSuccess: async res => {
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
        const res = await fetch('/api/producto', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Error al subir el archivo')

        notification.success({
          message: producto?.id ? 'Producto editado' : 'Producto creado',
          description: producto?.id
            ? 'Producto editado correctamente'
            : 'Producto creado correctamente',
        })
      } catch {
        notification.warning({
          message: producto?.id ? 'Producto editado' : 'Producto creado',
          description: 'Error al subir la imagen y/o ficha técnica',
        })
      } finally {
        setUploading(false)
      }

      // Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({ 
        queryKey: [QueryKeys.PRODUCTOS],
        refetchType: 'active' // Solo refetch queries activas
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
    },
  })

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
