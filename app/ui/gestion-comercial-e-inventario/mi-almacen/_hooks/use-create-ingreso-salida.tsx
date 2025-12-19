import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { TipoDocumento } from '@prisma/client'
import { toUTCBD } from '~/utils/fechas'
import {
  FormCreateIngresoSalidaProps,
} from '../_components/modals/modal-create-ingreso-salida'
import { ingresosSalidasApi } from '~/lib/api/ingreso-salida'
import { DataDocIngresoSalida } from '../_components/docs/doc-ingreso-salida'

export default function useCreateIngresoSalida({
  tipo_documento,
  onSuccess,
}: {
  tipo_documento: TipoDocumento
  onSuccess?: (res: DataDocIngresoSalida) => void
}) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { notification } = App.useApp()

  async function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    setLoading(true)
    try {
      // Convertir TipoDocumento a 'Ingreso' o 'Salida' para el API
      const tipoDocumentoApi: 'Ingreso' | 'Salida' =
        tipo_documento === TipoDocumento.Ingreso ? 'Ingreso' : 'Salida'

      const data = {
        ...values,
        tipo_documento: tipoDocumentoApi,
        fecha: values.fecha
          ? toUTCBD({
              date: values.fecha,
            })
          : undefined,
      }

      const res = await ingresosSalidasApi.create(data)

      if (res.error) {
        notification.error({
          message: 'Error',
          description: res.error.message,
        })
        return
      }

      notification.success({
        message: `${tipo_documento === TipoDocumento.Ingreso ? 'Ingreso' : 'Salida'} creado exitosamente`,
      })

      // Invalidar queries de productos
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'productos-by-almacen' ||
          query.queryKey[0] === 'productos-search',
        refetchType: 'active',
      })

      onSuccess?.(res.data as unknown as DataDocIngresoSalida)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Error al procesar la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    crearIngresoSalidaForm,
    loading: loading,
  }
}
