'use client'

import { Select, Spin } from 'antd'
import { useState } from 'react'
import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import { usePaquetes } from '~/hooks/use-paquetes'
import { useDebounce } from 'use-debounce'
import type { Paquete } from '~/lib/api/paquete'

interface SelectPaquetesProps {
  placeholder?: string
  className?: string
  classNameIcon?: string
  sizeIcon?: number
  onSelect?: (paquete: Paquete) => void
  onOpenModal?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

/**
 * Select para buscar y seleccionar paquetes
 * 
 * Características:
 * - Búsqueda en tiempo real con debounce
 * - Ícono de lupa para abrir modal de búsqueda avanzada
 * - Muestra nombre y cantidad de productos
 * - Al seleccionar, ejecuta callback con paquete completo
 */
export default function SelectPaquetes({
  placeholder = 'Buscar Paquete...',
  className = '',
  classNameIcon = 'text-cyan-600',
  sizeIcon = 18,
  onSelect,
  onOpenModal,
  disabled = false,
  autoFocus = false,
}: SelectPaquetesProps) {
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch] = useDebounce(searchText, 300)

  // Buscar paquetes activos
  const { data, isLoading } = usePaquetes({
    search: debouncedSearch,
    activo: true,
    per_page: 20,
  })

  const paquetes = data?.data || []

  const handleSelect = (paqueteId: number | null) => {
    if (!paqueteId) return
    
    const paquete = paquetes.find(p => p.id === paqueteId)
    if (paquete && onSelect) {
      onSelect(paquete)
      // Limpiar selección después de agregar
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
        value={null} // Siempre null para que se pueda seleccionar el mismo paquete múltiples veces
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
              No se encontraron paquetes
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Escribe para buscar paquetes
            </div>
          )
        }
        suffixIcon={
          <FaBoxOpen className={classNameIcon} size={sizeIcon} />
        }
        options={paquetes.map(paquete => ({
          value: paquete.id,
          label: (
            <div className="flex justify-between items-center">
              <span className="font-medium">{paquete.nombre}</span>
              <span className="text-xs text-gray-500 ml-2">
                {paquete.productos_count || paquete.productos.length} productos
              </span>
            </div>
          ),
          // Para el filtro de búsqueda
          searchLabel: paquete.nombre,
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

