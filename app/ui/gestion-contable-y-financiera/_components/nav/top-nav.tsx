'use client'
import { MdSpaceDashboard } from 'react-icons/md'
import { FaClipboardList } from 'react-icons/fa'
import { FaCartShopping, FaMoneyBillTrendUp } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { MenuProps } from 'antd'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { useRouter } from 'next/navigation'


export default function TopNav({ className }: { className?: string }) {
  const router = useRouter()

const itemsVentas: MenuProps['items'] = [
  {
    key: '1',
    label: 'Ventas por Cobrar',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/ventas-por-cobrar')
    }
  },
  {
    key: '2',
    label: 'Ingresos',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/ingresos')
    }
  },
  {
    key: '3',
    label: 'Gastos',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/gastos')
    }
  },
]

const itemsCompras: MenuProps['items'] = [
  {
    key: '1',
    label: 'Compras por Pagar',
  },
]
  return (
    <BaseNav className={className} bgColorClass='bg-rose-700'>
      <ButtonNav
        path='/ui/gestion-contable-y-financiera'
        colorActive='text-rose-700'
      >
        <MdSpaceDashboard />
        Dashboard
      </ButtonNav>

      <DropdownBase menu={{ items: itemsVentas }}>
        <ButtonNav withIcon={false} colorActive='text-rose-700'>
          <FaCartShopping />
          Ventas
        </ButtonNav>
      </DropdownBase>
      <DropdownBase menu={{ items: itemsCompras }}>
        <ButtonNav withIcon={false} colorActive='text-rose-700'>
          <FaMoneyBillTrendUp />
          Compras
        </ButtonNav>
      </DropdownBase>
      <ButtonNav
        path='/ui/gestion-comercial-e-inventario/mi-almacen'
        colorActive='text-emerald-600'
      >
        <FaClipboardList />
        Kardex
      </ButtonNav>
    </BaseNav>
  )
}
