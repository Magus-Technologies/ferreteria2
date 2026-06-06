'use client'

import { Suspense, lazy, useState } from 'react'
import { Spin, Tabs } from 'antd'
import { FaUserPlus, FaUsers, FaTruck, FaUserShield, FaSitemap } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import ModalUsuarioForm from './_components/modals/modal-usuario-form'
import { Usuario } from '~/lib/api/usuarios'
import TabVehiculos from '../registros/_components/tabs/tab-vehiculos'
import TabRoles from './_components/tabs/tab-roles'
import TabCargos from './_components/tabs/tab-cargos'

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
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)

  const handleUsuarioSelect = (usuario: Usuario | null) => {
    setUsuarioSeleccionado(usuario)
  }

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

        <Tabs
          defaultActiveKey='usuarios'
          className='mt-2'
          items={[
            {
              key: 'usuarios',
              label: <span className='flex items-center gap-2'><FaUsers /> Usuarios</span>,
              children: (
                <>
                  <div className='mt-4 w-full'>
                    <Suspense fallback={<ComponentLoading />}>
                      <TableUsuarios onUsuarioSelect={handleUsuarioSelect} />
                    </Suspense>
                  </div>
                  <div className='mt-6 w-full'>
                    <Suspense fallback={<ComponentLoading />}>
                      <TableInfoUsuario usuario={usuarioSeleccionado} />
                    </Suspense>
                  </div>
                </>
              ),
            },
            {
              key: 'roles',
              label: <span className='flex items-center gap-2'><FaUserShield /> Roles</span>,
              children: <TabRoles />,
            },
            {
              key: 'cargos',
              label: <span className='flex items-center gap-2'><FaSitemap /> Cargos</span>,
              children: <TabCargos />,
            },
            {
              key: 'vehiculos',
              label: <span className='flex items-center gap-2'><FaTruck /> Vehículos</span>,
              children: <TabVehiculos />,
            },
          ]}
        />
      </div>

      <ModalUsuarioForm
        open={openModal}
        setOpen={setOpenModal}
        usuarioEdit={null}
      />
    </ContenedorGeneral>
  )
}
