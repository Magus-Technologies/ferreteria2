'use client'

import { useState, useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { transaccionesCajaApi, type MovimientoInterno } from '~/lib/api/transacciones-caja'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'

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
        formatFechaPeru(params.value, 'DD/MM/YYYY HH:mm') || '-',
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
      <div className="h-[500px] w-full">
        <TableWithTitle<MovimientoInterno>
          id="historial-movimientos-internos"
          title="Historial de Movimientos Internos"
          extraTitle={
            <span className="text-sm text-slate-500">Total: {movimientos.length} movimientos</span>
          }
          tableRef={gridRef}
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
