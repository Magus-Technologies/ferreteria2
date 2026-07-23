import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { GiMoneyStack, GiPayMoney, GiReceiveMoney, GiTakeMyMoney } from 'react-icons/gi'
import { FaFileInvoiceDollar, FaHandHoldingDollar } from 'react-icons/fa6'
import { FaExchangeAlt, FaBalanceScale, FaHistory } from 'react-icons/fa'

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
      <ButtonNav
        path='/ui/gestion-contable-y-financiera/ventas-por-cobrar'
        colorActive='text-rose-700'
      >
        <FaHandHoldingDollar />
        Ventas por Cobrar
      </ButtonNav>
      <ButtonNav
        path='/ui/gestion-contable-y-financiera/comisiones'
        colorActive='text-rose-700'
      >
        <GiTakeMyMoney />
        Comisiones
      </ButtonNav>
      <ButtonNav
        path='/ui/gestion-contable-y-financiera/movimientos-caja'
        colorActive='text-rose-700'
      >
        <FaExchangeAlt />
        Movimientos de Caja
      </ButtonNav>
      <ButtonNav
        path='/ui/gestion-contable-y-financiera/arqueos-diarios'
        colorActive='text-rose-700'
      >
        <FaBalanceScale />
        Arqueos Diarios
      </ButtonNav>
      <ButtonNav
        path='/ui/gestion-contable-y-financiera/mis-aperturas-cierres'
        colorActive='text-rose-700'
      >
        <FaHistory />
        Mis Aperturas y Cierres
      </ButtonNav>
    </BaseNav>
  )
}
