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
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

const DemandaPorCategoriaDeProductos = lazy(() => import('./_components/charts/demanda-por-categoria-de-productos'))
const TableProductosPorVencer = lazy(() => import('./_components/tables/table-productos-por-vencer'))
const TableProductosSinRotar = lazy(() => import('./_components/tables/table-productos-sin-rotar'))
const TableProductosUrgenteStock = lazy(() => import('./_components/tables/table-productos-urgente-stock'))
const PrestamosPrestes = lazy(() => import('./_components/charts/prestamos-prestes'))

const ComponentLoading = () => <div className="flex items-center justify-center h-40"><Spin size="large" /></div>

export default function GestionComercialEInventario() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX)
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos title='Dashboard' icon={<MdSpaceDashboard className='text-cyan-600' />}>
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-stretch sm:items-center w-full sm:w-auto'>
          <ConfigurableElement
            componentId='gestion-comercial.dashboard.filtro-fecha'
            label='Filtro de Fechas'
          >
            <RangePickerBase variant='filled' size='large' className='w-full sm:w-auto' />
          </ConfigurableElement>
          <ConfigurableElement
            componentId='gestion-comercial.dashboard.filtro-almacen'
            label='Filtro de Almacén'
          >
            <SelectAlmacen className='w-full sm:w-auto' />
          </ConfigurableElement>
        </div>
      </TituloModulos>

      <div className='flex flex-col gap-3 w-full'>
        {/* 4 Cards superiores */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-costo-inventario' label='Card Costo Total de Inventario'>
            <CardDashboard title='Costo Total de Inventario' value={250000000} prefix='S/. ' icon={<FaMoneyBills size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-costo-ajuste' label='Card Costo de Ajuste de Inventario'>
            <CardDashboard title='Costo de Ajuste de Inventario' value={50000} prefix='S/. ' icon={<BsWrenchAdjustableCircleFill size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-productos-rotados' label='Card Productos Rotados'>
            <CardDashboard title='Productos Rotados' value={500000} prefix='S/. ' suffix=' / 100' icon={<FaRotate size={16} />} />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.dashboard.card-cantidad-productos' label='Card Cantidad de Productos'>
            <CardDashboard title='Cantidad de Productos' value={29} icon={<FaBoxesStacked size={16} />} decimal={0} />
          </ConfigurableElement>
        </div>

        {/* Grid de 4 columnas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {/* Columna 1: Cards verticales + Demanda */}
          <div className='flex flex-col gap-3'>
            <ConfigurableElement componentId='gestion-comercial.dashboard.card-inventario-inicial' label='Card Inventario Inicial por Año'>
              <CardDashboard title='Inventario Inicial por Año' value={250000000} prefix='S/. ' icon={<FaMoneyBillTrendUp size={14} />} iconRight={<YearPicker />} />
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.card-inventario-final' label='Card Inventario Final por Año'>
              <CardDashboard title='Inventario Final por Año' value={250000000} prefix='S/. ' icon={<FaMoneyBillWave size={14} />} iconRight={<YearPicker />} />
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.chart-demanda' label='Gráfico Demanda por Categoría'>
              <div className='flex flex-col h-[220px]'>
                <div className='font-semibold text-slate-700 text-sm mb-0.5'>Demanda por Categoría de Productos</div>
                <div className='flex-1'><Suspense fallback={<ComponentLoading />}><DemandaPorCategoriaDeProductos /></Suspense></div>
              </div>
            </ConfigurableElement>
          </div>

          {/* Columnas 2-4: Contenedor de tablas (ocupa 3 columnas) */}
          <div className='lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-3'>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-vencer' label='Tabla Productos por Vencer'>
              <div className='h-[220px]'><Suspense fallback={<ComponentLoading />}><TableProductosPorVencer /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-sin-rotar' label='Tabla Productos sin Rotar'>
              <div className='h-[220px] lg:col-span-2'><Suspense fallback={<ComponentLoading />}><TableProductosSinRotar /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.table-productos-urgente' label='Tabla Productos Urgente Stock'>
              <div className='h-[220px]'><Suspense fallback={<ComponentLoading />}><TableProductosUrgenteStock /></Suspense></div>
            </ConfigurableElement>
            <ConfigurableElement componentId='gestion-comercial.dashboard.chart-prestamos' label='Gráfico Préstamos y Prestés'>
              <div className='flex flex-col h-[220px] lg:col-span-2'>
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
