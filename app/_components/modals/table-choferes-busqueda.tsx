'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { Chofer } from '~/lib/api/chofer'
import { useState } from 'react'
import { useColumnsChoferes } from './columns-choferes'
import ModalCreateChofer from '../modals/modal-create-chofer'
import { useStoreChoferSeleccionado } from './store-chofer-seleccionado'
import useSearchChoferes from './use-search-choferes'

interface TableChoferesBusquedaProps
  extends Omit<
    TableWithTitleProps<Chofer>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({ data }: { data: Chofer | undefined }) => void
}

export default function TableChoferesBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableChoferesBusquedaProps) {
  const { response, loading } = useSearchChoferes({ value })

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<Chofer>()

  const setChoferSeleccionado = useStoreChoferSeleccionado(
    store => store.setChofer
  )

  return (
    <>
      <ModalCreateChofer open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<Chofer>
        {...props}
        id='choferes-busqueda'
        title='Choferes'
        loading={loading}
        columnDefs={useColumnsChoferes({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) => {
          console.log('chofer seleccionado en la tabla', selectedNodes?.[0]?.data)
          setChoferSeleccionado(selectedNodes?.[0]?.data as Chofer)
        }}
        onRowDoubleClicked={({ data }) => {
          console.log('doble click en el chofer', data)
          setChoferSeleccionado(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'DNI',
              'Nombres',
              'Apellidos',
              'Licencia',
              'Teléfono',
              'Email',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
