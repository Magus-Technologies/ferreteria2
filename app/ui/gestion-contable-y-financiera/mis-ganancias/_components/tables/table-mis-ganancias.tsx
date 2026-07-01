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

// Fila real (con __rowKey único) o fila de detalle sintética (documento pagado, full-width)
type GananciaRow = (GananciaDetalle & { __rowKey: string; __detail?: undefined })
type DetalleRow = { __detail: true; __rowKey: string; documento_pagado?: string | null }
type GridRow = GananciaRow | DetalleRow

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

  // Intercala una fila de detalle (documento pagado) justo debajo de cada fila expandida.
  const processedRowData = useMemo<GridRow[]>(() => {
    const result: GridRow[] = []
    rowData.forEach((row, i) => {
      const rowKey = `${row.id}-${i}`
      result.push({ ...row, __rowKey: rowKey })
      if (expandedKeys.has(rowKey)) {
        result.push({ __detail: true, __rowKey: `${rowKey}-detail`, documento_pagado: row.documento_pagado })
      }
    })
    return result
  }, [rowData, expandedKeys])

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
        if (!params.data || '__detail' in params.data) return null
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
        if (!p.data?.fecha) return '-'
        return p.data.hora_emision ? `${p.data.fecha} ${p.data.hora_emision}` : p.data.fecha
      },
    },
    {
      headerName: 'F.VENCE',
      field: 'fecha_vencimiento',
      width: 95,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'TIPO DOCUMENTO',
      field: 'tipo_doc',
      width: 140,
      valueFormatter: (p) => tipoDocMap[p.value?.toUpperCase() || ''] || p.value || '-',
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
      valueFormatter: (p) => formaPagoMap[p.value?.toLowerCase() || ''] || p.value || '-',
    },
    {
      headerName: 'CLIENTE',
      field: 'cliente',
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'VENDED',
      field: 'vendedor',
      width: 100,
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
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
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
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
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
      valueFormatter: (p) => p.value?.toFixed(4) || '0.0000',
      cellStyle: { color: '#7c3aed', fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'SUBTOT',
      field: 'subtot',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: { fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'DESPLIEGUE DE PAGO',
      field: 'cc',
      width: 180,
      valueFormatter: (p) => {
        if (!p.value || p.value === 'SIN_METODO') return 'SIN ASIGNAR'
        return despliegueMap[p.value] || p.value
      },
    },
    {
      headerName: 'COSTO',
      field: 'costo_total',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: { color: '#dc2626', fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'GANANC',
      field: 'ganancia',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: (p): CellStyle => ({
        color: (p.value ?? 0) >= 0 ? '#16a34a' : '#dc2626',
        fontWeight: 'bold',
        background: (p.value ?? 0) >= 0 ? '#f0fdf4' : '#fef2f2',
      }),
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