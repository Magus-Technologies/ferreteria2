'use client'

import ButtonBase from '~/components/buttons/button-base'
import ModalCreateProducto from '../modals/modal-create-producto'
import { FaPlusCircle } from 'react-icons/fa'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import { useStoreArchivosProducto } from '../../_store/store-archivos-producto'

export default function ButtonCreateProducto() {
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)
  const setOpenModal = useStoreEditOrCopyProducto(state => state.setOpenModal)

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  return (
    <>
      <ModalCreateProducto />
      <ButtonBase
        className='flex items-center justify-center gap-2 !rounded-md w-full lg:h-full h-10'
        size='sm'
        onClick={() => {
          setImgFile(undefined)
          setFichaTecnicaFile(undefined)
          setProducto(undefined)
          setOpenModal(true)
        }}
      >
        <FaPlusCircle className='text-emerald-600' size={15} /> Agregar
      </ButtonBase>
    </>
  )
}
