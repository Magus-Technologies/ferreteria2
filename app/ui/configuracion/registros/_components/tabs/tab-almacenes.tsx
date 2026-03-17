'use client'

import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabAlmacenes() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.ALMACENES}
      fetchFn={async () => {
        const res = await almacenesApi.getAll(true) // incluir inactivos
        return res.data?.data || []
      }}
      createFn={data => almacenesApi.create(data)}
      updateFn={(id, data) => almacenesApi.update(id, data)}
      deleteFn={id => almacenesApi.delete(id)}
      nameField='name'
      statusField='activo'
      entityName='Almacén'
      extraColumns={[
        {
          key: 'direccion',
          label: 'Dirección',
          render: (item) => <span className='text-gray-500 text-xs'>{item.direccion || '-'}</span>,
        },
      ]}
    />
  )
}
