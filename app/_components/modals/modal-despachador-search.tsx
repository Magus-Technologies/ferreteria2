'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import TableDespachadoresBusqueda from './table-despachadores-busqueda'
import { orangeColors } from '~/lib/colors'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
}

type ModalDespachadorSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: (despachador: Usuario | undefined) => void
  onSuccess?: (despachador: Usuario) => void
}

export default function ModalDespachadorSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
  onSuccess,
}: ModalDespachadorSearchProps) {
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
      title={'Buscar Despachador'}
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
          placeholder='Buscar Despachador'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TableDespachadoresBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
          selectionColor={orangeColors[10]}
        />
      </div>
    </Modal>
  )
}
