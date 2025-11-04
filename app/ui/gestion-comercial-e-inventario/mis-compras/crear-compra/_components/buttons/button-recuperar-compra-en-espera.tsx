import { BsFillCartDashFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import ModalComprasAnuladasEnEspera from '../modals/modal-compras-anuladas-en-espera'
import { useState } from 'react'
import { EstadoDeCompra } from '@prisma/client'
import { useStoreFiltrosComprasEnEspera } from '../../_store/store-filtros-compras-en-espera'

export default function ButtonRecuperarCompraEnEspera() {
  const [open, setOpen] = useState(false)

  const setFiltros = useStoreFiltrosComprasEnEspera(state => state.setFiltros)

  return (
    <>
      <ModalComprasAnuladasEnEspera
        open={open}
        setOpen={setOpen}
        estado_de_compra={EstadoDeCompra.EnEspera}
        setFiltros={setFiltros}
      />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-yellow-500'
        onClick={() => setOpen(true)}
      >
        <BsFillCartDashFill className='text-yellow-600 min-w-fit' size={30} />{' '}
        Recuperar Compra en Espera
      </ButtonBase>
    </>
  )
}
