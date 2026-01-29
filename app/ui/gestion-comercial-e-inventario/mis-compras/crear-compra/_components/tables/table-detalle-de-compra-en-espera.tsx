'use client'

import TableDetalleDeCompra from '../../../_components/tables/table-detalle-de-compra'
import { useStoreCompraSeleccionadaEnEspera } from '../../_store/store-compra-seleccionada-en-espera'
import { useEffect } from 'react'

export default function TableDetalleDeCompraEnEspera() {
  const compraSeleccionada = useStoreCompraSeleccionadaEnEspera(
    store => store.compra
  )
  const setCompraSeleccionada = useStoreCompraSeleccionadaEnEspera(
    store => store.setCompra
  )

  useEffect(() => {
    setCompraSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TableDetalleDeCompra
      id='g-c-e-i.mis-compras.detalle-de-compra-en-espera'
      compraSeleccionada={compraSeleccionada}
      setCompraSeleccionada={setCompraSeleccionada}
    />
  )
}
