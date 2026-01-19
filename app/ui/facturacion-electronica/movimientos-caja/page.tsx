'use client'

import { Tabs } from 'antd'
import { SwapOutlined, ArrowsAltOutlined } from '@ant-design/icons'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import HistorialPrestamos from './_components/historial-prestamos'
import HistorialMovimientosInternos from './_components/historial-movimientos-internos'

export default function MovimientosCajaPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)

  if (!canAccess) return <NoAutorizado />

  const items = [
    {
      key: 'prestamos',
      label: (
        <span className="flex items-center gap-2">
          <SwapOutlined />
          Préstamos entre Cajas
        </span>
      ),
      children: <HistorialPrestamos />,
    },
    {
      key: 'movimientos',
      label: (
        <span className="flex items-center gap-2">
          <ArrowsAltOutlined />
          Movimientos Internos
        </span>
      ),
      children: <HistorialMovimientosInternos />,
    },
  ]

  return (
    <ContenedorGeneral className="items-stretch">
      <TituloModulos
        title="Movimientos de Caja"
        icon={<SwapOutlined className="text-amber-600" />}
      />
      <div className="w-full">
        <Tabs defaultActiveKey="prestamos" items={items} size="large" />
      </div>
    </ContenedorGeneral>
  )
}
