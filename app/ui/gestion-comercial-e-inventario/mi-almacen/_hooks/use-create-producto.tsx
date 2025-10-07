import { useServerMutation } from '~/hooks/use-server-mutation'
import {
  FormCreateProductoFormatedProps,
  FormCreateProductoProps,
} from '../_components/modals/modal-create-producto'
import { createProducto, editarProducto } from '~/app/_actions/producto'
import { toLocalString } from '~/utils/fechas'
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

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
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
    const data = {
      ...values,
      compra: {
        ...values.compra,
        vencimiento: values.compra?.vencimiento
          ? toLocalString({
              date: values.compra.vencimiento,
            })
          : undefined,
      },
      unidades_derivadas: values.unidades_derivadas.map(item => {
        delete item.unidad_derivada
        return item
      }),
      estado: values.estado === 1,
      id: producto?.id,
    }
    execute(data)
  }

  return {
    crearProductoForm,
    loading: loading || uploading,
  }
}
