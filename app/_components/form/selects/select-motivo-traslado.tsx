'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { FaTruckFast } from 'react-icons/fa6'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import ModalMotivoTrasladoSearch from '../../modals/modal-motivo-traslado-search'
import { useStoreMotivoTrasladoSeleccionado } from '~/app/ui/facturacion-electronica/mis-guias/store/store-motivo-traslado-seleccionado'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'
import useGetMotivosTraslado from '~/app/ui/facturacion-electronica/mis-guias/_hooks/use-get-motivos-traslado'
import { useDebounce } from 'use-debounce'
import { FormInstance } from 'antd'

interface SelectMotivoTrasladoProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, motivoTraslado?: MotivoTraslado) => void
  classIconSearch?: string
  motivoTrasladoOptionsDefault?: Pick<MotivoTraslado, 'id' | 'codigo' | 'descripcion'>[]
  form?: FormInstance
}

export default function SelectMotivoTraslado({
  placeholder = 'Buscar Motivo de Traslado',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  classIconSearch = '',
  motivoTrasladoOptionsDefault = [],
  onChange,
  ...props
}: SelectMotivoTrasladoProps) {
  const selectMotivoTrasladoRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')

  const [openModalMotivoTrasladoSearch, setOpenModalMotivoTrasladoSearch] =
    useState(false)

  const [motivoTrasladoSeleccionado, setMotivoTrasladoSeleccionado] =
    useState<MotivoTraslado>()

  const motivoTrasladoSeleccionadoStore = useStoreMotivoTrasladoSeleccionado(
    store => store.motivoTraslado
  )
  const setMotivoTrasladoSeleccionadoStore = useStoreMotivoTrasladoSeleccionado(
    store => store.setMotivoTraslado
  )

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  function handleSelect({ data }: { data?: MotivoTraslado } = {}) {
    const motivoTraslado = data || motivoTrasladoSeleccionadoStore
    if (motivoTraslado) {
      setMotivoTrasladoSeleccionado(motivoTraslado)
      
      // Mostrar el motivo seleccionado en el campo
      const motivoLabel = `${motivoTraslado.codigo} : ${motivoTraslado.descripcion}`
      setText(motivoLabel)
      
      iterarChangeValue({
        refObject: selectMotivoTrasladoRef,
        value: motivoTraslado.id,
      })
      setMotivoTrasladoSeleccionadoStore(undefined)
      setOpenModalMotivoTrasladoSearch(false)
      onChange?.(motivoTraslado.id, motivoTraslado)
    }
  }

  const [value] = useDebounce(text, 300)

  const { response, loading } = useGetMotivosTraslado({ value })

  useEffect(() => {
    // Autoseleccionar si hay exactamente 1 resultado
    // PERO NO si el modal de búsqueda está abierto
    if (response && response.length === 1 && value && !openModalMotivoTrasladoSearch) {
      const motivoTraslado = response[0]
      // Autoseleccionar SOLO si el valor debounced coincide exactamente con el código
      if (motivoTraslado.codigo === value.trim()) {
        handleSelect({ data: motivoTraslado })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, value])

  const getLabel = (motivoTraslado: Pick<MotivoTraslado, 'codigo' | 'descripcion'>) => {
    return `${motivoTraslado.codigo} : ${motivoTraslado.descripcion}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectMotivoTrasladoRef}
        showSearch
        uppercase={true}
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaTruckFast className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        options={[
          ...(motivoTrasladoSeleccionado
            ? [
                {
                  value: motivoTrasladoSeleccionado.id,
                  label: getLabel(motivoTrasladoSeleccionado),
                },
              ]
            : []),
          ...motivoTrasladoOptionsDefault.map(motivoTraslado => ({
            value: motivoTraslado.id,
            label: getLabel(motivoTraslado),
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalMotivoTrasladoSearch(true)
        }}
        open={false}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalMotivoTrasladoSearch(true)}
      />
      <ModalMotivoTrasladoSearch
        open={openModalMotivoTrasladoSearch}
        setOpen={setOpenModalMotivoTrasladoSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
      />
    </div>
  )
}
