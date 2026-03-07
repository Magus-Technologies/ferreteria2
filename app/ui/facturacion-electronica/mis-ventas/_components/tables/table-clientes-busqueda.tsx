'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { Cliente } from '~/lib/api/cliente'
import { useState, useCallback } from 'react'
import { useColumnsClientes } from './columns-clientes'
import ModalCreateCliente from '../modals/modal-create-cliente'
import { useStoreClienteSeleccionado } from '../../store/store-cliente-seleccionado'
import useSearchClientes from '../../_hooks/use-search-clientes'
import { orangeColors } from '~/lib/colors'
import { useClientesConDeuda } from '../../_hooks/use-clientes-con-deuda'
import type { RowClassParams } from 'ag-grid-community'

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

  const clientesConDeuda = useClientesConDeuda()

  const getRowStyle = useCallback((params: RowClassParams<Cliente>) => {
    if (params.data && clientesConDeuda.has(params.data.id)) {
      return {
        background: '#fef2f2',
        borderLeft: '3px solid #ef4444',
        color: '#991b1b',
      }
    }
    return undefined
  }, [clientesConDeuda])

  return (
    <>
      <ModalCreateCliente open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<Cliente>
        {...props}
        id='mis-ventas.clientes'
        title='Clientes'
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        loading={loading}
        columnDefs={useColumnsClientes({ setDataEdit, setOpen, clientesDeudaMap: clientesConDeuda })}
        rowData={response || []}
        getRowStyle={getRowStyle}
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
              'Razon Social / Nombres',
              'Direccion',
              'Telefono',
              'Deuda',
              'Ventas Pend.',
              'Dias Mora',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
