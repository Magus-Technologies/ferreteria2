'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { useState } from 'react'
import { useColumnsDespachadores } from './columns-despachadores'
import { useStoreDespachadorSeleccionado } from './store-despachador-seleccionado'
import useSearchDespachadores from './use-search-despachadores'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
  email: string
  celular: string | null
}

interface TableDespachadoresBusquedaProps
  extends Omit<
    TableWithTitleProps<Usuario>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: (despachador: Usuario | undefined) => void
}

export default function TableDespachadoresBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableDespachadoresBusquedaProps) {
  const { response, loading } = useSearchDespachadores({ value })

  const setDespachadorSeleccionado = useStoreDespachadorSeleccionado(
    store => store.setDespachador
  )

  return (
    <>
      <TableWithTitle<Usuario>
        {...props}
        id='despachadores-busqueda'
        title='Despachadores'
        loading={loading}
        columnDefs={useColumnsDespachadores()}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) => {
          setDespachadorSeleccionado(selectedNodes?.[0]?.data as Usuario)
        }}
        onRowDoubleClicked={({ data }) => {
          setDespachadorSeleccionado(data)
          onRowDoubleClicked?.(data)
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'DNI/RUC',
              'Nombre Completo',
              'Email',
              'Celular',
            ],
          },
        ]}
      />
    </>
  )
}
