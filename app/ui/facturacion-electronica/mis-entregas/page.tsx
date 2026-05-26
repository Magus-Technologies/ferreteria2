'use client'

import { useState, useMemo } from 'react'
import { App } from 'antd'
import { FaTruck, FaCheckCircle, FaUserShield, FaBan, FaInfoCircle, FaMapMarkerAlt } from 'react-icons/fa'
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
import ModalDetallesEntregaCompleto from './_components/modals/modal-detalles-entrega-completo'
import ModalMapaEntrega from './_components/modals/mapbox/modal-mapa-entrega'

import { useStoreVentaSeleccionada } from './_store/store-venta-seleccionada'
import { useStoreEntregaSeleccionada } from './_store/store-entrega-seleccionada'
import useAccionesEntrega from './_hooks/use-acciones-entrega'
import { useQuery } from '@tanstack/react-query'
import { ventaApi } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function MisEntregasPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)
  const { message } = App.useApp()

  const venta    = useStoreVentaSeleccionada(s => s.venta)
  const entrega  = useStoreEntregaSeleccionada(s => s.entrega)
  const acciones = useAccionesEntrega(venta?.venta_id)

  const [openConfirmar,  setOpenConfirmar]  = useState(false)
  const [openAnular,     setOpenAnular]     = useState(false)
  const [openDetalles,   setOpenDetalles]   = useState(false)
  const [openMapa,       setOpenMapa]       = useState(false)

  if (!canAccess) return <NoAutorizado />

  const handleConfirmar = async () => {
    await acciones.confirmar.mutateAsync(entrega!.id)
    setOpenConfirmar(false)
  }

  const handleAnular = async (motivo: string) => {
    await acciones.anular.mutateAsync({ id: entrega!.id, motivo })
    setOpenAnular(false)
  }

  // ── Condiciones de bloqueo ──────────────────────────────────────────────
  const sinEntrega  = !entrega
  // 'en' = entregado, 'ca' = anulado → ambos son finales (es_final=true)
  const esFinal     = entrega?.es_final ?? false
  const yaAnulada   = entrega?.estado_entrega_codigo === 'ca'
  const esDomicilio = entrega?.tipo_entrega_codigo === 'de'

  // Detalle de venta (con cliente.direcciones) — solo carga cuando el mapa abre.
  const { data: ventaDetalleResp } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'mapa-entrega', venta?.venta_id],
    queryFn: () => ventaApi.getById(venta!.venta_id),
    enabled: openMapa && !!venta?.venta_id,
    staleTime: 5 * 60 * 1000,
  })
  const ventaDetalleMapa = (ventaDetalleResp?.data?.data ?? ventaDetalleResp?.data) as any

  // Shape que espera ModalMapaEntrega
  const entregaParaMapa = useMemo(() => {
    if (!entrega) return undefined
    const clienteDetalle = ventaDetalleMapa?.cliente ?? null
    return {
      direccion_entrega:  entrega.direccion_entrega,
      referencia_entrega: entrega.referencia_entrega,
      observaciones:      entrega.observaciones,
      estado_entrega:     entrega.estado_entrega_codigo,
      venta: {
        serie:   venta?.serie,
        numero:  venta?.numero,
        cliente: {
          razon_social: venta?.cliente_nombre,
          telefono:     venta?.cliente_telefono,
          // direcciones del cliente como fallback de GPS cuando la entrega no tiene GPS guardado
          direcciones:  clienteDetalle?.direcciones ?? [],
        },
      },
    }
  }, [entrega, venta, ventaDetalleMapa])

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

              {/* Confirmar: bloqueado sin entrega o si ya es final */}
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-green-500 !text-green-700 font-semibold hover:bg-green-50"
                disabled={sinEntrega || esFinal}
                onClick={() => setOpenConfirmar(true)}
              >
                <FaCheckCircle size={16} />
                Confirmar Entrega
              </ButtonBase>

              {/* Anular: bloqueado sin entrega, si es final, o si ya está anulada */}
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-red-400 !text-red-600 font-semibold hover:bg-red-50"
                disabled={sinEntrega || esFinal || yaAnulada}
                onClick={() => setOpenAnular(true)}
              >
                <FaBan size={16} />
                Anular Entrega
              </ButtonBase>

              {/* Reasignar: bloqueado sin entrega o si es final */}
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-slate-300 !text-slate-600 font-semibold hover:bg-slate-50"
                disabled={sinEntrega || esFinal}
                onClick={() => message.info('Reasignar chofer — próximamente')}
              >
                <FaUserShield size={16} />
                Reasignar Chofer
              </ButtonBase>

              {/* Ver detalles: bloqueado solo si no hay entrega */}
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-slate-300 !text-slate-600 font-semibold hover:bg-slate-50"
                disabled={sinEntrega}
                onClick={() => setOpenDetalles(true)}
              >
                <FaInfoCircle size={16} />
                Ver Detalles
              </ButtonBase>

              {/* Ver mapa: solo para entregas de tipo domicilio */}
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-blue-400 !text-blue-700 font-semibold hover:bg-blue-50"
                disabled={sinEntrega || !esDomicilio}
                onClick={() => setOpenMapa(true)}
              >
                <FaMapMarkerAlt size={16} />
                Ver Mapa
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

      <ModalMapaEntrega
        open={openMapa}
        onClose={() => setOpenMapa(false)}
        entrega={entregaParaMapa}
      />

      <ModalDetallesEntregaCompleto
        open={openDetalles}
        onClose={() => setOpenDetalles(false)}
        entrega={entrega ? {
          id: null,  // evita fetch a API vieja
          estado_entrega: entrega.estado_entrega_codigo,
          tipo_entrega:   entrega.tipo_entrega_codigo,
          tipo_despacho:  entrega.tipo_despacho_codigo,
          quien_entrega:  entrega.quien_entrega_codigo,
          direccion_entrega:  entrega.direccion_entrega,
          referencia_entrega: entrega.referencia_entrega,
          observaciones:      entrega.observaciones,
          fecha_programada:   entrega.fecha_programada,
          hora_inicio:        entrega.hora_inicio,
          hora_fin:           entrega.hora_fin,
          motivo_anulacion:   entrega.motivo_anulacion,
          despachador: entrega.chofer_name ? { name: entrega.chofer_name } : null,
          vehiculo: entrega.vehiculo_name
            ? { name: entrega.vehiculo_name, placa: entrega.vehiculo_placa }
            : null,
          venta: {
            serie:  venta?.serie,
            numero: venta?.numero,
            cliente: {
              razon_social: venta?.cliente_nombre,
              telefono:     venta?.cliente_telefono,
            },
            entregas_productos: [],
          },
          productos_entregados: (entrega.detalles ?? []).map(d => ({
            id: d.id,
            cantidad_entregada: d.cantidad,
            unidad_derivada_venta: {
              cantidad:          d.cantidad,
              cantidad_pendiente: d.cantidad_pendiente ?? 0,
              unidad_derivada_inmutable: { name: d.unidad ?? '' },
              producto_almacen_venta: {
                producto_almacen: {
                  producto: d.producto
                    ? { name: d.producto.name, cod_producto: d.producto.cod_producto }
                    : { name: 'Producto', cod_producto: '—' },
                },
              },
            },
          })),
        } : undefined}
      />
    </ContenedorGeneral>
  )
}
