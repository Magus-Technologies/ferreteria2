'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisEntregas } from './columns-mis-entregas'
import useGetEntregas from '../../_hooks/use-get-entregas'
import { create } from 'zustand'
import type { AgGridReact } from 'ag-grid-react'
import type { RowStyle } from 'ag-grid-community'
import { greenColors, blueColors, redColors, orangeColors } from '~/lib/colors'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ModalPostDespacho from '../modals/modal-post-despacho'
import ModalEntregaUpdate from '../modals/modal-entrega-update'

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
  almacen_salida?: any
  productos_entregados?: any[]
}

type AccionEntrega =
  | 'despachar'
  | 'marcar'
  | 'parcial'
  | 'confirmar'
  // Confirma eventos 'ec' (En Camino) → 'en' (Entregado) sin abrir modal.
  // Usado en el flujo de 2 etapas para Domicilio: el chofer salió, vuelve
  // y se confirma la entrega física para descontar stock.
  | 'confirmar-ec'
  | 'restante'
  | null

type UseStoreEntregaSeleccionada = {
  entrega?: EntregaDB
  setEntrega: (entrega: EntregaDB | undefined) => void
  // Post-despacho modal state (persiste a través de re-renders de la tabla)
  postDespachoEntrega?: any
  postDespachoOpen: boolean
  openPostDespacho: (entrega: any) => void
  closePostDespacho: () => void
  // Modal de configurar entrega (update) — fuera de AG Grid para no cerrarse al refrescar
  updateModalOpen: boolean
  updateModalRestante: boolean
  updateModalEntrega?: EntregaDB
  openUpdateModal: (entrega: EntregaDB, restante?: boolean) => void
  closeUpdateModal: () => void
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
    updateModalOpen: false,
    updateModalRestante: false,
    updateModalEntrega: undefined,
    openUpdateModal: (entrega, restante = false) => set({ updateModalOpen: true, updateModalEntrega: entrega, updateModalRestante: restante }),
    closeUpdateModal: () => set({ updateModalOpen: false, updateModalRestante: false }),
    accionTrigger: null,
    triggerAccion: (accion) => set({ accionTrigger: accion }),
  })
)

// Función para calcular el color de una entrega.
//
// Caso especial: una entrega con `estado='en'` puede tener productos con
// `cantidad_pendiente > 0` (entregado parcial — se entregaron 5 de 10).
// En ese caso pintamos la fila NARANJA en vez de verde, porque sigue habiendo
// trabajo pendiente y el usuario tiene que poder verlo de un vistazo.
//
// Además, el borde izquierdo diferencia:
//   - ORDEN  (madre): borde violeta (#7c3aed) — igual que la badge "📋 ORDEN"
//   - DESPACHO (hija): borde azul (#1d4ed8) — igual que la badge "🚚 DESPACHO"
function calcularColorEntrega(entrega: EntregaDB): RowStyle {
  const estado = entrega.estado_entrega

  let background: string
  if (estado === 'en') {
    background = greenColors[2]
  } else {
    switch (estado) {
      case 'pe': // Pendiente — naranja para que destaque que requiere acción
        background = orangeColors[2]; break
      case 'ec': // En Camino — azul para indicar que está en proceso
        background = blueColors[2]; break
      case 'ca': // Cancelado — rojo para distinguir
        background = redColors[2]; break
      default:
        background = 'transparent'
    }
  }

  return { background }
}

