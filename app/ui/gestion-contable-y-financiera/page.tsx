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
        <div className='flex gap-8 items-center'>
          <RangePickerBase variant='filled' size='large' />
          <SelectAlmacen />
        </div>
      </TituloModulos>
      <div className='grid grid-cols-[repeat(4,minmax(min-content,1fr))] grid-rows-5 gap-0 gap-x-12 gap-y-7 size-full'>
        <div className='col-start-1 col-end-2 row-start-1 row-end-2'>
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
        </div>
        <div className='col-start-2 col-end-3 row-start-1 row-end-2'>
          <CardDashboard
            title='Compras por Pagar'
            value={250000}
            prefix='S/. '
            icon={<GiPayMoney size={20} />}
          />
        </div>
        <div className='col-start-3 col-end-4 row-start-1 row-end-2'>
          <CardDashboard
            title='Ventas por Cobrar'
            value={50000}
            prefix='S/. '
            icon={<GiReceiveMoney size={20} />}
          />
        </div>
        <div className='col-start-4 col-end-5 row-start-1 row-end-2'>
          <CardDashboard
            title='Total de Ingresos | Total de Gastos'
            value={250000}
            prefix='S/. '
            suffix={` | 10000`}
            icon={<FaMoneyBills size={20} />}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-2 row-end-4'>
          <div className='text-center font-semibold -mt-2 text-slate-700'>
            Comisión por Vendedor
          </div>
          <Suspense fallback={<ChartLoading />}>
            <ComisionPorVendedor />
          </Suspense>
        </div>
        <div className='col-start-1 col-end-2 row-start-4 row-end-6'>
          <div className='text-center font-semibold -mt-2 text-slate-700'>
            Ventas por Métodos de Pago
          </div>
          <Suspense fallback={<ChartLoading />}>
            <VentasPorMetodosDePago />
          </Suspense>
        </div>
        <div className='col-start-2 col-end-5 row-start-2 row-end-6'>
          <div className='grid grid-cols-2 grid-rows-2 gap-y-6 gap-x-10 size-full'>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Porcentaje de Ganancias
              </div>
              <Suspense fallback={<ChartLoading />}>
                <PorcentajeDeGanancias />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Cierres de Caja con Pérdida
              </div>
              <Suspense fallback={<ChartLoading />}>
                <CierresDeCajaConPerdida />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Clientes Morosos
              </div>
              <Suspense fallback={<ChartLoading />}>
                <ClientesMorosos />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
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
