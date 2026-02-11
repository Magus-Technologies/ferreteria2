import { App, Upload, Progress, Modal } from 'antd'
import { UploadProps } from 'antd/lib'
import { FaCloudUploadAlt } from 'react-icons/fa'
import ButtonBase, { ButtonBaseProps } from '~/components/buttons/button-base'
import { BiLoaderAlt } from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthToken } from '~/lib/api'

// OPTIMIZACIÓN: Configuración de chunking
const CHUNK_SIZE = 50 // Procesar 50 archivos a la vez
const MAX_RETRIES = 2 // Reintentos por chunk

interface UploadProgress {
  total: number
  uploaded: number
  failed: number
  percentage: number
}

function useUploadMasivo() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({ 
    total: 0, 
    uploaded: 0, 
    failed: 0, 
    percentage: 0 
  })
  const [showProgress, setShowProgress] = useState(false)
  const { notification, modal } = App.useApp()
  const queryClient = useQueryClient()

  // OPTIMIZACIÓN: Función para subir un chunk de archivos con retry
  async function uploadChunk(
    files: File[], 
    tipo: string, 
    retryCount = 0
  ): Promise<{ uploaded: string[], not_found: string[], errors: string[] }> {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const fullUrl = `${API_URL}/productos/upload-files-masivo`
    
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files[]', file)
    })
    formData.append('tipo', tipo)
    
    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP ${res.status}`)
      }

      const data = await res.json()
      return data.data
      
    } catch (error) {
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Reintentando chunk (${retryCount + 1}/${MAX_RETRIES})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Backoff
        return uploadChunk(files, tipo, retryCount + 1)
      }
      
      throw error
    }
  }

  // OPTIMIZACIÓN: Función principal con chunking y progress
  async function handleUploadMasivo(files: File[], tipo: string) {
    try {
      setLoading(true)
      setShowProgress(true)
      
      const totalFiles = files.length
      let totalUploaded: string[] = []
      let totalNotFound: string[] = []
      let totalErrors: string[] = []

      // Dividir archivos en chunks
      const chunks: File[][] = []
      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        chunks.push(files.slice(i, i + CHUNK_SIZE))
      }

      console.log(`📦 Procesando ${totalFiles} archivos en ${chunks.length} lotes de ${CHUNK_SIZE}`)

      setProgress({
        total: totalFiles,
        uploaded: 0,
        failed: 0,
        percentage: 0
      })

      // Procesar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        console.log(`🚀 Procesando lote ${i + 1}/${chunks.length} (${chunk.length} archivos)`)

        try {
          const result = await uploadChunk(chunk, tipo)
          
          totalUploaded = [...totalUploaded, ...result.uploaded]
          totalNotFound = [...totalNotFound, ...result.not_found]
          totalErrors = [...totalErrors, ...(result.errors || [])]

          // Actualizar progreso
          const uploadedCount = totalUploaded.length
          const failedCount = totalNotFound.length + totalErrors.length
          
          setProgress({
            total: totalFiles,
            uploaded: uploadedCount,
            failed: failedCount,
            percentage: Math.round((uploadedCount + failedCount) / totalFiles * 100)
          })

        } catch (error) {
          console.error(`❌ Error en lote ${i + 1}:`, error)
          totalErrors.push(`Error en lote ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          
          // Actualizar progreso con fallos
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + chunk.length,
            percentage: Math.round((prev.uploaded + prev.failed + chunk.length) / totalFiles * 100)
          }))
        }

        // Pequeña pausa entre chunks para no saturar el servidor
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Mostrar resultados
      setShowProgress(false)
      
      if (totalNotFound.length > 0 || totalErrors.length > 0) {
        modal.warning({
          title: `${totalUploaded.length} archivos subidos`,
          width: 600,
          content: (
            <div className='max-h-[60dvh] overflow-y-auto'>
              {totalNotFound.length > 0 && (
                <div className='mb-4'>
                  <div className='font-bold text-orange-600'>Códigos de productos no encontrados ({totalNotFound.length}):</div>
                  <ul className='text-red-500 list-disc ml-4 max-h-40 overflow-y-auto'>
                    {totalNotFound.map((codigo, index) => (
                      <li key={index}>{codigo}</li>
                    ))}
                  </ul>
                </div>
              )}
              {totalErrors.length > 0 && (
                <div>
                  <div className='font-bold text-red-600'>Errores ({totalErrors.length}):</div>
                  <ul className='text-red-500 list-disc ml-4 max-h-40 overflow-y-auto'>
                    {totalErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        })
      } else {
        notification.success({
          message: '¡Importación completada!',
          description: `${totalUploaded.length} archivos subidos correctamente`,
          duration: 5
        })
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
      queryClient.invalidateQueries({ queryKey: ['productos-by-almacen'] })
      
    } catch (error) {
      setShowProgress(false)
      notification.error({
        message: 'Error crítico',
        description: error instanceof Error ? error.message : 'Error al subir los archivos',
      })
    } finally {
      setLoading(false)
    }
  }

  return { handleUploadMasivo, loading, progress, showProgress }
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
  const { handleUploadMasivo, loading, progress, showProgress } = useUploadMasivo()
  const { notification } = App.useApp()

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    if (!selectedFiles.length) return
    
    // Validar que los archivos tengan nombres válidos
    const invalidFiles = selectedFiles.filter(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      return !nameWithoutExt || nameWithoutExt.length === 0
    })

    if (invalidFiles.length > 0) {
      notification.warning({
        message: 'Archivos inválidos',
        description: `${invalidFiles.length} archivo(s) tienen nombres inválidos y serán ignorados`,
      })
    }

    try {
      handleUploadMasivo(selectedFiles, tipo)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Error al procesar los archivos',
      })
    } finally {
      setSelectedFiles([]) // Limpiar selección
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles])

  return (
    <>
      {/* Modal de progreso */}
      <Modal
        open={showProgress}
        closable={false}
        footer={null}
        centered
        width={500}
      >
        <div className='py-6'>
          <h3 className='text-lg font-semibold mb-4 text-center'>
            Importando archivos...
          </h3>
          
          <Progress
            percent={progress.percentage}
            status={loading ? 'active' : 'success'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          
          <div className='mt-4 text-center space-y-1'>
            <div className='text-sm text-gray-600'>
              <span className='font-semibold text-green-600'>{progress.uploaded}</span> subidos,{' '}
              <span className='font-semibold text-red-600'>{progress.failed}</span> fallidos{' '}
              de <span className='font-semibold'>{progress.total}</span> total
            </div>
            <div className='text-xs text-gray-500'>
              Procesando en lotes de {CHUNK_SIZE} archivos
            </div>
          </div>
        </div>
      </Modal>

      <Upload
        multiple
        disabled={loading}
        showUploadList={false}
        beforeUpload={(_, fileList) => {
          // Validar cantidad de archivos
          if (fileList.length > 500) {
            notification.warning({
              message: 'Demasiados archivos',
              description: 'Se recomienda importar máximo 500 archivos a la vez. Los primeros 500 serán procesados.',
            })
            setSelectedFiles(fileList.slice(0, 500))
          } else {
            setSelectedFiles(fileList)
          }
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
    </>
  )
}
