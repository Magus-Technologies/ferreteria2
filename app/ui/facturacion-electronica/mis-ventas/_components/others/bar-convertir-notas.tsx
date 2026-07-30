'use client'

import { App } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FaFileInvoice } from 'react-icons/fa6'
import { MdClose } from 'react-icons/md'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreMultiSeleccionNotas } from '../../_store/store-multi-seleccion-notas'
import useGetVentas from '../../_hooks/use-get-ventas'
import { useStoreFiltrosMisVentas } from '../../_store/store-filtros-mis-ventas'

// DNI del cliente genérico "CLIENTE VARIOS" (mostrador). No es un cliente real.
const DOC_CLIENTE_VARIOS = '99999999'

/**
 * Barra que aparece cuando hay ≥1 Nota de Venta seleccionada en la tabla.
 * Permite convertirlas a Factura/Boleta — navega a /crear-venta con los IDs
 * de las notas; ahí se carga el cliente y los productos para que el usuario
 * cambie el tipo de documento y guarde como nueva venta.
 */
export default function BarConvertirNotas() {
  const router = useRouter()
  const { message } = App.useApp()

  const ids = useStoreMultiSeleccionNotas((s) => s.ids)
  const clear = useStoreMultiSeleccionNotas((s) => s.clear)

  // Limpiar la selección cuando el componente se desmonta
  useEffect(() => clear, [clear])

  const filtros = useStoreFiltrosMisVentas((state) => state.filtros)
  const { response } = useGetVentas({ where: filtros })

  if (ids.length === 0) return null

  const seleccionadas = (response || []).filter((v) =>
    ids.includes(String(v.id)),
  )

  const handleConvertir = () => {
    if (seleccionadas.length === 0) return

    // CLIENTE VARIOS (DNI 99999999) es un genérico de mostrador, NO un cliente
    // real. Se ignora al validar "mismo cliente": sus notas se absorben en el
    // cliente real y el comprobante sale a nombre de ese cliente real. Solo se
    // bloquea si hay 2+ clientes REALES distintos (esos sí no se pueden juntar).
    const realClientIds = new Set(
      seleccionadas
        .filter((v) => (v as any).cliente?.numero_documento !== DOC_CLIENTE_VARIOS)
        .map((v) => v.cliente_id ?? null),
    )
    if (realClientIds.size > 1) {
      message.error(
        'Las notas son de clientes reales distintos. Una factura/boleta va a un solo cliente.',
      )
      return
    }

    const params = new URLSearchParams()
    params.set('notas', ids.join(','))
    router.push(
      `/ui/facturacion-electronica/mis-ventas/crear-venta?${params.toString()}`,
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md border border-amber-200 bg-amber-50">
      <span className="text-sm font-semibold text-amber-800">
        {ids.length} documento{ids.length === 1 ? '' : 's'} seleccionado
        {ids.length === 1 ? '' : 's'}
      </span>
      <ButtonBase
        color="info"
        size="md"
        onClick={handleConvertir}
        className="flex items-center gap-2"
      >
        <FaFileInvoice />
        Convertir a Factura/Boleta
      </ButtonBase>
      <ButtonBase
        color="default"
        size="md"
        onClick={clear}
        className="flex items-center gap-2"
      >
        <MdClose />
        Limpiar
      </ButtonBase>
    </div>
  )
}
