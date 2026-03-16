'use client'

import { useState } from 'react'
import { Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexView from './_components/kardex-view'
import KardexInventarioView from '~/app/ui/gestion-comercial-e-inventario/kardex/_components/kardex-inventario-view'

type KardexTipo = 'facturacion' | 'inventario'

export default function KardexPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MI_ALMACEN_INDEX)
  const [tipo, setTipo] = useState<KardexTipo>('facturacion')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4'>
        <div className='flex justify-end'>
          <Select
            value={tipo}
            onChange={setTipo}
            options={[
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'inventario', label: 'Kardex Inventario' },
            ]}
            className='w-56'
          />
        </div>
        {tipo === 'facturacion' ? <KardexView /> : <KardexInventarioView />}
      </div>
    </ContenedorGeneral>
  )
}
