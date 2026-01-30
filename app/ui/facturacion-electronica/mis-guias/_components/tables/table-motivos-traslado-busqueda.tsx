'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'
import { useEffect, useState } from 'react'
import { useColumnsMotivosTraslado } from './columns-motivos-traslado'
import ModalCreateMotivoTraslado from '~/app/ui/facturacion-electronica/mis-guias/_components/modals/modal-create-motivo-traslado'
import { useStoreMotivoTrasladoSeleccionado } from '../../store/store-motivo-traslado-seleccionado'
import useGetMotivosTraslado from '../../_hooks/use-get-motivos-traslado'
import { orangeColors } from '~/lib/colors'

interface TableMotivosTrasladoBusquedaProps
  extends Omit<
    TableWithTitleProps<MotivoTraslado>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: MotivoTraslado | undefined
  }) => void
}

export default function TableMotivosTrasladoBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableMotivosTrasladoBusquedaProps) {
  const { response, refetch, loading } = useGetMotivosTraslado({ value })

  useEffect(() => {
    refetch()
  }, [value, refetch])

  const [open, setOpen] = useState(false)
  const [dataEdit, setDataEdit] = useState<MotivoTraslado>()

  const setMotivoTrasladoSeleccionado = useStoreMotivoTrasladoSeleccionado(
    store => store.setMotivoTraslado
  )

  return (
    <>
      <ModalCreateMotivoTraslado open={open} setOpen={setOpen} dataEdit={dataEdit} />
      <TableWithTitle<MotivoTraslado>
        {...props}
        id='f-e.mis-guias.motivos-traslado'
        title='Motivos de Traslado'
        selectionColor={orangeColors[10]} // Color azul para facturación electrónica
        loading={loading}
        columnDefs={useColumnsMotivosTraslado({ setDataEdit, setOpen })}
        rowData={response || []}
        onSelectionChanged={({ selectedNodes }) =>
          setMotivoTrasladoSeleccionado(
            selectedNodes?.[0]?.data as MotivoTraslado
          )
        }
        onRowDoubleClicked={({ data }) => {
          setMotivoTrasladoSeleccionado(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'Código',
              'Descripción',
              'Activo',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
