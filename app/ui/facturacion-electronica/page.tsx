'use client'

import { FaMoneyBills } from 'react-icons/fa6'
import {
  MdDocumentScanner,
  MdFactCheck,
  MdSpaceDashboard,
} from 'react-icons/md'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { IoDocumentText } from 'react-icons/io5'
import RangePickerBase from '~/app/_components/form/fechas/range-picker-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const VentasPorCategoriaDeProductos = lazy(() => import('./_components/charts/ventas-por-categoria-de-productos'))
const VentasPorMetodosDePago = lazy(() => import('./_components/charts/ventas-por-metodos-de-pago'))
const ProductosMasVendidos = lazy(() => import('./_components/charts/productos-mas-vendidos'))
const IngresosPedidosPorTipoDeCanal = lazy(() => import('./_components/charts/ingresos-pedidos-por-tipo-de-canal'))
const VentasPorTiposDeDocumento = lazy(() => import('./_components/charts/ventas-por-tipos-de-documento'))
const VentasPorMarca = lazy(() => import('./_components/charts/ventas-por-marca'))

// Componente de loading optimizado
const ChartLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function FacturacionElectronica() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)
  
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
            title='Total de Ventas / N° de Ventas'
            value={250000}
            prefix='S/. '
            suffix=' / 1000'
            icon={<FaMoneyBills size={20} />}
          />
        </div>
        <div className='col-start-2 col-end-3 row-start-1 row-end-2'>
          <CardDashboard
            title='Total de Ventas por Facturas'
            value={50000}
            prefix='S/. '
            icon={<MdFactCheck size={20} />}
          />
        </div>
        <div className='col-start-3 col-end-4 row-start-1 row-end-2'>
          <CardDashboard
            title='Total de Ventas por Boletas'
            value={50000}
            prefix='S/. '
            icon={<MdDocumentScanner size={20} />}
          />
        </div>
        <div className='col-start-4 col-end-5 row-start-1 row-end-2'>
          <CardDashboard
            title='Total de Ventas por Notas de Venta'
            value={50000}
            prefix='S/. '
            icon={<IoDocumentText size={20} />}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-2 row-end-4'>
          <div className='text-center font-semibold -mt-2 text-slate-700'>
            Ventas por Categoría de Productos
          </div>
          <Suspense fallback={<ChartLoading />}>
            <VentasPorCategoriaDeProductos />
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
                Productos Mas Vendidos
              </div>
              <Suspense fallback={<ChartLoading />}>
                <ProductosMasVendidos />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Ingresos / Pedidos por Tipo de Canal
              </div>
              <Suspense fallback={<ChartLoading />}>
                <IngresosPedidosPorTipoDeCanal />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Ventas por Tipos de Documento
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorTiposDeDocumento />
              </Suspense>
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Ventas por Marca
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorMarca />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
