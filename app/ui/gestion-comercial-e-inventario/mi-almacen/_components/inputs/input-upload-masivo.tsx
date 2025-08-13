import { App, Upload } from 'antd'
import { UploadProps } from 'antd/lib'
import { FaCloudUploadAlt } from 'react-icons/fa'
import ButtonBase, { ButtonBaseProps } from '~/components/buttons/button-base'
import { BiLoaderAlt } from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'

function useUploadMasivo() {
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()
  const queryClient = useQueryClient()

  async function handleUploadMasivo(formData: FormData) {
    try {
      setLoading(true)
      const res = await fetch('/api/producto/upload-masivo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error al subir los archivos')

      const data = (await res.json()) as { data: string[] }
      if (data.data.length)
        notification.warning({
          duration: 0,
          message: 'Archivos subidos',
          description: (
            <div className='max-h-[60dvh] overflow-y-auto px-5'>
              <div className='font-bold'>Estos códigos no existen:</div>
              <ul className='text-red-500 list-disc'>
                {data.data.map((codigo, index) => (
                  <li key={index}>{codigo}</li>
                ))}
              </ul>
            </div>
          ),
        })
      else
        notification.success({
          message: 'Archivos subidos',
          description: 'Archivos subidos correctamente',
        })

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
    } catch {
      notification.warning({
        message: 'Error',
        description: 'Error al subir los archivos',
      })
    } finally {
      setLoading(false)
    }
  }

  return { handleUploadMasivo, loading }
}

interface InputUploadMasivoProps extends UploadProps {
  buttonProps?: Omit<ButtonBaseProps, 'children'>
  tipo: 'img' | 'ficha_tecnica'
  buttonTitle: string
}

export default function InputUploadMasivo({
  buttonProps,
  tipo,
  buttonTitle,
  ...props
}: InputUploadMasivoProps) {
  const { handleUploadMasivo, loading } = useUploadMasivo()
  const { notification } = App.useApp()

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    if (!selectedFiles.length) return
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('tipo', tipo)
      handleUploadMasivo(formData)
    } catch {
      notification.warning({
        message: 'Error',
        description: 'Error al subir los archivos',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles])

  return (
    <Upload
      multiple
      disabled={loading}
      showUploadList={false}
      beforeUpload={(_, fileList) => {
        setSelectedFiles(fileList)
        return false
      }}
      {...props}
    >
      <ButtonBase
        disabled={loading}
        className='flex gap-2 items-center'
        size='sm'
        {...buttonProps}
      >
        {loading ? (
          <BiLoaderAlt className='animate-spin' />
        ) : (
          <FaCloudUploadAlt />
        )}
        {buttonTitle}
      </ButtonBase>
    </Upload>
  )
}
