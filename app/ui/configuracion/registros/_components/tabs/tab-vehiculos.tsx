'use client'

import { vehiculosApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TablaCatalogo from '../tabla-catalogo'

export default function TabVehiculos() {
  return (
    <TablaCatalogo
      queryKey={QueryKeys.VEHICULOS}
      fetchFn={async () => {
        const res = await vehiculosApi.getAll()
        return res.data?.data || []
      }}
      createFn={data => vehiculosApi.create(data)}
      updateFn={(id, data) => vehiculosApi.update(id, data)}
      deleteFn={id => vehiculosApi.delete(id)}
      nameField='name'
      statusField='estado'
      entityName='Vehículo'
      createFields={[
        { key: 'tipo', label: 'Tipo (MOTO, CAMION, etc.)', required: true },
        { key: 'placa', label: 'Placa' },
      ]}
      extraColumns={[
        { key: 'tipo', label: 'Tipo' },
        { key: 'placa', label: 'Placa' },
      ]}
    />
  )
}
