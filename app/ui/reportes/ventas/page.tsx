'use client'

import { Suspense, useMemo, useState } from 'react'
import { FaDollarSign } from 'react-icons/fa'
import { DatePicker } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { gananciasApi } from '~/lib/api/ganancias'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import KpiCards from './_components/kpi-cards'
import GraficoVentas from './_components/grafico-ventas'
import SeccionReportesAvanzados from './_components/seccion-reportes-avanzados'
import SeccionContasis from './_components/seccion-contasis'
import ReporteAvanzadoView, { type ViewMode } from './_components/reporte-avanzado-view'

const { RangePicker } = DatePicker

const VALID_TIPOS = new Set<string>([
  'ventas_general', 'ventas_contado', 'ventas_credito', 'ventas_vendedor', 'ventas_cliente',
])

function ReporteVentasContent() {
  const canAccess = usePermission(permissions.REPORTES_VENTAS_INDEX)
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)
  const searchParams = useSearchParams()

  const tipo = searchParams.get('tipo')
  const viewMode = tipo && VALID_TIPOS.has(tipo) ? (tipo as ViewMode) : null

  const [dashDesde, setDashDesde] = useState(
    dayjs().subtract(11, 'months').startOf('month').format('YYYY-MM-DD')
  )
  const [dashHasta, setDashHasta] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))

  const effectiveAlmacenId = almacen_id ?? 1

  const { data: resumenData, isLoading: loadingResumen } = useQuery({
    queryKey: [QueryKeys.GANANCIAS_RESUMEN, effectiveAlmacenId, dashDesde, dashHasta],
    queryFn: () => gananciasApi.getResumen({ almacen_id: effectiveAlmacenId, desde: dashDesde, hasta: dashHasta }),
  })

  const { data: detalleData, isLoading: loadingDetalle } = useQuery({
    queryKey: [QueryKeys.GANANCIAS, effectiveAlmacenId, dashDesde, dashHasta, 'grafico'],
    queryFn: () => gananciasApi.getGanancias({ almacen_id: effectiveAlmacenId, desde: dashDesde, hasta: dashHasta, per_page: 10000 }),
  })

  const { data: empresaData } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, 1],
    queryFn: () => empresaApi.getById(1),
  })

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

  if (!canAccess) return <NoAutorizado />

  const empresa = empresaData?.data?.data
  const empresaInfo = empresa
    ? { razon_social: empresa.razon_social, ruc: empresa.ruc, direccion: empresa.direccion }
    : undefined

  if (viewMode) {
    return (
      <ContenedorGeneral>
        <ReporteAvanzadoView
          tipo={viewMode}
          almacenId={effectiveAlmacenId}
          empresaInfo={empresaInfo}
        />
      </ContenedorGeneral>
    )
  }

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Ventas"
        icon={<FaDollarSign className="text-rose-500" />}
        extra={
          <RangePicker
            value={[dayjs(dashDesde), dayjs(dashHasta)]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDashDesde(dates[0].format('YYYY-MM-DD'))
                setDashHasta(dates[1].format('YYYY-MM-DD'))
              }
            }}
            format='DD/MM/YYYY'
            size='small'
          />
        }
      />

      <KpiCards resumen={resumenData?.data?.data} loading={loadingResumen || loadingDetalle} />

      <div className='mt-4 w-full'>
        <GraficoVentas loading={loadingDetalle} datos={datosMensuales} />
      </div>

      <div className='mt-8 w-full'>
        <SeccionReportesAvanzados
          almacenId={effectiveAlmacenId}
          rfDesde={dashDesde}
          rfHasta={dashHasta}
          empresaInfo={empresaInfo}
        />
      </div>

      <div className='mt-8 w-full'>
        <SeccionContasis almacenId={effectiveAlmacenId} empresaInfo={empresaInfo} />
      </div>
    </ContenedorGeneral>
  )
}

export default function ReporteVentasPage() {
  return (
    <Suspense>
      <ReporteVentasContent />
    </Suspense>
  )
}
