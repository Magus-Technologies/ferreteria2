'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisPrestamos } from './columns-mis-prestamos'
import { create } from 'zustand'
import { prestamoApi, type Prestamo } from '~/lib/api/prestamo'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { orangeColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { useStoreFiltrosMisPrestamos } from '../../store/store-filtros-mis-prestamos'

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
  const tableRef = useRef<AgGridReact>(null)
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const filtros = useStoreFiltrosMisPrestamos((state) => state.filtros)

  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, almacen_id ?? 0, filtros],
    queryFn: async () => {
      const result = await prestamoApi.getAll({
        almacen_id: almacen_id ?? undefined,
        ...filtros,
      })
      return result.data?.data || []
    },
    enabled: !!almacen_id,
  })

  const setPrestamoSeleccionada = UseStorePrestamoSeleccionada(
    (state) => state.setPrestamo
  )

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0)
        if (firstNode) {
          firstNode.setSelected(true)
          setPrestamoSeleccionada(firstNode.data)
        }
      }, 100)
    }
  }, [response, setPrestamoSeleccionada])

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle<Prestamo>
        id='mis-prestamos'
        title='N° DE CLIENTES/PROVEEDORES - Préstamos'
        loading={loading}
        columnDefs={useColumnsMisPrestamos()}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        onRowClicked={(event) => {
          // Seleccionar la fila cuando se hace clic en cualquier parte
          event.node.setSelected(true)
        }}
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
