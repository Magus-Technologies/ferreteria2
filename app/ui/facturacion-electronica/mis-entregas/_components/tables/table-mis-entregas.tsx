'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisEntregas } from './columns-mis-entregas'
import useGetEntregas from '../../_hooks/use-get-entregas'
import { create } from 'zustand'
import type { AgGridReact } from 'ag-grid-react'
import type { RowStyle } from 'ag-grid-community'
import { orangeColors, greenColors, blueColors, redColors } from '~/lib/colors'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

// Tipo para las entregas que vienen de la API (con códigos de DB)
interface EntregaDB {
  id: number
  venta_id: string
  tipo_entrega: string
  tipo_despacho: string
  estado_entrega: 'pe' | 'ec' | 'en' | 'ca' // Códigos de la DB
  fecha_entrega: string
  fecha_programada?: string
  hora_inicio?: string
  hora_fin?: string
  direccion_entrega?: string
  observaciones?: string
  almacen_salida_id: number
  chofer_id?: string
  quien_entrega?: string
  user_id: string
  created_at: string
  updated_at: string
  venta?: any
  chofer?: any
  almacenSalida?: any
  productosEntregados?: any[]
}

type UseStoreEntregaSeleccionada = {
  entrega?: EntregaDB
  setEntrega: (entrega: EntregaDB | undefined) => void
}

export const useStoreEntregaSeleccionada = create<UseStoreEntregaSeleccionada>(
  (set) => ({
    entrega: undefined,
    setEntrega: (entrega) => set({ entrega }),
  })
)

// Función para calcular el color de una entrega
function calcularColorEntrega(entrega: EntregaDB): string {
  const estado = entrega.estado_entrega

  switch (estado) {
    case 'pe': // Pendiente
      return orangeColors[2]
    case 'ec': // En Camino
      return blueColors[2]
    case 'en': // Entregado
      return greenColors[2]
    case 'ca': // Cancelado
      return redColors[2]
    default:
      return 'transparent'
  }
}

export default function TableMisEntregas() {
  const tableRef = useRef<AgGridReact>(null)
  const { entregas, loading, refetch } = useGetEntregas()

  console.log('📊 TableMisEntregas - entregas:', entregas)
  console.log('📊 TableMisEntregas - loading:', loading)
  console.log('📊 TableMisEntregas - entregas.length:', entregas?.length)

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
  const getRowStyle = (params: { data?: EntregaDB }): RowStyle | undefined => {
    if (!params.data) return undefined
    
    const color = calcularColorEntrega(params.data)
    
    return {
      background: color,
    }
  }

  return (
    <ConfigurableElement
      componentId="mis-entregas.tabla"
      label="Tabla de Entregas"
    >
      <div className="w-full" style={{ height: '600px' }}>
        <TableWithTitle<EntregaDB>
          id="mis-entregas"
          title="MIS ENTREGAS"
          loading={loading}
          selectionColor={orangeColors[10]} 
          columnDefs={useColumnsMisEntregas(refetch)}
          rowData={entregas || []}
          tableRef={tableRef}
          getRowStyle={getRowStyle}
          onRowClicked={(event) => {
            event.node.setSelected(true)
          }}
          onSelectionChanged={({ selectedNodes }) => {
            const selectedEntrega = selectedNodes?.[0]?.data as EntregaDB
            setEntregaSeleccionada(selectedEntrega)
          }}
          onRowDoubleClicked={({ data }) => {
            setEntregaSeleccionada(data)
          }}
        />
      </div>
    </ConfigurableElement>
  )
}
