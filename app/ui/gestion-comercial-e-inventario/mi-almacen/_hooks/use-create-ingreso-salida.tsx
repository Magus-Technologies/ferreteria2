import { useServerMutation } from '~/hooks/use-server-mutation'
import { toString } from '~/utils/fechas'
import { TipoDocumento } from '@prisma/client'
import {
  FormCreateIngresoSalidaFormatedProps,
  FormCreateIngresoSalidaProps,
} from '../_components/modals/modal-create-ingreso-salida'
import { createIngresoSalida } from '~/app/_actions/ingreso-salida'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { DataDocIngresoSalida } from '../_components/docs/doc-ingreso-salida'

export default function useCreateIngresoSalida({
  tipo_documento,
  onSuccess,
}: {
  tipo_documento: TipoDocumento
  onSuccess?: (res: DataDocIngresoSalida) => void
}) {
  const { execute, loading } = useServerMutation<
    FormCreateIngresoSalidaFormatedProps,
    DataDocIngresoSalida
  >({
    action: createIngresoSalida,
    queryKey: [QueryKeys.PRODUCTOS, QueryKeys.PRODUCTOS_SEARCH],
    onSuccess: res => {
      onSuccess?.(res.data)
    },
    msgSuccess: `${
      tipo_documento === TipoDocumento.Ingreso ? 'Ingreso' : 'Salida'
    } creado exitosamente`,
  })

  function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    const data = {
      ...values,
      tipo_documento: tipo_documento,
      fecha: values.fecha
        ? toString({
            date: values.fecha,
          })
        : undefined,
    }
    execute(data)
  }

  return {
    crearIngresoSalidaForm,
    loading: loading,
  }
}
