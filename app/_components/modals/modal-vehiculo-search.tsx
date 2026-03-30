'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import TableVehiculosBusqueda from './table-vehiculos-busqueda'
import { orangeColors } from '~/lib/colors'
import type { Vehiculo } from '~/lib/api/catalogos'

type ModalVehiculoSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk?: ModalProps['onOk']
  textDefault?: string
  onRowDoubleClicked?: (vehiculo: Vehiculo | undefined) => void
}

export default function ModalVehiculoSearch({
  open,
  setOpen,
  onOk,
  textDefault = '',
  onRowDoubleClicked,
}: ModalVehiculoSearchProps) {
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
      title='Buscar Vehículo'
      okText='Seleccionar'
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
          placeholder='Buscar por nombre o placa'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
      </div>
      <div className='h-[500px] min-w-[800px] w-full mt-4'>
        <TableVehiculosBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
          selectionColor={orangeColors[10]}
        />
      </div>
    </Modal>
  )
}
