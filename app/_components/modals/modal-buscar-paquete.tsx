'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TablePaquetesBusqueda from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-paquetes-busqueda'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useStorePaqueteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-paquete-seleccionado'
import type { Paquete } from '~/lib/api/paquete'
import ButtonCreatePaquete from '../form/buttons/button-create-paquete'

type ModalBuscarPaqueteProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Paquete | undefined
  }) => void
}

export default function ModalBuscarPaquete({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalBuscarPaqueteProps) {
  const [text, setText] = useState(textDefault)
  
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 500)

  const setPaqueteSeleccionadoStore = useStorePaqueteSeleccionado(
    store => store.setPaquete
  )

  useEffect(() => {
    if (open) setPaqueteSeleccionadoStore(undefined)
  }, [open, setPaqueteSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Paquete'}
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
          placeholder='Buscar por nombre o descripción...'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreatePaquete className='mb-0!' />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TablePaquetesBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
          onPaqueteSeleccionado={setPaqueteSeleccionadoStore}
        />
      </div>
    </Modal>
  )
}

