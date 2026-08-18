'use client'

import { Tabs } from 'antd'
import { UserOutlined, BankOutlined, SwapOutlined, DollarOutlined } from '@ant-design/icons'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import HistorialPrestamosVendedores from './_components/historial-prestamos-vendedores'
import HistorialDepositosSeguridad from './_components/historial-depositos-seguridad'
import HistorialTrasladosBovedaTab from './_components/historial-traslados-boveda-tab'
import HistorialMovimientosInternos from './_components/historial-movimientos-internos'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function MovimientosCajaPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)

  if (!canAccess) return <NoAutorizado />

  const items = [
    {
      key: 'prestamos-vendedores',
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Préstamos entre Vendedores
        </span>
      ),
      children: (
        <ConfigurableElement componentId="movimientos-caja.prestamos-vendedores" label="Tab Préstamos entre Vendedores">
          <HistorialPrestamosVendedores />
        </ConfigurableElement>
      ),
    },
    {
      key: 'depositos-seguridad',
      label: (
        <span className="flex items-center gap-2">
          <BankOutlined />
          Movimiento entre Cajas
        </span>
      ),
      children: (
        <ConfigurableElement componentId="movimientos-caja.depositos-seguridad" label="Tab Movimiento entre Cajas">
          <HistorialDepositosSeguridad />
        </ConfigurableElement>
      ),
    },
    {
      key: 'traslados-boveda',
      label: (
        <span className="flex items-center gap-2">
          <SwapOutlined />
          Traslado a Bóveda
        </span>
      ),
      children: (
        <ConfigurableElement componentId="movimientos-caja.traslados-boveda" label="Tab Traslado a Bóveda">
          <HistorialTrasladosBovedaTab />
        </ConfigurableElement>
      ),
    },
    {
      key: 'traslado-efectivo',
      label: (
        <span className="flex items-center gap-2">
          <DollarOutlined />
          Traslado de Dinero
        </span>
      ),
      children: (
        <ConfigurableElement componentId="movimientos-caja.traslado-efectivo" label="Tab Traslado de Dinero">
          <HistorialMovimientosInternos />
        </ConfigurableElement>
      ),
    },
  ]

  return (
    <ContenedorGeneral className="items-stretch">
      <TituloModulos
        title="Movimientos de Caja"
        icon={<UserOutlined className="text-amber-600" />}
      />
      <div className="w-full">
        <Tabs defaultActiveKey="prestamos-vendedores" items={items} size="large" />
      </div>
    </ContenedorGeneral>
  )
}
