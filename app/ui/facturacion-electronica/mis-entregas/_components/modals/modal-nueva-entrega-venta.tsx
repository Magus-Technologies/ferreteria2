'use client'

/**
 * Wrapper para crear la PRIMERA entrega de una venta sin entregas asignadas
 * ("sin_entregas = true"). Abre el mismo ModalDetallesEntrega que usa
 * crear-venta, construyendo una entrega ficticia a partir de los datos de la
 * venta para que ModalEntregaUpdate funcione en modo `restante=true`.
 */

import { useMemo } from 'react'
import { Modal, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ventaApi } from '~/lib/api/venta'
import ModalEntregaUpdate from './modal-entrega-update'
import type { ResumenVenta } from '~/lib/api/entregas'
import type { CantidadOverride } from '~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-resumen-entrega-venta'
import type { RecolectarEntregaConfig } from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/modals/detalles-entrega/types'

interface Props {
  open: boolean
  onClose: () => void
  /** Solo se usa `venta_id`; acepta un `ResumenVenta` completo o el mínimo. */
  venta: Pick<ResumenVenta, 'venta_id'> | undefined
  onSuccess?: () => void
  /** Tipo de entrega a pre-seleccionar. Default: 'de' (domicilio) */
  tipoEntrega?: 'rt' | 'de' | 'pa'
  /** Cantidades específicas a programar por udv. Si se provee, filtra y pre-llena. */
  cantidadesOverride?: CantidadOverride[]
  /** Fecha programada elegida en Step 1. Formato 'YYYY-MM-DD'. */
  fechaProgramada?: string | null
  /**
   * Modo "solo recolectar": en vez de crear la entrega, el modal devuelve los
   * datos de despacho (dirección + GPS + fecha + chofer) al padre, que los
   * usará al crear todo junto. Oculta automáticamente la tabla de productos.
   */
  onRecolectar?: (config: RecolectarEntregaConfig) => void
}

export default function ModalNuevaEntregaVenta({ open, onClose, venta, onSuccess, tipoEntrega = 'de', cantidadesOverride, fechaProgramada, onRecolectar }: Props) {
  const { data: ventaResp, isLoading } = useQuery({
    // Clave dedicada (NO bajo QueryKeys.VENTAS) a propósito: este modal de
    // configuración debe quedarse quieto mientras está abierto. Si la clave
    // empezara con [VENTAS], cualquier invalidateQueries([VENTAS]) —p.ej. otro
    // usuario registrando una venta por realtime— matchearía por prefijo y
    // forzaría un refetch que recalcula la entrega y resetea lo que el usuario
    // estaba configurando. Además, staleTime + refetchOnWindowFocus:false evitan
    // refetches espontáneos mientras el modal sigue abierto.
    queryKey: ['venta-detalle-nueva-entrega', venta?.venta_id],
    queryFn: () => ventaApi.getById(venta!.venta_id),
    enabled: open && !!venta?.venta_id,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const ventaDetalle = (ventaResp?.data?.data ?? ventaResp?.data) as any

  /**
   * Entrega ficticia con la forma que ModalEntregaUpdate espera.
   * - Si cantidadesOverride está presente, solo incluye los productos del override
   *   y pre-llena cantidad_entregada con la cantidad planificada.
   * - Si no hay override, incluye todo lo pendiente con cantidad_entregada: 0
   */
  const fakeEntrega = useMemo(() => {
    if (!ventaDetalle) return null

    const tieneOverride = cantidadesOverride && cantidadesOverride.length > 0

    const productosPendientes = (ventaDetalle.productos_por_almacen ?? []).flatMap((prod: any) =>
      (prod.unidades_derivadas ?? [])
        .filter((udv: any) => {
          const pendiente = Number(udv.cantidad_pendiente ?? 0)
          if (pendiente <= 0) return false
          if (tieneOverride) {
            const override = cantidadesOverride!.find(c => c.udvId === String(udv.id))
            return override && override.cantidad > 0
          }
          return true
        })
        .map((udv: any) => {
          const override = tieneOverride
            ? cantidadesOverride!.find(c => c.udvId === String(udv.id))
            : undefined
          return {
            unidad_derivada_venta_id: udv.id,
            cantidad_entregada: override ? override.cantidad : 0,
            unidad_derivada_venta: {
              id: udv.id,
              cantidad: udv.cantidad,
              // Cuando hay override, la cantidad_pendiente = lo planificado.
              // modal-entrega-update lee este valor para inicializar `entregar`.
              cantidad_pendiente: override ? override.cantidad : udv.cantidad_pendiente,
              unidad_derivada_inmutable: udv.unidad_derivada_inmutable,
              producto_almacen_venta: {
                producto_almacen: prod.producto_almacen,
              },
            },
          }
        })
    )

    // Pre-popular la dirección D1 del cliente para que el formulario tenga valores
    // desde el primer render, sin depender de la query async de listarDirecciones.
    const direccionSeleccionada = ventaDetalle.direccion_seleccionada ?? 'D1'
    const dirCliente: any =
      (ventaDetalle.cliente?.direcciones ?? []).find((d: any) => d.tipo === direccionSeleccionada)
      ?? (ventaDetalle.cliente?.direcciones ?? [])[0]
      ?? null

    return {
      id: null,               // sin entrega previa → query de ModalEntregaUpdate no corre
      venta_id: ventaDetalle.id,
      tipo_entrega: tipoEntrega,
      tipo_despacho: 'in',
      estado_entrega: 'pe',
      fecha_programada: fechaProgramada ?? null,
      // Dirección pre-llenada desde el cliente — el modal puede sobreescribir
      direccion_entrega:  dirCliente?.direccion   ?? null,
      referencia_entrega: dirCliente?.referencia  ?? null,
      latitud:            dirCliente?.latitud  != null ? Number(dirCliente.latitud)  : null,
      longitud:           dirCliente?.longitud != null ? Number(dirCliente.longitud) : null,
      almacen_salida_id: ventaDetalle.almacen_id ?? ventaDetalle.almacen?.id,
      user_id: ventaDetalle.user?.id ?? ventaDetalle.user_id,
      quien_entrega: ventaDetalle.quien_entrega ?? 'chofer',
      grupo_entrega_id: null, // primera entrega → backend asignará su propio id
      venta: {
        id: ventaDetalle.id,
        cliente_id: ventaDetalle.cliente?.id,
        cliente: ventaDetalle.cliente,
        direccion_seleccionada: ventaDetalle.direccion_seleccionada ?? 'D1',
        entregas_productos: ventaDetalle.entregasProductos ?? [],
      },
      productos_entregados: productosPendientes,
    }
  }, [ventaDetalle, cantidadesOverride, tipoEntrega, fechaProgramada])

  // Mientras carga la venta POR PRIMERA VEZ: mostrar spinner dentro de un modal
  // base. Usamos isLoading (no isFetching) para que un refetch en segundo plano
  // no desmonte el modal rico y borre lo que el usuario está configurando.
  if (open && (isLoading || !fakeEntrega)) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title="Agregar Entrega a Domicilio"
        width={1100}
        centered
      >
        <div className="flex min-h-[240px] items-center justify-center">
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  if (!fakeEntrega) return null

  return (
    <ModalEntregaUpdate
      open={open}
      setOpen={(v) => { if (!v) onClose() }}
      entrega={fakeEntrega}
      restante={true}
      ocultarTablaProductos={true}
      titulo="Agregar Entrega a Domicilio"
      labelConfirmar="Agregar Entrega"
      onRecolectar={onRecolectar}
      onSuccess={() => {
        onSuccess?.()
        onClose()
      }}
    />
  )
}
