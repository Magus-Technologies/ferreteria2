import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import { FaFileInvoiceDollar } from 'react-icons/fa6'

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass='bg-rose-700'
    >
      <ButtonNav 
        path='/ui/gestion-contable-y-financiera/mis-ingresos'
        colorActive='text-rose-700'
      >
        <GiReceiveMoney />
        Mis Ingresos
      </ButtonNav>
      <ButtonNav 
        path='/ui/gestion-contable-y-financiera/mis-gastos'
        colorActive='text-rose-700'
      >
        <GiPayMoney />
        Mis Gastos
      </ButtonNav>
      <ButtonNav 
        path='/ui/gestion-contable-y-financiera/mis-ganancias'
        colorActive='text-rose-700'
      >
        <GiMoneyStack />
        Mis Ganancias
      </ButtonNav>
      <ButtonNav 
        path='/ui/gestion-contable-y-financiera/compras-por-pagar'
        colorActive='text-rose-700'
      >
        <FaFileInvoiceDollar />
        Mis compras por pagar
      </ButtonNav>
    </BaseNav>
  )
}
