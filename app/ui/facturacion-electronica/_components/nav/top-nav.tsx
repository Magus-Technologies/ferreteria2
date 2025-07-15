import { MdSpaceDashboard } from 'react-icons/md'
import { FaClipboardList } from 'react-icons/fa'
import { FaCartShopping, FaMoneyBillTrendUp } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { IoMdContact } from 'react-icons/io'
import { MenuProps } from 'antd'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'

const itemsVentas: MenuProps['items'] = [
  {
    key: '1',
    label: 'Crear Venta',
  },
  {
    key: '2',
    label: 'Crear Cotizacion',
  },
  {
    key: '3',
    label: 'Prestar / Pedir',
  },
  {
    key: '4',
    label: 'Crear Guía',
  },
  {
    key: '5',
    label: 'Crear Nota de Crédito',
  },
  {
    key: '6',
    label: 'Crear Nota de Débito',
  },
  {
    key: '7',
    label: 'Envíos a Sunat',
  },
]

const itemsFinanzas: MenuProps['items'] = [
  {
    key: '1',
    label: 'Aperturar Caja',
  },
  {
    key: '2',
    label: 'Cerrar Caja',
  },
  {
    key: '3',
    label: 'Crear Ingreso',
  },
  {
    key: '4',
    label: 'Crear Gasto',
  },
]

export default function TopNav({ className }: { className?: string }) {
  return (
    <BaseNav className={className} bgColorClass='bg-amber-600'>
      <ButtonNav
        path='/ui/facturacion-electronica'
        colorActive='text-amber-600'
      >
        <MdSpaceDashboard />
        Dashboard
      </ButtonNav>

      <DropdownBase menu={{ items: itemsVentas }}>
        <ButtonNav withIcon={false} colorActive='text-amber-600'>
          <FaCartShopping />
          Ventas
        </ButtonNav>
      </DropdownBase>
      <ButtonNav colorActive='text-amber-600'>
        <IoMdContact />
        Crear Contacto
      </ButtonNav>
      <DropdownBase menu={{ items: itemsFinanzas }}>
        <ButtonNav withIcon={false} colorActive='text-amber-600'>
          <FaMoneyBillTrendUp />
          Finanzas
        </ButtonNav>
      </DropdownBase>
      <ButtonNav
        path='/ui/gestion-comercial-e-inventario/kardex'
        colorActive='text-emerald-600'
      >
        <FaClipboardList />
        Kardex
      </ButtonNav>
    </BaseNav>
  )
}
