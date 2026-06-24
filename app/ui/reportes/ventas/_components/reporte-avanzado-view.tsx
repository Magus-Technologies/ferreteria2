'use client'

import { useState } from 'react'
import { FaArrowLeft, FaSearch } from 'react-icons/fa'
import { DatePicker, Button, Input } from 'antd'
import dayjs from 'dayjs'
import { useDebounce } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi, type GananciaDetalle } from '~/lib/api/ganancias'
import { exportReporteVentasToExcel } from '~/utils/export-reporte-ventas-excel'
import { useDownloadPdf } from '~/hooks/use-download-pdf'
import { useStoreAlmacen } from '~/store/store-almacen'
import DocReporteVentas from './doc-reporte-ventas'

const { RangePicker } = DatePicker

export type ViewMode =
  | 'ventas_general'
  | 'ventas_contado'
  | 'ventas_credito'
  | 'ventas_vendedor'
  | 'ventas_cliente'

const TITLES: Record<ViewMode, string> = {
  ventas_general:  'REPORTE DE VENTAS GENERAL',
  ventas_contado:  'REPORTE DE VENTAS AL CONTADO',
  ventas_credito:  'REPORTE DE VENTAS AL CRÉDITO',
  ventas_vendedor: 'REPORTE DE VENTAS POR VENDEDOR',
  ventas_cliente:  'REPORTE DE VENTAS POR CLIENTE',
}

const FILTROS: Partial<Record<ViewMode, Record<string, string>>> = {
  ventas_contado: { forma_pago: 'co' },
  ventas_credito: { forma_pago: 'cr' },
}

type EmpresaInfo = { razon_social?: string; ruc?: string; direccion?: string }
type ResultState = { type: 'success' | 'warning' | 'error'; text: string }

type Props = {
  tipo: ViewMode
  almacenId: number
  empresaInfo?: EmpresaInfo
}

