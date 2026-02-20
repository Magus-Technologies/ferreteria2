'use client'

import { useState, useMemo } from 'react'
import { FaBoxes, FaExclamationTriangle, FaCubes, FaArrowLeft } from 'react-icons/fa'
import { FaCartShopping } from 'react-icons/fa6'
import { MdInventory } from 'react-icons/md'
import { Select, DatePicker, Button, Checkbox } from 'antd'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'
import { inventarioReporteApi, type InventarioReporteFilters } from '~/lib/api/inventario-reporte'
import { marcasApi, categoriasApi } from '~/lib/api/catalogos'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { exportStockValorizadoToExcel, exportCantidadesVendidasToExcel } from '~/utils/export-inventario-excel'

type ViewMode = 'dashboard' | 'productos' | 'cantidades_vendidas' | 'stock_valorizado' | 'stock_bajo' | 'lista_precios' | 'stock_valorizado_fecha'

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

export default function ReporteInventarioPage() {
  const canAccess = usePermission(permissions.REPORTES_INVENTARIO_INDEX)
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [periodo, setPeriodo] = useState('anio_actual')
  const [tipoReporte, setTipoReporte] = useState<'ventas' | 'utilidad' | 'recurrencia'>('ventas')
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportResult, setExportResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  // Filtros para reportes avanzados
  const [rf, setRf] = useState({
    categoria_id: undefined as number | undefined,
    marca_id: undefined as number | undefined,
    ordenar_por: 'nombre' as string,
    soloConStock: false,
    stockMinimo: false,
    desde: dayjs().startOf('month').format('YYYY-MM-DD'),
    hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  })

  const fechasPeriodo = useMemo(() => getPeriodoFechas(periodo), [periodo])

  // Query: Top productos
  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: [QueryKeys.INVENTARIO_TOP_PRODUCTOS, almacen_id, fechasPeriodo, tipoReporte],
    queryFn: () => inventarioReporteApi.getTopProductos({
      almacen_id,
      desde: fechasPeriodo.desde,
      hasta: fechasPeriodo.hasta,
      tipo: tipoReporte,
      limit: 20,
    }),
    enabled: !!almacen_id,
  })

  // Query: Resumen KPI
  const { data: resumenData, isLoading: loadingResumen } = useQuery({
    queryKey: [QueryKeys.INVENTARIO_RESUMEN, almacen_id],
    queryFn: () => inventarioReporteApi.getResumen({ almacen_id }),
    enabled: !!almacen_id,
  })

  // Catálogos para selects
  const { data: marcasData } = useQuery({
    queryKey: [QueryKeys.MARCAS],
    queryFn: () => marcasApi.getAll(),
    enabled: viewMode !== 'dashboard',
  })

  const { data: categoriasData } = useQuery({
    queryKey: [QueryKeys.CATEGORIAS],
    queryFn: () => categoriasApi.getAll(),
    enabled: viewMode !== 'dashboard',
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
  const marcas = (marcasData?.data as any)?.data || []
  const categorias = (categoriasData?.data as any)?.data || []

  const topProductos = (topData?.data?.data || []).map((item, i) => ({
    name: `P${i + 1}`,
    fullName: item.producto,
    importe: item.importe,
    index: i,
  }))

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return 'S/. 0.00'
    return `S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getBarColor = (index: number) => {
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3']
    if (index < 5) return colors[0]
    if (index < 10) return colors[1]
    if (index < 15) return colors[2]
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
        case 'productos':
        case 'stock_valorizado':
        case 'stock_valorizado_fecha':
        case 'lista_precios': {
          const res = await inventarioReporteApi.getStockValorizado({
            almacen_id,
            categoria_id: rf.categoria_id,
            marca_id: rf.marca_id,
            con_stock: rf.soloConStock || undefined,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            const filtrosActivos = []
            if (rf.categoria_id) filtrosActivos.push('categoría')
            if (rf.marca_id) filtrosActivos.push('marca')
            if (rf.soloConStock) filtrosActivos.push('solo con stock')
            const detalle = filtrosActivos.length > 0
              ? ` con los filtros seleccionados (${filtrosActivos.join(', ')})`
              : ''
            setExportResult({ type: 'warning', text: `No se encontraron productos${detalle}. Intente con otros filtros.` })
            return
          }
          const titulos: Record<string, string> = {
            productos: 'REPORTE DE PRODUCTOS',
            stock_valorizado: 'STOCK VALORIZADO',
            stock_valorizado_fecha: 'STOCK VALORIZADO POR FECHA',
            lista_precios: 'LISTA DE PRECIOS',
          }
          exportStockValorizadoToExcel({
            items,
            nameFile: `${viewMode === 'lista_precios' ? 'Lista_Precios' : 'Stock_Valorizado'}_${dayjs().format('YYYYMMDD_HHmmss')}`,
            totalValorizado: res.data?.resumen?.total_valorizado,
            empresa,
            titulo: titulos[viewMode] || 'STOCK VALORIZADO',
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
        case 'cantidades_vendidas': {
          const res = await inventarioReporteApi.getCantidadesVendidas({
            almacen_id,
            desde: rf.desde,
            hasta: rf.hasta,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: 'No hay datos de ventas para exportar en el rango de fechas seleccionado.' })
            return
          }
          exportCantidadesVendidasToExcel({
            items,
            nameFile: `Cantidades_Vendidas_${dayjs().format('YYYYMMDD_HHmmss')}`,
            fechaDesde: dayjs(rf.desde).format('DD/MM/YYYY'),
            fechaHasta: dayjs(rf.hasta).format('DD/MM/YYYY'),
            empresa,
          })
          setExportResult({ type: 'success', text: 'Reporte exportado correctamente' })
          break
        }
        case 'stock_bajo': {
          const res = await inventarioReporteApi.getStockBajo({
            almacen_id,
            per_page: 10000,
          })
          const items = res.data?.data
          if (!items || items.length === 0) {
            setExportResult({ type: 'warning', text: 'No hay productos con stock bajo actualmente.' })
            return
          }
          exportStockValorizadoToExcel({
            items: items.map((p: any) => ({
              ...p,
              valor_total: Number(p.stock) * Number(p.costo_unitario),
            })),
            nameFile: `Stock_Bajo_${dayjs().format('YYYYMMDD_HHmmss')}`,
            empresa,
            titulo: 'PRODUCTOS CON STOCK BAJO',
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
      categoria_id: undefined,
      marca_id: undefined,
      ordenar_por: 'nombre',
      soloConStock: false,
      stockMinimo: false,
      desde: dayjs().startOf('month').format('YYYY-MM-DD'),
      hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
    })
  }

  // ==========================================
  // VISTAS DE REPORTES AVANZADOS
  // ==========================================
  if (viewMode !== 'dashboard') {
    const titles: Record<string, string> = {
      productos: 'REPORTE PRODUCTOS',
      cantidades_vendidas: 'REPORTE CANTIDADES VENDIDAS POR PRODUCTO',
      stock_valorizado: 'REPORTE STOCK VALORIZADO',
      stock_bajo: 'REPORTE PRODUCTOS CON STOCK BAJO',
      lista_precios: 'REPORTE LISTA DE PRECIOS',
      stock_valorizado_fecha: 'REPORTE STOCK VALORIZADO POR FECHA',
    }

    const showProductoFilters = ['productos', 'stock_valorizado', 'lista_precios', 'stock_valorizado_fecha'].includes(viewMode)
    const showFechas = ['cantidades_vendidas', 'stock_valorizado_fecha'].includes(viewMode)

    return (
      <ContenedorGeneral>
        <div className='w-full'>
          <div className='flex items-center gap-3 mb-6'>
            <button
              onClick={() => setViewMode('dashboard')}
              className='text-slate-500 hover:text-slate-700 transition-colors'
            >
              <FaArrowLeft size={18} />
            </button>
            <h2 className='font-bold text-slate-800 text-lg'>{titles[viewMode] || 'REPORTE'}</h2>
          </div>

          <div className='bg-white rounded-lg border border-slate-200 p-6 space-y-5'>
            {showProductoFilters && (
              <>
                {/* Categoría y Marca */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-600 mb-1'>Categoría:</label>
                    <Select
                      value={rf.categoria_id}
                      onChange={(val) => setRf((p) => ({ ...p, categoria_id: val }))}
                      placeholder='Todas las categorías'
                      allowClear
                      className='w-full'
                      options={categorias.map((c: any) => ({ value: c.id, label: c.name }))}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-600 mb-1'>Marca:</label>
                    <Select
                      value={rf.marca_id}
                      onChange={(val) => setRf((p) => ({ ...p, marca_id: val }))}
                      placeholder='Todas las marcas'
                      allowClear
                      className='w-full'
                      options={marcas.map((m: any) => ({ value: m.id, label: m.name }))}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-600 mb-1'>Ordenar Por:</label>
                    <Select
                      value={rf.ordenar_por}
                      onChange={(val) => setRf((p) => ({ ...p, ordenar_por: val }))}
                      className='w-full'
                      options={[
                        { value: 'nombre', label: 'NOMBRE PRODUCTO' },
                        { value: 'codigo', label: 'CÓDIGO PRODUCTO' },
                        { value: 'categoria', label: 'CATEGORÍA' },
                        { value: 'marca', label: 'MARCA' },
                      ]}
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className='flex flex-wrap gap-x-8 gap-y-2'>
                  <Checkbox
                    checked={rf.soloConStock}
                    onChange={(e) => setRf((p) => ({ ...p, soloConStock: e.target.checked }))}
                  >
                    Incluir solo productos con stock
                  </Checkbox>
                  <Checkbox
                    checked={rf.stockMinimo}
                    onChange={(e) => setRf((p) => ({ ...p, stockMinimo: e.target.checked }))}
                  >
                    Ver productos con stock mínimo
                  </Checkbox>
                </div>
              </>
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

            {/* Stock bajo: sin filtros adicionales, solo exportar */}
            {viewMode === 'stock_bajo' && (
              <p className='text-sm text-slate-500'>Se exportarán todos los productos cuyo stock actual sea menor al stock mínimo configurado.</p>
            )}

            <div className='flex gap-3 pt-2'>
              <Button
                type='primary'
                onClick={handleExportReporte}
                loading={exportingExcel}
              >
                Exportar
              </Button>
              <Button onClick={() => { handleLimpiar(); setExportResult(null) }}>
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
        title="Productos / Servicios"
        icon={<FaCartShopping className="text-teal-600" />}
      />

      {/* KPI Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 w-full'>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaCubes className='text-teal-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Productos</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-slate-800'>{resumen?.total_productos || 0}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaBoxes className='text-blue-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Stock Total</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-blue-600'>{Number(resumen?.total_stock || 0).toLocaleString('es-PE')}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <MdInventory className='text-green-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Valorización</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-green-600'>{formatMoney(resumen?.valorizacion_total)}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaExclamationTriangle className='text-orange-500' size={16} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Stock Bajo</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-orange-600'>{resumen?.productos_stock_bajo || 0}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaExclamationTriangle className='text-red-500' size={16} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Sin Stock</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-red-600'>{resumen?.productos_sin_stock || 0}</p>
          )}
        </div>
      </div>

      {/* Gráfico Top Productos */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Gráfico de Productos/Servicios</h3>
        <p className='text-xs text-slate-400 mb-2'>Top de Productos/Servicios por {periodo === 'anio_actual' ? 'Año actual' : periodo === 'mes_actual' ? 'Mes actual' : 'Semana actual'}</p>

        <div className='flex flex-wrap gap-3 mb-4 justify-end'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500'>Seleccionar periodo:</span>
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
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500'>Seleccionar tipo de reporte:</span>
            <Select
              value={tipoReporte}
              onChange={setTipoReporte}
              size='small'
              style={{ width: 140 }}
              options={[
                { value: 'ventas', label: 'Por ventas' },
                { value: 'utilidad', label: 'Por utilidad' },
                { value: 'recurrencia', label: 'Por recurrencia' },
              ]}
            />
          </div>
        </div>

        {loadingTop ? (
          <div className='h-[400px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>Cargando gráfico...</span>
          </div>
        ) : topProductos.length === 0 ? (
          <div className='h-[400px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>No hay datos de ventas en el periodo seleccionado</span>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={400}>
            <BarChart data={topProductos} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='name' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) =>
                  tipoReporte === 'recurrencia'
                    ? `${value} ventas`
                    : `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                }
                labelFormatter={(_label: string, payload: any[]) => payload?.[0]?.payload?.fullName || _label}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey='importe' name='Importe' radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey='importe'
                  position='top'
                  style={{ fontSize: 10, fill: '#475569' }}
                  formatter={(value: number) => Number(value).toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                />
                {topProductos.map((_, index) => (
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
            titulo='Productos'
            onClick={() => setViewMode('productos')}
          />
          <CardReporteAvanzado
            titulo='Cantidades Vendidas por Productos'
            onClick={() => setViewMode('cantidades_vendidas')}
          />
          <CardReporteAvanzado
            titulo='Stock Valorizado'
            onClick={() => setViewMode('stock_valorizado')}
          />
          <CardReporteAvanzado
            titulo='Stock Valorizado por Fecha'
            onClick={() => setViewMode('stock_valorizado_fecha')}
          />
          <CardReporteAvanzado
            titulo='Lista de Precios'
            onClick={() => setViewMode('lista_precios')}
          />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
