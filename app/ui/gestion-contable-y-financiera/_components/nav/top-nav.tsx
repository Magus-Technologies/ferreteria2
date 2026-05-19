'use client'
import { MdSpaceDashboard } from 'react-icons/md'
import { FaClipboardList } from 'react-icons/fa'
import { FaCartShopping } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { MenuProps } from 'antd'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { useState } from 'react'
import ModalCrearIngresoExtra from '../../mis-ingresos/_components/others/modal-crear-ingreso-extra'
import ModalCrearGastoExtra from '../../mis-gastos/_components/others/modal-crear-gasto-extra'


export default function TopNav({ className }: { className?: string }) {
  const [openIngresoExtra, setOpenIngresoExtra] = useState(false)
  const [openGastoExtra, setOpenGastoExtra] = useState(false)

const itemsVentas: MenuProps['items'] = [
  {
    key: '2',
    label: 'Ingresos',
    onClick: () => {
      setOpenIngresoExtra(true)
    }
  },
  {
    key: '3',
    label: 'Gastos',
    onClick: () => {
      setOpenGastoExtra(true)
    }
  },
]

  return (
    <>
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
        <ButtonNav
          path='/ui/gestion-contable-y-financiera/kardex-finanzas'
          colorActive='text-rose-700'
        >
          <FaClipboardList />
          Kardex
        </ButtonNav>
      </BaseNav>

      <ModalCrearIngresoExtra
        open={openIngresoExtra}
        onClose={() => setOpenIngresoExtra(false)}
      />
      <ModalCrearGastoExtra
        open={openGastoExtra}
        onClose={() => setOpenGastoExtra(false)}
      />
    </>
  )
}
