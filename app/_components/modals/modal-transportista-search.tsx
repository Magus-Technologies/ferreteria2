'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Transportista } from '~/lib/api/transportista'
import TableTransportistasBusqueda from './table-transportistas-busqueda'
import ButtonCreateTransportista from '../form/buttons/button-create-transportista'
import { orangeColors } from '~/lib/colors'

type ModalTransportistaSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Transportista | undefined
  }) => void
  onSuccess?: (transportista: Transportista) => void
}

export default function ModalTransportistaSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
  onSuccess,
}: ModalTransportistaSearchProps) {
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
      title={'Buscar Transportista'}
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
          placeholder='Buscar Transportista'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateTransportista
          className='mb-0!'
          onSuccess={transportista => {
            setText(transportista.ruc)
            onSuccess?.(transportista)
          }}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[500px] min-w-[1000px] w-full mt-4'>
        <TableTransportistasBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
          selectionColor={orangeColors[10]}
        />
      </div>
    </Modal>
  )
}
