'use client'

import { useCallback, useMemo, useState } from 'react'
import { ColDef, CellStyle, ICellRendererParams } from 'ag-grid-community' // Importamos CellStyle
import TableWithTitle from '~/components/tables/table-with-title'
import { useGetGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { Spin } from 'antd'
import type { GananciaDetalle } from '~/lib/api/ganancias'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { FaChevronRight, FaChevronDown } from 'react-icons/fa'

// Fila real (con __rowKey único), fila de detalle sintética (documento pagado, full-width)
// o fila EXTRA de subtotal (se agrega después de la última venta de una compra con 2+
// ventas; las filas individuales NO se tocan ni se fusionan).
type GananciaRow = (GananciaDetalle & { __rowKey: string; __detail?: undefined; __subtotal?: undefined })
type DetalleRow = { __detail: true; __rowKey: string; documento_pagado?: string | null }
type SubtotalRow = {
  __subtotal: true
  __rowKey: string
  __detail?: undefined
  documento_pagado: string
  numero: string
  cant: number
  subtot: number
  costo_total: number
  ganancia: number
  miembros: number
  // Impacto TC total (S/ ±) del grupo y fecha en que se pagó la compra de origen.
  impacto_tc: number | null
  fecha_pago_compra: string | null
  // Datos de la compra de origen (misma para todo el grupo, ya que se agrupa por
  // documento_pagado): fecha de vencimiento, tipo de documento, forma de pago,
  // proveedor y quién registró la compra.
  compra_fecha_vencimiento: string | null
  compra_tipo_documento: string | null
  compra_forma_pago: string | null
  compra_proveedor: string | null
  compra_registrado_por: string | null
}
type GridRow = GananciaRow | DetalleRow | SubtotalRow

// "N compras" no identifica una compra específica (una venta que se surtió de varios
// lotes) — no se puede usar como llave de agrupación o mezclaría ventas no relacionadas.
const esDocumentoAgrupable = (doc?: string | null): doc is string => !!doc && !/\d+ compras$/i.test(doc)

// fecha_pago_compra/compra_fecha_vencimiento llegan como "YYYY-MM-DD[ HH:mm:ss]"
const formatFechaCorta = (iso?: string | null) => {
  if (!iso) return null
  const [fecha, hora] = iso.split(' ')
  const [y, m, d] = fecha.split('-')
  if (!d || !m || !y) return iso
  return `${d}/${m}/${y} ${(hora || '00:00:00').slice(0, 8)}`
}

// Solo fecha, sin hora (compra_fecha_vencimiento no tiene una hora real registrada).
const formatSoloFecha = (iso?: string | null) => {
  if (!iso) return null
  const [y, m, d] = iso.split(' ')[0].split('-')
  return d && m && y ? `${d}/${m}/${y}` : iso
}

export default function TableMisGanancias() {
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading, error } = useGetGanancias(filtros)
  // Filas expandidas (muestran debajo el documento pagado). AG Grid Community no trae
  // master/detail nativo (es Enterprise); esto lo simula con full-width rows sintéticas.
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  // Query para obtener despliegues de pago con el formato detallado
  const { data: desplieguesData } = useQuery({
    queryKey: ['metodos-para-ventas'],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return response.data
    },
  })

  const rowData = data?.data?.data || []

  // Agrega una fila EXTRA de subtotal justo después de la ÚLTIMA venta de cada compra
  // con 2+ ventas. Las filas individuales (NV109, NV110, ...) NO se tocan ni se fusionan.
  const rowDataConSubtotales = useMemo<(GananciaDetalle | SubtotalRow)[]>(() => {
    const grupos = new Map<string, GananciaDetalle[]>()
    rowData.forEach((row) => {
      if (esDocumentoAgrupable(row.documento_pagado)) {
        const key = row.documento_pagado
        if (!grupos.has(key)) grupos.set(key, [])
        grupos.get(key)!.push(row)
      }
    })

    // Índice (en rowData) de la última venta de cada compra con 2+ ventas: ahí se
    // inserta la fila de subtotal, justo después.
    const ultimoIndicePorDoc = new Map<string, number>()
    rowData.forEach((row, i) => {
      const doc = row.documento_pagado
      if (esDocumentoAgrupable(doc) && (grupos.get(doc)?.length ?? 0) > 1) {
        ultimoIndicePorDoc.set(doc, i)
      }
    })

    const resultado: (GananciaDetalle | SubtotalRow)[] = []
    rowData.forEach((row, i) => {
      resultado.push(row)
      const doc = row.documento_pagado
      if (doc && ultimoIndicePorDoc.get(doc) === i) {
        const miembros = grupos.get(doc)!
        resultado.push({
          __subtotal: true,
          __rowKey: `subtotal-${doc}`,
          documento_pagado: doc,
          numero: `SUBTOTAL COMPRA ${doc}`,
          cant: miembros.reduce((s, r) => s + Number(r.cant || 0), 0),
          subtot: miembros.reduce((s, r) => s + Number(r.subtot || 0), 0),
          costo_total: miembros.reduce((s, r) => s + Number(r.costo_total || 0), 0),
          ganancia: miembros.reduce((s, r) => s + Number(r.ganancia || 0), 0),
          miembros: miembros.length,
          // Suma el impacto TC solo de los miembros que lo tengan (compras en dólares
          // con pago registrado); null si ninguno aplica.
          impacto_tc: miembros.some((r) => r.impacto_tc != null)
            ? miembros.reduce((s, r) => s + Number(r.impacto_tc || 0), 0)
            : null,
          // Fecha del pago de la compra (misma para todo el grupo, viene de la 1ra que la tenga)
          fecha_pago_compra: miembros.find((r) => r.fecha_pago_compra)?.fecha_pago_compra ?? null,
          // Datos de la compra de origen: mismos para todo el grupo (se agrupó por
          // documento_pagado), se toman de cualquier miembro que los tenga.
          compra_fecha_vencimiento: miembros.find((r) => r.compra_fecha_vencimiento)?.compra_fecha_vencimiento ?? null,
          compra_tipo_documento: miembros.find((r) => r.compra_tipo_documento)?.compra_tipo_documento ?? null,
          compra_forma_pago: miembros.find((r) => r.compra_forma_pago)?.compra_forma_pago ?? null,
          compra_proveedor: miembros.find((r) => r.compra_proveedor)?.compra_proveedor ?? null,
          compra_registrado_por: miembros.find((r) => r.compra_registrado_por)?.compra_registrado_por ?? null,
        })
      }
    })
    return resultado
  }, [rowData])

  // Intercala una fila de detalle (documento pagado) justo debajo de cada fila expandida.
  // Las filas de subtotal no son expandibles (ellas mismas ya son el resumen).
  const processedRowData = useMemo<GridRow[]>(() => {
    const result: GridRow[] = []
    rowDataConSubtotales.forEach((row: any, i) => {
      const rowKey = row.__subtotal ? row.__rowKey : `${row.id}-${i}`
      result.push({ ...row, __rowKey: rowKey })
      if (!row.__subtotal && expandedKeys.has(rowKey)) {
        result.push({ __detail: true, __rowKey: `${rowKey}-detail`, documento_pagado: row.documento_pagado })
      }
    })
    return result
  }, [rowDataConSubtotales, expandedKeys])

  // Crear mapa de despliegues de pago para conversión rápida
  const despliegueMap = useMemo(() => {
    if (!desplieguesData?.data) return {}
    return desplieguesData.data.reduce((acc, metodo) => {
      // Usamos despliegue_pago_id como llave porque es lo que viene en el campo 'cc'
      acc[metodo.despliegue_pago_id] = metodo.label.toUpperCase()
      return acc
    }, {} as Record<string, string>)
  }, [desplieguesData])

  // Mapeo de códigos a nombres completos
  const tipoDocMap: Record<string, string> = {
    '01': 'FACTURA',
    '03': 'BOLETA',
    '07': 'NOTA CRÉDITO',
    '08': 'NOTA DÉBITO',
    'nv': 'NOTA DE VENTA',
    'NV': 'NOTA DE VENTA',
    'GR': 'GUÍA REMISIÓN',
    'gr': 'GUÍA REMISIÓN',
    'CO': 'COTIZACIÓN',
    'co': 'COTIZACIÓN',
    'PR': 'PRÉSTAMO',
    'pr': 'PRÉSTAMO',
    'BOL': 'BOLETA',
    'FAC': 'FACTURA',
    'NC': 'NOTA CRÉDITO',
    'ND': 'NOTA DÉBITO',
  }

  const formaPagoMap: Record<string, string> = {
    'co': 'CONTADO',
    'cr': 'CRÉDITO',
  }

  // Tipado laxo: la grilla mezcla filas reales (GananciaDetalle) y filas de detalle
  // sintéticas (full-width), así que los ColDef individuales usan `any` como el resto
  // de tablas AG Grid del proyecto.
  const columns = useMemo<ColDef<any>[]>(() => [
    {
      headerName: '',
      colId: 'expand',
      width: 34,
      minWidth: 34,
      pinned: 'left' as const,
      sortable: false,
      filter: false,
      resizable: false,
      suppressNavigable: true,
      cellRenderer: (params: ICellRendererParams<GridRow>) => {
        if (!params.data || '__detail' in params.data || (params.data as any).__subtotal) return null
        const rowKey = params.data.__rowKey
        const isOpen = expandedKeys.has(rowKey)
        return (
          <button
            onClick={() => toggleExpand(rowKey)}
            className="flex items-center justify-center w-full h-full text-slate-500 hover:text-rose-600"
            title={isOpen ? 'Ocultar documento pagado' : 'Ver documento pagado'}
          >
            {isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
          </button>
        )
      },
    },
    {
      headerName: 'EMISION',
      field: 'fecha',
      width: 160,
      valueFormatter: (p) => {
        // Fila de subtotal: aquí no hay "emisión de venta", se muestra la fecha en que
        // se pagó la compra de origen.
        if (p.data?.__subtotal) {
          const fechaPago = formatFechaCorta(p.data.fecha_pago_compra)
          return fechaPago ? `Pagado: ${fechaPago}` : '-'
        }
        if (!p.data?.fecha) return '-'
        return p.data.hora_emision ? `${p.data.fecha} ${p.data.hora_emision}` : p.data.fecha
      },
    },
    {
      headerName: 'F.VENCE',
      field: 'fecha_vencimiento',
      width: 95,
      // Fila de subtotal: la venta no tiene "vencimiento"; se muestra el de la compra.
      valueFormatter: (p) =>
        p.data?.__subtotal ? (formatSoloFecha(p.data.compra_fecha_vencimiento) || '-') : (p.value || '-'),
    },
    {
      headerName: 'TIPO DOCUMENTO',
      field: 'tipo_doc',
      width: 140,
      // El backend ya abrevia compra_tipo_documento (FAC/BOL/...) igual que tipoDocMap;
      // se pasa por el mismo mapa para mostrar el nombre completo (FAC → FACTURA).
      valueFormatter: (p) =>
        p.data?.__subtotal
          ? (tipoDocMap[p.data.compra_tipo_documento?.toUpperCase() || ''] || p.data.compra_tipo_documento || '-')
          : (tipoDocMap[p.value?.toUpperCase() || ''] || p.value || '-'),
    },
    {
      headerName: 'N° COMPROBANTE',
      field: 'numero',
      width: 155,
      cellClass: 'font-mono text-xs',
    },
    {
      headerName: 'FORMA PAGO',
      field: 'f_pago',
      width: 110,
      valueFormatter: (p) => {
        const valor = p.data?.__subtotal ? p.data.compra_forma_pago : p.value
        return formaPagoMap[valor?.toLowerCase() || ''] || valor || '-'
      },
    },
    {
      headerName: 'CLIENTE',
      field: 'cliente',
      flex: 2,
      minWidth: 200,
      // Fila de subtotal: no hay "cliente", se muestra el proveedor de la compra.
      valueFormatter: (p) => (p.data?.__subtotal ? (p.data.compra_proveedor || '-') : (p.value || '')),
    },
    {
      headerName: 'VENDED',
      field: 'vendedor',
      width: 100,
      // Fila de subtotal: se muestra quién registró la compra.
      valueFormatter: (p) => (p.data?.__subtotal ? (p.data.compra_registrado_por || '-') : (p.value || '')),
    },
    {
      headerName: 'PRODUCTO',
      field: 'producto',
      flex: 3,
      minWidth: 250,
    },
    {
      headerName: 'MARCA',
      field: 'marca',
      width: 110,
    },
    {
      headerName: 'CANT',
      field: 'cant',
      width: 65,
      type: 'numericColumn',
      valueFormatter: (p) => (p.data?.__subtotal ? '-' : p.value?.toFixed(2) || '0.00'),
    },
    {
      headerName: 'UNIDAD',
      field: 'unidad',
      width: 80,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'P.UNIT',
      field: 'p_unit',
      width: 80,
      type: 'numericColumn',
      // La fila de subtotal no tiene un precio unitario único (cada venta tuvo el suyo)
      valueFormatter: (p) => (p.data?.__subtotal ? '-' : p.value?.toFixed(2) || '0.00'),
    },
    {
      headerName: 'LOTE',
      field: 'desglose_lote',
      width: 75,
      valueFormatter: (p) => p.value || '',
      cellStyle: { color: '#7c3aed', fontWeight: 'bold', fontSize: '11px' } as CellStyle,
    },
    {
      headerName: 'P.COSTO',
      field: 'costo',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => (p.data?.__subtotal ? '-' : p.value?.toFixed(4) || '0.0000'),
      cellStyle: { color: '#7c3aed', fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'SUBTOT',
      field: 'subtot',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => (p.data?.__subtotal ? '-' : p.value?.toFixed(2) || '0.00'),
      cellStyle: { fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'DESPLIEGUE DE PAGO',
      field: 'cc',
      width: 180,
      valueFormatter: (p) => {
        if (p.data?.__subtotal) return '-'
        if (!p.value || p.value === 'SIN_METODO') return 'SIN ASIGNAR'
        return despliegueMap[p.value] || p.value
      },
    },
    {
      headerName: 'COSTO',
      field: 'costo_total',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => (p.data?.__subtotal ? '-' : p.value?.toFixed(2) || '0.00'),
      cellStyle: { color: '#dc2626', fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'GANANC',
      field: 'ganancia',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      // Fila de subtotal: ya no suma ganancia, muestra el Impacto TC total (igual
      // convención que el modal PEPS: positivo = ganaste por el TC, verde). Solo el
      // número, sin la etiqueta "Impacto TC:".
      cellRenderer: (p: any) => {
        if (p.data?.__subtotal) {
          const impacto = p.data.impacto_tc
          if (impacto == null) return <span className="text-slate-400">-</span>
          const positivo = impacto >= 0
          return (
            <span className="font-bold whitespace-nowrap" style={{ color: positivo ? '#16a34a' : '#dc2626' }}>
              S/ {positivo ? '+' : ''}{impacto.toFixed(2)}
            </span>
          )
        }
        return <span>{Number(p.value ?? 0).toFixed(2)}</span>
      },
      cellStyle: (p): CellStyle => {
        if (p.data?.__subtotal) return { display: 'flex', alignItems: 'center' }
        return {
          color: (p.value ?? 0) >= 0 ? '#16a34a' : '#dc2626',
          fontWeight: 'bold',
          background: (p.value ?? 0) >= 0 ? '#f0fdf4' : '#fef2f2',
        }
      },
    },
  ], [despliegueMap, expandedKeys, toggleExpand])

  // ... resto del componente (isLoading, error, return) igual
  if (isLoading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
  if (error) return <div className="flex items-center justify-center h-64 text-center"><p className="text-red-500">Error al cargar</p></div>

  return (
    <TableWithTitle
      id='table-mis-ganancias'
      title={`Detalle de Ganancias${rowData.length > 0 ? ` (${rowData.length} registros)` : ''}`}
      columnDefs={columns}
      rowData={processedRowData}
      getRowId={(params: any) => params.data.__rowKey}
      // Fila de subtotal: se resalta con fondo y borde superior, como un total de grupo.
      getRowStyle={(params: any) =>
        params.data?.__subtotal
          ? { background: '#fef9c3', borderTop: '2px solid #ca8a04' }
          : undefined
      }
      // IsFullWidthRowParams trae el dato en rowNode.data, NO en params.data directo
      // (ese shape es el de ICellRendererParams, que sí usa fullWidthCellRenderer abajo).
      isFullWidthRow={(params: any) => !!params.rowNode?.data?.__detail}
      fullWidthCellRenderer={(params: any) => (
        <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-teal-50 border-l-4 border-teal-500 text-xs h-full">
          <span className="font-bold text-teal-700 uppercase tracking-wide">Documento pagado:</span>
          <span className="font-mono font-semibold text-teal-800">
            {params.data?.documento_pagado || 'Sin registro (venta antigua)'}
          </span>
        </div>
      )}
      className='h-full w-full'
      headerColor='var(--color-rose-600)'
      selectionColor="#fee2e2"
      withNumberColumn={true}
    />
  )
}