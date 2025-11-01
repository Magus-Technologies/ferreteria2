'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { getCompras } from '~/app/_actions/compra'
import { useColumnsCompras } from './columns-compras'
import ModalCrearRecepcionAlmacen from '../modals/modal-crear-recepcion-almacen'
import { getComprasResponseProps } from '~/app/_actions/compra'

export default function TableCompras() {
  const tableRef = useRef<AgGridReact>(null)

  const [primera_vez, setPrimeraVez] = useState(true)

  const setCompraSeleccionada = useStoreCompraSeleccionada(
    store => store.setCompra
  )

  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

  const { response, refetch, loading } = useServerQuery({
    action: getCompras,
    propsQuery: {
      queryKey: [QueryKeys.COMPRAS],
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

  const [openModal, setOpenModal] = useState(false)
  const [compraRecepcion, setCompraRecepcion] =
    useState<getComprasResponseProps>()

  return (
    <>
      <ModalCrearRecepcionAlmacen
        open={openModal}
        setOpen={setOpenModal}
        compra={compraRecepcion}
        setCompra={setCompraRecepcion}
      />
      <TableWithTitle<getComprasResponseProps>
        id='g-c-e-i.mis-compras.compras'
        onSelectionChanged={({ selectedNodes }) =>
          setCompraSeleccionada(
            selectedNodes?.[0]?.data as getComprasResponseProps
          )
        }
        tableRef={tableRef}
        title='Compras'
        schema={CompraCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsCompras({ setCompraRecepcion, setOpenModal })}
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
    </>
  )
}
