'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Form, Select } from 'antd'
import type { FormItemProps } from 'antd/lib'
import type { FormInstance } from 'antd'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'
import ModalProductoComplementarioSearch from '~/app/_components/modals/modal-producto-complementario-search'
import type { Producto } from '~/app/_types/producto'

interface Option {
  value: number
  label: string
}

export default function SelectProductoComplementario({
  propsForm,
  form,
  formWithMessage = false,
  placeholder = 'Buscar producto complementario...',
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
  const [options, setOptions] = useState<Option[]>(initialOption ? [initialOption] : [])
  const [searching, setSearching] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const almacenId = useStoreAlmacen((s) => s.almacen_id)
  const justClosedRef = useRef(false)

  useEffect(() => {
    if (initialOption) {
      setOptions((prev) => {
        const exists = prev.some((o) => o.value === initialOption.value)
        return exists ? prev : [initialOption, ...prev]
      })
    }
  }, [initialOption])

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!text || text.length < 1) {
        setOptions(initialOption ? [initialOption] : [])
        return
      }

      debounceRef.current = setTimeout(async () => {
        if (!almacenId) return
        setSearching(true)
        try {
          const res = await productosApiV2.getAllByAlmacen({
            almacen_id: almacenId!,
            search: text,
            per_page: 50,
          })
          const productos = res.data?.data ?? []
          const newOpts: Option[] = productos.map((p: any) => ({
            value: p.id,
            label: `${p.cod_producto} - ${p.name}`,
          }))
          setOptions(newOpts)
        } catch {
          setOptions([])
        } finally {
          setSearching(false)
        }
      }, 300)
    },
    [almacenId, initialOption]
  )

  const handleSelectFromModal = useCallback(
    (producto: Producto) => {
      const newOption: Option = {
        value: producto.id,
        label: `${producto.cod_producto} - ${producto.name}`,
      }
      setOptions((prev) => {
        const exists = prev.some((o) => o.value === newOption.value)
        return exists ? prev : [newOption, ...prev]
      })
      onChange?.(producto.id, producto)
      setModalOpen(false)
      justClosedRef.current = true
      setTimeout(() => {
        justClosedRef.current = false
      }, 300)
    },
    [onChange]
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setModalOpen(true)
    }
  }, [])

  const selectEl = (
    <>
      <Select
        showSearch
        allowClear
        filterOption={false}
        onSearch={handleSearch}
        loading={searching}
        placeholder={placeholder}
        options={options}
        size="small"
        style={{ width: '100%' }}
        onChange={(val) => onChange?.(val ?? undefined)}
        notFoundContent={searching ? 'Buscando...' : 'Presiona Enter para búsqueda avanzada'}
        onInputKeyDown={handleKeyDown}
      />
      <ModalProductoComplementarioSearch
        open={modalOpen}
        setOpen={(open) => {
          setModalOpen(open)
          if (!open) {
            justClosedRef.current = true
            setTimeout(() => {
              justClosedRef.current = false
            }, 300)
          }
        }}
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
            ? [...prefix_array_name, ...(Array.isArray(formItemProps.name) ? formItemProps.name : [formItemProps.name])]
            : formItemProps.name
        }
        style={{ marginBottom: 0, width: '100%' }}
        help={formWithMessage ? undefined : ''}
        validateStatus={formWithMessage ? undefined : ''}
      >
        {selectEl}
      </Form.Item>
    )
  }

  return selectEl
}

