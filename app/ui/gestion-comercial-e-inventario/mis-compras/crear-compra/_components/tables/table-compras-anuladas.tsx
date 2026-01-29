'use client'

import { QueryKeys } from '~/app/_lib/queryKeys'
import TableCompras from '../../../_components/tables/table-compras'
import { useColumnsCompras } from '../../../_components/tables/columns-compras'
import { useStoreFiltrosComprasAnuladas } from '../../_store/store-filtros-compras-anuladas'
import { useStoreCompraSeleccionadaAnuladas } from '../../_store/store-compra-seleccionada-anuladas'
import { useRouter } from 'next/navigation'

export default function TableComprasAnuladas() {
  const setCompraSeleccionada = useStoreCompraSeleccionadaAnuladas(
    store => store.setCompra
  )

  const filtros = useStoreFiltrosComprasAnuladas(state => state.filtros)

  const router = useRouter()

  return (
    <TableCompras
      columns={useColumnsCompras()}
      id='g-c-e-i.mis-compras.compras-anuladas'
      setCompraSeleccionada={setCompraSeleccionada}
      filtros={filtros}
      querykeys={[QueryKeys.COMPRAS_ANULADAS]}
      onRowDoubleClicked={({ data }) => {
        router.push(
          `/ui/gestion-comercial-e-inventario/mis-compras/editar-compra/${data?.id}`
        )
      }}
    />
  )
}
