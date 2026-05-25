'use client'

import { useState } from 'react'
import { App } from 'antd'
import { FaTruck, FaCheckCircle, FaUserShield, FaBan, FaInfoCircle } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonBase from '~/components/buttons/button-base'

import FiltersMisEntregas from './_components/filters/filters-mis-entregas'
import TableResumenVentas from './_components/tables/table-resumen-ventas'
import TableEntregasDetalle from './_components/tables/table-entregas-detalle'
import CardsInfoMisEntregas from './_components/cards/cards-info-mis-entregas'
import ModalConfirmarEntrega from './_components/modals/modal-confirmar-entrega'
import ModalAnularEntregaV2 from './_components/modals/modal-anular-entrega-v2'

import { useStoreVentaSeleccionada } from './_store/store-venta-seleccionada'
import { useStoreEntregaSeleccionada } from './_store/store-entrega-seleccionada'
import useAccionesEntrega from './_hooks/use-acciones-entrega'

export default function MisEntregasPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)
  const { message } = App.useApp()

  const venta    = useStoreVentaSeleccionada(s => s.venta)
  const entrega  = useStoreEntregaSeleccionada(s => s.entrega)
  const acciones = useAccionesEntrega(venta?.venta_id)

  const [openConfirmar, setOpenConfirmar] = useState(false)
  const [openAnular,    setOpenAnular]    = useState(false)

  if (!canAccess) return <NoAutorizado />

  // Guards de selección
  const conEntrega = (fn: () => void) => () => {
    if (!entrega) { message.warning('Seleccione una entrega primero'); return }
    fn()
  }

  const handleConfirmar = async () => {
    await acciones.confirmar.mutateAsync(entrega!.id)
    setOpenConfirmar(false)
  }

  const handleAnular = async (motivo: string) => {
    await acciones.anular.mutateAsync({ id: entrega!.id, motivo })
    setOpenAnular(false)
  }

  return (
    <ContenedorGeneral>
      <div className="flex flex-col gap-4 w-full">
        <FiltersMisEntregas />

        <div className="flex gap-4 w-full">
          {/* ─── Tablas ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="h-[calc(50vh-140px)]">
              <TableResumenVentas />
            </div>
            <div className="h-[calc(50vh-140px)]">
              <TableEntregasDetalle ventaId={venta?.venta_id} />
            </div>
          </div>

          {/* ─── Panel lateral ──────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-3">
            <CardsInfoMisEntregas />

            <div className="flex flex-col gap-2 mt-1">
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-green-500 !text-green-700 font-semibold hover:bg-green-50"
                onClick={conEntrega(() => setOpenConfirmar(true))}
                disabled={entrega?.es_final}
              >
                <FaCheckCircle size={16} />
                Confirmar Entrega
              </ButtonBase>

              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-red-400 !text-red-600 font-semibold hover:bg-red-50"
                onClick={conEntrega(() => setOpenAnular(true))}
                disabled={entrega?.es_final}
              >
                <FaBan size={16} />
                Anular Entrega
              </ButtonBase>

              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-slate-300 !text-slate-600 font-semibold hover:bg-slate-50"
                onClick={conEntrega(() => message.info('Modal reasignar — próximamente'))}
              >
                <FaUserShield size={16} />
                Reasignar Chofer
              </ButtonBase>

              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-slate-300 !text-slate-600 font-semibold hover:bg-slate-50"
                onClick={conEntrega(() => message.info('Detalles — próximamente'))}
              >
                <FaInfoCircle size={16} />
                Ver Detalles
              </ButtonBase>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modales ──────────────────────────────────────────────── */}
      <ModalConfirmarEntrega
        open={openConfirmar}
        onClose={() => setOpenConfirmar(false)}
        onConfirmar={handleConfirmar}
        entrega={entrega ? {
          ...entrega,
          estado_entrega: entrega.estado_entrega_codigo,
          productos_entregados: (entrega.detalles ?? []).map(d => ({
            id: d.id,
            cantidad_solicitada: d.cantidad,
            cantidad_entregada: d.cantidad,
            unidad_derivada_venta: {
              cantidad: d.cantidad,
              cantidad_pendiente: d.cantidad_pendiente ?? 0,
              factor: d.factor ?? 1,
              unidad_derivada_inmutable: { name: d.unidad ?? '' },
              productoAlmacenVenta: {
                productoAlmacen: {
                  producto: d.producto
                    ? { name: d.producto.name, cod_producto: d.producto.cod_producto }
                    : { name: 'Producto', cod_producto: '—' }
                }
              }
            }
          })),
          venta: {
            serie: venta?.serie,
            numero: venta?.numero,
            cliente: {
              razon_social: venta?.cliente_nombre,
              telefono: venta?.cliente_telefono,
            }
          },
          direccion_entrega: entrega.direccion_entrega,
          referencia_entrega: entrega.referencia_entrega,
        } : undefined}
        loading={acciones.confirmar.isPending}
      />

      <ModalAnularEntregaV2
        open={openAnular}
        onClose={() => setOpenAnular(false)}
        onAnular={handleAnular}
        entrega={entrega}
      />
    </ContenedorGeneral>
  )
}
