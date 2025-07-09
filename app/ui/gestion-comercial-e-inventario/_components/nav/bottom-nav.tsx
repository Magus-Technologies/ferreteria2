import { FaCalculator, FaCartShopping, FaWarehouse } from 'react-icons/fa6'
import ButtonNav from './button-nav'
import { BiTransferAlt } from 'react-icons/bi'
import { MdOutlinePendingActions } from 'react-icons/md'
import { FaTruck } from 'react-icons/fa'
import BaseNav from '~/components/nav/base-nav'

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav className={className} withDropdownUser={false}>
      <ButtonNav>
        <FaWarehouse />
        Mi Almacén
      </ButtonNav>
      <ButtonNav>
        <BiTransferAlt />
        Mis Transferencias
      </ButtonNav>
      <ButtonNav>
        <FaCalculator />
        Cuadres
      </ButtonNav>
      <ButtonNav>
        <FaCartShopping />
        Mis Compras
      </ButtonNav>
      <ButtonNav>
        <MdOutlinePendingActions />
        Mis Ordenes de Compra
      </ButtonNav>
      <ButtonNav>
        <FaTruck />
        Mis Proveedores
      </ButtonNav>
    </BaseNav>
  )
}
