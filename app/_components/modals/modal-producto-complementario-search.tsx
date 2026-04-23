'use client'

import { Input, Modal, ModalProps } from 'antd'
import type { InputRef } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import type { Producto } from '~/app/_types/producto'
import TableProductosBusqueda from '~/app/_components/modals/table-productos-busqueda'

type ModalProductoComplementarioSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk?: ModalProps['onOk']
  onSelect: (producto: Producto) => void
  initialSearchText?: string
}

export default function ModalProductoComplementarioSearch({
  open,
  setOpen,
  onOk,
  onSelect,
  initialSearchText = '',
}: ModalProductoComplementarioSearchProps) {
  const [text, setText] = useState('')
  const [value] = useDebounce(text, 500)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (open && initialSearchText) {
      setText(initialSearchText)
    } else if (!open) {
      setText('')
    }
  }, [open, initialSearchText])

  const handleRowDoubleClick = (producto: Producto | undefined) => {
    if (producto) {
      onSelect(producto)
      setOpen(false)
    }
  }

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title='Buscar Producto Complementario'
      okText='Seleccionar'
      onOk={onOk}
      cancelText='Cerrar'
      cancelButtonProps={{ className: 'rounded-xl' }}
      okButtonProps={{
        className: classOkButtonModal,
      }}
      onCancel={() => {
        setOpen(false)
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
      afterOpenChange={(opened) => {
        if (opened) inputRef.current?.focus({ cursor: 'end' })
      }}
    >
      <div className='flex items-center gap-2'>
        <Input
          ref={inputRef}
          variant='filled'
          placeholder='Buscar por código o nombre...'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
          autoComplete='off'
        />
      </div>
      <div className='h-[500px] min-w-[1200px] w-full mt-4'>
        <TableProductosBusqueda
          value={value}
          onRowDoubleClicked={handleRowDoubleClick}
        />
      </div>
    </Modal>
  )
}
