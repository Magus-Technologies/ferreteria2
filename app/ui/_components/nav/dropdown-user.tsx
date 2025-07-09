import { MenuProps } from 'antd'
import { FaSignOutAlt } from 'react-icons/fa'
import DropdownBase from '~/components/dropdown/dropdown-base'

const items: MenuProps['items'] = [
  {
    key: '1',
    label: 'Cambiar Contraseña',
  },
  {
    key: '2',
    label: 'Cerrar Sesión',
    className: '!text-red-500',
    extra: <FaSignOutAlt className='text-red-500' />,
  },
]

export default function DropdownUser() {
  return (
    <DropdownBase menu={{ items }}>
      <span className='font-bold'>Hola, Elias</span>
    </DropdownBase>
  )
}
