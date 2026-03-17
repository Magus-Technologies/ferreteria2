'use client'

import { tipoServicioApi } from '~/lib/api/tipo-servicio'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabTiposServicio() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.TIPOS_SERVICIO}
      fetchFn={async () => {
        const res = await tipoServicioApi.getAll()
        const data = res.data as any
        return Array.isArray(data) ? data : data?.data || []
      }}
      createFn={data => tipoServicioApi.create(data)}
      updateFn={(id, data) => tipoServicioApi.update(id, data)}
      deleteFn={id => tipoServicioApi.delete(id)}
      nameField='nombre'
      statusField='activo'
      entityName='Tipo de Servicio'
    />
  )
}
