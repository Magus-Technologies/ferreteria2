import { BsFillCartCheckFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import ModalRecuperarOrdenCompra from '../modals/modal-recuperar-orden-compra'
import { useState } from 'react'
import { useStoreFiltrosOrdenesCompra } from '../../_store/store-filtros-ordenes-compra'
import { type FormInstance } from 'antd'

interface ButtonRecuperarOrdenCompraProps {
  form: FormInstance
}

export default function ButtonRecuperarOrdenCompra({
  form,
}: ButtonRecuperarOrdenCompraProps) {
  const [open, setOpen] = useState(false)

  const setFiltros = useStoreFiltrosOrdenesCompra(state => state.setFiltros)

  return (
    <>
      <ModalRecuperarOrdenCompra
        open={open}
        setOpen={setOpen}
        setFiltros={setFiltros}
        form={form}
      />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-orange-500'
        onClick={() => setOpen(true)}
      >
        <BsFillCartCheckFill className='text-orange-600 min-w-fit' size={30} />{' '}
        Recuperar Orden de Compra
      </ButtonBase>
    </>
  )
}
