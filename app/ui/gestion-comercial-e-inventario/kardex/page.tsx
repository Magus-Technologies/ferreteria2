'use client'

import { useState } from 'react'
import { Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexInventarioView from './_components/kardex-inventario-view'
import KardexView from '~/app/ui/facturacion-electronica/mi-almacen/_components/kardex-view'
import KardexFinanzasView from '~/app/ui/gestion-contable-y-financiera/kardex-finanzas/_components/kardex-finanzas-view'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

type KardexTipo = 'inventario' | 'facturacion' | 'finanzas'

export default function KardexInventarioPage() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_KARDEX_INDEX)
  const [tipo, setTipo] = useState<KardexTipo>('inventario')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='w-full !items-stretch !p-0'>
      <div className='flex justify-end p-4 border-b'>
        <ConfigurableElement componentId='kardex.selector-tipo' label='Selector de Tipo de Kardex' noFullWidth>
          <Select
            value={tipo}
            onChange={setTipo}
            options={[
              { value: 'inventario', label: 'Kardex Inventario' },
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'finanzas', label: 'Kardex Finanzas' },
            ]}
            className='w-56'
          />
        </ConfigurableElement>
      </div>
      <div className='flex-1 overflow-auto'>
        {tipo === 'inventario' ? <KardexInventarioView /> : tipo === 'facturacion' ? <KardexView /> : <KardexFinanzasView />}
      </div>
    </ContenedorGeneral>
  )
}
