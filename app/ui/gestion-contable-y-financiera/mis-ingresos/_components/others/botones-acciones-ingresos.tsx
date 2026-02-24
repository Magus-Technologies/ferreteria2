'use client'

import { FaPlus } from 'react-icons/fa'
import { useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ModalCrearIngresoExtra from './modal-crear-ingreso-extra'

export default function BotonesAccionesIngresos() {
  const [openCrear, setOpenCrear] = useState(false)

  const handleAgregar = () => {
    setOpenCrear(true)
  }

  return (
    <div className='flex items-center gap-2 p-4 bg-gray-50 border-t'>
      <ConfigurableElement componentId='gestion-contable.mis-Ingresos.boton-agregar' label='Botón Agregar'>
        <ButtonBase
          onClick={handleAgregar}
          className='bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white flex items-center gap-2'
        >
          <FaPlus />
          Agregar
        </ButtonBase>
      </ConfigurableElement>



      <ModalCrearIngresoExtra
        open={openCrear}
        onClose={() => setOpenCrear(false)}
      />
    </div>
  )
}
