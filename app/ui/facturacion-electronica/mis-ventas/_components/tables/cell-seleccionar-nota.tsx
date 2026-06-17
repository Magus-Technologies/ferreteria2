'use client'

import { Checkbox } from 'antd'
import { ICellRendererParams } from 'ag-grid-community'
import type { getVentaResponseProps } from '~/lib/api/venta'
import { useStoreMultiSeleccionNotas } from '../../_store/store-multi-seleccion-notas'

/**
 * Checkbox para seleccionar Notas de Venta y Boletas y convertirlas a Factura/Boleta.
 * Se renderiza para tipo_documento = 'nv' o '03'.
 */
export default function CellSeleccionarNota(
  params: ICellRendererParams<getVentaResponseProps>,
) {
  const venta = params.data
  const ids = useStoreMultiSeleccionNotas((s) => s.ids)
  const toggle = useStoreMultiSeleccionNotas((s) => s.toggle)

  if (!venta || (venta.tipo_documento !== 'nv' && venta.tipo_documento !== '03')) return null

  const checked = ids.includes(String(venta.id))

  return (
    <Checkbox
      checked={checked}
      onChange={() => toggle(String(venta.id))}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
