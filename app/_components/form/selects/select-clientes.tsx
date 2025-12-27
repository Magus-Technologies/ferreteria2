'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch, FaUser } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { Cliente } from '~/lib/api/cliente'
import useSearchClientes from '~/app/ui/facturacion-electronica/mis-ventas/_hooks/use-search-clientes'
import { useDebounce } from 'use-debounce'
import ButtonCreateCliente from '../buttons/button-create-cliente'
import ModalClienteSearch from '../../modals/modal-cliente-search'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'
import { FormInstance } from 'antd'

interface SelectClientesProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, cliente?: Cliente) => void
  showButtonCreate?: boolean
  classIconSearch?: string
  classIconCreate?: string
  clienteOptionsDefault?: Pick<Cliente, 'id' | 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>[]
  form?: FormInstance
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
  form,
  ...props
}: SelectClientesProps) {
  const selectClientesRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalClienteSearch, setOpenModalClienteSearch] = useState(false)

  const [clienteCreado, setClienteCreado] = useState<Cliente>()
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente>()

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

  function handleSelect({ data }: { data?: Cliente } = {}) {
    const cliente = data || clienteSeleccionadoStore
    // console.log('handleselect - cliente', cliente)
    if (cliente) {
      setClienteSeleccionado(cliente)

      // Mostrar el nombre del cliente en el campo de búsqueda
      const clienteLabel = cliente.razon_social
        ? `${cliente.numero_documento} : ${cliente.razon_social}`
        : `${cliente.numero_documento} : ${cliente.nombres} ${cliente.apellidos}`
      setText(clienteLabel)

      iterarChangeValue({
        refObject: selectClientesRef,
        value: cliente.id,
      })

      // Autocompletar campos del formulario si se proporciona form
      if (form) {
        if (cliente.numero_documento) {
          form.setFieldValue('ruc_dni', cliente.numero_documento)
        }
        if (cliente.telefono) {
          form.setFieldValue('telefono', cliente.telefono)
        }

        // Guardar las 3 direcciones en el formulario (campos ocultos para referencia)
        form.setFieldValue('_cliente_direccion_1', cliente.direccion || '')
        form.setFieldValue('_cliente_direccion_2', cliente.direccion_2 || '')
        form.setFieldValue('_cliente_direccion_3', cliente.direccion_3 || '')

        // Llenar campo de dirección según el checkbox seleccionado (por defecto D1)
        const direccionSeleccionada = form.getFieldValue('direccion_seleccionada') || 'D1'

        if (direccionSeleccionada === 'D1' && cliente.direccion) {
          form.setFieldValue('direccion', cliente.direccion)
        } else if (direccionSeleccionada === 'D2' && cliente.direccion_2) {
          form.setFieldValue('direccion', cliente.direccion_2)
        } else if (direccionSeleccionada === 'D3' && cliente.direccion_3) {
          form.setFieldValue('direccion', cliente.direccion_3)
        } else if (cliente.direccion) {
          // Fallback a dirección 1 si la seleccionada no existe
          form.setFieldValue('direccion', cliente.direccion)
        }
      }

      setClienteSeleccionadoStore(undefined)
      setOpenModalClienteSearch(false)
      onChange?.(cliente.id, cliente)
    }
  }

  const [value] = useDebounce(text, 1000)

  const { response, loading } = useSearchClientes({ value })

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
        form={form}
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
