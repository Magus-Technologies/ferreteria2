'use client'

import { categoriasApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabCategorias() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.CATEGORIAS}
      fetchFn={async () => {
        const res = await categoriasApi.getAll()
        return res.data?.data || []
      }}
      createFn={data => categoriasApi.create(data)}
      updateFn={(id, data) => categoriasApi.update(id, data)}
      deleteFn={id => categoriasApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Categoría'
    />
  )
}
