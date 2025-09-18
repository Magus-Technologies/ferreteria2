'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Prisma, Proveedor } from '@prisma/client'
import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import { SearchProveedor } from '~/app/_actions/proveedor'
import ButtonCreateProveedor from '../buttons/button-create-proveedor'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalProveedorSearch from '../../modals/modal-proveedor-search'

interface SelectProveedoresProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectProveedores({
  placeholder = 'Buscar Proveedor',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  ...props
}: SelectProveedoresProps) {
  const selectProveedoresRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalProveedorSearch, setOpenModalProveedorSearch] =
    useState(false)

  const [value] = useDebounce(text, 1000)

  const [proveedorCreado, setProveedorCreado] = useState<Proveedor>()

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
      refetch()
    }
  }, [value, refetch])

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectProveedoresRef}
        showSearch
        filterOption={false}
        onSearch={setText}
        prefix={<FaBoxOpen className={classNameIcon} size={sizeIcon} />}
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
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 -ml-[4.5rem] ${
          showButtonCreate ? 'mr-10' : ''
        } cursor-pointer z-10`}
        size={15}
        onClick={() => setOpenModalProveedorSearch(true)}
      />
      <ModalProveedorSearch
        open={openModalProveedorSearch}
        setOpen={setOpenModalProveedorSearch}
        onOk={() => {}}
        textDefault={textDefault}
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
