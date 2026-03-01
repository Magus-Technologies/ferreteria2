'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TableServiciosBusqueda from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-servicios-busqueda'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useStoreServicioSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-servicio-seleccionado'
import type { Servicio } from '~/lib/api/servicios'
import ButtonCreateServicio from '../form/buttons/button-create-servicio'

type ModalBuscarServicioProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Servicio | undefined
  }) => void
}

export default function ModalBuscarServicio({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalBuscarServicioProps) {
  const [text, setText] = useState(textDefault)

  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 500)

  const setServicioSeleccionadoStore = useStoreServicioSeleccionado(
    store => store.setServicio
  )

  useEffect(() => {
    if (open) setServicioSeleccionadoStore(undefined)
  }, [open, setServicioSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Servicio'}
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
          placeholder='Buscar por nombre...'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateServicio className='mb-0!' />
      </div>
      <div className='h-[500px] min-w-[800px] w-full mt-4'>
        <TableServiciosBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
          onServicioSeleccionado={setServicioSeleccionadoStore}
        />
      </div>
    </Modal>
  )
}
