'use client'

import { QueryKeys } from '~/app/_lib/queryKeys'
import { useState } from 'react'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { useColumnsCompras } from './columns-compras'
import ModalCrearRecepcionAlmacen from '../modals/modal-crear-recepcion-almacen'
import { getComprasResponseProps } from '~/app/_actions/compra'
import TableCompras from './table-compras'

export default function TableMisCompras() {
  const setCompraSeleccionada = useStoreCompraSeleccionada(
    store => store.setCompra
  )

  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

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
      <TableCompras
        columns={useColumnsCompras({
          setCompraRecepcion,
          setOpenModal,
        })}
        id='g-c-e-i.mis-compras.compras'
        setCompraSeleccionada={setCompraSeleccionada}
        filtros={filtros}
        querykeys={[QueryKeys.COMPRAS]}
      />
    </>
  )
}
