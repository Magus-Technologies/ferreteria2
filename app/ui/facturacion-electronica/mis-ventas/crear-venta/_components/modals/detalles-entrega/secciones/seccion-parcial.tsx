'use client'

import { Select, type FormInstance } from 'antd'
import type { ColDef } from 'ag-grid-community'
import TablaProductosEntrega from '../../../../../_components/tables/tabla-productos-entrega'
import type { DireccionCliente } from '~/lib/api/cliente'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'
import { useDetallesEntrega } from '../context'
import { SeccionRestoProgramado } from './seccion-resto-programado'
import type { Cargo } from '../hooks/use-cargos'
import type { SeccionOcultable } from '../types'

interface SeccionParcialProps {
  form: FormInstance
  clienteNombre?: string
  onEditarCliente: () => void
  direcciones: DireccionCliente[]
  cargandoDirecciones: boolean
  cargos: Cargo[]
  columnDefsResto: ColDef<ProductoEntrega>[]
  totalAEntregar: number
  totalAProgramar: number
  totalSinProgramar: number
  restoDireccionEntrega?: string
  ocultar?: Set<SeccionOcultable>
  /** Tabla simplificada (sin Ubicación / Eliminar) — modo actualizar-entrega. */
  tablaSimple?: boolean
}

/**
 * Sección "Despacho Parcial" — incluye:
 *  - Selector "¿Quién entrega ahora?" (almacén o vendedor).
 *  - Tabla AG Grid de productos donde se edita "entregar ahora".
 *  - Resumen con counters (A entregar / A programar / Pendientes sin programar).
 *  - Sub-sección `SeccionRestoProgramado` con el flujo de domicilio para el resto.
 */
export function SeccionParcial({
  form,
  clienteNombre,
  onEditarCliente,
  direcciones,
  cargandoDirecciones,
  cargos,
  columnDefsResto,
  totalAEntregar,
  totalAProgramar,
  totalSinProgramar,
  restoDireccionEntrega,
  ocultar,
  tablaSimple,
}: SeccionParcialProps) {
  const {
    productosEntrega,
    setProductosEntrega,
    quienEntregaParcial,
    setQuienEntregaParcial,
  } = useDetallesEntrega()

  return (
    <div className="space-y-4">
      {/* Selector de quién entrega */}
      {!ocultar?.has('quien-entrega') && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            ¿Quién entrega? <span className="text-red-500">*</span>
          </label>
          <Select
            value={quienEntregaParcial}
            onChange={(value) => setQuienEntregaParcial(value)}
            options={[
              { value: 'almacen', label: 'Almacen' },
              { value: 'vendedor', label: 'Vendedor' },
            ]}
            className="w-60"
          />
        </div>
      )}

      {/* Tabla AG Grid de productos */}
      {!ocultar?.has('tabla-productos') && (
        <TablaProductosEntrega
          productos={productosEntrega}
          onProductoChange={setProductosEntrega}
          simple={tablaSimple}
        />
      )}

      {/* Resumen */}
      {totalAEntregar > 0 && (
        <div className="flex justify-end">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-green-800 font-medium">
              Total a entregar ahora: {totalAEntregar} unidad(es)
            </span>
          </div>
        </div>
      )}

      {/* Counters: A entregar / A programar / Pendientes sin programar */}
      {productosEntrega.length > 0 &&
        (totalAEntregar > 0 || totalAProgramar > 0 || totalSinProgramar > 0) && (
          <div className="flex flex-wrap gap-2 justify-end text-xs">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <span className="text-green-700">A entregar: </span>
              <span className="font-bold text-green-800">{totalAEntregar.toFixed(2)}</span>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
              <span className="text-orange-700">A programar: </span>
              <span className="font-bold text-orange-800">{totalAProgramar.toFixed(2)}</span>
            </div>
            <div
              className={`border rounded-lg px-3 py-1.5 ${
                totalSinProgramar > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className={totalSinProgramar > 0 ? 'text-red-700' : 'text-gray-600'}>
                Pendientes sin programar:{' '}
              </span>
              <span className={`font-bold ${totalSinProgramar > 0 ? 'text-red-800' : 'text-gray-700'}`}>
                {totalSinProgramar.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      {totalSinProgramar > 0 && (
        <p className="text-xs text-gray-500 text-right italic">
          Las unidades sin programar quedarán como pendientes en la venta.
          Podrás programarlas luego desde <span className="font-semibold">Mis Ventas</span>.
        </p>
      )}

      {/* Sub-sección "Programar entrega del resto" */}
      <SeccionRestoProgramado
        form={form}
        clienteNombre={clienteNombre}
        onEditarCliente={onEditarCliente}
        direcciones={direcciones}
        cargandoDirecciones={cargandoDirecciones}
        cargos={cargos}
        columnDefsResto={columnDefsResto}
        restoDireccionEntrega={restoDireccionEntrega}
        ocultar={ocultar}
      />
    </div>
  )
}
