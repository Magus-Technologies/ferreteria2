'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { Transportista } from '~/lib/api/transportista'
import { useState } from 'react'
import { useColumnsTransportistas } from './columns-transportistas'
import ModalCreateTransportista from '../modals/modal-create-transportista'
import { useStoreTransportistaSeleccionado } from './store-transportista-seleccionado'
import useSearchTransportistas from './use-search-transportistas'

interface TableTransportistasBusquedaProps
  extends Omit<
    TableWithTitleProps<Transportista>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({ data }: { data: Transportista | undefined }) => void
}

export default function TableTransportistasBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableTransportistasBusquedaProps) {
  const { response, loading } = useSearchTransportistas({ value })

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<Transportista>()

  const setTransportistaSeleccionado = useStoreTransportistaSeleccionado(
    store => store.setTransportista
  )

  return (
    <>
      <ModalCreateTransportista
        open={open}
        setOpen={setOpen}
        dataEdit={dataEdit}
      />
      <TableWithTitle<Transportista>
        {...props}
        id='transportistas-busqueda'
        title='Transportistas'
        loading={loading}
        columnDefs={useColumnsTransportistas({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) => {
          setTransportistaSeleccionado(selectedNodes?.[0]?.data as Transportista)
        }}
        onRowDoubleClicked={({ data }) => {
          setTransportistaSeleccionado(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'RUC',
              'Razón Social',
              'N° MTC',
              'Estado',
              'Registrado',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
