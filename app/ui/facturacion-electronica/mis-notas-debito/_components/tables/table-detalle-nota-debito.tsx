'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'
import { useStoreNotaDebitoSeleccionada } from './table-mis-notas-debito'

type DetalleNota = {
  codigo: string
  descripcion: string
  unidad_medida: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  igv: number
  total: number
}

export default function TableDetalleNotaDebito() {
  const nota = useStoreNotaDebitoSeleccionada((state) => state.nota)

  // Los items de una nota de débito son los del comprobante afectado
  // (comprobante_referencia.detalles), que el listado ya trae eager-loaded.
  const detalle: DetalleNota[] =
    (nota?.comprobante_referencia?.detalles ?? []).map((d: any) => ({
      codigo: d.codigo_producto || '',
      descripcion: d.descripcion || '',
      unidad_medida: d.unidad_medida || '',
      cantidad: Number(d.cantidad || 0),
      precio_unitario: Number(d.precio_unitario || 0),
      subtotal: Number(d.subtotal || 0),
      igv: Number(d.igv || 0),
      total: Number(d.total || 0),
    }))

  const columns: ColDef<DetalleNota>[] = [
    { headerName: 'Código', field: 'codigo', width: 120 },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, minWidth: 200 },
    { headerName: 'U.Medida', field: 'unidad_medida', width: 100 },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 80,
      valueFormatter: (p) => Number(p.value ?? 0).toFixed(2),
    },
    {
      headerName: 'P. Unit.',
      field: 'precio_unitario',
      width: 110,
      valueFormatter: (p) => `S/ ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 110,
      valueFormatter: (p) => `S/ ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'IGV',
      field: 'igv',
      width: 100,
      valueFormatter: (p) => `S/ ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 120,
      valueFormatter: (p) => `S/ ${Number(p.value ?? 0).toFixed(2)}`,
      cellStyle: { textAlign: 'right', fontWeight: '600' },
    },
  ]

  const cliente = nota?.venta?.cliente

  return (
    <div className="w-full">
      {/* Info de la nota seleccionada */}
      {nota && (
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="text-sm">
            <span className="font-semibold">Nota: </span>
            <span>{nota.numero_completo || `${nota.serie}-${nota.numero}`}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Afecta: </span>
            <span>
              {nota.referencia_documento ||
                (nota.venta ? `${nota.venta.serie}-${nota.venta.numero}` : '—')}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Cliente: </span>
            <span>
              {cliente?.razon_social ||
                `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
                'CLIENTE GENERAL'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Motivo: </span>
            <span>{nota.motivo?.descripcion || nota.descripcion || '—'}</span>
          </div>
        </div>
      )}

      <div className="w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]">
        <TableWithTitle<DetalleNota>
          id="detalle-nota-debito"
          title="Detalle de Nota de Débito"
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={detalle}
          noRowsOverlayComponent={() => (
            <div className="text-gray-400 text-sm">
              Selecciona una nota para ver su detalle
            </div>
          )}
        />
      </div>
    </div>
  )
}
