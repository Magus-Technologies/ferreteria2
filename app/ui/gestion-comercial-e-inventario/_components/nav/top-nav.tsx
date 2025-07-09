import { MdSpaceDashboard } from 'react-icons/md'
import ButtonNav from './button-nav'
import { FaBoxOpen, FaClipboardList } from 'react-icons/fa'
import { FaCartShopping } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { IoMdContact } from 'react-icons/io'
import { MenuProps } from 'antd'
import BaseNav from '~/components/nav/base-nav'

const itemsInventario: MenuProps['items'] = [
  {
    key: '1',
    label: 'Crear Producto',
  },
  {
    key: '2',
    label: 'Transferir Stock',
  },
]

const itemsCompras: MenuProps['items'] = [
  {
    key: '1',
    label: 'Crear Compra',
  },
  {
    key: '2',
    label: 'Crear Orden de Compra',
  },
]

const itemsContactos: MenuProps['items'] = [
  {
    key: '1',
    label: 'Crear Proveedor',
  },
]

export default function TopNav({ className }: { className?: string }) {
  return (
    <BaseNav className={className}>
      <ButtonNav path='/ui/gestion-comercial-e-inventario'>
        <MdSpaceDashboard />
        Dashboard
      </ButtonNav>

      <DropdownBase menu={{ items: itemsInventario }}>
        <ButtonNav withIcon={false}>
          <FaBoxOpen />
          Inventario
        </ButtonNav>
      </DropdownBase>
      <DropdownBase menu={{ items: itemsCompras }}>
        <ButtonNav withIcon={false}>
          <FaCartShopping />
          Compras
        </ButtonNav>
      </DropdownBase>
      <ButtonNav path='/ui/gestion-comercial-e-inventario/kardex'>
        <FaClipboardList />
        Kardex
      </ButtonNav>
      <DropdownBase menu={{ items: itemsContactos }}>
        <ButtonNav withIcon={false}>
          <IoMdContact />
          Contactos
        </ButtonNav>
      </DropdownBase>
    </BaseNav>
  )
}
