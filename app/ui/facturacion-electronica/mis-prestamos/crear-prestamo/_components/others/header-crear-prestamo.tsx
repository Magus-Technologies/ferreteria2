'use client'

import { MdAccountBalance } from 'react-icons/md'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export default function HeaderCrearPrestamo() {
  const { can } = usePermissionHook()

  return (
    <TituloModulos
      title='Crear Préstamo'
      icon={<MdAccountBalance className='text-amber-600' />}
      extra={
        <div className='pl-0 lg:pl-8 flex items-center gap-2 lg:gap-4 w-full lg:w-auto'>
          <SelectProductos
            autoFocus
            allowClear
            size='large'
            className='w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px] font-normal!'
            classNameIcon='text-amber-600 mx-1'
            classIconSearch='!mb-0'
            classIconPlus='mb-0!'
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProductoPrestamo
            showUltimasCompras={false}
            placeholder='Buscar productos para agregar al préstamo'
          />
        </div>
      }
    />
  )
}
