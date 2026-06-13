'use client'

import { BsWrenchAdjustableCircleFill } from 'react-icons/bs'
import { FaMoneyBillWave } from 'react-icons/fa'
import { FaBoxesStacked, FaMoneyBills, FaMoneyBillTrendUp, FaRotate } from 'react-icons/fa6'
import { MdSpaceDashboard } from 'react-icons/md'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import SelectAlmacen from '../../_components/form/selects/select-almacen'
import RangePickerBase from '~/app/_components/form/fechas/range-picker-base'
import YearPicker from '~/app/_components/form/fechas/year-picker'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy, useState, useMemo } from 'react'
import { Spin } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreDashboardFiltrosGCI } from './_store/store-dashboard-filtros'

const DemandaPorCategoriaDeProductos = lazy(() => import('./_components/charts/demanda-por-categoria-de-productos'))
const TableProductosPorVencer = lazy(() => import('./_components/tables/table-productos-por-vencer'))
const TableProductosSinRotar = lazy(() => import('./_components/tables/table-productos-sin-rotar'))
const TableProductosUrgenteStock = lazy(() => import('./_components/tables/table-productos-urgente-stock'))
const PrestamosPrestes = lazy(() => import('./_components/charts/prestamos-prestes'))

const ComponentLoading = () => <div className="flex items-center justify-center h-40"><Spin size="large" /></div>

