'use client'

import { useEffect } from 'react'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersMisProveedores from './_components/filters/filters-mis-proveedores'
import TableMisProveedores from './_components/tables/table-mis-proveedores'
import TableDeudasProveedor from './_components/tables/table-deudas-proveedor'
import CardsInfoProveedores from './_components/cards/cards-info-proveedores'
import { useStoreProveedorSeleccionado } from './_store/store-proveedor-seleccionado'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function MisProveedoresPage() {
  const canAccess = usePermission(permissions.PROVEEDOR_BASE)
  const { setProveedorId } = useStoreProveedorSeleccionado()

  // Limpiar proveedor seleccionado al desmontar
  useEffect(() => {
    return () => {
      setProveedorId(null)
    }
  }, [setProveedorId])

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)]">
        <ConfigurableElement componentId="mis-proveedores.filtros" label="Filtros de Proveedores">
          <FiltersMisProveedores />
        </ConfigurableElement>
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Tabla de Proveedores */}
            <div className="flex-1 min-h-0">
              <TableMisProveedores />
            </div>
            {/* Tabla de Deudas con scroll infinito */}
            <ConfigurableElement componentId="mis-proveedores.tabla-deudas" label="Tabla de Deudas con Proveedores">
              <div className="flex-1 min-h-0">
                <TableDeudasProveedor proveedorSeleccionado={null} />
              </div>
            </ConfigurableElement>
          </div>
          <ConfigurableElement componentId="mis-proveedores.cards-info" label="Tarjetas de Resumen de Proveedores" noFullWidth>
            <div className="w-64 flex-shrink-0">
              <CardsInfoProveedores />
            </div>
          </ConfigurableElement>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
