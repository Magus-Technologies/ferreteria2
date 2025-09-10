import { useServerMutation } from '~/hooks/use-server-mutation'
import { toString } from '~/utils/fechas'
import { IngresoSalida } from '@prisma/client'
import { FormInstance } from 'antd'
import {
  FormCreateIngresoSalidaFormatedProps,
  FormCreateIngresoSalidaProps,
} from '../_components/modals/modal-create-ingreso-salida'
import { createIngresoSalida } from '~/app/_actions/ingreso-salida'
import { IngresoSalidaEnum } from '~/app/_lib/tipos-ingresos-salidas'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useCreateIngresoSalida({
  setOpen,
  form,
  tipo,
}: {
  setOpen: (value: boolean) => void
  form: FormInstance
  tipo: IngresoSalidaEnum
}) {
  const { execute, loading } = useServerMutation<
    FormCreateIngresoSalidaFormatedProps,
    IngresoSalida
  >({
    action: createIngresoSalida,
    queryKey: [QueryKeys.PRODUCTOS, QueryKeys.PRODUCTOS_SEARCH],
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
    },
    msgSuccess: `${
      tipo === IngresoSalidaEnum.ingreso ? 'Ingreso' : 'Salida'
    } creado exitosamente`,
  })

  function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    const data = {
      ...values,
      tipo,
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
