'use client'

import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { useEffect } from 'react'
import TableDetalleDeCompra from './table-detalle-de-compra'

export default function TableDetalleDeCompraMisCompras() {
  const compraSeleccionada = useStoreCompraSeleccionada(store => store.compra)
  const setCompraSeleccionada = useStoreCompraSeleccionada(
    store => store.setCompra
  )

  useEffect(() => {
    setCompraSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TableDetalleDeCompra
      id='g-c-e-i.mis-compras.detalle-de-compra'
      compraSeleccionada={compraSeleccionada}
      setCompraSeleccionada={setCompraSeleccionada}
    />
  )
}
