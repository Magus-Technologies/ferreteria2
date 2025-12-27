'use client'

import React from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisPrestamos } from './columns-mis-prestamos'
import { create } from 'zustand'
import { prestamoApi, type Prestamo } from '~/lib/api/prestamo'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'

type UseStorePrestamoSeleccionada = {
  prestamo?: Prestamo
  setPrestamo: (prestamo: Prestamo | undefined) => void
}

export const UseStorePrestamoSeleccionada =
  create<UseStorePrestamoSeleccionada>((set) => ({
    prestamo: undefined,
    setPrestamo: (prestamo) => set({ prestamo }),
  }))

export default function TableMisPrestamos() {
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, almacen_id ?? 0],
    queryFn: async () => {
      const result = await prestamoApi.getAll({
        almacen_id: almacen_id ?? undefined
      })
      return result.data?.data || []
    },
    enabled: !!almacen_id,
  })

  const setPrestamoSeleccionada = UseStorePrestamoSeleccionada(
    (state) => state.setPrestamo
  )

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle<Prestamo>
        id='mis-prestamos'
        title='N° DE CLIENTES/PROVEEDORES - Préstamos'
        loading={loading}
        columnDefs={useColumnsMisPrestamos()}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setPrestamoSeleccionada(selectedNodes?.[0]?.data as Prestamo)
        }
        onRowDoubleClicked={({ data }) => {
          setPrestamoSeleccionada(data)
        }}
      />
    </div>
  )
}
