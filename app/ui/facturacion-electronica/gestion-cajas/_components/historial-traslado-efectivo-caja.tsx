'use client'

import { useState, useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { transaccionesCajaApi, type MovimientoInternoFila } from '~/lib/api/transacciones-caja'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'

interface HistorialTrasladoEfectivoCajaProps {
  cajaPrincipalId: number
}

export default function HistorialTrasladoEfectivoCaja({ cajaPrincipalId }: HistorialTrasladoEfectivoCajaProps) {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<MovimientoInternoFila[]>([])
  const gridRef = useRef<AgGridReact<MovimientoInternoFila>>(null)

  const fetchMovimientos = async () => {
    setLoading(true)
    try {
      const response = await transaccionesCajaApi.getMovimientosInternosPorCajaPrincipal(cajaPrincipalId)

      if (response.error) {
        console.error('Error al cargar movimientos:', response.error)
        setMovimientos([])
        return
      }

      setMovimientos(response.data?.data || [])
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimientos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajaPrincipalId])

  const columns: ColDef<MovimientoInternoFila>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
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
      field: 'vendedor',
      width: 200,
    },
    {
      headerName: 'Sub-Caja Origen',
      field: 'sub_caja_origen',
      width: 180,
    },
    {
      headerName: 'Sub-Caja Destino',
      field: 'sub_caja_destino',
      width: 180,
    },
    {
      headerName: 'Justificación',
      field: 'justificacion',
      flex: 1,
      minWidth: 250,
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
        <TableWithTitle<MovimientoInternoFila>
          id="historial-traslado-efectivo-caja"
          title="Historial de Movimientos Internos"
          extraTitle={
            <span className="text-sm text-slate-500">Total: {movimientos.length} movimientos</span>
          }
          tableRef={gridRef}
          rowData={movimientos}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
        />
      </div>
    </div>
  )
}
