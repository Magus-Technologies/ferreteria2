'use client'

import { useStoreFiltrosOrdenesCompra } from '../../_store/store-filtros-ordenes-compra'
import { useStoreOrdenCompraSeleccionada } from '../../_store/store-orden-compra-seleccionada'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TableCompras from '../../../_components/tables/table-compras'
import { useColumnsOrdenesCompra } from './columns-ordenes-compra'

export default function TableOrdenesCompra() {
  const filtros = useStoreFiltrosOrdenesCompra(state => state.filtros)
  const setCompraSeleccionada = useStoreOrdenCompraSeleccionada(
    state => state.setCompra
  )

  const columns = useColumnsOrdenesCompra()

  return (
    <TableCompras
      columns={columns}
      id='g-c-e-i.mis-compras.ordenes-compra'
      setCompraSeleccionada={setCompraSeleccionada}
      filtros={filtros}
      querykeys={[QueryKeys.COMPRAS]}
    />
  )
}
