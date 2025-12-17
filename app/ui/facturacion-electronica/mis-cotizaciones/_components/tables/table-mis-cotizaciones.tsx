'use client'

import React from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisCotizaciones } from './columns-mis-cotizaciones'
import { create } from 'zustand'
import { getCotizaciones, type GetCotizacionesResponse } from '~/app/_actions/cotizacion'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'

type Cotizacion = GetCotizacionesResponse

type UseStoreCotizacionSeleccionada = {
  cotizacion?: Cotizacion
  setCotizacion: (cotizacion: Cotizacion | undefined) => void
}

export const useStoreCotizacionSeleccionada =
  create<UseStoreCotizacionSeleccionada>((set) => ({
    cotizacion: undefined,
    setCotizacion: (cotizacion) => set({ cotizacion }),
  }))

export default function TableMisCotizaciones() {
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const { response, loading } = useServerQuery({
    action: getCotizaciones,
    propsQuery: {
      queryKey: [QueryKeys.COTIZACIONES, almacen_id ?? 0],
    },
    params: {
      where: {
        almacen_id,
      },
    },
  })

  const setCotizacionSeleccionada = useStoreCotizacionSeleccionada(
    (state) => state.setCotizacion
  )

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle<Cotizacion>
        id='mis-cotizaciones'
        title='N° DE CLIENTES/COTIZACIONES'
        loading={loading}
        columnDefs={useColumnsMisCotizaciones()}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setCotizacionSeleccionada(selectedNodes?.[0]?.data as Cotizacion)
        }
        onRowDoubleClicked={({ data }) => {
          setCotizacionSeleccionada(data)
        }}
      />
    </div>
  )
}
