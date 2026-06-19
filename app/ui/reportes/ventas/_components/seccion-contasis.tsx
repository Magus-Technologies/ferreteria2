'use client'

import { useState } from 'react'
import { DatePicker, Button } from 'antd'
import dayjs from 'dayjs'
import { contasisApi } from '~/lib/api/contasis'
import { exportContasisVentasToExcel } from '~/utils/export-contasis-excel'

const { RangePicker } = DatePicker

type EmpresaInfo = { razon_social?: string; ruc?: string; direccion?: string }
type ResultState = { type: 'success' | 'warning' | 'error'; text: string }

type Props = {
  almacenId: number
  empresaInfo?: EmpresaInfo
}

export default function SeccionContasis({ almacenId, empresaInfo }: Props) {
  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [hasta, setHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await contasisApi.getVentas({ desde, hasta, almacen_id: almacenId })
      const items = res.data?.data
      if (!items?.length) {
        setResult({ type: 'warning', text: 'No hay comprobantes electrónicos en el rango seleccionado.' })
        return
      }
      exportContasisVentasToExcel(items, {
        desde: dayjs(desde).format('DD/MM/YYYY'),
        hasta: dayjs(hasta).format('DD/MM/YYYY'),
        empresa: empresaInfo?.razon_social,
        nameFile: `CONTASIS_VENTAS_${dayjs(desde).format('YYYYMM')}_${dayjs(hasta).format('YYYYMM')}`,
      })
      setResult({ type: 'success', text: `${items.length} comprobantes exportados correctamente.` })
    } catch {
      setResult({ type: 'error', text: 'Error al generar el archivo. Intente nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full'>
      <h3 className='font-bold text-slate-700 text-base uppercase mb-1'>Exportar CONTASIS</h3>
      <p className='text-xs text-slate-400 mb-4'>
        Genera el archivo Excel en formato CONTASIS (Registro de Ventas) a partir de los comprobantes electrónicos emitidos.
      </p>
      <div className='bg-white rounded-lg border border-slate-200 p-5 space-y-4 max-w-lg'>
        <div>
          <label className='block text-sm font-medium text-slate-600 mb-1'>Rango de fechas</label>
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
            className='w-full'
          />
        </div>
        <Button type='primary' onClick={handleExport} loading={loading} className='w-full'>
          Exportar Excel CONTASIS — Ventas
        </Button>
        {result && (
          <div className={`p-3 rounded-lg text-sm ${
            result.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            result.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.text}
          </div>
        )}
      </div>
    </div>
  )
}
