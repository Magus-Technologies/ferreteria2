import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TableMotivosTrasladoBusqueda from '~/app/ui/facturacion-electronica/mis-guias/_components/tables/table-motivos-traslado-busqueda'
import { useEffect, useState } from 'react'
import ButtonCreateMotivoTraslado from '../form/buttons/button-create-motivo-traslado'
import { useDebounce } from 'use-debounce'
import { useStoreMotivoTrasladoSeleccionado } from '~/app/ui/facturacion-electronica/mis-guias/store/store-motivo-traslado-seleccionado'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'

type ModalMotivoTrasladoSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string

  onRowDoubleClicked?: ({
    data,
  }: {
    data: MotivoTraslado | undefined
  }) => void
}

export default function ModalMotivoTrasladoSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalMotivoTrasladoSearchProps) {
  const [text, setText] = useState(textDefault)
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 500)

  const setMotivoTrasladoSeleccionadoStore = useStoreMotivoTrasladoSeleccionado(
    store => store.setMotivoTraslado
  )

  useEffect(() => {
    if (open) setMotivoTrasladoSeleccionadoStore(undefined)
  }, [open, setMotivoTrasladoSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Motivo de Traslado'}
      okText={'Seleccionar'}
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
    >
      <div className='flex items-center gap-2'>
        <InputBase
          placeholder='Buscar Motivo de Traslado'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
        />
        <ButtonCreateMotivoTraslado
          className='mb-0!'
          onSuccess={res => setText(res.codigo)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[500px] min-w-[800px] w-full mt-4'>
        <TableMotivosTrasladoBusqueda
          value={value}
          onRowDoubleClicked={onRowDoubleClicked}
        />
      </div>
    </Modal>
  )
}
