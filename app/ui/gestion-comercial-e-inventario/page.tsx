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
          <RangePickerBase variant='filled' size='large' className='w-full sm:w-auto' />
          <SelectAlmacen className='w-full sm:w-auto' />
        </div>
      </TituloModulos>

      <div className='flex flex-col gap-3 w-full'>
        {/* 4 Cards superiores */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <CardDashboard title='Costo Total de Inventario' value={250000000} prefix='S/. ' icon={<FaMoneyBills size={16} />} />
          <CardDashboard title='Costo de Ajuste de Inventario' value={50000} prefix='S/. ' icon={<BsWrenchAdjustableCircleFill size={16} />} />
          <CardDashboard title='Productos Rotados' value={500000} prefix='S/. ' suffix=' / 100' icon={<FaRotate size={16} />} />
          <CardDashboard title='Cantidad de Productos' value={29} icon={<FaBoxesStacked size={16} />} decimal={0} />
        </div>

        {/* Grid de 4 columnas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {/* Columna 1: Cards verticales + Demanda */}
          <div className='flex flex-col gap-3'>
            <CardDashboard title='Inventario Inicial por Año' value={250000000} prefix='S/. ' icon={<FaMoneyBillTrendUp size={14} />} iconRight={<YearPicker />} />
            <CardDashboard title='Inventario Final por Año' value={250000000} prefix='S/. ' icon={<FaMoneyBillWave size={14} />} iconRight={<YearPicker />} />
            <div className='flex flex-col h-[220px]'>
              <div className='font-semibold text-slate-700 text-sm mb-0.5'>Demanda por Categoría de Productos</div>
              <div className='flex-1'><Suspense fallback={<ComponentLoading />}><DemandaPorCategoriaDeProductos /></Suspense></div>
            </div>
          </div>

          {/* Columnas 2-4: Contenedor de tablas (ocupa 3 columnas) */}
          <div className='lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-3'>
            {/* Fila 1: 2 tablas lado a lado */}
            <div className='h-[220px]'><Suspense fallback={<ComponentLoading />}><TableProductosPorVencer /></Suspense></div>
            <div className='h-[220px] lg:col-span-2'><Suspense fallback={<ComponentLoading />}><TableProductosSinRotar /></Suspense></div>
            
            {/* Fila 2: Tabla + Gráfico */}
            <div className='h-[220px]'><Suspense fallback={<ComponentLoading />}><TableProductosUrgenteStock /></Suspense></div>
            <div className='flex flex-col h-[220px] lg:col-span-2'>
              <div className='font-semibold text-slate-700 text-sm mb-0.5'>Préstamos y Prestés</div>
              <div className='flex-1'><Suspense fallback={<ComponentLoading />}><PrestamosPrestes /></Suspense></div>
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
