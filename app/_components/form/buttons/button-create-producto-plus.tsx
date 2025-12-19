import { Tooltip } from 'antd'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import type { Producto } from '~/app/_types/producto'
import ModalCreateProducto from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-producto'
import { useStoreEditOrCopyProducto } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-edit-or-copy-producto'
import { useStoreArchivosProducto } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-archivos-producto'

interface ButtonCreateProductoPlusProps {
  className?: string
  onSuccess?: (res: Producto) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
}

export default function ButtonCreateProductoPlus({
  className,
  onSuccess,
  textDefault,
  setTextDefault,
}: ButtonCreateProductoPlusProps) {
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)
  const setOpenModal = useStoreEditOrCopyProducto(state => state.setOpenModal)

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  const can = usePermission()
  if (!can(permissions.PRODUCTO_CREATE)) return null

  return (
    <>
      <ModalCreateProducto
        onSuccess={onSuccess}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
      />
      <Tooltip title='Crear Producto'>
        <ButtonCreateFormWithName
          onClick={() => {
            setImgFile(undefined)
            setFichaTecnicaFile(undefined)
            setProducto(undefined)
            setOpenModal(true)
          }}
          className={className}
        />
      </Tooltip>
    </>
  )
}
