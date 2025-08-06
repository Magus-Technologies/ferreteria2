import { App, Upload } from 'antd'

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
