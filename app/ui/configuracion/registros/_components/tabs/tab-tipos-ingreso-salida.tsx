'use client'

import { tipoIngresoSalidaApi } from '~/lib/api/tipo-ingreso-salida'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabTiposIngresoSalida() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.TIPOS_INGRESO_SALIDA}
      fetchFn={async () => {
        const res = await tipoIngresoSalidaApi.getAll()
        const data = res.data as any
        return Array.isArray(data) ? data : data?.data || []
      }}
      createFn={data => tipoIngresoSalidaApi.create(data)}
      updateFn={(id, data) => tipoIngresoSalidaApi.update(id, data)}
      deleteFn={id => tipoIngresoSalidaApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Tipo Ingreso/Salida'
    />
  )
}
