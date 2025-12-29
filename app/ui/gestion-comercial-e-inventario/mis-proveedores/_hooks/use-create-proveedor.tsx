import { QueryKeys } from '~/app/_lib/queryKeys'
import { toUTCBD } from '~/utils/fechas'
import { dataProveedorModalProps } from '../_components/modals/modal-create-proveedor'
import { proveedorApi, type Proveedor } from '~/lib/api/proveedor'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { message } from 'antd'

export default function useCreateProveedor({
  onSuccess,
  dataEdit,
}: {
  onSuccess?: (proveedor: Proveedor) => void
  dataEdit?: Proveedor
}) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const mutation = useMutation({
    mutationFn: async (values: dataProveedorModalProps) => {
      const { vendedores, carros, choferes, estado, ...rest } = values

      const data = {
        ...rest,
        estado: estado === 1,
        vendedores: vendedores?.map(item => ({
          dni: item.dni,
          nombres: item.nombres,
          direccion: item.direccion,
          telefono: item.telefono,
          email: item.email,
          estado: item.estado === 1,
          cumple: item.cumple
            ? toUTCBD({
                date: item.cumple,
              })
            : undefined,
        })),
        carros: carros?.map(item => ({
          placa: item.placa,
        })),
        choferes: choferes?.map(item => ({
          dni: item.dni,
          name: item.name,
          licencia: item.licencia,
        })),
      }

      const result = dataEdit
        ? await proveedorApi.update(dataEdit.id, data)
        : await proveedorApi.create(data)

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data!.data
    },
    onSuccess: (proveedor) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES_SEARCH] })
      message.success(`Proveedor ${dataEdit ? 'editado' : 'creado'} exitosamente`)
      onSuccess?.(proveedor)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al procesar la solicitud')
    },
  })

  function crearProveedorForm(values: dataProveedorModalProps) {
    setLoading(true)
    mutation.mutate(values, {
      onSettled: () => setLoading(false)
    })
  }

  return {
    crearProveedorForm,
    loading: loading || mutation.isPending,
  }
}
