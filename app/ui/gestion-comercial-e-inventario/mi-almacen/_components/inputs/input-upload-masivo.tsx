import { App, Upload } from 'antd'
import { UploadProps } from 'antd/lib'
import { FaCloudUploadAlt } from 'react-icons/fa'
import ButtonBase, { ButtonBaseProps } from '~/components/buttons/button-base'
import { BiLoaderAlt } from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthToken } from '~/lib/api'

function useUploadMasivo() {
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()
  const queryClient = useQueryClient()

  async function handleUploadMasivo(formData: FormData) {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      // Usar el backend de Laravel en lugar de Next.js API Route
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const fullUrl = `${API_URL}/productos/upload-files-masivo`
      
      console.log('🔍 API_URL:', API_URL)
      console.log('🌐 Full URL:', fullUrl)
      console.log('🔑 Token:', token ? 'Presente' : 'No presente')
      console.log('🔑 Token completo:', token) // Ver el token real
      console.log('📦 FormData files:', formData.getAll('files'))
      console.log('📦 FormData tipo:', formData.get('tipo'))
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json', // IMPORTANTE: Esto evita la redirección de Laravel
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      console.log('📡 Response status:', res.status)
      console.log('📡 Response URL:', res.url) // Ver si redireccionó
      console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()))

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al subir los archivos')
      }

      const data = (await res.json()) as { 
        data: { 
          uploaded: string[], 
          not_found: string[] 
        } 
      }
      
      if (data.data.not_found.length)
        notification.warning({
          duration: 0,
          message: `${data.data.uploaded.length} archivos subidos`,
          description: (
            <div className='max-h-[60dvh] overflow-y-auto px-5'>
              <div className='font-bold'>Estos códigos no existen:</div>
              <ul className='text-red-500 list-disc'>
                {data.data.not_found.map((codigo, index) => (
                  <li key={index}>{codigo}</li>
                ))}
              </ul>
            </div>
          ),
        })
      else
        notification.success({
          message: 'Archivos subidos',
          description: `${data.data.uploaded.length} archivos subidos correctamente`,
        })

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
      // También invalidar la query de productos por almacén que usa la tabla
      queryClient.invalidateQueries({ queryKey: ['productos-by-almacen'] })
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir los archivos',
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
        formData.append('files[]', file) // Agregar [] para que Laravel lo interprete como array
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
        className='flex gap-2 items-center flex-shrink-0 whitespace-nowrap'
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
