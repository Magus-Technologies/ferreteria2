'use client'

import { Suspense, lazy, useState } from 'react'
import { Spin } from 'antd'
import { FaUserPlus, FaUsers } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import ModalUsuarioForm from './_components/modals/modal-usuario-form'

// Lazy loading de componentes pesados
const TableUsuarios = lazy(() => import('./_components/tables/table-usuarios'))

// Componente de loading
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function UsuariosPage() {
  const [openModal, setOpenModal] = useState(false)

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <TituloModulos
          title='Gestión de Usuarios'
          icon={<FaUsers className='text-blue-600' />}
        >
          <ButtonBase
            color='success'
            size='md'
            onClick={() => setOpenModal(true)}
            className='flex items-center gap-2'
          >
            <FaUserPlus />
            Crear Usuario
          </ButtonBase>
        </TituloModulos>

        <div className='mt-4 w-full'>
          <Suspense fallback={<ComponentLoading />}>
            <TableUsuarios />
          </Suspense>
        </div>
      </div>

      <ModalUsuarioForm
        open={openModal}
        setOpen={setOpenModal}
        usuarioEdit={null}
      />
    </ContenedorGeneral>
  )
}
