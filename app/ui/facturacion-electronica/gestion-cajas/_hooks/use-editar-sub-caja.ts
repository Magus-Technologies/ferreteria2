import { useState } from 'react'
import { message } from 'antd'
import { cajaPrincipalApi, type SubCaja, type UpdateSubCajaRequest } from '~/lib/api/caja-principal'

export default function useEditarSubCaja({
  onSuccess,
}: {
  onSuccess?: (data: SubCaja) => void
}) {
  const [loading, setLoading] = useState(false)

  async function editarSubCaja(id: number, values: UpdateSubCajaRequest) {
    setLoading(true)
    try {
      const response = await cajaPrincipalApi.updateSubCaja(id, values)

      if (response.error) {
        message.error(response.error.message || 'Error al actualizar la sub-caja')
        return
      }

      if (response.data?.data) {
        message.success('Sub-caja actualizada exitosamente')
        onSuccess?.(response.data.data)
      }
    } catch (error) {
      console.error('Error al actualizar sub-caja:', error)
      message.error('Error inesperado al actualizar la sub-caja')
    } finally {
      setLoading(false)
    }
  }

  return {
    editarSubCaja,
    loading,
  }
}
