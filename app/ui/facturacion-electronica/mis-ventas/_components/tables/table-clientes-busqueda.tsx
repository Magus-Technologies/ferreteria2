'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { ClienteCreateInputSchema } from '~/prisma/generated/zod'
import { getClienteResponseProps } from '~/app/_actions/cliente'
import { useState } from 'react'
import { useColumnsClientes } from './columns-clientes'
import ModalCreateCliente from '../modals/modal-create-cliente'
import { useStoreClienteSeleccionado } from '../../store/store-cliente-seleccionado'
import useGetClientes from '../../_hooks/use-get-clientes'

interface TableClientesBusquedaProps
  extends Omit<
    TableWithTitleProps<getClienteResponseProps>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getClienteResponseProps | undefined
  }) => void
}

export default function TableClientesBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableClientesBusquedaProps) {
  const { response, loading } = useGetClientes({ value })

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<getClienteResponseProps>()

  const setClienteSeleccionado = useStoreClienteSeleccionado(
    store => store.setCliente
  )

  return (
    <>
      <ModalCreateCliente open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<getClienteResponseProps>
        {...props}
        id='mis-ventas.clientes'
        title='Clientes'
        schema={ClienteCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsClientes({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
        {
          console.log('clientre seleccionado en la tabla',selectedNodes?.[0]?.data)
          setClienteSeleccionado(
            selectedNodes?.[0]?.data as getClienteResponseProps
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
