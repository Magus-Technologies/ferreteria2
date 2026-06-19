'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import CardReporteAvanzado from '~/app/ui/reportes/_components/cards/card-reporte-avanzado'
import { gananciasApi } from '~/lib/api/ganancias'
import { exportReporteVentasToExcel } from '~/utils/export-reporte-ventas-excel'

type EmpresaInfo = { razon_social?: string; ruc?: string; direccion?: string }

type ReporteConfig = {
  id: string
  titulo: string
  label: string
  filtros?: Record<string, string>
}

const REPORTES: ReporteConfig[] = [
  { id: 'ventas_general',  titulo: 'REPORTE DE VENTAS GENERAL',          label: 'Ventas General' },
  { id: 'ventas_contado',  titulo: 'REPORTE DE VENTAS AL CONTADO',       label: 'Ventas al Contado', filtros: { forma_pago: 'co' } },
  { id: 'ventas_credito',  titulo: 'REPORTE DE VENTAS AL CRÉDITO',       label: 'Ventas al Crédito', filtros: { forma_pago: 'cr' } },
  { id: 'ventas_vendedor', titulo: 'REPORTE DE VENTAS POR VENDEDOR',     label: 'Ventas por Vendedor' },
  { id: 'ventas_cliente',  titulo: 'REPORTE DE VENTAS POR CLIENTE',      label: 'Ventas por Cliente' },
]

type Props = {
  almacenId: number
  rfDesde: string
  rfHasta: string
  empresaInfo?: EmpresaInfo
}

export default function SeccionReportesAvanzados({ almacenId, rfDesde, rfHasta, empresaInfo }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleExcel = async (r: ReporteConfig) => {
    setLoadingId(r.id)
    try {
      const res = await gananciasApi.getGanancias({
        almacen_id: almacenId,
        desde: rfDesde,
        hasta: rfHasta,
        ...r.filtros,
        per_page: 10000,
      })
      const items = res.data?.data
      if (!items?.length) return
      exportReporteVentasToExcel({
        items,
        resumen: res.data?.resumen,
        nameFile: `${r.id}_${dayjs().format('YYYYMMDD_HHmmss')}`,
        fechaDesde: dayjs(rfDesde).format('DD/MM/YYYY'),
        fechaHasta: dayjs(rfHasta).format('DD/MM/YYYY'),
        empresa: empresaInfo,
        titulo: r.titulo,
      })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className='w-full'>
      <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
        {REPORTES.map((r) => (
          <CardReporteAvanzado
            key={r.id}
            titulo={r.label}
            onClick={() => router.push(`/ui/reportes/ventas?tipo=${r.id}`)}
            onExcel={() => handleExcel(r)}
            loadingExcel={loadingId === r.id}
          />
        ))}
      </div>
    </div>
  )
}
