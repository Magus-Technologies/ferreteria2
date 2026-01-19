'use client'

import { useState, useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { transaccionesCajaApi, type MovimientoInterno } from '~/lib/api/transacciones-caja'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'

export default function HistorialMovimientosInternos() {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<MovimientoInterno[]>([])
  const gridRef = useRef<AgGridReact<MovimientoInterno>>(null)

  const fetchMovimientos = async () => {
    setLoading(true)
    try {
      const response = await transaccionesCajaApi.getMovimientosInternos({
        page: 1,
        per_page: 100,
      })

      if (response.error) {
        console.error('Error al cargar movimientos:', response.error)
        setMovimientos([])
        return
      }

      if (response.data?.data) {
        setMovimientos(response.data.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimientos()
  }, [])

  const columns: ColDef<MovimientoInterno>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/ ${parseFloat(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', color: '#2563eb' },
    },
    {
      headerName: 'Usuario',
      field: 'user.name',
      width: 200,
    },
    {
      headerName: 'Sub-Caja Origen',
      field: 'sub_caja_origen.nombre',
      width: 180,
    },
    {
      headerName: 'Sub-Caja Destino',
      field: 'sub_caja_destino.nombre',
      width: 180,
    },
    {
      headerName: 'Justificación',
      field: 'justificacion',
      flex: 1,
      minWidth: 250,
    },
    {
      headerName: 'Comprobante',
      field: 'comprobante',
      width: 150,
      valueFormatter: (params) => params.value || '-',
    },
  ]

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Cargando movimientos..." />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Historial de Movimientos Internos</span>
        <span className="text-sm text-slate-500">Total: {movimientos.length} movimientos</span>
      </div>
      <div className="h-[500px] w-full">
        <TableBase<MovimientoInterno>
          ref={gridRef}
          rowData={movimientos}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          headerColor="var(--color-amber-600)"
        />
      </div>
    </div>
  )
}
