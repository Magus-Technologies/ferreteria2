'use client'

import { FaMoneyBills } from 'react-icons/fa6'
import { MdSpaceDashboard } from 'react-icons/md'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import RangePickerBase from '~/app/_components/form/fechas/range-picker-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const VentasPorMetodosDePago = lazy(() => import('./_components/charts/ventas-por-metodos-de-pago'))
const ComisionPorVendedor = lazy(() => import('./_components/charts/comision-por-vendedor'))
const PorcentajeDeGanancias = lazy(() => import('./_components/charts/porcentaje-de-ganancias'))
const CierresDeCajaConPerdida = lazy(() => import('./_components/charts/cierres-de-caja-con-perdida'))
const ClientesMorosos = lazy(() => import('./_components/charts/clientes-morosos'))
const GananciasPorRecomendacion = lazy(() => import('./_components/charts/ganancias-por-recomendacion'))

// Componente de loading optimizado
const ChartLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function GestionContableYFinanciera() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Dashboard'
        icon={<MdSpaceDashboard className='text-cyan-600' />}
      >
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-stretch sm:items-center w-full sm:w-auto'>
          <RangePickerBase variant='filled' size='large' className='w-full sm:w-auto' />
          <SelectAlmacen className='w-full sm:w-auto' />
        </div>
      </TituloModulos>
      {/* Grid responsivo para Dashboard */}
      <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-7 w-full'>

        {/* Cards superiores - Responsivos */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12'>
          <CardDashboard
            title='Total de Ganancias | Total de Capital'
            value={250000}
            prefix='S/. '
            suffix={` | S/. ${(1000).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<FaMoneyBills size={20} />}
          />
          <CardDashboard
            title='Compras por Pagar'
            value={250000}
            prefix='S/. '
            icon={<GiPayMoney size={20} />}
          />
          <CardDashboard
            title='Ventas por Cobrar'
            value={50000}
            prefix='S/. '
            icon={<GiReceiveMoney size={20} />}
          />
          <CardDashboard
            title='Total de Ingresos | Total de Gastos'
            value={250000}
            prefix='S/. '
            suffix={` | 10000`}
            icon={<FaMoneyBills size={20} />}
          />
        </div>

        {/* Sección de gráficos - Layout responsivo */}
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-12'>

          {/* Columna izquierda - Gráficos circulares */}
          <div className='flex flex-col gap-4 sm:gap-5 md:gap-6'>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Comisión por Vendedor
              </div>
              <Suspense fallback={<ChartLoading />}>
                <ComisionPorVendedor />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Ventas por Métodos de Pago
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorMetodosDePago />
              </Suspense>
            </div>
          </div>

          {/* Columna derecha - Grid 2x2 de gráficos */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10'>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Porcentaje de Ganancias
              </div>
              <Suspense fallback={<ChartLoading />}>
                <PorcentajeDeGanancias />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Cierres de Caja con Pérdida
              </div>
              <Suspense fallback={<ChartLoading />}>
                <CierresDeCajaConPerdida />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Clientes Morosos
              </div>
              <Suspense fallback={<ChartLoading />}>
                <ClientesMorosos />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-xs sm:text-sm md:text-base text-slate-700'>
                Ganancias por Recomendación
              </div>
              <Suspense fallback={<ChartLoading />}>
                <GananciasPorRecomendacion />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
