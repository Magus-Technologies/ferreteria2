import { BsWrenchAdjustableCircleFill } from 'react-icons/bs'
import { FaMoneyBillWave } from 'react-icons/fa'
import {
  FaBoxesStacked,
  FaMoneyBills,
  FaMoneyBillTrendUp,
  FaRotate,
} from 'react-icons/fa6'
import { MdSpaceDashboard } from 'react-icons/md'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import DemandaPorCategoriaDeProductos from './_components/charts/demanda-por-categoria-de-productos'
import TableProductosPorVencer from './_components/tables/table-productos-por-vencer'
import TableProductosSinRotar from './_components/tables/table-productos-sin-rotar'
import TableProductosUrgenteStock from './_components/tables/table-productos-urgente-stock'
import PrestamosPrestes from './_components/charts/prestamos-prestes'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import SelectAlmacen from '../../_components/form/selects/select-almacen'
import RangePickerBase from '~/app/_components/form/fechas/range-picker-base'
import YearPicker from '~/app/_components/form/fechas/year-picker'

export default function GestionComercialEInventario() {
  const can = usePermission()
  if (!can(permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX))
    return <NoAutorizado />

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
      <div className='grid grid-cols-[repeat(4,minmax(min-content,1fr))] grid-rows-5 gap-x-12 gap-y-7 size-full'>
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
            iconRight={<YearPicker />}
          />
        </div>
        <div className='col-start-1 col-end-2 row-start-3 row-end-4'>
          <CardDashboard
            title='Inventario Final por Año'
            value={250000000}
            prefix='S/. '
            icon={<FaMoneyBillWave size={20} />}
            iconRight={<YearPicker />}
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
            <TableProductosSinRotar />
            <TableProductosUrgenteStock />

            <div className=''>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Préstamos y Prestés
              </div>
              <PrestamosPrestes />
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
