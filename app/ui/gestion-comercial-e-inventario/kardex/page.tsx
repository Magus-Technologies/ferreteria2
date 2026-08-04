'use client'

import { useState } from 'react'
import { Select, Empty } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexInventarioView from './_components/kardex-inventario-view'
import KardexCombinadoView from './_components/kardex-combinado-view'
import KardexView from '~/app/ui/facturacion-electronica/mi-almacen/_components/kardex-view'
import KardexFinanzasView from '~/app/ui/gestion-contable-y-financiera/kardex-finanzas/_components/kardex-finanzas-view'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

type KardexTipo = 'inventario' | 'facturacion' | 'finanzas'

export default function KardexInventarioPage() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_KARDEX_INDEX)
  const [tipos, setTipos] = useState<KardexTipo[]>(['inventario'])

  if (!canAccess) return <NoAutorizado />

  const tieneInventario = tipos.includes('inventario')
  const tieneFacturacion = tipos.includes('facturacion')
  const tieneFinanzas = tipos.includes('finanzas')
  // Inventario + Facturación comparten el mismo shape de movimiento y se pueden
  // fusionar en una sola tabla. Finanzas es otra cosa (métodos de pago / caja,
  // sin columnas de stock) y siempre se muestra aparte, aunque esté combinada
  // con las otras selecciones.
  const combinarInventarioYFacturacion = tieneInventario && tieneFacturacion

  return (
    <ContenedorGeneral className='w-full !items-stretch !p-0'>
      <div className='flex justify-end p-4 border-b'>
        <ConfigurableElement componentId='kardex.selector-tipo' label='Selector de Tipo de Kardex' noFullWidth>
          <Select
            mode='multiple'
            allowClear
            value={tipos}
            onChange={(vals) => setTipos(vals as KardexTipo[])}
            options={[
              { value: 'inventario', label: 'Kardex Inventario' },
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'finanzas', label: 'Kardex Finanzas' },
            ]}
            placeholder='Selecciona uno o varios'
            maxTagCount='responsive'
            className='w-72'
          />
        </ConfigurableElement>
      </div>
      <div className='flex-1 overflow-auto flex flex-col gap-4'>
        {tipos.length === 0 && (
          <div className='flex-1 flex items-center justify-center'>
            <Empty description='Selecciona al menos un tipo de Kardex' />
          </div>
        )}

        {tieneFinanzas && <KardexFinanzasView />}

        {combinarInventarioYFacturacion ? (
          <KardexCombinadoView />
        ) : tieneInventario ? (
          <KardexInventarioView />
        ) : tieneFacturacion ? (
          <KardexView />
        ) : null}
      </div>
    </ContenedorGeneral>
  )
}
