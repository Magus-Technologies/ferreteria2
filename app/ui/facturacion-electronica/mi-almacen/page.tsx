'use client'

import { useState } from 'react'
import { Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexView from './_components/kardex-view'
import KardexInventarioView from '~/app/ui/gestion-comercial-e-inventario/kardex/_components/kardex-inventario-view'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

type KardexTipo = 'facturacion' | 'inventario'

export default function KardexPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MI_ALMACEN_INDEX)
  const [tipo, setTipo] = useState<KardexTipo>('facturacion')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='w-full !items-stretch'>
      <div className='flex justify-end'>
        <ConfigurableElement componentId='facturacion-kardex.selector-tipo' label='Selector de Tipo de Kardex' noFullWidth>
          <Select
            value={tipo}
            onChange={setTipo}
            options={[
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'inventario', label: 'Kardex Inventario' },
            ]}
            className='w-56'
          />
        </ConfigurableElement>
      </div>
      {tipo === 'facturacion' ? <KardexView /> : <KardexInventarioView />}
    </ContenedorGeneral>
  )
}
