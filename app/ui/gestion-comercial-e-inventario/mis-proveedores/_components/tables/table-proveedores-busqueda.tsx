'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { ProveedorCreateInputSchema } from '~/prisma/generated/zod'
import type { Proveedor } from '~/lib/api/proveedor'
import { useEffect, useState } from 'react'
import { useColumnsProveedores } from './columns-proveedores'
import ModalCreateProveedor from '../modals/modal-create-proveedor'
import { useStoreProveedorSeleccionado } from '../../store/store-proveedor-seleccionado'
import useGetProveedores from '../../_hooks/use-get-proveedores'
import { greenColors } from '~/lib/colors'

interface TableProveedoresBusquedaProps
  extends Omit<
    TableWithTitleProps<Proveedor>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Proveedor | undefined
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
  const [dataEdit, setDataEdit] = useState<Proveedor>()

  const setProveedorSeleccionado = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  return (
    <>
      <ModalCreateProveedor open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<Proveedor>
        {...props}
        id='g-c-e-i.mi-almacen.proveedores'
        title='Proveedores'
        selectionColor={greenColors[10]} // Color verde para gestión comercial e inventario
        schema={ProveedorCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsProveedores({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setProveedorSeleccionado(
            selectedNodes?.[0]?.data as Proveedor
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
