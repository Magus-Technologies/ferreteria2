import { MdSpaceDashboard } from 'react-icons/md'
import { FaBoxOpen, FaClipboardList } from 'react-icons/fa'
import { FaCartShopping } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { IoMdContact } from 'react-icons/io'
import { MenuProps } from 'antd'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'

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
    <BaseNav className={className} bgColorClass='bg-emerald-600'>
      <ButtonNav
        path='/ui/gestion-comercial-e-inventario'
        colorActive='text-emerald-600'
      >
        <MdSpaceDashboard />
        Dashboard
      </ButtonNav>

      <DropdownBase menu={{ items: itemsInventario }}>
        <ButtonNav withIcon={false} colorActive='text-emerald-600'>
          <FaBoxOpen />
          Inventario
        </ButtonNav>
      </DropdownBase>
      <DropdownBase menu={{ items: itemsCompras }}>
        <ButtonNav withIcon={false} colorActive='text-emerald-600'>
          <FaCartShopping />
          Compras
        </ButtonNav>
      </DropdownBase>
      <ButtonNav
        path='/ui/gestion-comercial-e-inventario/kardex'
        colorActive='text-emerald-600'
      >
        <FaClipboardList />
        Kardex
      </ButtonNav>
      <DropdownBase menu={{ items: itemsContactos }}>
        <ButtonNav withIcon={false} colorActive='text-emerald-600'>
          <IoMdContact />
          Contactos
        </ButtonNav>
      </DropdownBase>
    </BaseNav>
  )
}
