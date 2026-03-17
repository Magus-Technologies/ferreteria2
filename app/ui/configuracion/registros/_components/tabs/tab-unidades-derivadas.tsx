'use client'

import { unidadesDerivadas } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabUnidadesDerivadas() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.UNIDADES_DERIVADAS}
      fetchFn={async () => {
        const res = await unidadesDerivadas.getAll()
        return res.data?.data || []
      }}
      createFn={data => unidadesDerivadas.create(data)}
      updateFn={(id, data) => unidadesDerivadas.update(id, data)}
      deleteFn={id => unidadesDerivadas.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Unidad Derivada'
    />
  )
}
