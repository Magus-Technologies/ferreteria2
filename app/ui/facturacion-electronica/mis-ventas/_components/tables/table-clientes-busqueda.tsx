'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { Cliente } from '~/lib/api/cliente'
import { useState } from 'react'
import { useColumnsClientes } from './columns-clientes'
import ModalCreateCliente from '../modals/modal-create-cliente'
import { useStoreClienteSeleccionado } from '../../store/store-cliente-seleccionado'
import useSearchClientes from '../../_hooks/use-search-clientes'
import { orangeColors } from '~/lib/colors'

interface TableClientesBusquedaProps
  extends Omit<
    TableWithTitleProps<Cliente>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Cliente | undefined
  }) => void
}

export default function TableClientesBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableClientesBusquedaProps) {
  const { response, loading } = useSearchClientes({ value })

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<Cliente>()

  const setClienteSeleccionado = useStoreClienteSeleccionado(
    store => store.setCliente
  )

  return (
    <>
      <ModalCreateCliente open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<Cliente>
        {...props}
        id='mis-ventas.clientes'
        title='Clientes'
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        loading={loading}
        columnDefs={useColumnsClientes({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
        {
          console.log('cliente seleccionado en la tabla',selectedNodes?.[0]?.data)
          setClienteSeleccionado(
            selectedNodes?.[0]?.data as Cliente
          )
        }

        }
        onRowDoubleClicked={({ data }) => {
          console.log('doble click en el clienbte' , data)
          setClienteSeleccionado(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'Documento',
              'Razón Social / Nombres',
              'Dirección',
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
