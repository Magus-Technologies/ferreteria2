import { Proveedor } from '@prisma/client'
import { createProveedor } from '~/app/_actions/proveedor'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { dataProveedorModalProps } from '../_components/modals/modal-create-proveedor'
import { ServerResult } from '~/auth/middleware-server-actions'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useCreateProveedor({
  onSuccess,
}: {
  onSuccess?: (res: ServerResult<Proveedor>) => void
}) {
  const { execute, loading } = useServerMutation({
    action: createProveedor,
    queryKey: [QueryKeys.PROVEEDORES, QueryKeys.PROVEEDORES_SEARCH],
    onSuccess,
    msgSuccess: 'Proveedor creado exitosamente',
  })

  function crearProveedorForm(values: dataProveedorModalProps) {
    const data = {
      ...values,
      estado: values.estado === 1,
    }
    execute({ data })
  }

  return {
    crearProveedorForm,
    loading,
  }
}
