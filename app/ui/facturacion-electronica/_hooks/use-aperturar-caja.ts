import { useServerMutation } from '~/hooks/use-server-mutation'
import { createAperturarCaja } from '~/app/_actions/caja'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'
import { AperturaYCierreCaja } from '@prisma/client'

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaYCierreCaja) => void
}) {
  const { execute, loading } = useServerMutation({
    action: createAperturarCaja,
    msgSuccess: 'Apertura de caja creada exitosamente',
    onSuccess: data => {
      onSuccess?.(data.data!)
    },
  })

  function crearAperturarCaja(values: AperturarCajaFormValues) {
    const data = {
      ...values,
    }
    execute(data)
  }

  return {
    crearAperturarCaja,
    loading: loading,
  }
}