export default function TableMisEntregas() {
  const tableRef = useRef<AgGridReact>(null)
  const { entregas, loading, refetch } = useGetEntregas()
  const { postDespachoOpen, postDespachoEntrega, closePostDespacho } = useStoreEntregaSeleccionada()
  const updateModalOpen = useStoreEntregaSeleccionada((s) => s.updateModalOpen)
  const updateModalRestante = useStoreEntregaSeleccionada((s) => s.updateModalRestante)
  const closeUpdateModal = useStoreEntregaSeleccionada((s) => s.closeUpdateModal)
  const entregaParaUpdate = useStoreEntregaSeleccionada((s) => s.updateModalEntrega)

  const setEntregaSeleccionada = useStoreEntregaSeleccionada(
    (state) => state.setEntrega
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const migrationKey = 'mis-entregas-fecha-programada-column-v2'
    const fechaProgramadaHeader = 'Fecha Programada'
    if (window.localStorage.getItem(migrationKey)) return

    const selectedColumnsKey = 'table-columns-mis-entregas'
    const selectedColumnsRaw = window.localStorage.getItem(selectedColumnsKey)

    if (selectedColumnsRaw) {
      try {
        const selectedColumns = JSON.parse(selectedColumnsRaw)
        if (Array.isArray(selectedColumns) && !selectedColumns.includes(fechaProgramadaHeader)) {
          window.localStorage.setItem(
            selectedColumnsKey,
            JSON.stringify([...selectedColumns, fechaProgramadaHeader])
          )
        }
      } catch {
        window.localStorage.removeItem(selectedColumnsKey)
      }
    }

    const gridStateKey = 'ag-grid-state-mis-entregas'
    const gridStateRaw = window.localStorage.getItem(gridStateKey)

    if (gridStateRaw) {
      try {
        const gridState = JSON.parse(gridStateRaw)
        if (Array.isArray(gridState)) {
          let changed = false
          const nextGridState = gridState.map((columnState) => {
            if (columnState?.colId !== 'fecha_programada' || columnState.hide !== true) {
              return columnState
            }

            changed = true
            return { ...columnState, hide: false }
          })

          if (changed) {
            window.localStorage.setItem(gridStateKey, JSON.stringify(nextGridState))
          }
        }
      } catch {
        window.localStorage.removeItem(gridStateKey)
      }
    }

    window.localStorage.setItem(migrationKey, '1')
  }, [])

  // Migración: mostrar columna "Rol" (agregada después del release inicial).
  // El localStorage guarda qué columnas son visibles por headerName; si el
  // usuario ya tenía preferencias guardadas, "Rol" no estará en la lista.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const migrationKey = 'mis-entregas-rol-column-v1'
    if (window.localStorage.getItem(migrationKey)) return

    const selectedColumnsKey = 'table-columns-mis-entregas'
    const selectedColumnsRaw = window.localStorage.getItem(selectedColumnsKey)
    if (selectedColumnsRaw) {
      try {
        const selectedColumns = JSON.parse(selectedColumnsRaw)
        if (Array.isArray(selectedColumns) && !selectedColumns.includes('Rol')) {
          window.localStorage.setItem(
            selectedColumnsKey,
            JSON.stringify([...selectedColumns, 'Rol'])
          )
        }
      } catch {
        window.localStorage.removeItem(selectedColumnsKey)
      }
    }

    const gridStateKey = 'ag-grid-state-mis-entregas'
    const gridStateRaw = window.localStorage.getItem(gridStateKey)
    if (gridStateRaw) {
      try {
        const gridState = JSON.parse(gridStateRaw)
        if (Array.isArray(gridState)) {
          let changed = false
          const nextGridState = gridState.map((columnState: any) => {
            if (columnState?.colId !== 'rol_entrega' || columnState.hide !== true) return columnState
            changed = true
            return { ...columnState, hide: false }
          })
          if (changed) {
            window.localStorage.setItem(gridStateKey, JSON.stringify(nextGridState))
          }
        }
      } catch {
        window.localStorage.removeItem(gridStateKey)
      }
    }

    window.localStorage.setItem(migrationKey, '1')
  }, [])

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
    return calcularColorEntrega(params.data)
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
            selectionColor="overlay"
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

      {/* Modal Configurar Entrega - fuera de AG Grid para no cerrarse al refrescar la tabla */}
      <ModalEntregaUpdate
        open={updateModalOpen}
        setOpen={(o) => { if (!o) closeUpdateModal() }}
        entrega={entregaParaUpdate}
        onSuccess={refetch}
        restante={updateModalRestante}
      />
    </>
  )
}
