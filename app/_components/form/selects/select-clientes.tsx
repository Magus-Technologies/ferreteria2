'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { Cliente } from '@prisma/client'
import { FaSearch, FaUser } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { getClienteResponseProps } from '~/app/_actions/cliente'
import useGetClientes from '~/app/ui/facturacion-electronica/mis-ventas/_hooks/use-get-clientes'
import { useDebounce } from 'use-debounce'
import ButtonCreateCliente from '../buttons/button-create-cliente'
import ModalClienteSearch from '../../modals/modal-cliente-search'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'

interface SelectClientesProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, cliente?: getClienteResponseProps) => void
  showButtonCreate?: boolean
  classIconSearch?: string
  classIconCreate?: string
  clienteOptionsDefault?: Pick<Cliente, 'id' | 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>[]
}

export default function SelectClientes({
  placeholder = 'Buscar Cliente',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  classIconSearch = '',
  classIconCreate = '',
  clienteOptionsDefault = [],
  onChange,
  ...props
}: SelectClientesProps) {
  const selectClientesRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalClienteSearch, setOpenModalClienteSearch] = useState(false)

  const [clienteCreado, setClienteCreado] = useState<Cliente>()
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<getClienteResponseProps>()

  const clienteSeleccionadoStore = useStoreClienteSeleccionado(
    store => store.cliente
  )
  const setClienteSeleccionadoStore = useStoreClienteSeleccionado(
    store => store.setCliente
  )

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  function handleSelect({ data }: { data?: getClienteResponseProps } = {}) {
    setText('')
    const cliente = data || clienteSeleccionadoStore
    if (cliente) {
      setClienteSeleccionado(cliente)
      iterarChangeValue({
        refObject: selectClientesRef,
        value: cliente.id,
      })
      setClienteSeleccionadoStore(undefined)
      setOpenModalClienteSearch(false)
      onChange?.(cliente.id, cliente)
    }
  }

  const [value] = useDebounce(text, 1000)

  const { response, loading } = useGetClientes({ value })

  useEffect(() => {
    if (response && response.length === 1) handleSelect({ data: response[0] })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  const getLabel = (cliente: Pick<Cliente, 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>) => {
      if (cliente.razon_social) return `${cliente.numero_documento} : ${cliente.razon_social}`
      return `${cliente.numero_documento} : ${cliente.nombres} ${cliente.apellidos}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectClientesRef}
        showSearch
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        options={[
          ...(clienteCreado
            ? [
                {
                  value: clienteCreado.id,
                  label: getLabel(clienteCreado),
                },
              ]
            : []),
          ...(clienteSeleccionado
            ? [
                {
                  value: clienteSeleccionado.id,
                  label: getLabel(clienteSeleccionado),
                },
              ]
            : []),
          ...clienteOptionsDefault.map(cliente => ({
            value: cliente.id,
            label: getLabel(cliente),
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalClienteSearch(true)
        }}
        open={false}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalClienteSearch(true)}
      />
      <ModalClienteSearch
        open={openModalClienteSearch}
        setOpen={setOpenModalClienteSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
      />
      {showButtonCreate && (
        <ButtonCreateCliente
          onSuccess={res => {
            setClienteCreado(res)
            iterarChangeValue({
              refObject: selectClientesRef,
              value: res.id,
            })
          }}
          textDefault={textDefault}
          setTextDefault={setTextDefault}
          className={classIconCreate}
        />
      )}
    </div>
  )
}
