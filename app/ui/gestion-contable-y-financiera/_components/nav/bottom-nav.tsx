import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from 'react-icons/gi'

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass='bg-rose-700'
    >
      <ButtonNav colorActive='text-rose-700'>
        <GiReceiveMoney />
        Mis Ingresos
      </ButtonNav>
      <ButtonNav colorActive='text-rose-700'>
        <GiPayMoney />
        Mis Gastos
      </ButtonNav>
      <ButtonNav colorActive='text-rose-700'>
        <GiMoneyStack />
        Mis Ganancias
      </ButtonNav>
    </BaseNav>
  )
}
