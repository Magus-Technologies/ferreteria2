import { Input, Modal, ModalProps } from 'antd'
import { FaSearch } from 'react-icons/fa'
import type { InputRef } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import TableClientesBusqueda from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-clientes-busqueda'
import TableDetalleDeudaCliente from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-detalle-deuda-cliente'
import { useEffect, useRef, useState } from 'react'
import ButtonCreateCliente from '../form/buttons/button-create-cliente'
import { useDebounce } from 'use-debounce'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'
import { Cliente } from '~/lib/api/cliente'

type ModalClienteSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string

  onRowDoubleClicked?: ({
    data,
  }: {
    data: Cliente | undefined
  }) => void
}

export default function ModalClienteSearch({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
}: ModalClienteSearchProps) {
  const [text, setText] = useState('')
  const [profesion, setProfesion] = useState('')
  
  // Sincronizar text con textDefault cuando el modal se abre o textDefault cambia
  useEffect(() => {
    if (open) {
      setText(textDefault)
      setProfesion('')
    }
  }, [open, textDefault])

  const [value] = useDebounce(text, 500)
  const [profesionValue] = useDebounce(profesion, 500)
  const inputRef = useRef<InputRef>(null)

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
        // setText('')
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
          placeholder='Buscar Cliente'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
          autoComplete='off'
          prefix={<FaSearch className='text-slate-400 mr-1' />}
        />
        <Input
          variant='filled'
          placeholder='Filtrar por profesion'
          value={profesion}
          onChange={e => setProfesion(e.target.value)}
          className='max-w-[260px]'
          autoComplete='off'
        />
        <ButtonCreateCliente
          className='mb-0!'
          onSuccess={res => setText(res.numero_documento)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='h-[420px] min-w-[1200px] w-full mt-4'>
        <TableClientesBusqueda
          value={value}
          profesion={profesionValue}
          onRowDoubleClicked={onRowDoubleClicked}
        />
      </div>
      <div className='mt-4'>
        <TableDetalleDeudaCliente />
      </div>
    </Modal>
  )
}
