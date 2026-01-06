'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Chofer } from '~/lib/api/chofer'
import TableChoferesBusqueda from './table-choferes-busqueda'
import ButtonCreateChofer from '../form/buttons/button-create-chofer'

type ModalChoferSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: ({ data }: { data: Chofer | undefined }) => void
  onSuccess?: (chofer: Chofer) => void
}

export default function ModalChoferSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
  onSuccess,
}: ModalChoferSearchProps) {
  const [text, setText] = useState(textDefault)
  
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 1000)

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Chofer'}
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
      destroyOnClose
    >
      <div className='flex items-center gap-2'>
        <InputBase
          placeholder='Buscar Chofer'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateChofer
          className='mb-0!'
          onSuccess={chofer => {
            setText(chofer.dni)
            onSuccess?.(chofer)
          }}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TableChoferesBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
        />
      </div>
    </Modal>
  )
}
