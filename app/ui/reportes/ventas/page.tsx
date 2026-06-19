'use client'

import { useState, useMemo } from 'react'
import { FaDollarSign, FaArrowLeft } from 'react-icons/fa'
import { Select, DatePicker, Button } from 'antd'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'
import { gananciasApi } from '~/lib/api/ganancias'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { exportReporteVentasToExcel } from '~/utils/export-reporte-ventas-excel'
import { contasisApi } from '~/lib/api/contasis'
import { exportContasisVentasToExcel } from '~/utils/export-contasis-excel'

const { RangePicker } = DatePicker

type ViewMode = 'dashboard' | 'ventas_general' | 'ventas_contado' | 'ventas_credito' | 'ventas_vendedor' | 'ventas_cliente'

type FiltroAvanzado = {
  tipo?: 'general' | 'contado' | 'credito' | 'vendedor' | 'cliente'
  desde: string
  hasta: string
}

export default function ReporteVentasPage() {
  const canAccess = usePermission(permissions.REPORTES_VENTAS_INDEX)
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [exportingExcel, setExportingExcel] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  // CONTASIS export state
  const [contasisDesde, setContasisDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [contasisHasta, setContasisHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [exportingContasis, setExportingContasis] = useState(false)
  const [contasisResult, setContasisResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  // Filtros dashboard — último año por defecto para el gráfico
  const [dashDesde, setDashDesde] = useState(dayjs().subtract(11, 'months').startOf('month').format('YYYY-MM-DD'))
  const [dashHasta, setDashHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))

  // Filtros del reporte avanzado
  const [rf, setRf] = useState<FiltroAvanzado>({
    desde: dayjs().startOf('month').format('YYYY-MM-DD'),
    hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  })

  // Query: resumen mensual para el gráfico (agrupado por mes)
  const { data: resumenData, isLoading: loadingGrafico } = useQuery({
    queryKey: [QueryKeys.GANANCIAS_RESUMEN, almacen_id, dashDesde, dashHasta],
    queryFn: () => gananciasApi.getResumen({
      almacen_id,
      desde: dashDesde,
      hasta: dashHasta,
    }),
    enabled: !!almacen_id,
  })

  // Query: datos detallados para el gráfico por mes (top-level)
  const { data: detalleData, isLoading: loadingDetalle } = useQuery({
    queryKey: [QueryKeys.GANANCIAS, almacen_id, dashDesde, dashHasta, 'grafico'],
    queryFn: () => gananciasApi.getGanancias({
      almacen_id,
      desde: dashDesde,
      hasta: dashHasta,
      per_page: 10000,
    }),
    enabled: !!almacen_id,
  })

  // Query: empresa para header Excel
  const { data: empresaData } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, 1],
    queryFn: () => empresaApi.getById(1),
  })

  const handleExportContasis = async () => {
    setExportingContasis(true)
    setContasisResult(null)
    try {
      const res = await contasisApi.getVentas({ desde: contasisDesde, hasta: contasisHasta, almacen_id })
      const items = res.data?.data
      if (!items || items.length === 0) {
        setContasisResult({ type: 'warning', text: 'No hay comprobantes electrónicos en el rango seleccionado.' })
        return
      }
      exportContasisVentasToExcel(items, {
        desde: dayjs(contasisDesde).format('DD/MM/YYYY'),
        hasta: dayjs(contasisHasta).format('DD/MM/YYYY'),
        empresa: empresaInfo?.razon_social,
        nameFile: `CONTASIS_VENTAS_${dayjs(contasisDesde).format('YYYYMM')}_${dayjs(contasisHasta).format('YYYYMM')}`,
      })
      setContasisResult({ type: 'success', text: `${items.length} comprobantes exportados correctamente.` })
    } catch {
      setContasisResult({ type: 'error', text: 'Error al generar el archivo. Intente nuevamente.' })
    } finally {
      setExportingContasis(false)
    }
  }

  if (!canAccess) return <NoAutorizado />

  const empresa = empresaData?.data?.data
  const empresaInfo = empresa
    ? { razon_social: empresa.razon_social, ruc: empresa.ruc, direccion: empresa.direccion }
    : undefined

  const resumen = resumenData?.data?.data

  // Agrupar detalle por mes para el gráfico
  const datosMensuales = useMemo(() => {
    const detalle = detalleData?.data?.data || []
    const porMes: Record<string, { ventas: number; ganancia: number }> = {}
    for (const item of detalle) {
      const mes = dayjs(item.fecha).format('MMM-YY').toUpperCase()
      if (!porMes[mes]) porMes[mes] = { ventas: 0, ganancia: 0 }
      porMes[mes].ventas += Number(item.subtot || 0)
      porMes[mes].ganancia += Number(item.ganancia || 0)
    }
    return Object.entries(porMes).map(([mes, vals]) => ({ mes, ...vals }))
  }, [detalleData])

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return 'S/. 0.00'
    return `S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // ==========================================
  // EXPORTAR REPORTE AVANZADO
  // ==========================================
  const handleExportReporte = async () => {
    setExportingExcel('export')
    setExportResult(null)
    try {
      const filtrosExtra: Record<string, string> = {}
      if (viewMode === 'ventas_contado') filtrosExtra.forma_pago = 'co'
      if (viewMode === 'ventas_credito') filtrosExtra.forma_pago = 'cr'

      const res = await gananciasApi.getGanancias({
        almacen_id,
        desde: rf.desde,
        hasta: rf.hasta,
        ...filtrosExtra,
        per_page: 10000,
      })

      const items = res.data?.data
      if (!items || items.length === 0) {
        setExportResult({ type: 'warning', text: 'No hay ventas en el rango de fechas seleccionado.' })
        return
      }

      const titulos: Record<ViewMode, string> = {
        dashboard: 'REPORTE DE VENTAS',
        ventas_general: 'REPORTE DE VENTAS GENERAL',
        ventas_contado: 'REPORTE DE VENTAS AL CONTADO',
        ventas_credito: 'REPORTE DE VENTAS AL CRÉDITO',
        ventas_vendedor: 'REPORTE DE VENTAS POR VENDEDOR',
        ventas_cliente: 'REPORTE DE VENTAS POR CLIENTE',
      }

      const prefijos: Record<ViewMode, string> = {
        dashboard: 'Ventas',
        ventas_general: 'Ventas_General',
        ventas_contado: 'Ventas_Contado',
        ventas_credito: 'Ventas_Credito',
        ventas_vendedor: 'Ventas_Vendedor',
        ventas_cliente: 'Ventas_Cliente',
      }

      exportReporteVentasToExcel({
        items,
        resumen: res.data?.resumen,
        nameFile: `${prefijos[viewMode]}_${dayjs().format('YYYYMMDD_HHmmss')}`,
        fechaDesde: dayjs(rf.desde).format('DD/MM/YYYY'),
        fechaHasta: dayjs(rf.hasta).format('DD/MM/YYYY'),
        empresa: empresaInfo,
        titulo: titulos[viewMode],
      })
      setExportResult({ type: 'success', text: 'Reporte exportado correctamente.' })
    } catch {
      setExportResult({ type: 'error', text: 'Error al generar el reporte. Intente nuevamente.' })
    } finally {
      setExportingExcel(null)
    }
  }

  // ==========================================
  // VISTA REPORTE AVANZADO
  // ==========================================
  if (viewMode !== 'dashboard') {
    const titles: Record<ViewMode, string> = {
      dashboard: '',
      ventas_general: 'REPORTE DE VENTAS GENERAL',
      ventas_contado: 'REPORTE DE VENTAS AL CONTADO',
      ventas_credito: 'REPORTE DE VENTAS AL CRÉDITO',
      ventas_vendedor: 'REPORTE DE VENTAS POR VENDEDOR',
      ventas_cliente: 'REPORTE DE VENTAS POR CLIENTE',
    }

    return (
      <ContenedorGeneral>
        <div className='w-full'>
          <div className='flex items-center gap-3 mb-6'>
            <button
              onClick={() => { setViewMode('dashboard'); setExportResult(null) }}
              className='text-slate-500 hover:text-slate-700 transition-colors'
            >
              <FaArrowLeft size={18} />
            </button>
            <h2 className='font-bold text-slate-800 text-lg'>{titles[viewMode]}</h2>
          </div>

          <div className='bg-white rounded-lg border border-slate-200 p-6 space-y-5'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-slate-600 mb-1'>Rango de fechas:</label>
                <RangePicker
                  value={[dayjs(rf.desde), dayjs(rf.hasta)]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setRf((p) => ({
                        ...p,
                        desde: dates[0]!.format('YYYY-MM-DD'),
                        hasta: dates[1]!.format('YYYY-MM-DD'),
                      }))
                    }
                  }}
                  format='DD/MM/YYYY'
                  className='w-full'
                />
              </div>
            </div>

            <div className='flex gap-3 pt-2'>
              <Button
                type='primary'
                onClick={handleExportReporte}
                loading={exportingExcel === 'export'}
              >
                Exportar Excel
              </Button>
              <Button onClick={() => {
                setRf({
                  desde: dayjs().startOf('month').format('YYYY-MM-DD'),
                  hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
                })
                setExportResult(null)
              }}>
                Limpiar
              </Button>
            </div>

            {exportResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                exportResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                exportResult.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {exportResult.text}
              </div>
            )}
          </div>
        </div>
      </ContenedorGeneral>
    )
  }

  // ==========================================
  // DASHBOARD PRINCIPAL
  // ==========================================
  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Ventas"
        icon={<FaDollarSign className="text-rose-500" />}
      />

      {/* Filtro de fechas del dashboard */}
      <div className='flex items-center gap-3 mt-3 w-full'>
        <RangePicker
          value={[dayjs(dashDesde), dayjs(dashHasta)]}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDashDesde(dates[0].format('YYYY-MM-DD'))
              setDashHasta(dates[1].format('YYYY-MM-DD'))
            }
          }}
          format='DD/MM/YYYY'
          size='middle'
          className='w-64'
        />
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 w-full'>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <span className='text-xs text-slate-500 uppercase font-semibold'>Total Ventas</span>
          {loadingDetalle ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse mt-1' />
          ) : (
            <p className='text-lg font-bold text-slate-800 mt-1'>{formatMoney(resumen?.ventas)}</p>
          )}
        </div>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <span className='text-xs text-slate-500 uppercase font-semibold'>Ganancia</span>
          {loadingDetalle ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse mt-1' />
          ) : (
            <p className='text-lg font-bold text-green-600 mt-1'>{formatMoney(resumen?.ganancia)}</p>
          )}
        </div>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <span className='text-xs text-slate-500 uppercase font-semibold'>Costo</span>
          {loadingDetalle ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse mt-1' />
          ) : (
            <p className='text-lg font-bold text-slate-600 mt-1'>{formatMoney(resumen?.costo)}</p>
          )}
        </div>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <span className='text-xs text-slate-500 uppercase font-semibold'>Transacciones</span>
          {loadingDetalle ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse mt-1' />
          ) : (
            <p className='text-lg font-bold text-blue-600 mt-1'>{resumen?.total_transacciones || 0}</p>
          )}
        </div>
      </div>

      {/* Gráfico de Ventas */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Gráfico de Ventas</h3>
        <p className='text-xs text-slate-400 mb-4'>Ventas y ganancia por mes</p>

        {loadingDetalle ? (
          <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>Cargando gráfico...</span>
          </div>
        ) : datosMensuales.length === 0 ? (
          <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>No hay datos de ventas en el periodo seleccionado</span>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <AreaChart data={datosMensuales}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='mes' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Area
                type='monotone'
                dataKey='ventas'
                name='Ventas'
                stroke='#ef4444'
                fill='#ef444420'
                strokeWidth={2}
              />
              <Area
                type='monotone'
                dataKey='ganancia'
                name='Ganancia'
                stroke='#3b82f6'
                fill='#3b82f620'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          <CardReporteAvanzado
            titulo='Ventas General'
            onClick={() => setViewMode('ventas_general')}
            onExcel={() => { setViewMode('ventas_general'); setTimeout(handleExportReporte, 50) }}
          />
          <CardReporteAvanzado
            titulo='Ventas al Contado'
            onClick={() => setViewMode('ventas_contado')}
            onExcel={() => { setViewMode('ventas_contado'); setTimeout(handleExportReporte, 50) }}
          />
          <CardReporteAvanzado
            titulo='Ventas al Crédito'
            onClick={() => setViewMode('ventas_credito')}
            onExcel={() => { setViewMode('ventas_credito'); setTimeout(handleExportReporte, 50) }}
          />
          <CardReporteAvanzado
            titulo='Ventas por Vendedor'
            onClick={() => setViewMode('ventas_vendedor')}
            onExcel={() => { setViewMode('ventas_vendedor'); setTimeout(handleExportReporte, 50) }}
          />
          <CardReporteAvanzado
            titulo='Ventas por Cliente'
            onClick={() => setViewMode('ventas_cliente')}
            onExcel={() => { setViewMode('ventas_cliente'); setTimeout(handleExportReporte, 50) }}
          />
        </div>
      </div>

      {/* Exportar CONTASIS */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-1'>Exportar CONTASIS</h3>
        <p className='text-xs text-slate-400 mb-4'>
          Genera el archivo Excel en formato CONTASIS (Registro de Ventas) a partir de los comprobantes electrónicos emitidos.
        </p>
        <div className='bg-white rounded-lg border border-slate-200 p-5 space-y-4 max-w-lg'>
          <div>
            <label className='block text-sm font-medium text-slate-600 mb-1'>Rango de fechas</label>
            <RangePicker
              value={[dayjs(contasisDesde), dayjs(contasisHasta)]}
              onChange={(dates) => {
                if (dates?.[0] && dates?.[1]) {
                  setContasisDesde(dates[0].format('YYYY-MM-DD'))
                  setContasisHasta(dates[1].format('YYYY-MM-DD'))
                  setContasisResult(null)
                }
              }}
              format='DD/MM/YYYY'
              className='w-full'
            />
          </div>
          <Button
            type='primary'
            onClick={handleExportContasis}
            loading={exportingContasis}
            className='w-full'
          >
            Exportar Excel CONTASIS — Ventas
          </Button>
          {contasisResult && (
            <div className={`p-3 rounded-lg text-sm ${
              contasisResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              contasisResult.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {contasisResult.text}
            </div>
          )}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
