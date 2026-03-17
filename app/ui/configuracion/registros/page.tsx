'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TabsRegistros from './_components/tabs-registros'

export default function RegistrosPage() {
  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <h1 className='text-2xl font-bold mb-6'>Registros y Catálogos</h1>
        <TabsRegistros />
      </div>
    </ContenedorGeneral>
  )
}
