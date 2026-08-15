'use client'

import ButtonBase from '~/components/buttons/button-base'
import { FaPlusCircle } from 'react-icons/fa'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import { useStoreArchivosProducto } from '../../_store/store-archivos-producto'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function ButtonCreateProducto() {
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)
  const setOpenModal = useStoreEditOrCopyProducto(state => state.setOpenModal)

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  // El wrapper va DENTRO del componente y no en la página: mi-almacén lo
  // renderiza dos veces (fila móvil y columna de escritorio), así que envolverlo
  // acá cubre ambas sin repetir el id.
  return (
    <ConfigurableElement
      componentId='mi-almacen.boton-agregar-producto'
      label='Botón Agregar Producto'
    >
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
    </ConfigurableElement>
  )
}
