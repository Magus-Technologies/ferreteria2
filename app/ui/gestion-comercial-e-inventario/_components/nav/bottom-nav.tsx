import { FaCalculator, FaCartShopping, FaWarehouse } from 'react-icons/fa6'
import { BiTransferAlt } from 'react-icons/bi'
import { MdOutlinePendingActions } from 'react-icons/md'
import { FaTruck } from 'react-icons/fa'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass='bg-emerald-600'
    >
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/mi-almacen'
      >
        <FaWarehouse />
        Mi Almacén
      </ButtonNav>
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/mis-transferencias'
      >
        <BiTransferAlt />
        Mis Transferencias
      </ButtonNav>
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/cuadres'
      >
        <FaCalculator />
        Cuadres
      </ButtonNav>
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/mis-compras'
      >
        <FaCartShopping />
        Mis Compras
      </ButtonNav>
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra'
      >
        <MdOutlinePendingActions />
        Mis Ordenes de Compra
      </ButtonNav>
      <ButtonNav
        colorActive='text-emerald-600'
        path='/ui/gestion-comercial-e-inventario/mis-proveedores'
      >
        <FaTruck />
        Mis Proveedores
      </ButtonNav>
    </BaseNav>
  )
}
