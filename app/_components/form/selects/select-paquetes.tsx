'use client'

import { useEffect, useRef, useState } from 'react'
import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import SelectBase, { RefSelectBaseProps } from './select-base'
import ModalBuscarPaquete from '../../modals/modal-buscar-paquete'
import { useStorePaqueteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-paquete-seleccionado'
import type { Paquete } from '~/lib/api/paquete'

interface SelectPaquetesProps {
  placeholder?: string
  className?: string
  classNameIcon?: string
  sizeIcon?: number
  onSelect?: (paquete: Paquete) => void
  disabled?: boolean
  autoFocus?: boolean
}

/**
 * Select para buscar paquetes — funciona igual que SelectProductos:
 * - El dropdown NO se abre al hacer click
 * - Se escribe texto y al presionar Enter se abre el modal de búsqueda
 * - Ícono de lupa para abrir modal manualmente
 */
export default function SelectPaquetes({
  placeholder = 'Buscar Paquete...',
  className = '',
  classNameIcon = 'text-cyan-600',
  sizeIcon = 18,
  onSelect,
  disabled = false,
  autoFocus = false,
}: SelectPaquetesProps) {
  const selectRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')
  const [textDefault, setTextDefault] = useState('')
  const [openModal, setOpenModal] = useState(false)

  const paqueteSeleccionadoStore = useStorePaqueteSeleccionado(
    (store) => store.paquete
  )

  // Aplicar autoFocus
  useEffect(() => {
    if (autoFocus && selectRef.current) {
      const timer = setTimeout(() => {
        selectRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  function handleSelect({ data }: { data?: Paquete } = {}) {
    const paquete = data || paqueteSeleccionadoStore
    if (paquete && onSelect) {
      onSelect(paquete)
      setText('')
      setOpenModal(false)
    }
  }

  return (
    <>
      <SelectBase
        ref={selectRef}
        showSearch
        uppercase={true}
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaBoxOpen className={classNameIcon} size={sizeIcon} />}
        variant='filled'
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        open={false}
        options={[]}
        onKeyUp={(e) => {
          if (e.key === 'Enter' && text) {
            setTextDefault(text)
            setOpenModal(true)
          }
        }}
      />
      <FaSearch
        className='text-yellow-600 mb-7 cursor-pointer min-w-fit'
        size={15}
        onClick={() => {
          setTextDefault(text)
          setOpenModal(true)
        }}
      />
      <ModalBuscarPaquete
        open={openModal}
        setOpen={setOpenModal}
        textDefault={textDefault}
        onOk={() => handleSelect()}
        onRowDoubleClicked={handleSelect}
      />
    </>
  )
}
