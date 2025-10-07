'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Prisma, Proveedor } from '@prisma/client'
import { FaSearch } from 'react-icons/fa'
import { SearchProveedor } from '~/app/_actions/proveedor'
import ButtonCreateProveedor from '../buttons/button-create-proveedor'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalProveedorSearch from '../../modals/modal-proveedor-search'
import { dataEditProveedor } from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/_components/modals/modal-create-proveedor'
import { useStoreProveedorSeleccionado } from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado'
import { FaTruck } from 'react-icons/fa6'

interface SelectProveedoresProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
  classIconSearch?: string
}

export default function SelectProveedores({
  placeholder = 'Buscar Proveedor',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  classIconSearch = '',
  ...props
}: SelectProveedoresProps) {
  const selectProveedoresRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalProveedorSearch, setOpenModalProveedorSearch] =
    useState(false)

  const [value] = useDebounce(text, 1000)

  const [proveedorCreado, setProveedorCreado] = useState<Proveedor>()
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<dataEditProveedor>()

  const proveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.proveedor
  )
  const setProveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  const { response, refetch } = useServerQuery({
    action: SearchProveedor,
    propsQuery: {
      queryKey: [QueryKeys.PROVEEDORES_SEARCH],
      enabled: !!value,
    },
    params: {
      where: {
        OR: [
          {
            razon_social: {
              contains: value,
              mode: 'insensitive',
            },
          },
          {
            ruc: {
              contains: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    } satisfies Prisma.ProveedorFindManyArgs,
  })

  useEffect(() => {
    if (value) {
      setProveedorCreado(undefined)
      setProveedorSeleccionado(undefined)
      refetch()
    }
  }, [value, refetch])

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  function handleSelect({ data }: { data?: dataEditProveedor } = {}) {
    const proveedor = data || proveedorSeleccionadoStore
    if (proveedor) {
      setProveedorSeleccionado(proveedor)
      iterarChangeValue({
        refObject: selectProveedoresRef,
        value: proveedor.id,
      })
      setProveedorSeleccionadoStore(undefined)
      setOpenModalProveedorSearch(false)
    }
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectProveedoresRef}
        showSearch
        filterOption={false}
        onSearch={setText}
        prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={[
          ...(response?.map(item => ({
            value: item.id,
            label: `${item.ruc} : ${item.razon_social}`,
          })) || []),
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
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
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
        />
      )}
    </div>
  )
}
