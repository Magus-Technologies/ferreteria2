'use client'
import { MdSpaceDashboard } from 'react-icons/md'
import { FaClipboardList } from 'react-icons/fa'
import { FaCartShopping, FaCashRegister } from 'react-icons/fa6'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { MenuProps } from 'antd'
import BaseNav from '~/app/_components/nav/base-nav'
import ButtonNav from '~/app/_components/nav/button-nav'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import ModalCrearIngresoExtra from '../../mis-ingresos/_components/others/modal-crear-ingreso-extra'
import ModalCrearGastoExtra from '../../mis-gastos/_components/others/modal-crear-gasto-extra'
import ModalMoverDineroSubCajas from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-mover-dinero-subcajas'
import ModalSolicitarEfectivo from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-solicitar-efectivo'
import ModalTrasladoBoveda from '~/app/ui/facturacion-electronica/mis-aperturas-cierres/_components/modals/modal-traslado-boveda'
import ModalAperturarCaja from '../../gestion-cajas/_components/modal-aperturar-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { fetchCajaActivaOrNull } from '~/lib/api/caja'


export default function TopNav({ className }: { className?: string }) {
  const router = useRouter()
  const [openIngresoExtra, setOpenIngresoExtra] = useState(false)
  const [openGastoExtra, setOpenGastoExtra] = useState(false)
  const [openMoverDinero, setOpenMoverDinero] = useState(false)
  const [openPedirPrestamo, setOpenPedirPrestamo] = useState(false)
  const [openTrasladoBoveda, setOpenTrasladoBoveda] = useState(false)
  const [openAperturarCaja, setOpenAperturarCaja] = useState(false)
  const [openCerrarCaja, setOpenCerrarCaja] = useState(false)

  // Obtener caja activa (necesaria para Pedir Préstamo y Traslado a Bóveda)
  const { data: cajaActiva } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: () => fetchCajaActivaOrNull(),
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
  })

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

const itemsCaja: MenuProps['items'] = [
  {
    key: 'aperturar-caja',
    label: 'Aperturar Caja',
    disabled: !!cajaActiva,
    onClick: () => {
      setOpenAperturarCaja(true)
    }
  },
  {
    key: 'cierre-caja',
    label: 'Cierre de Caja',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/cierre-caja')
    }
  },
  {
    type: 'divider',
  },
  {
    key: 'mover-dinero',
    label: 'Mover Dinero entre Sub-Cajas',
    onClick: () => {
      setOpenMoverDinero(true)
    }
  },
  {
    key: 'pedir-prestamo',
    label: 'Pedir Préstamo',
    onClick: () => {
      setOpenPedirPrestamo(true)
    }
  },
  {
    key: 'traslado-boveda',
    label: 'Traslado a Bóveda',
    onClick: () => {
      setOpenTrasladoBoveda(true)
    }
  },
  {
    type: 'divider',
  },
  {
    key: 'gestion-cajas',
    label: 'Gestión de Cajas',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/gestion-cajas')
    }
  },
  {
    key: 'metodos-pago',
    label: 'Métodos de Pago',
    onClick: () => {
      router.push('/ui/gestion-contable-y-financiera/metodos-pago')
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

        <DropdownBase menu={{ items: itemsCaja }}>
          <ButtonNav withIcon={false} colorActive='text-rose-700'>
            <FaCashRegister />
            Caja
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

      <ModalMoverDineroSubCajas
        open={openMoverDinero}
        setOpen={setOpenMoverDinero}
      />
      <ModalSolicitarEfectivo
        open={openPedirPrestamo}
        setOpen={setOpenPedirPrestamo}
        aperturaId={cajaActiva?.id || ''}
      />
      <ModalTrasladoBoveda
        open={openTrasladoBoveda}
        onCancel={() => setOpenTrasladoBoveda(false)}
        onSuccess={() => setOpenTrasladoBoveda(false)}
        aperturaCierreId={cajaActiva?.id || ''}
        vendedorId={cajaActiva?.user?.id || cajaActiva?.user_id || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || '' } catch { return '' } })()}
      />

      <ModalAperturarCaja
        open={openAperturarCaja}
        setOpen={setOpenAperturarCaja}
        onSuccess={() => setOpenAperturarCaja(false)}
      />
    </>
  )
}
