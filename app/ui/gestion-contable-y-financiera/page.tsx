import { FaMoneyBills } from 'react-icons/fa6'
import { MdSpaceDashboard } from 'react-icons/md'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import NoAutorizado from '~/components/others/no-autorizado'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import VentasPorMetodosDePago from './_components/charts/ventas-por-metodos-de-pago'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import ComisionPorVendedor from './_components/charts/comision-por-vendedor'
import PorcentajeDeGanancias from './_components/charts/porcentaje-de-ganancias'
import CierresDeCajaConPerdida from './_components/charts/cierres-de-caja-con-perdida'
import ClientesMorosos from './_components/charts/clientes-morosos'
import GananciasPorRecomendacion from './_components/charts/ganancias-por-recomendacion'
import RangePickerBase from '~/app/_components/form/fechas/range-picker-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'

export default function GestionContableYFinanciera() {
  const can = usePermission()
  if (!can(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX))
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
          <ComisionPorVendedor />
        </div>
        <div className='col-start-1 col-end-2 row-start-4 row-end-6'>
          <div className='text-center font-semibold -mt-2 text-slate-700'>
            Ventas por Métodos de Pago
          </div>
          <VentasPorMetodosDePago />
        </div>
        <div className='col-start-2 col-end-5 row-start-2 row-end-6'>
          <div className='grid grid-cols-2 grid-rows-2 gap-y-6 gap-x-10 size-full'>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Porcentaje de Ganancias
              </div>
              <PorcentajeDeGanancias />
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Cierres de Caja con Pérdida
              </div>
              <CierresDeCajaConPerdida />
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Clientes Morosos
              </div>
              <ClientesMorosos />
            </div>
            <div>
              <div className='text-center font-semibold mb-2 text-slate-700'>
                Ganancias por Recomendación
              </div>
              <GananciasPorRecomendacion />
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
