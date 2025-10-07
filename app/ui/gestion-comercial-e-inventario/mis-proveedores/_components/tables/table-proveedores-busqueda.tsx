'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ProveedorCreateInputSchema } from '~/prisma/generated/zod'
import { Prisma } from '@prisma/client'
import { SearchProveedor } from '~/app/_actions/proveedor'
import { useEffect, useState } from 'react'
import { useColumnsProveedores } from './columns-proveedores'
import ModalCreateProveedor, {
  dataEditProveedor,
} from '../modals/modal-create-proveedor'
import { useStoreProveedorSeleccionado } from '../../store/store-proveedor-seleccionado'

interface TableProveedoresBusquedaProps
  extends Omit<
    TableWithTitleProps<dataEditProveedor>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: dataEditProveedor | undefined
  }) => void
}

export default function TableProveedoresBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableProveedoresBusquedaProps) {
  const { response, refetch, loading } = useServerQuery({
    action: SearchProveedor,
    propsQuery: {
      queryKey: [QueryKeys.PROVEEDORES_SEARCH],
      enabled: !!value,
    },
    params: {
      where: {
        OR: [
          {
            razon_social: {
              contains: value,
              mode: 'insensitive',
            },
          },
          {
            ruc: {
              contains: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    } satisfies Prisma.ProveedorFindManyArgs,
  })

  useEffect(() => {
    refetch()
  }, [value, refetch])

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<dataEditProveedor>()

  const setProveedorSeleccionado = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  return (
    <>
      <ModalCreateProveedor open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<dataEditProveedor>
        {...props}
        id='g-c-e-i.mi-almacen.proveedores'
        title='Proveedores'
        schema={ProveedorCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsProveedores({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setProveedorSeleccionado(
            selectedNodes?.[0]?.data as dataEditProveedor
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
