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
import { FormInstance } from 'antd'

interface SelectProveedoresProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, proveedor?: Proveedor) => void
  showButtonCreate?: boolean
  classIconSearch?: string
  classIconCreate?: string
  proveedorOptionsDefault?: Pick<Proveedor, 'id' | 'ruc' | 'razon_social'>[]
  showOnlyDocument?: boolean
  form?: FormInstance
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
  showOnlyDocument = false,
  ...props
}: SelectProveedoresProps) {
  const selectProveedoresRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')
  const [lastSelectedDocument, setLastSelectedDocument] = useState('')

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

  // Detectar cuando el usuario modifica el texto y limpiar campos relacionados
  useEffect(() => {
    if (showOnlyDocument && lastSelectedDocument && text !== lastSelectedDocument) {
      // El usuario modificó el RUC de un proveedor ya seleccionado
      if (props.form) {
        props.form.setFieldValue('proveedor_razon_social', '')
      }
      setProveedorSeleccionado(undefined)
      // Limpiar el proveedor_id si el texto no coincide
      iterarChangeValue({
        refObject: selectProveedoresRef,
        value: undefined,
      })
    }
  }, [text, lastSelectedDocument, showOnlyDocument, props.form])

  function handleSelect({ data }: { data?: Proveedor } = {}) {
    const proveedor = data || proveedorSeleccionadoStore
    if (proveedor) {
      setProveedorSeleccionado(proveedor)
      
      // Guardar el RUC seleccionado para detectar cambios
      if (showOnlyDocument && proveedor.ruc) {
        setLastSelectedDocument(proveedor.ruc)
        setText(proveedor.ruc)
      } else {
        setText('')
      }
      
      iterarChangeValue({
        refObject: selectProveedoresRef,
        value: proveedor.id,
      })
      setProveedorSeleccionadoStore(undefined)
      setOpenModalProveedorSearch(false)
      onChange?.(proveedor.id, proveedor)
    }
  }

  const [value] = useDebounce(text, 300) // Reducir de 1000ms a 300ms

  const { response, loading } = useGetProveedores({ value })

  useEffect(() => {
    // Autoseleccionar si hay exactamente 1 resultado
    // PERO NO si el modal de búsqueda está abierto
    if (response && response.length === 1 && value && !openModalProveedorSearch) {
      const proveedor = response[0]
      // Autoseleccionar SOLO si el valor debounced coincide exactamente con el RUC
      if (proveedor.ruc === value.trim()) {
        handleSelect({ data: proveedor })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, value])

  const getLabel = (proveedor: Pick<Proveedor, 'ruc' | 'razon_social'>) => {
    if (showOnlyDocument) {
      return proveedor.ruc
    }
    return `${proveedor.ruc} : ${proveedor.razon_social}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectProveedoresRef}
        showSearch
        uppercase={true}
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
                  label: getLabel(proveedorCreado),
                },
              ]
            : []),
          ...(proveedorSeleccionado
            ? [
                {
                  value: proveedorSeleccionado.id,
                  label: getLabel(proveedorSeleccionado),
                },
              ]
            : []),
          ...proveedorOptionsDefault.map(proveedor => ({
            value: proveedor.id,
            label: getLabel(proveedor),
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') {
            setTextDefault(text || '')
            setOpenModalProveedorSearch(true)
          }
        }}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-1 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => {
          setTextDefault(text || '')
          setOpenModalProveedorSearch(true)
        }}
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
