'use client'

import { Tabs } from 'antd'
import { UserOutlined, BankOutlined } from '@ant-design/icons'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import HistorialPrestamosVendedores from './_components/historial-prestamos-vendedores'
import HistorialDepositosSeguridad from './_components/historial-depositos-seguridad'

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
      children: <HistorialPrestamosVendedores />,
    },
    {
      key: 'depositos-seguridad',
      label: (
        <span className="flex items-center gap-2">
          <BankOutlined />
          Depósitos de Seguridad
        </span>
      ),
      children: <HistorialDepositosSeguridad />,
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
