'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { ProveedorCreateInputSchema } from '~/prisma/generated/zod'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'
import { useEffect, useState } from 'react'
import { useColumnsProveedores } from './columns-proveedores'
import ModalCreateProveedor from '../modals/modal-create-proveedor'
import { useStoreProveedorSeleccionado } from '../../store/store-proveedor-seleccionado'
import useGetProveedores from '../../_hooks/use-get-proveedores'

interface TableProveedoresBusquedaProps
  extends Omit<
    TableWithTitleProps<getProveedorResponseProps>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getProveedorResponseProps | undefined
  }) => void
}

export default function TableProveedoresBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableProveedoresBusquedaProps) {
  const { response, refetch, loading } = useGetProveedores({ value })

  useEffect(() => {
    refetch()
  }, [value, refetch])

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<getProveedorResponseProps>()

  const setProveedorSeleccionado = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  return (
    <>
      <ModalCreateProveedor open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<getProveedorResponseProps>
        {...props}
        id='g-c-e-i.mi-almacen.proveedores'
        title='Proveedores'
        schema={ProveedorCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsProveedores({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setProveedorSeleccionado(
            selectedNodes?.[0]?.data as getProveedorResponseProps
          )
        }
        onRowDoubleClicked={({ data }) => {
          setProveedorSeleccionado(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'RUC',
              'Razón Social',
              'Dirección',
              'Teléfono',
              'Email',
              'Activo',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
