'use client'

import { useState } from 'react'
import { FaTruck, FaCheckCircle, FaSpinner, FaBan, FaClock } from 'react-icons/fa'
import { DatePicker, Button, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { exportReporteEntregasToExcel } from '~/utils/export-reporte-entregas-excel'

const { RangePicker } = DatePicker

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pe', label: 'Pendiente' },
  { value: 'ec', label: 'En Camino' },
  { value: 'en', label: 'Entregado' },
  { value: 'ca', label: 'Cancelado' },
]

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'rt', label: 'En Tienda' },
  { value: 'de', label: 'Domicilio' },
  { value: 'pa', label: 'Parcial' },
]

export default function ReporteEntregasPage() {
  const canAccess = usePermission(permissions.REPORTES_INDEX)

  const [desde, setDesde] = useState(dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'))
  const [hasta, setHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [estado, setEstado] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  const { data: reporteData, isLoading } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'reporte', desde, hasta, estado, tipoEntrega],
    queryFn: () => entregasNuevasApi.reporte({
      fecha_desde: desde,
      fecha_hasta: hasta,
      estado: estado || undefined,
      tipo_entrega: tipoEntrega || undefined,
      per_page: 10000,
    }),
  })

  const { data: empresaData } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, 1],
    queryFn: () => empresaApi.getById(1),
  })

  if (!canAccess) return <NoAutorizado />

  const empresa = empresaData?.data?.data
  const empresaInfo = empresa ? { razon_social: empresa.razon_social, ruc: empresa.ruc, direccion: empresa.direccion } : undefined

  const resumen = (reporteData?.data as any)?.resumen
  const items = (reporteData?.data as any)?.data || []

  const kpiCards = [
    { label: 'Total', value: resumen?.total ?? 0, color: 'text-slate-700', icon: <FaTruck className="text-slate-400" /> },
    { label: 'Pendientes', value: resumen?.pendientes ?? 0, color: 'text-orange-600', icon: <FaClock className="text-orange-400" /> },
    { label: 'En Camino', value: resumen?.en_camino ?? 0, color: 'text-blue-600', icon: <FaTruck className="text-blue-400" /> },
    { label: 'Entregadas', value: resumen?.entregadas ?? 0, color: 'text-green-600', icon: <FaCheckCircle className="text-green-400" /> },
    { label: 'Canceladas', value: resumen?.canceladas ?? 0, color: 'text-red-600', icon: <FaBan className="text-red-400" /> },
    { label: 'En Tienda', value: resumen?.en_tienda ?? 0, color: 'text-cyan-600', icon: null },
    { label: 'Domicilio', value: resumen?.domicilio ?? 0, color: 'text-purple-600', icon: null },
    { label: 'Parciales', value: resumen?.parciales ?? 0, color: 'text-amber-600', icon: null },
  ]

  const handleExport = async () => {
    setExporting(true)
    setExportResult(null)
    try {
      if (!items || items.length === 0) {
        setExportResult({ type: 'warning', text: 'No hay entregas para exportar en el rango seleccionado.' })
        return
      }
      exportReporteEntregasToExcel({
        items,
        resumen,
        nameFile: `Entregas_${dayjs().format('YYYYMMDD_HHmmss')}`,
        fechaDesde: dayjs(desde).format('DD/MM/YYYY'),
        fechaHasta: dayjs(hasta).format('DD/MM/YYYY'),
        empresa: empresaInfo,
      })
      setExportResult({ type: 'success', text: 'Reporte exportado correctamente.' })
    } catch {
      setExportResult({ type: 'error', text: 'Error al exportar. Intente nuevamente.' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Entregas"
        icon={<FaTruck className="text-indigo-500" />}
      />

      {/* Filtros */}
      <div className='flex flex-wrap items-center gap-3 mt-4 w-full'>
        <RangePicker
          value={[dayjs(desde), dayjs(hasta)]}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDesde(dates[0].format('YYYY-MM-DD'))
              setHasta(dates[1].format('YYYY-MM-DD'))
            }
          }}
          format='DD/MM/YYYY'
          size='middle'
          className='w-64'
        />
        <Select
          value={estado}
          onChange={setEstado}
          options={ESTADO_OPTIONS}
          style={{ width: 180 }}
          size='middle'
        />
        <Select
          value={tipoEntrega}
          onChange={setTipoEntrega}
          options={TIPO_OPTIONS}
          style={{ width: 180 }}
          size='middle'
        />
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4 w-full'>
        {kpiCards.map((k) => (
          <div key={k.label} className='bg-white rounded-lg border border-slate-200 p-3 text-center'>
            <p className='text-xs text-slate-500 uppercase font-semibold mb-1'>{k.label}</p>
            {isLoading ? (
              <div className='h-6 bg-slate-100 rounded animate-pulse' />
            ) : (
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className='bg-white rounded-lg border border-slate-200 mt-6 w-full overflow-hidden'>
        <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
          <h3 className='font-bold text-slate-700 text-sm uppercase'>Listado de Entregas</h3>
          <div className='flex items-center gap-3'>
            {exportResult && (
              <span className={`text-xs ${exportResult.type === 'success' ? 'text-green-600' : exportResult.type === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                {exportResult.text}
              </span>
            )}
            <Button
              type='primary'
              size='small'
              onClick={handleExport}
              loading={exporting}
              disabled={isLoading || items.length === 0}
            >
              Exportar Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center h-40'>
            <FaSpinner className='animate-spin text-slate-400' size={24} />
          </div>
        ) : items.length === 0 ? (
          <div className='flex items-center justify-center h-40 text-slate-400 text-sm'>
            No hay entregas en el rango seleccionado
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead className='bg-slate-50 text-slate-600 uppercase text-[10px]'>
                <tr>
                  <th className='text-left px-3 py-2'>N° Venta</th>
                  <th className='text-left px-3 py-2'>Cliente</th>
                  <th className='text-left px-3 py-2'>Tipo</th>
                  <th className='text-left px-3 py-2'>Estado</th>
                  <th className='text-left px-3 py-2'>Chofer</th>
                  <th className='text-left px-3 py-2'>Dirección</th>
                  <th className='text-left px-3 py-2'>F. Creación</th>
                  <th className='text-left px-3 py-2'>F. Ejecución</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 200).map((item: any, i: number) => (
                  <tr key={item.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className='px-3 py-2 font-mono font-semibold text-blue-700'>{item.venta_numero || '—'}</td>
                    <td className='px-3 py-2 max-w-[180px] truncate'>{item.cliente || '—'}</td>
                    <td className='px-3 py-2'>{item.tipo_entrega_nombre || '—'}</td>
                    <td className='px-3 py-2'>
                      <span className={`font-semibold ${
                        item.estado_codigo === 'en' ? 'text-green-600' :
                        item.estado_codigo === 'ec' ? 'text-blue-600' :
                        item.estado_codigo === 'ca' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {item.estado_nombre || item.estado_codigo || '—'}
                      </span>
                    </td>
                    <td className='px-3 py-2'>{item.chofer || '—'}</td>
                    <td className='px-3 py-2 max-w-[200px] truncate'>{item.direccion_entrega || '—'}</td>
                    <td className='px-3 py-2'>{item.fecha_creacion ? dayjs(item.fecha_creacion).format('DD/MM/YY') : '—'}</td>
                    <td className='px-3 py-2'>{item.fecha_ejecutada ? dayjs(item.fecha_ejecutada).format('DD/MM/YY HH:mm') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 200 && (
              <p className='text-xs text-slate-400 text-center py-2'>
                Mostrando 200 de {items.length} registros. Exportá el Excel para ver todos.
              </p>
            )}
          </div>
        )}
      </div>
    </ContenedorGeneral>
  )
}
