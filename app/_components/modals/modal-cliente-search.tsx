import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TableClientesBusqueda from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-clientes-busqueda'
import { useEffect, useState } from 'react'
import ButtonCreateCliente from '../form/buttons/button-create-cliente'
import { useDebounce } from 'use-debounce'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'
import { getClienteResponseProps } from '~/app/_actions/cliente'

type ModalClienteSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string

  onRowDoubleClicked?: ({
    data,
  }: {
    data: getClienteResponseProps | undefined
  }) => void
}

export default function ModalClienteSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalClienteSearchProps) {
  const [text, setText] = useState(textDefault)
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 1000)

  const setClienteSeleccionadoStore = useStoreClienteSeleccionado(
    store => store.setCliente
  )

  useEffect(() => {
    if (open) setClienteSeleccionadoStore(undefined)
  }, [open, setClienteSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Cliente'}
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
          placeholder='Buscar Cliente'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateCliente
          className='mb-0!'
          onSuccess={res => setText(res.numero_documento)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TableClientesBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
        />
      </div>
    </Modal>
  )
}
