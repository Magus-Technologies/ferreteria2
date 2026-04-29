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
import ModalPostDespacho from '../modals/modal-post-despacho'

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

type AccionEntrega = 'despachar' | 'marcar' | 'confirmar' | null

type UseStoreEntregaSeleccionada = {
  entrega?: EntregaDB
  setEntrega: (entrega: EntregaDB | undefined) => void
  // Post-despacho modal state (persiste a través de re-renders de la tabla)
  postDespachoEntrega?: any
  postDespachoOpen: boolean
  openPostDespacho: (entrega: any) => void
  closePostDespacho: () => void
  // Trigger desde el botón principal del filter para abrir el modal
  // de acción correspondiente al estado actual de la entrega seleccionada.
  accionTrigger: AccionEntrega
  triggerAccion: (accion: AccionEntrega) => void
}

export const useStoreEntregaSeleccionada = create<UseStoreEntregaSeleccionada>(
  (set) => ({
    entrega: undefined,
    setEntrega: (entrega) => set({ entrega }),
    postDespachoEntrega: undefined,
    postDespachoOpen: false,
    openPostDespacho: (entrega) => set({ postDespachoOpen: true, postDespachoEntrega: entrega }),
    closePostDespacho: () => set({ postDespachoOpen: false, postDespachoEntrega: undefined }),
    accionTrigger: null,
    triggerAccion: (accion) => set({ accionTrigger: accion }),
  })
)

// Función para calcular el color de una entrega.
// Convención al estilo mis-ventas: el estado default (Pendiente) es transparente
// para no saturar visualmente. Solo se pintan los estados que requieren atención.
function calcularColorEntrega(entrega: EntregaDB): string {
  const estado = entrega.estado_entrega

  switch (estado) {
    case 'ec': // En Camino — destaca para que se vea que está en proceso
      return blueColors[2]
    case 'en': // Entregado — verde para indicar éxito/completado
      return greenColors[2]
    case 'ca': // Cancelado — rojo para distinguir
      return redColors[2]
    case 'pe': // Pendiente — sin color (es el default esperado)
    default:
      return 'transparent'
  }
}

export default function TableMisEntregas() {
  const tableRef = useRef<AgGridReact>(null)
  const { entregas, loading, refetch } = useGetEntregas()
  const { postDespachoOpen, postDespachoEntrega, closePostDespacho } = useStoreEntregaSeleccionada()

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
    <>
      <ConfigurableElement
        componentId="mis-entregas.tabla"
        label="Tabla de Entregas"
      >
        <div className="w-full h-full">
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

      {/* Modal Post-Despacho (mapa + WhatsApp) - a nivel de tabla para sobrevivir re-renders */}
      <ModalPostDespacho
        open={postDespachoOpen}
        onClose={closePostDespacho}
        entrega={postDespachoEntrega}
      />
    </>
  )
}
