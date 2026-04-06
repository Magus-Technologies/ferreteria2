'use client'

import { useState, useCallback, useRef } from 'react'
import { Form, Input } from 'antd'
import type { FormItemProps } from 'antd/lib'
import type { FormInstance } from 'antd'
import ModalProductoComplementarioSearch from '~/app/_components/modals/modal-producto-complementario-search'
import type { Producto } from '~/app/_types/producto'
import { FaSearch } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'

interface Option {
  value: number
  label: string
}

export default function SelectProductoComplementario({
  propsForm,
  form,
  formWithMessage = false,
  placeholder = 'Buscar producto com...',
  onChange,
  initialOption,
}: {
  propsForm?: FormItemProps & { prefix_array_name?: (string | number)[] }
  form?: FormInstance
  formWithMessage?: boolean
  placeholder?: string
  onChange?: (value: number | undefined, producto?: Producto) => void
  initialOption?: Option
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(
    initialOption?.label
  )
  const [selectedValue, setSelectedValue] = useState<number | undefined>(
    initialOption?.value
  )
  const inputRef = useRef<any>(null)

  const handleSelectFromModal = useCallback(
    (producto: Producto) => {
      const label = `${producto.cod_producto} - ${producto.name}`
      setSelectedLabel(label)
      setSelectedValue(producto.id)
      setSearchText('')
      onChange?.(producto.id, producto)
      setModalOpen(false)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    setSelectedLabel(undefined)
    setSelectedValue(undefined)
    setSearchText('')
    onChange?.(undefined)
  }, [onChange])

  const inputEl = (
    <>
      <div className='flex items-center gap-1 w-full'>
        <Input
          ref={inputRef}
          size='small'
          placeholder={placeholder}
          value={selectedLabel || searchText}
          onChange={(e) => {
            if (selectedLabel) {
              handleClear()
            }
            setSearchText(e.target.value)
          }}
          onPressEnter={(e) => {
            e.preventDefault()
            setModalOpen(true)
          }}
          suffix={
            <div className='flex items-center gap-1'>
              {selectedValue && (
                <IoClose
                  className='text-gray-400 hover:text-red-500 cursor-pointer'
                  size={14}
                  onClick={handleClear}
                />
              )}
              <FaSearch
                className='text-yellow-600 cursor-pointer'
                size={12}
                onClick={() => setModalOpen(true)}
              />
            </div>
          }
          style={{ width: '100%' }}
        />
      </div>
      <ModalProductoComplementarioSearch
        open={modalOpen}
        setOpen={setModalOpen}
        onSelect={handleSelectFromModal}
        initialSearchText={searchText}
      />
    </>
  )

  if (propsForm) {
    const { prefix_array_name, ...formItemProps } = propsForm
    return (
      <Form.Item
        {...formItemProps}
        name={
          prefix_array_name
            ? [
                ...prefix_array_name,
                ...(Array.isArray(formItemProps.name)
                  ? formItemProps.name
                  : [formItemProps.name]),
              ]
            : formItemProps.name
        }
        style={{ marginBottom: 0, width: '100%' }}
        help={formWithMessage ? undefined : ''}
        validateStatus={formWithMessage ? undefined : ''}
        getValueFromEvent={() => selectedValue}
      >
        {inputEl}
      </Form.Item>
    )
  }

  return inputEl
}
