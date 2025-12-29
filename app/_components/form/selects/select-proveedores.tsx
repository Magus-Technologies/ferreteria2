'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import ButtonCreateProveedor from '../buttons/button-create-proveedor'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import ModalProveedorSearch from '../../modals/modal-proveedor-search'
import { useStoreProveedorSeleccionado } from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado'
import { FaTruck } from 'react-icons/fa6'
import type { Proveedor } from '~/lib/api/proveedor'
import useGetProveedores from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/_hooks/use-get-proveedores'
import { useDebounce } from 'use-debounce'

interface SelectProveedoresProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, proveedor?: Proveedor) => void
  showButtonCreate?: boolean
  classIconSearch?: string
  classIconCreate?: string
  proveedorOptionsDefault?: Pick<Proveedor, 'id' | 'ruc' | 'razon_social'>[]
}

export default function SelectProveedores({
  placeholder = 'Buscar Proveedor',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  classIconSearch = '',
  classIconCreate = '',
  proveedorOptionsDefault = [],
  onChange,
  ...props
}: SelectProveedoresProps) {
  const selectProveedoresRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalProveedorSearch, setOpenModalProveedorSearch] =
    useState(false)

  const [proveedorCreado, setProveedorCreado] = useState<Proveedor>()
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<Proveedor>()

  const proveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.proveedor
  )
  const setProveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  function handleSelect({ data }: { data?: Proveedor } = {}) {
    setText('')
    const proveedor = data || proveedorSeleccionadoStore
    if (proveedor) {
      setProveedorSeleccionado(proveedor)
      iterarChangeValue({
        refObject: selectProveedoresRef,
        value: proveedor.id,
      })
      setProveedorSeleccionadoStore(undefined)
      setOpenModalProveedorSearch(false)
      onChange?.(proveedor.id, proveedor)
    }
  }

  const [value] = useDebounce(text, 1000)

  const { response, loading } = useGetProveedores({ value })

  useEffect(() => {
    if (response && response.length === 1) handleSelect({ data: response[0] })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectProveedoresRef}
        showSearch
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        options={[
          ...(proveedorCreado
            ? [
                {
                  value: proveedorCreado.id,
                  label: `${proveedorCreado.ruc} : ${proveedorCreado.razon_social}`,
                },
              ]
            : []),
          ...(proveedorSeleccionado
            ? [
                {
                  value: proveedorSeleccionado.id,
                  label: `${proveedorSeleccionado.ruc} : ${proveedorSeleccionado.razon_social}`,
                },
              ]
            : []),
          ...proveedorOptionsDefault.map(proveedor => ({
            value: proveedor.id,
            label: `${proveedor.ruc} : ${proveedor.razon_social}`,
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalProveedorSearch(true)
        }}
        open={false}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalProveedorSearch(true)}
      />
      <ModalProveedorSearch
        open={openModalProveedorSearch}
        setOpen={setOpenModalProveedorSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
      />
      {showButtonCreate && (
        <ButtonCreateProveedor
          onSuccess={res => {
            setProveedorCreado(res)
            iterarChangeValue({
              refObject: selectProveedoresRef,
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
