'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisCotizaciones } from './columns-mis-cotizaciones'
import { create } from 'zustand'
import { cotizacionesApi, type Cotizacion } from '~/lib/api/cotizaciones'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { AgGridReact } from 'ag-grid-react'
import { orangeColors } from '~/lib/colors'

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
  const tableRef = useRef<AgGridReact>(null);
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.COTIZACIONES, almacen_id ?? 0],
    queryFn: async () => {
      const result = await cotizacionesApi.getAll({ 
        almacen_id: almacen_id ?? undefined 
      })
      return result.data?.data || [] // Laravel devuelve { data: { data: [...] } }
    },
    enabled: !!almacen_id,
  })

  const setCotizacionSeleccionada = useStoreCotizacionSeleccionada(
    (state) => state.setCotizacion
  )

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setCotizacionSeleccionada(firstNode.data);
        }
      }, 100);
    }
  }, [response, setCotizacionSeleccionada]);

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle<Cotizacion>
        id='mis-cotizaciones'
        title='N° DE CLIENTES/COTIZACIONES'
        loading={loading}
        columnDefs={useColumnsMisCotizaciones()}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
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
