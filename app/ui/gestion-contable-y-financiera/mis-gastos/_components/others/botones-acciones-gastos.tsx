'use client'

import { FaPlus, FaPrint, FaTimes, FaSignOutAlt } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function BotonesAccionesGastos() {
  const handleAgregar = () => {
    console.log('Agregar nuevo gasto')
    // Implementar modal para agregar gasto
  }

  const handleImprimir = () => {
    console.log('Imprimir gastos')
    // Implementar funcionalidad de impresión
  }

  const handleAnularGastos = () => {
    console.log('Anular gastos')
    // Implementar funcionalidad para anular gastos
  }

  const handleSalir = () => {
    console.log('Salir')
    // Implementar navegación de salida
  }

  return (
    <div className='flex items-center gap-2 p-4 bg-gray-50 border-t'>
      <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-agregar' label='Botón Agregar'>
        <ButtonBase
          onClick={handleAgregar}
          className='bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white flex items-center gap-2'
        >
          <FaPlus />
          Agregar
        </ButtonBase>
      </ConfigurableElement>

      <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-imprimir' label='Botón Imprimir'>
        <ButtonBase
          onClick={handleImprimir}
          className='bg-gray-600 hover:bg-gray-700 border-gray-600 hover:border-gray-700 text-white flex items-center gap-2'
        >
          <FaPrint />
          Imprimir
        </ButtonBase>
      </ConfigurableElement>

      <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-anular' label='Botón Anular Gastos'>
        <ButtonBase
          onClick={handleAnularGastos}
          className='bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700 text-white flex items-center gap-2'
        >
          <FaTimes />
          Anular Gastos
        </ButtonBase>
      </ConfigurableElement>

      <div className='ml-auto'>
        <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-salir' label='Botón Salir'>
          <ButtonBase
            onClick={handleSalir}
            className='bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white flex items-center gap-2'
          >
            <FaSignOutAlt />
            Salir
          </ButtonBase>
        </ConfigurableElement>
      </div>
    </div>
  )
}