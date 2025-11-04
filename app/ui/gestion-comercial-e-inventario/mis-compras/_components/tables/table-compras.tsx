'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { getCompras } from '~/app/_actions/compra'
import { getComprasResponseProps } from '~/app/_actions/compra'
import { ColDef } from 'ag-grid-community'
import { Prisma } from '@prisma/client'

export default function TableCompras({
  columns,
  id,
  setCompraSeleccionada,
  filtros,
  querykeys,
  onRowDoubleClicked,
}: {
  columns: ColDef<getComprasResponseProps>[]
  id: string
  setCompraSeleccionada: (compra: getComprasResponseProps | undefined) => void
  filtros: Prisma.CompraWhereInput | undefined
  querykeys: QueryKeys[]
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getComprasResponseProps | undefined
  }) => void
}) {
  const tableRef = useRef<AgGridReact>(null)

  const [primera_vez, setPrimeraVez] = useState(true)

  const { response, refetch, loading } = useServerQuery({
    action: getCompras,
    propsQuery: {
      queryKey: querykeys,
    },
    params: {
      where: filtros,
    },
  })

  useEffect(() => {
    if (!loading && filtros) setPrimeraVez(false)
  }, [loading, filtros])

  useEffect(() => {
    if (!primera_vez) refetch()
  }, [filtros, refetch, primera_vez])

  return (
    <TableWithTitle<getComprasResponseProps>
      id={id}
      onSelectionChanged={({ selectedNodes }) =>
        setCompraSeleccionada(
          selectedNodes?.[0]?.data as getComprasResponseProps
        )
      }
      onRowDoubleClicked={({ data }) => {
        onRowDoubleClicked?.({ data })
      }}
      tableRef={tableRef}
      title='Compras'
      schema={CompraCreateInputSchema}
      loading={loading}
      columnDefs={columns}
      rowData={response}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Documento',
            'Serie',
            'Número',
            'Fecha',
            'RUC',
            'Proveedor',
            'Subtotal',
            'IGV',
            'Total',
            'Forma de Pago',
            'Total Pagado',
            'Resta',
            'Estado de Cuenta',
            'Registrador',
            'Estado',
            'Acciones',
          ],
        },
      ]}
    />
  )
}
