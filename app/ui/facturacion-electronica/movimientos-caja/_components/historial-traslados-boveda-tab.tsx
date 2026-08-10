'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { App, Select } from 'antd'
import dayjs from 'dayjs'
import { DollarOutlined } from '@ant-design/icons'
import { FaCalendar } from 'react-icons/fa'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { trasladoBovedaApi, type TrasladoBoveda } from '~/lib/api/traslado-boveda'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { fetchCajaActivaOrNull } from '~/lib/api/caja'
import { useColumnsHistorialTraslados } from '~/app/ui/facturacion-electronica/gestion-cajas/_components/columns-historial-traslados'
import { subscribeModelChanged } from '~/lib/realtime-bus'
import { useVeTodosLosMovimientos } from '~/hooks/use-ve-todos-los-movimientos'

export default function HistorialTrasladosBovedaTab() {
  const { modal, message } = App.useApp()
  const { veTodo, userId, userName } = useVeTodosLosMovimientos()
  const [traslados, setTraslados] = useState<TrasladoBoveda[]>([])
  const [loading, setLoading] = useState(false)
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()])
  // Roles administrativos ven todo (arranca en null = "Todos"); cualquier otro
  // rol arranca viendo solo sus propios traslados (mismo criterio que Mis
  // Ventas). Se sincroniza en un efecto porque `userId` llega asíncrono.
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | null>(null)
  const gridRef = useRef<AgGridReact<TrasladoBoveda>>(null)

  useEffect(() => {
    if (veTodo || !userId) return
    setUsuarioFiltro(userId)
  }, [veTodo, userId])

  const { data: cajaActiva } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: () => fetchCajaActivaOrNull(),
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
  })

  // El historial NO depende de tener caja abierta: antes se pedía la apertura
  // activa y, si no había, ni siquiera se llamaba al backend — la pestaña salía
  // vacía como si no existieran traslados. El endpoint resuelve la caja principal
  // desde la última apertura del usuario (abierta o cerrada).
  const cargarTraslados = async () => {
    try {
      setLoading(true)
      const response = await trasladoBovedaApi.obtenerHistorial()
      setTraslados(Array.isArray(response) ? response : (response as any)?.data || [])
    } catch (error) {
      message.error('Error al cargar traslados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTraslados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unsub = subscribeModelChanged((ev) => {
      if (ev.module === 'traslados-boveda') {
        cargarTraslados()
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajaActiva?.id])

  const handleAnular = async (traslado: TrasladoBoveda) => {
    modal.confirm({
      title: '¿Anular traslado a bóveda?',
      content: (
        <div>
          <p>¿Estás seguro de que deseas anular este traslado?</p>
          <p className='mt-2 text-sm text-slate-600'>
            Monto: <span className='font-semibold'>S/ {parseFloat(traslado.monto).toFixed(2)}</span>
          </p>
        </div>
      ),
      okText: 'Continuar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await trasladoBovedaApi.anularTraslado(traslado.id, {
            supervisor_id: '',
            supervisor_password: '',
          })
          message.success('Traslado anulado exitosamente')
          cargarTraslados()
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Error al anular traslado')
        }
      },
    })
  }

  const columns = useColumnsHistorialTraslados({
    onAnular: handleAnular,
  })

  const opcionesUsuario = useMemo(() => {
    const vistos = new Map<string, string>()
    traslados.forEach((t) => {
      if (t.vendedor_id) vistos.set(t.vendedor_id, t.vendedor?.name ?? t.vendedor_id)
    })
    // El usuario logueado puede no tener aún ningún traslado en los datos
    // cargados (ej. filtrado a "hoy" y todavía no hizo ninguno) — sin esto el
    // Select no tiene su nombre para mostrar y cae al ID crudo como label.
    if (userId && !vistos.has(userId)) vistos.set(userId, userName || userId)
    return Array.from(vistos.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, nombre]) => ({ label: nombre, value: id }))
  }, [traslados, userId, userName])

  const filteredTraslados = useMemo(() => {
    return traslados.filter((t) => {
      if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
        const fecha = dayjs(t.fecha_traslado)
        const [start, end] = rangoFechas
        const dentroRango =
          (fecha.isAfter(start, 'day') || fecha.isSame(start, 'day')) &&
          (fecha.isBefore(end, 'day') || fecha.isSame(end, 'day'))
        if (!dentroRango) return false
      }
      if (usuarioFiltro && t.vendedor_id !== usuarioFiltro) {
        return false
      }
      return true
    })
  }, [traslados, rangoFechas, usuarioFiltro])

  const totalTrasladado = filteredTraslados.reduce((sum, t) => sum + parseFloat(t.monto), 0)

  return (
    <div className='flex flex-col gap-4'>
      <div className='p-4 bg-slate-50 rounded-lg border border-slate-200'>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>Usuario:</label>
              <Select
                className='!w-[180px]'
                variant='filled'
                placeholder='Todos'
                value={usuarioFiltro}
                onChange={(val) => setUsuarioFiltro(val ?? null)}
                options={opcionesUsuario}
                showSearch
                allowClear
              />
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>Desde:</label>
              <DatePickerBase
                className='!w-[140px]'
                variant='filled'
                placeholder='Fecha'
                prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
                value={rangoFechas[0]}
                onChange={(val) => setRangoFechas([val, rangoFechas[1]])}
                allowClear
              />
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>Hasta:</label>
              <DatePickerBase
                className='!w-[140px]'
                variant='filled'
                placeholder='Fecha'
                prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
                value={rangoFechas[1]}
                onChange={(val) => setRangoFechas([rangoFechas[0], val])}
                allowClear
              />
            </div>
          </div>

          <div className='p-2 px-4 bg-amber-50 border border-amber-200 rounded-lg inline-block text-right'>
            <div className='flex items-center gap-4 justify-end'>
              <span className='text-xs text-slate-500 font-medium uppercase tracking-wider'>
                Total Trasladado:
              </span>
              <span className='text-lg font-bold text-amber-600'>
                <DollarOutlined className='mr-1' />
                S/ {totalTrasladado.toFixed(2)}
              </span>
            </div>
            <p className='text-[10px] text-slate-400 leading-none mt-1'>
              {filteredTraslados.length} traslado{filteredTraslados.length !== 1 ? 's' : ''} filtrado{filteredTraslados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className='h-[500px] w-full'>
        <TableWithTitle<TrasladoBoveda>
          id='historial-traslados-boveda-tab'
          title='Traslados a Bóveda'
          tableRef={gridRef}
          rowData={filteredTraslados}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          loading={loading}
          suppressDragLeaveHidesColumns={true}
          suppressMovableColumns={true}
        />
      </div>
    </div>
  )
}