function fmt(val?: number) {
  return `S/. ${Number(val ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(val?: number) {
  return Number(val ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReporteAvanzadoView({ tipo, almacenId, empresaInfo }: Props) {
  const router = useRouter()
  const almacen_id = useStoreAlmacen((s) => s.almacen_id)
  const effectiveAlmacenId = almacen_id ?? almacenId

  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [hasta, setHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  const { downloadPdf } = useDownloadPdf()

  const filtrosBase = FILTROS[tipo] ?? {}

  // El backend filtra por documento / razÃ³n social / nombre del cliente con `search`.
  const [searchDebounced] = useDebounce(search.trim(), search.trim() === '' ? 0 : 500)
  const searchFiltro = searchDebounced.length >= 2 ? { search: searchDebounced } : {}

  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ['reporte-avanzado-preview', tipo, effectiveAlmacenId, desde, hasta, searchDebounced],
    queryFn: () =>
      gananciasApi.getGanancias({
        almacen_id: effectiveAlmacenId,
        desde,
        hasta,
        ...filtrosBase,
        ...searchFiltro,
        per_page: 100,
      }),
  })

  const rows   = previewData?.data?.data ?? []
  const resumen = previewData?.data?.resumen

  // Trae todos los registros del rango/filtros para exportar (Excel o PDF).
  const fetchItemsParaExportar = async () => {
    const res = await gananciasApi.getGanancias({
      almacen_id: effectiveAlmacenId,
      desde,
      hasta,
      ...filtrosBase,
      ...searchFiltro,
      per_page: 10000,
    })
    return res
  }

  const handleExport = async () => {
    setExporting(true)
    setResult(null)
    try {
      const res = await fetchItemsParaExportar()
      const items = res.data?.data
      if (!items?.length) {
        setResult({ type: 'warning', text: 'No hay ventas en el rango de fechas seleccionado.' })
        return
      }
      exportReporteVentasToExcel({
        items,
        resumen: res.data?.resumen,
        nameFile: `${tipo}_${dayjs().format('YYYYMMDD_HHmmss')}`,
        fechaDesde: dayjs(desde).format('DD/MM/YYYY'),
        fechaHasta: dayjs(hasta).format('DD/MM/YYYY'),
        empresa: empresaInfo,
        titulo: TITLES[tipo],
      })
      setResult({ type: 'success', text: 'Reporte exportado correctamente.' })
    } catch {
      setResult({ type: 'error', text: 'Error al generar el reporte. Intente nuevamente.' })
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    setResult(null)
    try {
      const res = await fetchItemsParaExportar()
      const items = res.data?.data
      if (!items?.length) {
        setResult({ type: 'warning', text: 'No hay ventas en el rango de fechas seleccionado.' })
        return
      }
      await downloadPdf(
        <DocReporteVentas
          items={items}
          resumen={res.data?.resumen}
          titulo={TITLES[tipo]}
          fechaDesde={dayjs(desde).format('DD/MM/YYYY')}
          fechaHasta={dayjs(hasta).format('DD/MM/YYYY')}
          empresa={empresaInfo}
        />,
        `${tipo}_${dayjs().format('YYYYMMDD_HHmmss')}`,
      )
      setResult({ type: 'success', text: 'PDF generado correctamente.' })
    } catch {
      setResult({ type: 'error', text: 'Error al generar el PDF. Intente nuevamente.' })
    } finally {
      setExportingPdf(false)
    }
  }

  const showVendedor = tipo === 'ventas_vendedor'
  const showFPago    = tipo === 'ventas_general'

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-5'>
        <button
          onClick={() => router.push('/ui/reportes/ventas')}
          className='text-slate-500 hover:text-slate-700 transition-colors'
        >
          <FaArrowLeft size={18} />
        </button>
        <h2 className='font-bold text-slate-800 text-lg'>{TITLES[tipo]}</h2>
      </div>

      {/* Filtros + Export */}
      <div className='bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap items-end gap-4 mb-5'>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>Rango de fechas</label>
          <RangePicker
            value={[dayjs(desde), dayjs(hasta)]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDesde(dates[0].format('YYYY-MM-DD'))
                setHasta(dates[1].format('YYYY-MM-DD'))
                setResult(null)
              }
            }}
            format='DD/MM/YYYY'
            size='middle'
          />
        </div>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>Buscar cliente</label>
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setResult(null) }}
            placeholder='Documento, razón social o nombre'
            allowClear
            prefix={<FaSearch className='text-slate-400 mr-1' />}
            className='w-[280px]'
          />
        </div>
        <Button type='primary' onClick={handleExport} loading={exporting}>
          Exportar Excel
        </Button>
        <Button onClick={handleExportPdf} loading={exportingPdf} danger>
          Descargar PDF
        </Button>
        <Button onClick={() => {
          setDesde(dayjs().startOf('month').format('YYYY-MM-DD'))
          setHasta(dayjs().endOf('month').format('YYYY-MM-DD'))
          setSearch('')
          setResult(null)
        }}>
          Limpiar
        </Button>

        {result && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            result.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            result.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.text}
          </div>
        )}
      </div>

      {/* Resumen KPI */}
      {resumen && !loadingPreview && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5'>
          <div className='bg-white rounded-lg border border-slate-200 p-3'>
            <span className='text-xs text-slate-500 uppercase font-semibold'>Total Ventas</span>
            <p className='text-base font-bold text-slate-800 mt-0.5'>{fmt(resumen.ventas)}</p>
          </div>
          <div className='bg-white rounded-lg border border-slate-200 p-3'>
            <span className='text-xs text-slate-500 uppercase font-semibold'>Ganancia</span>
            <p className='text-base font-bold text-green-600 mt-0.5'>{fmt(resumen.ganancia)}</p>
          </div>
          <div className='bg-white rounded-lg border border-slate-200 p-3'>
            <span className='text-xs text-slate-500 uppercase font-semibold'>Costo</span>
            <p className='text-base font-bold text-slate-500 mt-0.5'>{fmt(resumen.costo)}</p>
          </div>
          <div className='bg-white rounded-lg border border-slate-200 p-3'>
            <span className='text-xs text-slate-500 uppercase font-semibold'>Registros</span>
            <p className='text-base font-bold text-blue-600 mt-0.5'>{resumen.total_transacciones}</p>
          </div>
        </div>
      )}

      {/* Tabla preview */}
      <div className='bg-white rounded-lg border border-slate-200 overflow-hidden'>
        <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
          <span className='text-sm font-semibold text-slate-700'>
            Vista previa
            {rows.length > 0 && (
              <span className='ml-2 text-xs font-normal text-slate-400'>
                (mostrando {rows.length} de {resumen?.total_transacciones ?? rows.length} registros)
              </span>
            )}
          </span>
        </div>

        {loadingPreview ? (
          <div className='h-48 flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>Cargando datos...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className='h-48 flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>No hay registros en el rango seleccionado</span>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr className='bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-left'>
                  <th className='px-3 py-2 font-semibold whitespace-nowrap'>Fecha</th>
                  <th className='px-3 py-2 font-semibold whitespace-nowrap'>Doc.</th>
                  <th className='px-3 py-2 font-semibold whitespace-nowrap min-w-[140px]'>Cliente</th>
                  {showVendedor && <th className='px-3 py-2 font-semibold whitespace-nowrap min-w-[120px]'>Vendedor</th>}
                  {showFPago    && <th className='px-3 py-2 font-semibold whitespace-nowrap'>F.Pago</th>}
                  <th className='px-3 py-2 font-semibold whitespace-nowrap min-w-[130px]'>Producto</th>
                  <th className='px-3 py-2 font-semibold text-right whitespace-nowrap'>Cant.</th>
                  <th className='px-3 py-2 font-semibold text-right whitespace-nowrap'>P.Unit</th>
                  <th className='px-3 py-2 font-semibold text-right whitespace-nowrap'>Subtotal</th>
                  <th className='px-3 py-2 font-semibold text-right whitespace-nowrap'>Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: GananciaDetalle, i) => (
                  <tr
                    key={`${row.id}-${i}`}
                    className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-3 py-1.5 whitespace-nowrap text-slate-600'>
                      {/* El backend ya entrega la fecha como DD/MM/YYYY */}
                      {row.fecha}
                    </td>
                    <td className='px-3 py-1.5 whitespace-nowrap text-slate-500'>
                      {row.tipo_doc} {row.numero}
                    </td>
                    <td className='px-3 py-1.5 text-slate-700 max-w-[180px] truncate'>{row.cliente}</td>
                    {showVendedor && (
                      <td className='px-3 py-1.5 text-slate-600 max-w-[140px] truncate'>{row.vendedor}</td>
                    )}
                    {showFPago && (
                      <td className='px-3 py-1.5 whitespace-nowrap'>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          row.f_pago === 'co'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {row.f_pago === 'co' ? 'Contado' : row.f_pago === 'cr' ? 'Crédito' : row.f_pago}
                        </span>
                      </td>
                    )}
                    <td className='px-3 py-1.5 text-slate-700 max-w-[160px] truncate'>{row.producto}</td>
                    <td className='px-3 py-1.5 text-right text-slate-600'>{fmtNum(row.cant)}</td>
                    <td className='px-3 py-1.5 text-right text-slate-600'>{fmtNum(row.p_unit)}</td>
                    <td className='px-3 py-1.5 text-right font-medium text-slate-800'>{fmtNum(row.subtot)}</td>
                    <td className={`px-3 py-1.5 text-right font-medium ${
                      Number(row.ganancia) >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {fmtNum(row.ganancia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
