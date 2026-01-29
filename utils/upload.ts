import { App, Upload } from 'antd'
import { RcFile } from 'antd/es/upload'
import { UploadFile } from 'antd/lib'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e
  }
  return e?.file
}

export const useBeforeUpload = () => {
  const { notification } = App.useApp()
  const beforeUpload = (file: File) => {
    const isValidSize = file.size / 1024 / 1024 < 5 // Convierte bytes a MB
    if (!isValidSize) {
      notification.error({
        message: 'Error',
        description: 'El archivo debe pesar menos de 5MB',
      })
      return Upload.LIST_IGNORE
    }
    return false
  }

  return beforeUpload
}

export const toUploadFile = (file: File): UploadFile => ({
  uid: file.name + '-' + file.lastModified,
  name: file.name,
  status: 'done',
  originFileObj: file as RcFile,
})

export async function urlToFile(url: string): Promise<File> {
  const res = await fetch(url)
  const blob = await res.blob()
  const filename = url.split('/').pop() || 'file'
  return new File([blob], filename, { type: blob.type })
}

/**
 * Construye la URL completa de storage de Laravel
 * @param path - Ruta relativa del archivo (ej: "productos/imgs/abc.jpg")
 * @returns URL completa (ej: "http://localhost:8000/storage/productos/imgs/abc.jpg")
 */
export function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null

  // Si ya es una URL completa, devolverla tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  // Remover '/api' del final para obtener la URL base
  const baseUrl = apiUrl.replace(/\/api$/, '')

  return `${baseUrl}/storage/${path}`
}
