'use client'

import { useState, useMemo } from 'react'
import { FaUsers, FaUserPlus, FaUserTimes, FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa'
import { FaBuilding, FaUserLarge } from 'react-icons/fa6'
import { MdPeople } from 'react-icons/md'
import { Select, DatePicker, Button } from 'antd'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'
import { clienteReporteApi } from '~/lib/api/cliente-reporte'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { exportListadoClientesToExcel, exportPorCobrarToExcel, exportFrecuentesToExcel } from '~/utils/export-clientes-excel'

type ViewMode = 'dashboard' | 'clientes' | 'por_cobrar' | 'frecuentes' | 'recientes' | 'ranking'

function getPeriodoFechas(periodo: string) {
  switch (periodo) {
    case 'mes_actual':
      return {
        desde: dayjs().startOf('month').format('YYYY-MM-DD'),
        hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
      }
    case 'semana_actual':
      return {
        desde: dayjs().startOf('week').format('YYYY-MM-DD'),
        hasta: dayjs().endOf('week').format('YYYY-MM-DD'),
      }
    default:
      return {
        desde: dayjs().startOf('year').format('YYYY-MM-DD'),
        hasta: dayjs().endOf('year').format('YYYY-MM-DD'),
      }
  }
}

export default function ReporteClientesPage() {
  const canAccess = usePermission(permissions.REPORTES_CLIENTES_INDEX)
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [periodo, setPeriodo] = useState('anio_actual')
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportResult, setExportResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  // Filtros para reportes avanzados
  const [rf, setRf] = useState({
    tipo_cliente: undefined as string | undefined,
    estado: undefined as string | undefined,
    dias: 30 as number,
    desde: dayjs().startOf('year').format('YYYY-MM-DD'),
    hasta: dayjs().endOf('year').format('YYYY-MM-DD'),
  })

  const fechasPeriodo = useMemo(() => getPeriodoFechas(periodo), [periodo])

  // Query: Top clientes
  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: [QueryKeys.CLIENTES_TOP, almacen_id, fechasPeriodo],
    queryFn: () => clienteReporteApi.getTopClientes({
      almacen_id,
      desde: fechasPeriodo.desde,
      hasta: fechasPeriodo.hasta,
      limit: 10,
    }),
    enabled: !!almacen_id,
  })

  // Query: Resumen KPI
  const { data: resumenData, isLoading: loadingResumen } = useQuery({
    queryKey: [QueryKeys.CLIENTES_RESUMEN, almacen_id],
    queryFn: () => clienteReporteApi.getResumen({ almacen_id }),
    enabled: !!almacen_id,
  })

  // Query: Empresa para header Excel
  const { data: empresaData } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, 1],
    queryFn: () => empresaApi.getById(1),
  })

  if (!canAccess) return <NoAutorizado />

  const resumen = resumenData?.data?.data
  const empresaInfo = empresaData?.data?.data
  const empresa = empresaInfo ? { razon_social: empresaInfo.razon_social, ruc: empresaInfo.ruc, direccion: empresaInfo.direccion } : undefined

  const topClientes = (topData?.data?.data || []).map((item, i) => ({
    name: `C${i + 1}`,
    fullName: item.nombre,
    monto: item.total_compras,
    ventas: item.num_ventas,
    index: i,
  }))

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return 'S/. 0.00'
    return `S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getBarColor = (index: number) => {
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
    if (index < 3) return colors[0]
    if (index < 6) return colors[1]
    if (index < 8) return colors[2]
    return colors[3]
  }

  // ==========================================
  // EXPORTAR REPORTE
  // ==========================================
  const handleExportReporte = async () => {
    setExportingExcel(true)
    setExportResult(null)
    try {
      switch (viewMode) {
        case 'clientes':
        case 'ranking': {
          const res = await clienteReporteApi.getListado({
            tipo_cliente: rf.tipo_cliente,
            estado: rf.estado,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: 'No se encontraron clientes con los filtros seleccionados.' })
            return
          }
          const titulos: Record<string, string> = {
            clientes: 'LISTADO DE CLIENTES',
            ranking: 'RANKING DE CLIENTES POR COMPRAS',
          }
          exportListadoClientesToExcel({
            items,
            nameFile: `${viewMode === 'ranking' ? 'Ranking_Clientes' : 'Listado_Clientes'}_${dayjs().format('YYYYMMDD_HHmmss')}`,
            empresa,
            titulo: titulos[viewMode],
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
        case 'por_cobrar': {
          const res = await clienteReporteApi.getPorCobrar({
            almacen_id,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: 'No hay clientes con deuda pendiente.' })
            return
          }
          exportPorCobrarToExcel({
            items,
            nameFile: `Cuentas_por_Cobrar_${dayjs().format('YYYYMMDD_HHmmss')}`,
            empresa,
            resumen: res.data?.resumen,
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
        case 'frecuentes': {
          const res = await clienteReporteApi.getFrecuentes({
            almacen_id,
            desde: rf.desde,
            hasta: rf.hasta,
            limit: 50,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: 'No se encontraron clientes frecuentes en el rango de fechas seleccionado.' })
            return
          }
          exportFrecuentesToExcel({
            items,
            nameFile: `Clientes_Frecuentes_${dayjs().format('YYYYMMDD_HHmmss')}`,
            empresa,
            fechaDesde: dayjs(rf.desde).format('DD/MM/YYYY'),
            fechaHasta: dayjs(rf.hasta).format('DD/MM/YYYY'),
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
        case 'recientes': {
          const res = await clienteReporteApi.getRecientes({
            dias: rf.dias,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: `No se encontraron clientes registrados en los últimos ${rf.dias} días.` })
            return
          }
          exportListadoClientesToExcel({
            items: items.map((c: any) => ({ ...c, total_ventas: c.total_ventas || 0, total_compras: 0 })),
            nameFile: `Clientes_Recientes_${dayjs().format('YYYYMMDD_HHmmss')}`,
            empresa,
            titulo: `NUEVOS CLIENTES - ÚLTIMOS ${rf.dias} DÍAS`,
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
      }
    } catch {
      setExportResult({ type: 'error', text: 'Error al generar el reporte. Intente nuevamente.' })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleLimpiar = () => {
    setRf({
      tipo_cliente: undefined,
      estado: undefined,
      dias: 30,
      desde: dayjs().startOf('year').format('YYYY-MM-DD'),
      hasta: dayjs().endOf('year').format('YYYY-MM-DD'),
    })
    setExportResult(null)
  }

  // ==========================================
  // VISTAS DE REPORTES AVANZADOS
  // ==========================================
  if (viewMode !== 'dashboard') {
    const titles: Record<string, string> = {
      clientes: 'REPORTE LISTADO DE CLIENTES',
      por_cobrar: 'REPORTE CUENTAS POR COBRAR',
      frecuentes: 'REPORTE CLIENTES FRECUENTES',
      recientes: 'REPORTE CLIENTES RECIENTES',
      ranking: 'REPORTE RANKING DE CLIENTES',
    }

    const showTipoEstado = ['clientes', 'ranking'].includes(viewMode)
    const showFechas = viewMode === 'frecuentes'
    const showDias = viewMode === 'recientes'

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
            <h2 className='font-bold text-slate-800 text-lg'>{titles[viewMode] || 'REPORTE'}</h2>
          </div>

          <div className='bg-white rounded-lg border border-slate-200 p-6 space-y-5'>
            {showTipoEstado && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>Tipo de Cliente:</label>
                  <Select
                    value={rf.tipo_cliente}
                    onChange={(val) => setRf((p) => ({ ...p, tipo_cliente: val }))}
                    placeholder='Todos'
                    allowClear
                    className='w-full'
                    options={[
                      { value: 'p', label: 'DNI (Persona Natural)' },
                      { value: 'e', label: 'RUC (Empresa)' },
                    ]}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>Estado:</label>
                  <Select
                    value={rf.estado}
                    onChange={(val) => setRf((p) => ({ ...p, estado: val }))}
                    placeholder='Todos'
                    allowClear
                    className='w-full'
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                    ]}
                  />
                </div>
              </div>
            )}

            {showFechas && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>Fecha Inicio:</label>
                  <DatePicker
                    value={dayjs(rf.desde)}
                    onChange={(date) => date && setRf((p) => ({ ...p, desde: date.format('YYYY-MM-DD') }))}
                    format='YYYY-MM-DD'
                    className='w-full'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>Fecha Fin:</label>
                  <DatePicker
                    value={dayjs(rf.hasta)}
                    onChange={(date) => date && setRf((p) => ({ ...p, hasta: date.format('YYYY-MM-DD') }))}
                    format='YYYY-MM-DD'
                    className='w-full'
                  />
                </div>
              </div>
            )}

            {showDias && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>Últimos días:</label>
                  <Select
                    value={rf.dias}
                    onChange={(val) => setRf((p) => ({ ...p, dias: val }))}
                    className='w-full'
                    options={[
                      { value: 7, label: 'Últimos 7 días' },
                      { value: 15, label: 'Últimos 15 días' },
                      { value: 30, label: 'Últimos 30 días' },
                      { value: 60, label: 'Últimos 60 días' },
                      { value: 90, label: 'Últimos 90 días' },
                      { value: 180, label: 'Últimos 180 días' },
                      { value: 365, label: 'Último año' },
                    ]}
                  />
                </div>
              </div>
            )}

            {viewMode === 'por_cobrar' && (
              <p className='text-sm text-slate-500'>Se exportarán todos los clientes con saldo pendiente de pago (ventas al crédito).</p>
            )}

            <div className='flex gap-3 pt-2'>
              <Button
                type='primary'
                onClick={handleExportReporte}
                loading={exportingExcel}
              >
                Exportar
              </Button>
              <Button onClick={handleLimpiar}>
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
        title="Clientes"
        icon={<FaUsers className="text-blue-500" />}
      />

      {/* KPI Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 w-full'>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <MdPeople className='text-blue-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Total Clientes</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-slate-800'>{resumen?.total_clientes || 0}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaUserLarge className='text-green-500' size={14} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Activos</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-green-600'>{resumen?.clientes_activos || 0}</p>
          )}
          {!loadingResumen && (
            <div className='flex gap-3 mt-1'>
              <span className='text-[10px] text-slate-400'>
                <FaUserLarge className='inline mr-0.5' size={8} /> {resumen?.clientes_persona || 0} Personas
              </span>
              <span className='text-[10px] text-slate-400'>
                <FaBuilding className='inline mr-0.5' size={8} /> {resumen?.clientes_empresa || 0} Empresas
              </span>
            </div>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaMoneyBillWave className='text-red-500' size={16} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Por Cobrar</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <>
              <p className='text-lg font-bold text-red-600'>{formatMoney(resumen?.total_por_cobrar)}</p>
              <span className='text-[10px] text-slate-400'>{resumen?.clientes_con_deuda || 0} clientes con deuda</span>
            </>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaUserPlus className='text-purple-500' size={16} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Nuevos (30d)</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <>
              <p className='text-lg font-bold text-purple-600'>{resumen?.nuevos_30_dias || 0}</p>
              <span className='text-[10px] text-slate-400'>
                <FaUserTimes className='inline mr-0.5' size={8} /> {resumen?.clientes_inactivos || 0} inactivos
              </span>
            </>
          )}
        </div>
      </div>

      {/* Gráfico Top Clientes */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Top Clientes</h3>
        <p className='text-xs text-slate-400 mb-2'>Clientes con mayor monto de compras</p>

        <div className='flex flex-wrap gap-3 mb-4 justify-end'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500'>Periodo:</span>
            <Select
              value={periodo}
              onChange={setPeriodo}
              size='small'
              style={{ width: 140 }}
              options={[
                { value: 'anio_actual', label: 'Año actual' },
                { value: 'mes_actual', label: 'Mes actual' },
                { value: 'semana_actual', label: 'Semana actual' },
              ]}
            />
          </div>
        </div>

        {loadingTop ? (
          <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>Cargando gráfico...</span>
          </div>
        ) : topClientes.length === 0 ? (
          <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>No hay datos de clientes en el periodo seleccionado</span>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <BarChart data={topClientes} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='name' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                labelFormatter={(_label: string, payload: readonly any[]) => payload?.[0]?.payload?.fullName || _label}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey='monto' name='Monto' radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey='monto'
                  position='top'
                  style={{ fontSize: 10, fill: '#475569' }}
                  formatter={(value: any) => Number(value).toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                />
                {topClientes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          <CardReporteAvanzado
            titulo='Listado de Clientes'
            onClick={() => setViewMode('clientes')}
          />
          <CardReporteAvanzado
            titulo='Cuentas por Cobrar'
            onClick={() => setViewMode('por_cobrar')}
          />
          <CardReporteAvanzado
            titulo='Clientes Frecuentes'
            onClick={() => setViewMode('frecuentes')}
          />
          <CardReporteAvanzado
            titulo='Clientes Recientes'
            onClick={() => setViewMode('recientes')}
          />
          <CardReporteAvanzado
            titulo='Ranking de Clientes'
            onClick={() => setViewMode('ranking')}
          />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
