import { BsCartXFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import ModalComprasAnuladasEnEspera from '../modals/modal-compras-anuladas-en-espera'
import { useState } from 'react'
import { EstadoDeCompra } from '@prisma/client'
import { useStoreFiltrosComprasAnuladas } from '../../_store/store-filtros-compras-anuladas'

export default function ButtonRecuperarCompraAnulada() {
  const [open, setOpen] = useState(false)

  const setFiltros = useStoreFiltrosComprasAnuladas(state => state.setFiltros)

  return (
    <>
      <ModalComprasAnuladasEnEspera
        open={open}
        setOpen={setOpen}
        estado_de_compra={EstadoDeCompra.Anulado}
        setFiltros={setFiltros}
      />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-rose-500'
        onClick={() => setOpen(true)}
      >
        <BsCartXFill className='text-rose-600 min-w-fit' size={30} /> Recuperar
        Compra Anulada
      </ButtonBase>
    </>
  )
}
