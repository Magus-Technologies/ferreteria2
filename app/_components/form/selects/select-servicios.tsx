'use client'

import { Select, Spin } from 'antd'
import { useState } from 'react'
import { FaConciergeBell, FaSearch } from 'react-icons/fa'
import { useServicios } from '~/hooks/use-servicios'
import { useDebounce } from 'use-debounce'
import type { Servicio } from '~/lib/api/servicios'

interface SelectServiciosProps {
  placeholder?: string
  className?: string
  classNameIcon?: string
  sizeIcon?: number
  onSelect?: (servicio: Servicio) => void
  onOpenModal?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

export default function SelectServicios({
  placeholder = 'Buscar Servicio...',
  className = '',
  classNameIcon = 'text-violet-600',
  sizeIcon = 18,
  onSelect,
  onOpenModal,
  disabled = false,
  autoFocus = false,
}: SelectServiciosProps) {
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch] = useDebounce(searchText, 300)

  const { data, isLoading } = useServicios({
    search: debouncedSearch,
    activo: true,
    per_page: 20,
  })

  const servicios = data?.data || []

  const handleSelect = (servicioId: number | null) => {
    if (!servicioId) return

    const servicio = servicios.find(s => s.id === servicioId)
    if (servicio && onSelect) {
      onSelect(servicio)
      setSearchText('')
    }
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Select
        showSearch
        placeholder={placeholder}
        className={`flex-1 ${className}`}
        size="large"
        value={null}
        searchValue={searchText}
        onSearch={setSearchText}
        onSelect={handleSelect}
        filterOption={false}
        loading={isLoading}
        disabled={disabled}
        autoFocus={autoFocus}
        notFoundContent={
          isLoading ? (
            <div className="flex justify-center py-4">
              <Spin size="small" />
            </div>
          ) : searchText ? (
            <div className="text-center py-4 text-gray-500">
              No se encontraron servicios
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Escribe para buscar servicios
            </div>
          )
        }
        suffixIcon={
          <FaConciergeBell className={classNameIcon} size={sizeIcon} />
        }
        options={servicios.map(servicio => ({
          value: servicio.id,
          label: (
            <div className="flex justify-between items-center">
              <span className="font-medium">{servicio.nombre}</span>
              <span className="text-xs text-gray-500 ml-2">
                S/ {Number(servicio.precio).toFixed(2)}
              </span>
            </div>
          ),
          searchLabel: servicio.nombre,
        }))}
      />

      {onOpenModal && (
        <FaSearch
          className="text-yellow-600 cursor-pointer hover:text-yellow-700 transition-colors"
          size={18}
          onClick={onOpenModal}
          title="Búsqueda avanzada"
        />
      )}
    </div>
  )
}
