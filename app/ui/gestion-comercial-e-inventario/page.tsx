import { BsWrenchAdjustableCircleFill } from 'react-icons/bs'
import { FaMoneyBillWave } from 'react-icons/fa'
import {
  FaBoxesStacked,
  FaMoneyBills,
  FaMoneyBillTrendUp,
  FaRotate,
} from 'react-icons/fa6'
import { MdSpaceDashboard } from 'react-icons/md'
import CardDashboard from '~/components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import DemandaPorCategoriaDeProductos from './_components/charts/demanda-por-categoria-de-productos'
import TableProductosPorVencer from './_components/tables/table-productos-por-vencer'

export default function GestionComercialEInventario() {
  const can = usePermission()
  if (!can(permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX))
    return <NoAutorizado />

  return (
    <div className='animate-fade animate-ease-in-out animate-delay-[250ms] size-full flex flex-col items-center px-8 py-2 gap-6'>
      <div className='w-full'>
        <div className='text-4xl font-bold text-slate-700 flex items-center gap-2'>
          <MdSpaceDashboard className='text-cyan-600' />
          Dashboard
        </div>
      </div>
      <div className='grid grid-cols-4 grid-rows-5 gap-x-12 gap-y-7 size-full'>
        <div className='col-start-1 col-end-2 row-start-1 row-end-2'>
          <CardDashboard
            title='Costo Total de Inventario'
            value={250000000}
            prefix='S/. '
            icon={<FaMoneyBills size={20} />}
          />
        </div>
        <div className='col-start-2 col-end-3 row-start-1 row-end-2'>
          <CardDashboard
            title='Costo de Ajuste de Inventario'
            value={50000}
            prefix='S/. '
            icon={<BsWrenchAdjustableCircleFill size={20} />}
          />
        </div>
        <div className='col-start-3 col-end-4 row-start-1 row-end-2'>
          <CardDashboard
            title='Productos Rotados'
            value={500000}
            prefix='S/. '
            suffix=' / 100'
            icon={<FaRotate size={20} />}
          />
        </div>
        <div className='col-start-4 col-end-5 row-start-1 row-end-2'>
          <CardDashboard
            title='Cantidad de Productos'
            value={29}
            icon={<FaBoxesStacked size={20} />}
            decimal={0}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-2 row-end-3'>
          <CardDashboard
            title='Inventario Inicial por Año'
            value={250000000}
            prefix='S/. '
            icon={<FaMoneyBillTrendUp size={20} />}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-3 row-end-4'>
          <CardDashboard
            title='Inventario Final por Año'
            value={250000000}
            prefix='S/. '
            icon={<FaMoneyBillWave size={20} />}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-4 row-end-6'>
          <div className='text-center font-semibold -mt-2 text-slate-700'>
            Demanda por Categoría de Productos
          </div>
          <DemandaPorCategoriaDeProductos />
        </div>
        <div className='col-start-2 col-end-5 row-start-2 row-end-6'>
          <div className='grid grid-cols-2 grid-rows-2 gap-y-6 gap-x-10 size-full'>
            <TableProductosPorVencer />
            <TableProductosPorVencer />
            <TableProductosPorVencer />
          </div>
        </div>
      </div>
    </div>
  )
}
