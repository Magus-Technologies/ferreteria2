import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TableProveedoresBusqueda from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/_components/tables/table-proveedores-busqueda'
import { useEffect, useState } from 'react'
import ButtonCreateProveedor from '../form/buttons/button-create-proveedor'
import { useDebounce } from 'use-debounce'
import { useStoreProveedorSeleccionado } from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado'
import type { Proveedor } from '~/lib/api/proveedor'

type ModalProveedorSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string

  onRowDoubleClicked?: ({
    data,
  }: {
    data: Proveedor | undefined
  }) => void
}

export default function ModalProveedorSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalProveedorSearchProps) {
  const [text, setText] = useState(textDefault)
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 1000)

  const setProveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  useEffect(() => {
    if (open) setProveedorSeleccionadoStore(undefined)
  }, [open, setProveedorSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Proveedor'}
      okText={'Seleccionar'}
      onOk={onOk}
      cancelText='Cerrar'
      cancelButtonProps={{ className: 'rounded-xl' }}
      okButtonProps={{
        className: classOkButtonModal,
      }}
      onCancel={() => {
        setOpen(false)
        setText('')
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <div className='flex items-center gap-2'>
        <InputBase
          placeholder='Buscar Proveedor'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateProveedor
          className='mb-0!'
          onSuccess={res => setText(res.ruc)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TableProveedoresBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
        />
      </div>
    </Modal>
  )
}
