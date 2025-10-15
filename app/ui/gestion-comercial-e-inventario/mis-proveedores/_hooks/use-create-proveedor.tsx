import { Proveedor } from '@prisma/client'
import { createProveedor, editarProveedor } from '~/app/_actions/proveedor'
import { useServerMutation } from '~/hooks/use-server-mutation'
import {
  dataEditProveedor,
  dataProveedorModalProps,
} from '../_components/modals/modal-create-proveedor'
import { ServerResult } from '~/auth/middleware-server-actions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { toUTCBD } from '~/utils/fechas'

export default function useCreateProveedor({
  onSuccess,
  dataEdit,
}: {
  onSuccess?: (res: ServerResult<Proveedor>) => void
  dataEdit?: dataEditProveedor
}) {
  const { execute, loading } = useServerMutation({
    action: dataEdit ? editarProveedor : createProveedor,
    queryKey: [QueryKeys.PROVEEDORES, QueryKeys.PROVEEDORES_SEARCH],
    onSuccess,
    msgSuccess: `Proveedor ${dataEdit ? 'editado' : 'creado'} exitosamente`,
  })

  function crearProveedorForm(values: dataProveedorModalProps) {
    const { vendedores, estado, ...rest } = values
    const data = {
      ...rest,
      estado: estado === 1,
      ...(vendedores && vendedores.length
        ? {
            vendedores: {
              create: vendedores.map(item => ({
                ...item,
                estado: item.estado === 1,
                cumple: item.cumple
                  ? toUTCBD({
                      date: item.cumple,
                    })
                  : undefined,
                id: undefined,
                proveedor_id: undefined,
              })),
            },
          }
        : {}),
      id: dataEdit?.id,
    }
    execute({ data })
  }

  return {
    crearProveedorForm,
    loading,
  }
}
