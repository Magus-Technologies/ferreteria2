'use client'

import { ubicacionesApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabUbicaciones() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.UBICACIONES}
      fetchFn={async () => {
        const res = await ubicacionesApi.getAll()
        return res.data?.data || []
      }}
      createFn={data => ubicacionesApi.create(data)}
      updateFn={(id, data) => ubicacionesApi.update(id, data)}
      deleteFn={id => ubicacionesApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Ubicación'
    />
  )
}
