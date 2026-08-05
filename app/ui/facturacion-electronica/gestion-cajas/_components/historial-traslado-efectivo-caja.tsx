'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { DatePicker, Input } from 'antd'
const { RangePicker } = DatePicker
import dayjs from 'dayjs'
import { DollarOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { transaccionesCajaApi, type MovimientoInternoFila } from '~/lib/api/transacciones-caja'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import { subscribeModelChanged } from '~/lib/realtime-bus'

interface HistorialTrasladoEfectivoCajaProps {
  cajaPrincipalId: number
}

export default function HistorialTrasladoEfectivoCaja({ cajaPrincipalId }: HistorialTrasladoEfectivoCajaProps) {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<MovimientoInternoFila[]>([])
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()])
  const [buscarUsuario, setBuscarUsuario] = useState('')
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

  // Tiempo real: esta tabla usa useState/fetch manual (no React Query), así que no
  // se refresca sola cuando se crea un nuevo Traslado de Efectivo (movimiento
  // interno) — el canal WebSocket ya está conectado globalmente (RealtimeProvider),
  // así que acá solo nos suscribimos al bus interno.
  useEffect(() => {
    const unsub = subscribeModelChanged((ev) => {
      if (ev.module === 'cajas') {
        fetchMovimientos()
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajaPrincipalId])

  // Mismos filtros que "Historial de Traslados a Bóveda": rango de fechas (por
  // defecto hoy) y búsqueda de usuario. Filtrado en cliente, igual que allá.
  const filteredMovimientos = useMemo(() => {
    const texto = buscarUsuario.trim().toLowerCase()
    return movimientos.filter((m) => {
      if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
        const fecha = dayjs(m.fecha)
        const [start, end] = rangoFechas
        const dentroRango =
          (fecha.isAfter(start, 'day') || fecha.isSame(start, 'day')) &&
          (fecha.isBefore(end, 'day') || fecha.isSame(end, 'day'))
        if (!dentroRango) return false
      }
      // Busca tanto en quien REALIZÓ el traslado como en el usuario DESTINO.
      const nombreVendedor = (m.vendedor ?? '').toLowerCase()
      const nombreDestino = (m.usuario_destino ?? '').toLowerCase()
      if (texto && !nombreVendedor.includes(texto) && !nombreDestino.includes(texto)) {
        return false
      }
      return true
    })
  }, [movimientos, rangoFechas, buscarUsuario])

  const totalMonto = filteredMovimientos.reduce((sum, m) => sum + parseFloat(m.monto), 0)

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
      headerName: 'Realizado Por',
      field: 'vendedor',
      width: 200,
      cellStyle: { color: '#7c3aed' },
    },
    {
      headerName: 'Usuario Destino',
      field: 'usuario_destino',
      width: 200,
      cellStyle: { color: '#059669', fontWeight: 'bold' },
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Buscar usuario:</span>
            <Input.Search
              className="w-56"
              placeholder="Nombre del usuario"
              value={buscarUsuario}
              onChange={(e) => setBuscarUsuario(e.target.value)}
              allowClear
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Rango de fechas:</span>
            <RangePicker
              className="w-64"
              placeholder={['Inicio', 'Fin']}
              value={rangoFechas}
              onChange={(val) => setRangoFechas(val as any)}
              allowClear
            />
          </div>
        </div>

        <div className="p-2 px-4 bg-amber-50 border border-amber-200 rounded-lg inline-block text-right">
          <div className="flex items-center gap-4 justify-end">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Total Trasladado:
            </span>
            <span className="text-lg font-bold text-amber-600">
              <DollarOutlined className="mr-1" />
              S/ {totalMonto.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-none mt-1">
            {filteredMovimientos.length} movimiento{filteredMovimientos.length !== 1 ? 's' : ''}{' '}
            filtrado{filteredMovimientos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="h-[440px] w-full">
        <TableWithTitle<MovimientoInternoFila>
          id="historial-traslado-efectivo-caja"
          title="Historial de Movimientos Internos"
          tableRef={gridRef}
          rowData={filteredMovimientos}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          suppressDragLeaveHidesColumns={true}
          suppressMovableColumns={true}
        />
      </div>
    </div>
  )
}
