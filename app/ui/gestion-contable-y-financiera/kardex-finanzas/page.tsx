'use client'

import { useState } from 'react'
import { Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexFinanzasView from './_components/kardex-finanzas-view'
import KardexView from '~/app/ui/facturacion-electronica/mi-almacen/_components/kardex-view'
import KardexInventarioView from '~/app/ui/gestion-comercial-e-inventario/kardex/_components/kardex-inventario-view'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

type KardexTipo = 'finanzas' | 'facturacion' | 'inventario'

export default function KardexFinanzasPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_KARDEX_FINANZAS_INDEX)
  const [tipo, setTipo] = useState<KardexTipo>('finanzas')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='w-full !items-stretch !p-0'>
      <div className='flex justify-end p-4 border-b'>
        <ConfigurableElement componentId='kardex-finanzas.selector-tipo' label='Selector de Tipo de Kardex' noFullWidth>
          <Select
            value={tipo}
            onChange={setTipo}
            options={[
              { value: 'finanzas', label: 'Kardex Finanzas' },
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'inventario', label: 'Kardex Inventario' },
            ]}
            className='w-56'
          />
        </ConfigurableElement>
      </div>
      <div className='flex-1 overflow-auto'>
        {tipo === 'finanzas' ? <KardexFinanzasView /> : tipo === 'facturacion' ? <KardexView /> : <KardexInventarioView />}
      </div>
    </ContenedorGeneral>
  )
}
