import { FaCalculator, FaCartShopping, FaWarehouse } from 'react-icons/fa6'
import { BiTransferAlt } from 'react-icons/bi'
import { MdOutlinePendingActions } from 'react-icons/md'
import { FaTruck } from 'react-icons/fa'
import BaseNav from '~/components/nav/base-nav'
import ButtonNav from '~/components/nav/button-nav'

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass='bg-emerald-600'
    >
      <ButtonNav colorActive='text-emerald-600'>
        <FaWarehouse />
        Mi Almacén
      </ButtonNav>
      <ButtonNav colorActive='text-emerald-600'>
        <BiTransferAlt />
        Mis Transferencias
      </ButtonNav>
      <ButtonNav colorActive='text-emerald-600'>
        <FaCalculator />
        Cuadres
      </ButtonNav>
      <ButtonNav colorActive='text-emerald-600'>
        <FaCartShopping />
        Mis Compras
      </ButtonNav>
      <ButtonNav colorActive='text-emerald-600'>
        <MdOutlinePendingActions />
        Mis Ordenes de Compra
      </ButtonNav>
      <ButtonNav colorActive='text-emerald-600'>
        <FaTruck />
        Mis Proveedores
      </ButtonNav>
    </BaseNav>
  )
}
