'use client'

import { Suspense, lazy, useState } from 'react'
import { Spin } from 'antd'
import { FaUserPlus, FaUsers } from 'react-icons/fa'
import { MdSecurity } from 'react-icons/md'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import ModalUsuarioForm from './_components/modals/modal-usuario-form'
import ModalAsignarPermisos from './_components/modals/modal-asignar-permisos'
import { Usuario } from '~/lib/api/usuarios'

// Lazy loading de componentes pesados
const TableUsuarios = lazy(() => import('./_components/tables/table-usuarios'))
const TableInfoUsuario = lazy(() => import('./_components/tables/table-info-usuario'))

// Componente de loading
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function UsuariosPage() {
  const [openModal, setOpenModal] = useState(false)
  const [openPermisosModal, setOpenPermisosModal] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)

  const handleUsuarioSelect = (usuario: Usuario | null) => {
    setUsuarioSeleccionado(usuario)
  }

  const handleAsignarPermisos = () => {
    if (usuarioSeleccionado) {
      setOpenPermisosModal(true)
    }
  }

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <TituloModulos
          title='Gestión de Usuarios'
          icon={<FaUsers className='text-blue-600' />}
        >
          <div className="flex gap-2">
            {usuarioSeleccionado && (
              <ButtonBase
                color='warning'
                size='md'
                onClick={handleAsignarPermisos}
                className='flex items-center gap-2'
              >
                <MdSecurity size={18} />
                Asignar Permisos
              </ButtonBase>
            )}
            <ButtonBase
              color='success'
              size='md'
              onClick={() => setOpenModal(true)}
              className='flex items-center gap-2'
            >
              <FaUserPlus />
              Crear Usuario
            </ButtonBase>
          </div>
        </TituloModulos>

        {/* Tabla principal de usuarios */}
        <div className='mt-4 w-full'>
          <Suspense fallback={<ComponentLoading />}>
            <TableUsuarios onUsuarioSelect={handleUsuarioSelect} />
          </Suspense>
        </div>

        {/* Tabla de información del usuario seleccionado */}
        <div className='mt-6 w-full'>
          <Suspense fallback={<ComponentLoading />}>
            <TableInfoUsuario usuario={usuarioSeleccionado} />
          </Suspense>
        </div>
      </div>

      <ModalUsuarioForm
        open={openModal}
        setOpen={setOpenModal}
        usuarioEdit={null}
      />

      <ModalAsignarPermisos
        open={openPermisosModal}
        setOpen={setOpenPermisosModal}
        userId={usuarioSeleccionado?.id || ''}
        userName={usuarioSeleccionado?.name || ''}
      />
    </ContenedorGeneral>
  )
}
