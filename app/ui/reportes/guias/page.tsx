'use client'

import { useState } from 'react'
import { FaTruck, FaSpinner } from 'react-icons/fa'
import { MdLocalShipping } from 'react-icons/md'
import { DatePicker, Button, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { guiaRemisionApi, type GuiaRemisionFilters } from '~/lib/api/guia-remision'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { exportReporteGuiasToExcel } from '~/utils/export-reporte-guias-excel'

const { RangePicker } = DatePicker

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EMITIDA', label: 'Emitida' },
  { value: 'ANULADA', label: 'Anulada' },
]

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ELECTRONICA_REMITENTE', label: 'GRE Remitente' },
  { value: 'ELECTRONICA_TRANSPORTISTA', label: 'GRE Transportista' },
]

export default function ReporteGuiasPage() {
  const canAccess = usePermission(permissions.REPORTES_INDEX)

  const [desde, setDesde] = useState(dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'))
  const [hasta, setHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [estado, setEstado] = useState('')
  const [tipoGuia, setTipoGuia] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  const filtros: GuiaRemisionFilters = {
    fecha_emision_desde: desde,
    fecha_emision_hasta: hasta,
    estado: estado as any || undefined,
    tipo_guia: tipoGuia as any || undefined,
    per_page: 100,
  }

  const { data: guiasData, isLoading } = useQuery({
    queryKey: [QueryKeys.GUIAS_REMISION, filtros],
    queryFn: () => guiaRemisionApi.list(filtros),
  })

  const { data: empresaData } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, 1],
    queryFn: () => empresaApi.getById(1),
  })

  if (!canAccess) return <NoAutorizado />

  const empresa = empresaData?.data?.data
  const empresaInfo = empresa ? { razon_social: empresa.razon_social, ruc: empresa.ruc, direccion: empresa.direccion } : undefined

  const guias = (guiasData?.data as any)?.data || []
  const total = (guiasData?.data as any)?.total ?? guias.length

  // KPIs calculados en cliente
  const borrador = guias.filter((g: any) => g.estado === 'BORRADOR').length
  const emitidas = guias.filter((g: any) => g.estado === 'EMITIDA').length
  const anuladas = guias.filter((g: any) => g.estado === 'ANULADA').length

  const handleExport = async () => {
    setExporting(true)
    setExportResult(null)
    try {
      if (!guias || guias.length === 0) {
        setExportResult({ type: 'warning', text: 'No hay guías para exportar en el rango seleccionado.' })
        return
      }
      exportReporteGuiasToExcel({
        items: guias,
        nameFile: `Guias_Remision_${dayjs().format('YYYYMMDD_HHmmss')}`,
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
        title="Guías de Remisión"
        icon={<MdLocalShipping className="text-cyan-600" />}
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
          value={tipoGuia}
          onChange={setTipoGuia}
          options={TIPO_OPTIONS}
          style={{ width: 200 }}
          size='middle'
        />
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 w-full'>
        {[
          { label: 'Total', value: total, color: 'text-slate-700' },
          { label: 'Borradores', value: borrador, color: 'text-slate-500' },
          { label: 'Emitidas', value: emitidas, color: 'text-green-600' },
          { label: 'Anuladas', value: anuladas, color: 'text-red-600' },
        ].map((k) => (
          <div key={k.label} className='bg-white rounded-lg border border-slate-200 p-4 text-center'>
            <p className='text-xs text-slate-500 uppercase font-semibold mb-1'>{k.label}</p>
            {isLoading ? (
              <div className='h-6 bg-slate-100 rounded animate-pulse' />
            ) : (
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className='bg-white rounded-lg border border-slate-200 mt-6 w-full overflow-hidden'>
        <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
          <h3 className='font-bold text-slate-700 text-sm uppercase'>
            Listado de Guías {total > guias.length ? `(mostrando ${guias.length} de ${total})` : `(${total})`}
          </h3>
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
              disabled={isLoading || guias.length === 0}
            >
              Exportar Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center h-40'>
            <FaSpinner className='animate-spin text-slate-400' size={24} />
          </div>
        ) : guias.length === 0 ? (
          <div className='flex items-center justify-center h-40 text-slate-400 text-sm'>
            No hay guías en el rango seleccionado
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead className='bg-slate-50 text-slate-600 uppercase text-[10px]'>
                <tr>
                  <th className='text-left px-3 py-2'>Serie-Núm.</th>
                  <th className='text-left px-3 py-2'>F. Emisión</th>
                  <th className='text-left px-3 py-2'>F. Traslado</th>
                  <th className='text-left px-3 py-2'>Estado</th>
                  <th className='text-left px-3 py-2'>Tipo</th>
                  <th className='text-left px-3 py-2'>Cliente</th>
                  <th className='text-left px-3 py-2'>N° Venta</th>
                  <th className='text-left px-3 py-2'>Motivo</th>
                  <th className='text-left px-3 py-2'>Almacén Origen</th>
                </tr>
              </thead>
              <tbody>
                {guias.map((g: any, i: number) => {
                  const serieNum = g.serie && g.numero ? `${g.serie}-${g.numero}` : g.id || '—'
                  const cliente = g.cliente?.razon_social
                    || `${g.cliente?.nombres || ''} ${g.cliente?.apellidos || ''}`.trim()
                    || '—'
                  const ventaNum = g.venta?.serie && g.venta?.numero
                    ? `${g.venta.serie}-${g.venta.numero}` : '—'
                  return (
                    <tr key={g.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className='px-3 py-2 font-mono font-semibold text-blue-700'>{serieNum}</td>
                      <td className='px-3 py-2'>{g.fecha_emision ? dayjs(g.fecha_emision).format('DD/MM/YY') : '—'}</td>
                      <td className='px-3 py-2'>{g.fecha_traslado ? dayjs(g.fecha_traslado).format('DD/MM/YY') : '—'}</td>
                      <td className='px-3 py-2'>
                        <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          g.estado === 'EMITIDA' ? 'bg-green-100 text-green-700' :
                          g.estado === 'ANULADA' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {g.estado || '—'}
                        </span>
                      </td>
                      <td className='px-3 py-2 text-[10px]'>{g.tipo_guia?.replace('ELECTRONICA_', '') || '—'}</td>
                      <td className='px-3 py-2 max-w-[160px] truncate'>{cliente}</td>
                      <td className='px-3 py-2 font-mono'>{ventaNum}</td>
                      <td className='px-3 py-2 max-w-[140px] truncate'>{g.motivoTraslado?.descripcion || '—'}</td>
                      <td className='px-3 py-2'>{g.almacenOrigen?.name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ContenedorGeneral>
  )
}
