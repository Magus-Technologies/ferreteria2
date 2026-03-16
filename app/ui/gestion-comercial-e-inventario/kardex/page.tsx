'use client'

import { useState } from 'react'
import { Select } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexInventarioView from './_components/kardex-inventario-view'
import KardexView from '~/app/ui/facturacion-electronica/mi-almacen/_components/kardex-view'

type KardexTipo = 'inventario' | 'facturacion'

export default function KardexInventarioPage() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_KARDEX_INDEX)
  const [tipo, setTipo] = useState<KardexTipo>('inventario')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4'>
        <div className='flex justify-end'>
          <Select
            value={tipo}
            onChange={setTipo}
            options={[
              { value: 'inventario', label: 'Kardex Inventario' },
              { value: 'facturacion', label: 'Kardex Facturación' },
            ]}
            className='w-56'
          />
        </div>
        {tipo === 'inventario' ? <KardexInventarioView /> : <KardexView />}
      </div>
    </ContenedorGeneral>
  )
}
