'use client'

import TableDetalleDeCompra from '../../../_components/tables/table-detalle-de-compra'
import { useStoreCompraSeleccionadaAnuladas } from '../../_store/store-compra-seleccionada-anuladas'
import { useEffect } from 'react'

export default function TableDetalleDeCompraAnulada() {
  const compraSeleccionada = useStoreCompraSeleccionadaAnuladas(
    store => store.compra
  )
  const setCompraSeleccionada = useStoreCompraSeleccionadaAnuladas(
    store => store.setCompra
  )

  useEffect(() => {
    setCompraSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TableDetalleDeCompra
      id='g-c-e-i.mis-compras.detalle-de-compra-anulada'
      compraSeleccionada={compraSeleccionada}
      setCompraSeleccionada={setCompraSeleccionada}
    />
  )
}
