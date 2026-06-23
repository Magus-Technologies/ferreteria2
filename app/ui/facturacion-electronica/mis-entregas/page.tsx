'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { FaCheckCircle, FaBan, FaInfoCircle, FaMapMarkerAlt } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonBase from '~/components/buttons/button-base'

import FiltersMisEntregas from './_components/filters/filters-mis-entregas'
import TableMisEntregas, { useStoreEntregaSeleccionada } from './_components/tables/table-mis-entregas'
import TableDetalleEntrega from './_components/tables/table-detalle-entrega'
import CardsInfoEntregas from './_components/cards/cards-info-entregas'

// Modales con dependencias pesadas → dynamic import (ssr:false).
// ModalMapaEntrega arrastra mapbox-gl (~2.8 MB). El resto arrastra AntD forms
// grandes + @react-pdf/renderer. Cargarlos solo al abrir el modal reduce el
// bundle inicial de mis-entregas en ~500 KB - 1 MB.
const ModalConfirmarEntrega = dynamic(
  () => import('./_components/modals/modal-confirmar-entrega'),
  { ssr: false }
)
const ModalAnularEntregaV2 = dynamic(
  () => import('./_components/modals/modal-anular-entrega-v2'),
  { ssr: false }
)
const ModalDetallesEntregaCompleto = dynamic(
  () => import('./_components/modals/modal-detalles-entrega-completo'),
  { ssr: false }
)
const ModalMapaEntrega = dynamic(
  () => import('./_components/modals/mapbox/modal-mapa-entrega'),
  { ssr: false }
)
const ModalPdfEntregaWrapper = dynamic(
  () => import('./_components/modals/modal-pdf-entrega-wrapper'),
  { ssr: false }
)

