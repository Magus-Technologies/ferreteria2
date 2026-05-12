'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import { Tag, Spin } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosPorVencer } from '~/app/ui/gestion-comercial-e-inventario/_components/tables/columns-productos-por-vencer'
import { greenColors } from '~/lib/colors'
import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'
import dayjs from 'dayjs'

interface TableProductosPorVencerProps {
  dias?: number
  busqueda?: string
}

type ProductoVencimientoRow = {
  name: string
  cod_producto: string
  cantidad: number
  stock_min: string
  almacen: string
  vencimiento: string
  lote: string | null
  unidad?: string | null
  estado: string
  dias_restantes: number
}

type ProductoVencimientoResumenRow = {
  groupKey: string
  name: string
  cod_producto: string
  cantidad: number
  stock_min: string
  almacen: string
  vencimiento: string
  lote: string | null
  unidad?: string | null
  estado: string
  dias_restantes: number
  lotes_total: number
}

const resumenColumns: ColDef<ProductoVencimientoResumenRow>[] = [
  {
    colId: 'cod_producto',
    headerName: 'Código',
    field: 'cod_producto',
    width: 100,
    filter: true,
  },
  {
    colId: 'producto',
    headerName: 'Producto',
    field: 'name',
    minWidth: 220,
    flex: 2,
    filter: true,
  },
  {
    colId: 'lotes_total',
    headerName: 'Lotes',
    field: 'lotes_total',
    width: 100,
    filter: 'agNumberColumnFilter',
  },
  {
    colId: 'cantidad',
    headerName: 'Cant. total',
    field: 'cantidad',
    width: 120,
    filter: 'agNumberColumnFilter',
  },
  {
    colId: 'estado',
    headerName: 'Estado',
    field: 'estado',
    width: 120,
    cellRenderer: (params: any) => {
      const isVencido = params.value === 'Vencido'
      return (
        <Tag color={isVencido ? 'error' : 'warning'} className='font-bold uppercase !rounded-full'>
          {params.value}
        </Tag>
      )
    },
    sortable: true,
    filter: true,
  },
  {
    colId: 'vencimiento',
    headerName: 'Próx. venc.',
    field: 'vencimiento',
    minWidth: 120,
    valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
    filter: 'agDateColumnFilter',
  },
  {
    colId: 'almacen',
    headerName: 'Almacén',
    field: 'almacen',
    minWidth: 140,
    filter: true,
  },
]

export default function TableProductosPorVencer({ dias = -1, busqueda = '' }: TableProductosPorVencerProps) {
  const { almacen_id } = useStoreAlmacen()
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['productos-vencidos', almacen_id, dias],
    queryFn: async () => {
      const response = await productosApiV2.getVencimientos(almacen_id!, dias)
      return response.data || []
    },
    enabled: !!almacen_id
  })

  // Filter data by search term on the frontend
  const filteredData = useMemo(() => {
    if (!data) return []
    if (!busqueda.trim()) return data

    const term = busqueda.toLowerCase().trim()
    return data.filter((item: any) =>
      item.name?.toLowerCase().includes(term) ||
      item.cod_producto?.toLowerCase().includes(term) ||
      item.lote?.toLowerCase().includes(term) ||
      item.almacen?.toLowerCase().includes(term)
    )
  }, [data, busqueda])

  const resumenData = useMemo(() => {
    const mapa = new Map<string, ProductoVencimientoResumenRow>()

    for (const item of filteredData as ProductoVencimientoRow[]) {
      // Normalize name: trim whitespace and collapse multiple spaces to prevent
      // duplicate entries when product names have trailing spaces or encoding differences
      const normalizedName = item.name?.trim().replace(/\s+/g, ' ') || ''
      const key = [
        item.cod_producto || '',
        normalizedName,
        item.almacen || '',
        item.unidad || '',
      ].join('|')

      const existente = mapa.get(key)
      const vencimientoActual = dayjs(item.vencimiento)

      if (!existente) {
        mapa.set(key, {
          ...item,
          name: normalizedName,
          groupKey: key,
          lotes_total: 1,
        })
        continue
      }

      const vencimientoExistente = dayjs(existente.vencimiento)
      mapa.set(key, {
        ...existente,
        cantidad: Number(existente.cantidad) + Number(item.cantidad),
        lotes_total: existente.lotes_total + 1,
        vencimiento: vencimientoActual.isBefore(vencimientoExistente) ? item.vencimiento : existente.vencimiento,
        dias_restantes: vencimientoActual.isBefore(vencimientoExistente) ? item.dias_restantes : existente.dias_restantes,
        lote: vencimientoActual.isBefore(vencimientoExistente) ? item.lote : existente.lote,
        estado: vencimientoActual.isBefore(vencimientoExistente) ? item.estado : existente.estado,
      })
    }

    return Array.from(mapa.values()).sort((a, b) =>
      dayjs(a.vencimiento).valueOf() - dayjs(b.vencimiento).valueOf()
    )
  }, [filteredData])

  useEffect(() => {
    if (!resumenData.length) {
      setSelectedGroupKey(null)
      return
    }

    const exists = selectedGroupKey
      ? resumenData.some((row) => row.groupKey === selectedGroupKey)
      : false

    if (!exists) {
      setSelectedGroupKey(resumenData[0].groupKey)
    }
  }, [resumenData, selectedGroupKey])

  const selectedResumen = useMemo(() => {
    if (!resumenData.length) return null
    return resumenData.find((row) => row.groupKey === selectedGroupKey) ?? resumenData[0]
  }, [resumenData, selectedGroupKey])

  const detalleFiltrado = useMemo(() => {
    if (!selectedResumen) return filteredData
    // Filtrar por cod_producto, nombre, almacen y unidad para ser más específico
    // y evitar mostrar productos con nombres similares pero códigos diferentes
    return filteredData.filter((item: ProductoVencimientoRow) =>
      (item.cod_producto || '') === (selectedResumen.cod_producto || '') &&
      item.name === selectedResumen.name &&
      item.almacen === selectedResumen.almacen &&
      (item.unidad || '') === (selectedResumen.unidad || '')
    )
  }, [filteredData, selectedResumen])

  const getTitle = () => {
    if (dias === 0) return 'Productos Vencidos'
    if (dias === -1) return 'Todos los Vencimientos'
    return `Productos por vencer (${dias} días)`
  }

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center p-10 gap-3'>
        <Spin size="large" />
        <span className='text-gray-500 text-sm'>Cargando productos por vencer...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <TableWithTitle
        id='g-c-e-i.dashboard.productos-por-vencer-v2.resumen'
        title={`${getTitle()} - Resumen`}
        extraTitle={
          <span className='text-xs text-slate-400 font-normal'>
            ({resumenData.length} {resumenData.length === 1 ? 'producto' : 'productos'})
          </span>
        }
        selectionColor={greenColors[10]}
        columnDefs={resumenColumns}
        rowData={resumenData}
        onRowClicked={({ data }) => {
          if (data?.groupKey) setSelectedGroupKey(data.groupKey)
        }}
        style={{ height: '250px' }}
      />

      <TableWithTitle
        id='g-c-e-i.dashboard.productos-por-vencer-v2.detalle'
        title={`${getTitle()} - Detalle por lote`}
        extraTitle={
          <span className='text-xs text-slate-400 font-normal'>
            ({detalleFiltrado.length} {detalleFiltrado.length === 1 ? 'registro' : 'registros'})
          </span>
        }
        selectionColor={greenColors[10]}
        columnDefs={useColumnsProductosPorVencer()}
        rowData={detalleFiltrado}
        style={{ height: '280px' }}
      />
    </div>
  )
}
