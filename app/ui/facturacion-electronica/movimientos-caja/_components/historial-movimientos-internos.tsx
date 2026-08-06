'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Spin, Select, Button, Popconfirm, Tag, Tooltip, App } from 'antd'
import dayjs from 'dayjs'
import { DeleteOutlined } from '@ant-design/icons'
import { FaCalendar } from 'react-icons/fa'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { transaccionesCajaApi, type MovimientoInternoFila } from '~/lib/api/transacciones-caja'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import { subscribeModelChanged } from '~/lib/realtime-bus'

export default function HistorialMovimientosInternos() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  // El backend (MovimientoInternoService::listarMovimientos) devuelve una forma
  // PLANA (vendedor, sub_caja_origen/destino como texto) — MovimientoInternoFila,
  // no el tipo anidado `MovimientoInterno` (user.name, sub_caja_origen.nombre) que
  // se usaba antes acá y nunca coincidía con la respuesta real.
  const [movimientos, setMovimientos] = useState<MovimientoInternoFila[]>([])
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | null>(null)
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()])
  const gridRef = useRef<AgGridReact<MovimientoInternoFila>>(null)

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
        setMovimientos((response.data.data.data as unknown as MovimientoInternoFila[]) || [])
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
  }, [])

  const opcionesUsuario = useMemo(() => {
    const nombres = new Set<string>()
    movimientos.forEach((m) => {
      if (m.vendedor) nombres.add(m.vendedor)
    })
    return Array.from(nombres).sort().map((nombre) => ({ label: nombre, value: nombre }))
  }, [movimientos])

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
        const fecha = dayjs(m.fecha)
        const [start, end] = rangoFechas
        const dentroRango =
          (fecha.isAfter(start, 'day') || fecha.isSame(start, 'day')) &&
          (fecha.isBefore(end, 'day') || fecha.isSame(end, 'day'))
        if (!dentroRango) return false
      }
      if (usuarioFiltro && m.vendedor !== usuarioFiltro) return false
      return true
    })
  }, [movimientos, usuarioFiltro, rangoFechas])

  const handleAnular = async (id: string) => {
    try {
      const response = await transaccionesCajaApi.anularMovimientoInterno(id)
      if (response.error) {
        message.error(response.error.message || 'Error al anular el movimiento')
        return
      }
      message.success('Movimiento anulado')
      fetchMovimientos()
    } catch (error: any) {
      message.error(error?.message || 'Error al anular el movimiento')
    }
  }

  const columns: ColDef<MovimientoInternoFila>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      valueFormatter: (params) =>
        formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
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
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'anulado' ? 'red' : 'green'}>
          {params.value === 'anulado' ? 'ANULADO' : 'ACTIVO'}
        </Tag>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 110,
      cellRenderer: (params: any) => {
        if (params.data.estado === 'anulado') return null
        return (
          <Tooltip title="Anular movimiento">
            <Popconfirm
              title="¿Anular este movimiento?"
              description="El monto se revertirá: volverá a la caja de origen y se descontará del destino."
              onConfirm={() => handleAnular(params.data.id)}
              okText="Sí, anular"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger type="text" icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Tooltip>
        )
      },
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
    <div className="w-full flex flex-col gap-3">
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Usuario:</label>
            <Select
              className="!w-[180px]"
              variant="filled"
              placeholder="Todos"
              value={usuarioFiltro}
              onChange={(val) => setUsuarioFiltro(val ?? null)}
              options={opcionesUsuario}
              showSearch
              allowClear
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desde:</label>
            <DatePickerBase
              className="!w-[140px]"
              variant="filled"
              placeholder="Fecha"
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              value={rangoFechas[0]}
              onChange={(val) => setRangoFechas([val, rangoFechas[1]])}
              allowClear
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Hasta:</label>
            <DatePickerBase
              variant="filled"
              className="!w-[140px]"
              placeholder="Fecha"
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              value={rangoFechas[1]}
              onChange={(val) => setRangoFechas([rangoFechas[0], val])}
              allowClear
            />
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full">
        <TableWithTitle<MovimientoInternoFila>
          id="historial-movimientos-internos"
          title="Historial de Movimientos Internos"
          extraTitle={
            <span className="text-sm text-slate-500">Total: {movimientosFiltrados.length} movimientos</span>
          }
          tableRef={gridRef}
          rowData={movimientosFiltrados}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
        />
      </div>
    </div>
  )
}