export default function GestionComercialEInventario() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX)

  const { almacen_id } = useStoreAlmacen()
  const desde = useStoreDashboardFiltrosGCI((s) => s.desde)
  const hasta = useStoreDashboardFiltrosGCI((s) => s.hasta)
  const setRango = useStoreDashboardFiltrosGCI((s) => s.setRango)

  // Periodo (rango del filtro) para costo de ajuste y productos rotados.
  const periodo = { almacen_id, desde, hasta }

  // Memoizado para no resetear la selección en curso del RangePicker.
  const rangoValue = useMemo<[Dayjs, Dayjs]>(() => [dayjs(desde), dayjs(hasta)], [desde, hasta])

  // Año de cada card de inventario inicial/final (YearPicker).
  const [anioInicial, setAnioInicial] = useState(dayjs())
  const [anioFinal, setAnioFinal] = useState(dayjs())

  const { data: resumenInventario } = useQuery({
    queryKey: ['inventario-resumen', almacen_id],
    queryFn: async () => {
      const res = await inventarioReporteApi.getResumen({ almacen_id })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? null
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  const { data: costoAjuste } = useQuery({
    queryKey: ['inventario-costo-ajuste', periodo],
    queryFn: async () => {
      const res = await inventarioReporteApi.getCostoAjuste(periodo)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data?.costo_ajuste ?? 0
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  const { data: rotados } = useQuery({
    queryKey: ['inventario-productos-rotados', periodo],
    queryFn: async () => {
      const res = await inventarioReporteApi.getProductosRotados(periodo)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? { rotados: 0, total: 0 }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  const { data: invInicial } = useQuery({
    queryKey: ['inventario-por-anio', 'inicial', almacen_id, anioInicial.year()],
    queryFn: async () => {
      const res = await inventarioReporteApi.getInventarioPorAnio({ almacen_id, anio: anioInicial.year() })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data?.inicial ?? 0
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  const { data: invFinal } = useQuery({
    queryKey: ['inventario-por-anio', 'final', almacen_id, anioFinal.year()],
    queryFn: async () => {
      const res = await inventarioReporteApi.getInventarioPorAnio({ almacen_id, anio: anioFinal.year() })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data?.final ?? 0
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='min-h-full items-stretch'>
      <TituloModulos title='Dashboard' icon={<MdSpaceDashboard className='text-cyan-600' />}>
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-stretch sm:items-center w-full sm:w-auto'>
          <ConfigurableElement
            componentId='gestion-comercial.dashboard.filtro-fecha'
            label='Filtro de Fechas'
          >
            <RangePickerBase
              variant='filled'
              size='large'
              className='w-full sm:w-auto'
              allowClear={false}
              value={rangoValue}
              onChange={(rango) => {
                if (rango && rango[0] && rango[1]) {
                  setRango(rango[0].format('YYYY-MM-DD'), rango[1].format('YYYY-MM-DD'))
                }
              }}
            />
          </ConfigurableElement>
          {/* SelectAlmacen ahora se configura desde el dropdown global de Sucursales */}
          {/* <ConfigurableElement
            componentId='gestion-comercial.dashboard.filtro-almacen'
            label='Filtro de Almacén'
          >
            <SelectAlmacen className='w-full sm:w-auto' />
          </ConfigurableElement> */}
        </div>
      </TituloModulos>

      <div className='flex flex-col gap-3 w-full flex-1 min-h-0'>
        {/* 4 Cards superiores */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0'>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-costo-inventario' label='Card Costo Total de Inventario'>
            <CardDashboard title='Costo Total de Inventario' value={resumenInventario?.valorizacion_total ?? 0} prefix='S/. ' icon={<FaMoneyBills size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-costo-ajuste' label='Card Costo de Ajuste de Inventario'>
            <CardDashboard title='Costo de Ajuste de Inventario' value={costoAjuste ?? 0} prefix='S/. ' icon={<BsWrenchAdjustableCircleFill size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-productos-rotados' label='Card Productos Rotados'>
            <CardDashboard title='Productos Rotados' value={rotados?.rotados ?? 0} suffix={` / ${rotados?.total ?? 0}`} decimal={0} icon={<FaRotate size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-cantidad-productos' label='Card Cantidad de Productos'>
            <CardDashboard title='Cantidad de Productos' value={resumenInventario?.total_productos ?? 0} icon={<FaBoxesStacked size={16} />} decimal={0} />
          </ConfigurableElement>
        </div>

        {/* Grid de 4 columnas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 min-h-0 xl:h-[clamp(540px,calc(100dvh-330px),820px)]'>
          {/* Columna 1: Cards verticales + Demanda */}
          <div className='flex flex-col gap-4 min-h-0'>
            <ConfigurableElement componentId='gestion-comercial.dashboard.card-inventario-inicial' label='Card Inventario Inicial por Año'>
              <div className='shrink-0'>
                <CardDashboard title='Inventario Inicial por Año' value={invInicial ?? 0} prefix='S/. ' icon={<FaMoneyBillTrendUp size={14} />} iconRight={<YearPicker value={anioInicial} onChange={(d) => d && setAnioInicial(d)} allowClear={false} />} />
              </div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.card-inventario-final' label='Card Inventario Final por Año'>
              <div className='shrink-0'>
                <CardDashboard title='Inventario Final por Año' value={invFinal ?? 0} prefix='S/. ' icon={<FaMoneyBillWave size={14} />} iconRight={<YearPicker value={anioFinal} onChange={(d) => d && setAnioFinal(d)} allowClear={false} />} />
              </div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.chart-demanda' label='Gráfico Demanda por Categoría'>
              <div className='flex flex-col h-[clamp(240px,30dvh,360px)] shrink-0 mt-5'>
                <div className='font-semibold text-slate-700 text-sm mb-2'>Demanda por Categoría de Productos</div>
                <div className='flex-1'><Suspense fallback={<ComponentLoading />}><DemandaPorCategoriaDeProductos /></Suspense></div>
              </div>
            </ConfigurableElement>
          </div>

          {/* Columnas 2-4: Contenedor de tablas (ocupa 3 columnas) */}
          <div className='xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 min-h-0 xl:grid-rows-2'>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-vencer' label='Tabla Productos por Vencer'>
              <div className='h-[520px] xl:h-full xl:row-span-2 min-h-0'><Suspense fallback={<ComponentLoading />}><TableProductosPorVencer /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-sin-rotar' label='Tabla Productos sin Rotar'>
              <div className='h-[clamp(240px,28dvh,380px)] xl:h-full xl:col-span-2 min-h-0'><Suspense fallback={<ComponentLoading />}><TableProductosSinRotar /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-urgente' label='Tabla Productos Urgente Stock'>
              <div className='h-[clamp(240px,28dvh,380px)] xl:h-full min-h-0'><Suspense fallback={<ComponentLoading />}><TableProductosUrgenteStock /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.chart-prestamos' label='Gráfico Préstamos y Prestés'>
              <div className='flex flex-col h-[clamp(240px,28dvh,380px)] xl:h-full min-h-0'>
                <div className='font-semibold text-slate-700 text-sm mb-0.5'>Préstamos y Prestés</div>
                <div className='flex-1'><Suspense fallback={<ComponentLoading />}><PrestamosPrestes /></Suspense></div>
              </div>
            </ConfigurableElement>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
