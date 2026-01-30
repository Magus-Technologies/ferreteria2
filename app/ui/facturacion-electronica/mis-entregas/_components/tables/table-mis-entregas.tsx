'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import type { Entrega } from '~/lib/api/entregas'
import { useColumnsMisEntregas } from './columns-mis-entregas'
import useGetEntregas from '../../_hooks/use-get-entregas'
import { create } from 'zustand'
import type { AgGridReact } from 'ag-grid-react'
import type { RowStyle } from 'ag-grid-community'
import { orangeColors, greenColors, blueColors, redColors } from '~/lib/colors'

type UseStoreEntregaSeleccionada = {
  entrega?: Entrega
  setEntrega: (entrega: Entrega | undefined) => void
}

export const useStoreEntregaSeleccionada = create<UseStoreEntregaSeleccionada>(
  (set) => ({
    entrega: undefined,
    setEntrega: (entrega) => set({ entrega }),
  })
)

// Función para calcular el color de una entrega
function calcularColorEntrega(entrega: Entrega): string {
  const estado = entrega.estado_entrega

  switch (estado) {
    case 'PENDIENTE':
      return orangeColors[2]
    case 'EN_CAMINO':
      return blueColors[2]
    case 'ENTREGADO':
      return greenColors[2]
    case 'CANCELADO':
      return redColors[2]
    default:
      return 'transparent'
  }
}

export default function TableMisEntregas() {
  const tableRef = useRef<AgGridReact>(null)
  const { entregas, loading, refetch } = useGetEntregas()

  const setEntregaSeleccionada = useStoreEntregaSeleccionada(
    (state) => state.setEntrega
  )

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (entregas && entregas.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0)
        if (firstNode) {
          firstNode.setSelected(true)
          setEntregaSeleccionada(firstNode.data)
        }
      }, 100)
    }
  }, [entregas, setEntregaSeleccionada])

  // Función para aplicar estilos a las filas
  const getRowStyle = (params: { data?: Entrega }): RowStyle | undefined => {
    if (!params.data) return undefined
    
    const color = calcularColorEntrega(params.data)
    
    return {
      background: color,
    }
  }

  return (
    <div className="w-full" style={{ height: '600px' }}>
      <TableWithTitle<Entrega>
        id="mis-entregas"
        title="MIS ENTREGAS"
        loading={loading}
        columnDefs={useColumnsMisEntregas(refetch)}
        rowData={entregas || []}
        tableRef={tableRef}
        getRowStyle={getRowStyle}
        onRowClicked={(event) => {
          event.node.setSelected(true)
        }}
        onSelectionChanged={({ selectedNodes }) => {
          const selectedEntrega = selectedNodes?.[0]?.data as Entrega
          setEntregaSeleccionada(selectedEntrega)
        }}
        onRowDoubleClicked={({ data }) => {
          setEntregaSeleccionada(data)
        }}
      />
    </div>
  )
}
