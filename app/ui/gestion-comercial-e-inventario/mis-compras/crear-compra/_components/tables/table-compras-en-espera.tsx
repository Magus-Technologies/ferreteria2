'use client'

import { QueryKeys } from '~/app/_lib/queryKeys'
import TableCompras from '../../../_components/tables/table-compras'
import { useColumnsCompras } from '../../../_components/tables/columns-compras'
import { useStoreCompraSeleccionadaEnEspera } from '../../_store/store-compra-seleccionada-en-espera'
import { useStoreFiltrosComprasEnEspera } from '../../_store/store-filtros-compras-en-espera'
import { useRouter } from 'next/navigation'

export default function TableComprasEnEspera() {
  const setCompraSeleccionada = useStoreCompraSeleccionadaEnEspera(
    store => store.setCompra
  )

  const router = useRouter()

  const filtros = useStoreFiltrosComprasEnEspera(state => state.filtros)

  return (
    <TableCompras
      columns={useColumnsCompras()}
      id='g-c-e-i.mis-compras.compras-en-espera'
      setCompraSeleccionada={setCompraSeleccionada}
      filtros={filtros}
      querykeys={[QueryKeys.COMPRAS_EN_ESPERA]}
      onRowDoubleClicked={({ data }) => {
        router.push(
          `/ui/gestion-comercial-e-inventario/mis-compras/editar-compra/${data?.id}`
        )
      }}
    />
  )
}
