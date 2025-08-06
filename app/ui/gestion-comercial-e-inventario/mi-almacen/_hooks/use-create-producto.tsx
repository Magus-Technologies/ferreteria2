import { useServerMutation } from '~/hooks/use-server-mutation'
import {
  FormCreateProductoFormatedProps,
  FormCreateProductoProps,
} from '../_components/modals/modal-create-producto'
import { createProducto } from '~/app/_actions/producto'
import { toUTCString } from '~/utils/fechas'
import { useStoreArchivosProducto } from '../store/store-archivos-producto'
import { useState } from 'react'
import { App } from 'antd'
import { Producto } from '@prisma/client'
import { FormInstance } from 'antd'
import { Dispatch, SetStateAction } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useCreateProducto({
  setOpen,
  form,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>
  form: FormInstance
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

  const { execute, loading } = useServerMutation<
    FormCreateProductoFormatedProps,
    Producto
  >({
    action: createProducto,
    onSuccess: async res => {
      if (img_file || ficha_tecnica_file) {
        const formData = new FormData()

        if (img_file) formData.append('img_file', img_file)
        if (ficha_tecnica_file)
          formData.append('ficha_tecnica_file', ficha_tecnica_file)

        formData.append('cod_producto', res.data!.cod_producto!)

        setUploading(true)
        try {
          const res = await fetch('/api/producto', {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) throw new Error('Error al subir el archivo')

          notification.success({
            message: 'Producto creado',
            description: 'Producto creado correctamente',
          })
        } catch (error) {
          console.error('🚀 ~ file: use-create-producto.tsx:67 ~ error:', error)
          notification.warning({
            message: 'Producto creado',
            description: 'Error al subir la imagen y/o ficha técnica',
          })
        } finally {
          setUploading(false)
        }
      } else {
        notification.success({
          message: 'Producto creado',
          description: 'Producto creado correctamente',
        })
      }

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
      setOpen(false)
      form.resetFields()
      setImgFile(undefined)
      setFichaTecnicaFile(undefined)
    },
  })

  function crearProductoForm(values: FormCreateProductoProps) {
    const data = {
      ...values,
      compra: {
        ...values.compra,
        vencimiento: values.compra.vencimiento
          ? toUTCString({
              date: values.compra.vencimiento,
            })
          : undefined,
      },
      estado: values.estado === 1,
    }
    execute(data)
  }

  return {
    crearProductoForm,
    loading: loading || uploading,
  }
}