import useAccionesEntrega from './_hooks/use-acciones-entrega'
import { useQuery } from '@tanstack/react-query'
import { ventaApi } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function MisEntregasPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)
  const entrega  = useStoreEntregaSeleccionada(s => s.entrega)
  const acciones = useAccionesEntrega(entrega?.venta_id)

  const [openConfirmar,  setOpenConfirmar]  = useState(false)
  const [openAnular,     setOpenAnular]     = useState(false)
  const [openDetalles,   setOpenDetalles]   = useState(false)
  const [openMapa,       setOpenMapa]       = useState(false)

  if (!canAccess) return <NoAutorizado />

  const handleConfirmar = async () => {
    await acciones.confirmar.mutateAsync(entrega!.id)
    setOpenConfirmar(false)
  }

  const handleMarcarEnCamino = async () => {
    await acciones.enCamino.mutateAsync(entrega!.id)
  }

  const handleAnular = async (motivo: string) => {
    await acciones.anular.mutateAsync({ id: entrega!.id, motivo })
    setOpenAnular(false)
  }

  // ── Condiciones de bloqueo ──────────────────────────────────────────────
  const sinEntrega  = !entrega
  const esFinal     = entrega?.estado_entrega === 'en' || entrega?.estado_entrega === 'ca'
  const yaAnulada   = entrega?.estado_entrega === 'ca'
  const esDomicilio = entrega?.tipo_entrega === 'de'

  // Detalle de venta (con cliente.direcciones) — solo carga cuando el mapa abre.
  const { data: ventaDetalleResp } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'mapa-entrega', entrega?.venta_id],
    queryFn:  () => ventaApi.getById(entrega!.venta_id),
    enabled:  openMapa && !!entrega?.venta_id,
    staleTime: 5 * 60 * 1000,
  })
  const ventaDetalleMapa = (ventaDetalleResp?.data?.data ?? ventaDetalleResp?.data) as any

  // Shape que espera ModalMapaEntrega
  const entregaParaMapa = useMemo(() => {
    if (!entrega) return undefined
    const clienteDetalle = ventaDetalleMapa?.cliente ?? null
    const venta = (entrega as any).venta
    return {
      direccion_entrega:  (entrega as any).direccion_entrega,
      referencia_entrega: (entrega as any).referencia_entrega,
      observaciones:      (entrega as any).observaciones,
      estado_entrega:     entrega.estado_entrega,
      latitud:            (entrega as any).latitud,
      longitud:           (entrega as any).longitud,
      venta: {
        serie:   venta?.serie,
        numero:  venta?.numero,
        cliente: {
          razon_social: venta?.cliente?.razon_social ?? venta?.cliente?.nombres,
          telefono:     venta?.cliente?.telefono,
          direcciones:  clienteDetalle?.direcciones ?? [],
        },
      },
    }
  }, [entrega, ventaDetalleMapa])

  return (
    <ContenedorGeneral>
      <div className="flex flex-col gap-4 w-full">
        <FiltersMisEntregas />

        <div className="flex gap-4 w-full">
          {/* ─── Tablas ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="h-[300px]">
              <TableMisEntregas />
            </div>
            <div>
              <TableDetalleEntrega />
            </div>
          </div>

          {/* ─── Panel lateral ──────────────────────────────────── */}
          <div className="w-52 flex-shrink-0 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <CardsInfoEntregas />
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-green-500 !text-green-700 font-semibold hover:bg-green-50"
                disabled={sinEntrega || esFinal}
                onClick={() => setOpenConfirmar(true)}
              >
                <FaCheckCircle size={16} />
                Confirmar Entrega
              </ButtonBase>

              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-red-400 !text-red-600 font-semibold hover:bg-red-50"
                // Anular es valido desde cualquier estado salvo 'ca' (ya anulada).
                // El backend permite explicitamente 'en' -> 'ca' (anulacion
                // post-entrega excepcional), igual que el dropdown de la tabla.
                disabled={sinEntrega || yaAnulada}
                onClick={() => setOpenAnular(true)}
              >
                <FaBan size={16} />
                Anular Entrega
              </ButtonBase>

              <ButtonBase
                className="w-full h-10 flex items-center justify-center gap-2 border-slate-300 !text-slate-600 font-semibold hover:bg-slate-50"
                disabled={sinEntrega}
                onClick={() => setOpenDetalles(true)}
              >
                <FaInfoCircle size={16} />
                Ver Detalles
              </ButtonBase>

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
      <ModalPdfEntregaWrapper />

      <ModalConfirmarEntrega
        open={openConfirmar}
        onClose={() => setOpenConfirmar(false)}
        onConfirmar={handleConfirmar}
        onMarcarEnCamino={handleMarcarEnCamino}
        entrega={entrega as any}
        loading={acciones.confirmar.isPending}
        loadingEnCamino={acciones.enCamino.isPending}
      />

      <ModalAnularEntregaV2
        open={openAnular}
        onClose={() => setOpenAnular(false)}
        onAnular={handleAnular}
        entrega={entrega as any}
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
          id: entrega.id,
          estado_entrega:    entrega.estado_entrega,
          tipo_entrega:      entrega.tipo_entrega,
          tipo_despacho:     entrega.tipo_despacho,
          quien_entrega:     entrega.quien_entrega,
          direccion_entrega:  (entrega as any).direccion_entrega,
          referencia_entrega: (entrega as any).referencia_entrega,
          observaciones:      (entrega as any).observaciones,
          fecha_programada:   (entrega as any).fecha_programada,
          hora_inicio:        (entrega as any).hora_inicio,
          hora_fin:           (entrega as any).hora_fin,
          motivo_anulacion:   (entrega as any).motivo_anulacion,
          fecha_ejecutada:  (entrega as any).fecha_ejecutada,
          user_entregado_id: (entrega as any).user_entregado_id,
          userEntregado:  (entrega as any).userEntregado ?? null,
          almacenSalida:  (entrega as any).almacenSalida ?? null,
          despachador: (entrega as any).chofer ? { name: (entrega as any).chofer?.name } : null,
          vehiculo: (entrega as any).vehiculo
            ? { name: (entrega as any).vehiculo?.name, placa: (entrega as any).vehiculo?.placa }
            : null,
          venta: {
            serie:   (entrega as any).venta?.serie,
            numero:  (entrega as any).venta?.numero,
            cliente: {
              razon_social: (entrega as any).venta?.cliente?.razon_social,
              telefono:     (entrega as any).venta?.cliente?.telefono,
            },
            entregas_productos: [],
            historial: (entrega as any).venta?.historial ?? [],
          },
          productos_entregados: ((entrega as any).productos_entregados ?? []).map((d: any) => ({
            id:                d.id,
            cantidad_entregada: d.cantidad_entregada,
            unidad_derivada_venta: d.unidad_derivada_venta,
          })),
        } : undefined}
      />
    </ContenedorGeneral>
  )
}
