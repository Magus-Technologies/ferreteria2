'use client'

import { useMemo } from 'react'
import { ColDef, CellStyle } from 'ag-grid-community' // Importamos CellStyle
import TableWithTitle from '~/components/tables/table-with-title'
import { useGetGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { Spin } from 'antd'
import type { GananciaDetalle } from '~/lib/api/ganancias'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'

export default function TableMisGanancias() {
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading, error } = useGetGanancias(filtros)

  // Query para obtener despliegues de pago con el formato detallado
  const { data: desplieguesData } = useQuery({
    queryKey: ['metodos-para-ventas'],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return response.data
    },
  })

  const rowData = data?.data?.data || []

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

  // Tipamos ColDef con GananciaDetalle para mejor soporte de TS
  const columns = useMemo<ColDef<GananciaDetalle>[]>(() => [
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
      headerName: 'P.UNIT',
      field: 'p_unit',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
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
  ], [despliegueMap])

  // ... resto del componente (isLoading, error, return) igual
  if (isLoading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
  if (error) return <div className="flex items-center justify-center h-64 text-center"><p className="text-red-500">Error al cargar</p></div>

  return (
    <TableWithTitle
      id='table-mis-ganancias'
      title={`Detalle de Ganancias${rowData.length > 0 ? ` (${rowData.length} registros)` : ''}`}
      columnDefs={columns}
      rowData={rowData}
      className='h-full w-full'
      headerColor='var(--color-rose-600)'
      selectionColor="#fee2e2"
      withNumberColumn={true}
    />
  )
}