'use client'

import { marcasApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabMarcas() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.MARCAS}
      fetchFn={async () => {
        const res = await marcasApi.getAll()
        return res.data?.data || []
      }}
      createFn={data => marcasApi.create(data)}
      updateFn={(id, data) => marcasApi.update(id, data)}
      deleteFn={id => marcasApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Marca'
    />
  )
}
