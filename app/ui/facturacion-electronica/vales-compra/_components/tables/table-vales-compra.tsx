'use client'

import React, { useRef } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsValesCompra } from './columns-vales-compra'
import { create } from 'zustand'
import { getValesCompra, type ValeCompra } from '~/lib/api/vales-compra'
import { useQuery } from '@tanstack/react-query'
import { valesCompraKeys } from '~/lib/api/vales-compra'
import { AgGridReact } from 'ag-grid-react'
import { orangeColors } from '~/lib/colors'
import { useStoreFiltrosVales } from '../../_store/store-filtros-vales'

type UseStoreValeSeleccionado = {
  vale?: ValeCompra
  setVale: (vale: ValeCompra | undefined) => void
}

export const useStoreValeSeleccionado =
  create<UseStoreValeSeleccionado>((set) => ({
    vale: undefined,
    setVale: (vale) => set({ vale }),
  }))

export default function TableValesCompra() {
  const tableRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosVales((s) => s.filtros);

  const { data: response, isLoading: loading } = useQuery({
    queryKey: valesCompraKeys.list(filtros),
    queryFn: async () => {
      const result = await getValesCompra({
        per_page: 100,
        search: filtros.search || undefined,
        estado: filtros.estado || undefined,
        tipo_promocion: filtros.tipo_promocion || undefined,
        modalidad: filtros.modalidad || undefined,
      })
      return result.data?.data || []
    },
  })

  const setValeSeleccionado = useStoreValeSeleccionado(
    (state) => state.setVale
  )

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setValeSeleccionado(firstNode.data);
        }
      }, 100);
    }
  }, [response, setValeSeleccionado]);

  return (
    <div className='w-full h-full'>
      <TableWithTitle<ValeCompra>
        id='vales-compra'
        title='VALES DE COMPRA / PROMOCIONES'
        loading={loading}
        columnDefs={useColumnsValesCompra()}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor={orangeColors[10]}
        onRowClicked={(event) => {
          event.node.setSelected(true);
        }}
        onSelectionChanged={({ selectedNodes }) => {
          const selectedVale = selectedNodes?.[0]?.data as ValeCompra;
          setValeSeleccionado(selectedVale);
        }}
        onRowDoubleClicked={({ data }) => {
          setValeSeleccionado(data)
          if (data?.id) {
            const { openModal } = require('../../_store/store-modal-pdf-vale').useStoreModalPdfVale.getState()
            openModal(data.id)
          }
        }}
        rowSelection={true}
        animateRows
        className='ag-theme-alpine-dark'
      />
    </div>
  )
}
