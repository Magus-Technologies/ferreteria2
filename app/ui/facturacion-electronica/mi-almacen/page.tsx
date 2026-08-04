'use client'

import { useState } from 'react'
import { Select, Empty } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexView from './_components/kardex-view'
import KardexInventarioView from '~/app/ui/gestion-comercial-e-inventario/kardex/_components/kardex-inventario-view'
import KardexCombinadoView from '~/app/ui/gestion-comercial-e-inventario/kardex/_components/kardex-combinado-view'
import KardexFinanzasView from '~/app/ui/gestion-contable-y-financiera/kardex-finanzas/_components/kardex-finanzas-view'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

type KardexTipo = 'facturacion' | 'inventario' | 'finanzas'

export default function KardexPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MI_ALMACEN_INDEX)
  const [tipos, setTipos] = useState<KardexTipo[]>(['facturacion'])

  if (!canAccess) return <NoAutorizado />

  const tieneFacturacion = tipos.includes('facturacion')
  const tieneInventario = tipos.includes('inventario')
  const tieneFinanzas = tipos.includes('finanzas')
  // Inventario + Facturación comparten el mismo shape de movimiento y se pueden
  // fusionar en una sola tabla. Finanzas es otra cosa (métodos de pago / caja,
  // sin columnas de stock) y siempre se muestra aparte.
  const combinarInventarioYFacturacion = tieneInventario && tieneFacturacion

  return (
    <ContenedorGeneral className='w-full !items-stretch'>
      <div className='flex justify-end'>
        <ConfigurableElement componentId='facturacion-kardex.selector-tipo' label='Selector de Tipo de Kardex' noFullWidth>
          <Select
            mode='multiple'
            allowClear
            value={tipos}
            onChange={(vals) => setTipos(vals as KardexTipo[])}
            options={[
              { value: 'facturacion', label: 'Kardex Facturación' },
              { value: 'inventario', label: 'Kardex Inventario' },
              { value: 'finanzas', label: 'Kardex Finanzas' },
            ]}
            placeholder='Selecciona uno o varios'
            maxTagCount='responsive'
            className='w-72'
          />
        </ConfigurableElement>
      </div>

      <div className='flex flex-col gap-4'>
        {tipos.length === 0 && (
          <div className='flex-1 flex items-center justify-center py-12'>
            <Empty description='Selecciona al menos un tipo de Kardex' />
          </div>
        )}

        {tieneFinanzas && <KardexFinanzasView />}

        {combinarInventarioYFacturacion ? (
          <KardexCombinadoView />
        ) : tieneFacturacion ? (
          <KardexView />
        ) : tieneInventario ? (
          <KardexInventarioView />
        ) : null}
      </div>
    </ContenedorGeneral>
  )
}
