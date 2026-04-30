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

    // Validar que todas las notas tengan el mismo cliente.
    // Si no, no podemos convertir: una factura/boleta es de un solo cliente.
    const clienteIds = new Set(
      seleccionadas.map((v) => v.cliente_id ?? null),
    )
    if (clienteIds.size > 1) {
      message.error(
        'Todas las notas seleccionadas deben pertenecer al mismo cliente.',
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
        {ids.length} nota{ids.length === 1 ? '' : 's'} seleccionada
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
