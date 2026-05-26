'use client'

import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreVentaSeleccionada } from '../tables/table-mis-ventas'
import ModalResumenEntregaVenta, { type TipoEntregaCodigo, type CantidadOverride } from '../modals/modal-resumen-entrega-venta'
import ModalNuevaEntregaVenta from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-nueva-entrega-venta'
import type { ResumenVenta } from '~/lib/api/entregas'

export default function AccionConfigurarEntrega() {
  const venta = useStoreVentaSeleccionada(s => s.venta)

  const [openResumen,      setOpenResumen]      = useState(false)
  const [openProgramar,    setOpenProgramar]    = useState(false)
  const [tipoEntrega,      setTipoEntrega]      = useState<TipoEntregaCodigo>('de')
  const [cantidades,       setCantidades]       = useState<CantidadOverride[]>([])
  const [fechaProgramada,  setFechaProgramada]  = useState<string | null>(null)

  const ventaAdaptada: ResumenVenta | undefined = venta
    ? ({
        venta_id:                 venta.id,
        serie:                    venta.serie ?? '',
        numero:                   venta.numero ?? 0,
        venta_numero:             `${venta.serie ?? ''}-${venta.numero ?? ''}`,
        fecha:                    venta.fecha ?? '',
        cliente_nombre:           venta.cliente?.razon_social
                                    ?? `${venta.cliente?.nombres ?? ''} ${venta.cliente?.apellidos ?? ''}`.trim()
                                    ?? '',
        cliente_numero_documento: venta.cliente?.numero_documento ?? null,
        cliente_telefono:         venta.cliente?.telefono ?? null,
        total_entregas:           0,
        completadas:              0,
        en_camino:                0,
        pendientes:               0,
        canceladas:               0,
        proxima_fecha_programada: null,
        ultima_fecha_ejecutada:   null,
        sin_entregas:             true,
      } satisfies ResumenVenta)
    : undefined

  const handleProgramar = (tipo: TipoEntregaCodigo, newCantidades: CantidadOverride[], fecha: string | null) => {
    setTipoEntrega(tipo)
    setCantidades(newCantidades)
    setFechaProgramada(fecha)
    setOpenResumen(false)
    setOpenProgramar(true)
  }

  return (
    <>
      <ButtonBase
        className="w-full h-10 flex items-center justify-center gap-2 border-blue-500 !text-blue-700 font-semibold hover:bg-blue-50"
        disabled={!venta}
        onClick={() => setOpenResumen(true)}
      >
        <FaPlus size={14} />
        Configurar Entrega
      </ButtonBase>

      {/* Paso 1: resumen de productos + selector de tipo */}
      <ModalResumenEntregaVenta
        open={openResumen}
        onClose={() => setOpenResumen(false)}
        ventaId={venta?.id}
        ventaNumero={venta ? `${venta.serie}-${venta.numero}` : undefined}
        clienteNombre={
          venta?.cliente?.razon_social
          ?? `${venta?.cliente?.nombres ?? ''} ${venta?.cliente?.apellidos ?? ''}`.trim()
          ?? undefined
        }
        onProgramar={handleProgramar}
      />

      {/* Paso 2: configuración completa de la entrega */}
      <ModalNuevaEntregaVenta
        open={openProgramar}
        onClose={() => {
          setOpenProgramar(false)
          setOpenResumen(true)   // volver a Step 1 si el usuario cierra Step 2
        }}
        venta={ventaAdaptada}
        tipoEntrega={tipoEntrega}
        cantidadesOverride={cantidades}
        fechaProgramada={fechaProgramada}
        onSuccess={() => setOpenProgramar(false)}
      />
    </>
  )
}
