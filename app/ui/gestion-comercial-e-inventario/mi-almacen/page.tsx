import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import FiltersMiAlmacen from './_components/filters/filters-mi-almacen'
import TableProductos from './_components/tables/table-productos'
import TableUltimasComprasIngresadas from './_components/tables/table-ultimas-compras-ingresadas'
import TableDetalleDePrecios from './_components/tables/table-detalle-de-precios'
import ButtonBase from '~/components/buttons/button-base'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import CardMiniInfo from './_components/cards/card-mini-info'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import ButtonCreateProducto from './_components/buttons/button-create-producto'
import can from '~/utils/server-validate-permission'

export default async function MiAlmacen() {
  if (!(await can(permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX)))
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <FiltersMiAlmacen />
      <div className='flex size-full gap-8'>
        <div className='grid grid-rows-7 gap-y-4 size-full'>
          <div className='row-start-1 row-end-4'>
            <TableProductos />
          </div>
          <div className='row-start-4 row-end-6'>
            <TableUltimasComprasIngresadas />
          </div>
          <div className='row-start-6 row-end-8'>
            <TableDetalleDePrecios data={[]} />
          </div>
        </div>
        <div className='flex flex-col items-center justify-around gap-8'>
          {(await can(permissions.PRODUCTO_CREATE)) && <ButtonCreateProducto />}
          {(await can(permissions.PRODUCTO_INGRESO_CREATE)) && (
            <ButtonBase className='flex items-center justify-center gap-2 !rounded-md w-full h-full'>
              <GiReceiveMoney className='text-orange-600' size={15} /> Ingresos
            </ButtonBase>
          )}
          {(await can(permissions.PRODUCTO_SALIDA_CREATE)) && (
            <ButtonBase className='flex items-center justify-center gap-2 !rounded-md w-full h-full'>
              <GiPayMoney className='text-rose-600' size={15} /> Salidas
            </ButtonBase>
          )}
          <CardMiniInfo title='Inversión' value={10000} className='h-full' />
          <CardMiniInfo
            title='P. Venta Aprox'
            value={10000}
            className='h-full'
          />
          <CardMiniInfo
            title='Utilidad Aprox'
            value={10000}
            className='h-full'
          />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
