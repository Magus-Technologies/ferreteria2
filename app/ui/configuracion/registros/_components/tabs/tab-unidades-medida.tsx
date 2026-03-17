'use client'

import { unidadesMedidaApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabUnidadesMedida() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.UNIDADES_MEDIDA}
      fetchFn={async () => {
        const res = await unidadesMedidaApi.getAll()
        return res.data?.data || []
      }}
      createFn={data => unidadesMedidaApi.create(data)}
      updateFn={(id, data) => unidadesMedidaApi.update(id, data)}
      deleteFn={id => unidadesMedidaApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Unidad de Medida'
    />
  )
}
