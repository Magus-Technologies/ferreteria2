import { Cliente } from '@prisma/client'
import {
  createCliente,
  editarCliente,
  getClienteResponseProps,
} from '~/app/_actions/cliente'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { ServerResult } from '~/auth/middleware-server-actions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FormCreateClienteValues } from '../_components/modals/modal-create-cliente'

export default function useCreateCliente({
  onSuccess,
  dataEdit,
}: {
  onSuccess?: (res: ServerResult<Cliente>) => void
  dataEdit?: getClienteResponseProps
}) {
  const { execute, loading } = useServerMutation({
    action: dataEdit ? editarCliente : createCliente,
    queryKey: [QueryKeys.CLIENTES, QueryKeys.CLIENTES_SEARCH],
    onSuccess,
    msgSuccess: `Cliente ${dataEdit ? 'editado' : 'creado'} exitosamente`,
  })

  function crearClienteForm(values: FormCreateClienteValues) {
    const data = {
      ...values,
      id: dataEdit?.id,
    }
    execute({ data })
  }

  return {
    crearClienteForm,
    loading,
  }
}
