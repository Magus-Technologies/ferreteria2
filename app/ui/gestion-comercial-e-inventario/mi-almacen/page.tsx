import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import FiltersMiAlmacen from './_components/filters/filters-mi-almacen'
import TableProductos from './_components/tables/table-productos'
import TableUltimasComprasIngresadas from './_components/tables/table-ultimas-compras-ingresadas'
import TableDetalleDePrecios from './_components/tables/table-detalle-de-precios'
import ButtonBase from '~/components/buttons/button-base'
import { FaPlusCircle } from 'react-icons/fa'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import CardMiniInfo from './_components/cards/card-mini-info'
import usePermission from '~/hooks/use-permission'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'

export default function MiAlmacen() {
  const can = usePermission()
  if (!can(permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX))
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <FiltersMiAlmacen />
      <div className='grid grid-rows-7 gap-y-4 size-full'>
        <div className='row-start-1 row-end-4'>
          <div className='flex size-full gap-8'>
            <TableProductos />
            <div className='flex flex-col items-center justify-between gap-2'>
              {can(permissions.PRODUCTO_CREATE) && (
                <ButtonBase className='flex items-center justify-center gap-2 !rounded-md w-full'>
                  <FaPlusCircle className='text-emerald-600' size={15} />{' '}
                  Agregar
                </ButtonBase>
              )}
              {can(permissions.PRODUCTO_INGRESO_CREATE) && (
                <ButtonBase className='flex items-center justify-center gap-2 !rounded-md w-full'>
                  <GiReceiveMoney className='text-orange-600' size={15} />{' '}
                  Ingresos
                </ButtonBase>
              )}
              {can(permissions.PRODUCTO_SALIDA_CREATE) && (
                <ButtonBase className='flex items-center justify-center gap-2 !rounded-md w-full'>
                  <GiPayMoney className='text-rose-600' size={15} /> Salidas
                </ButtonBase>
              )}
              <CardMiniInfo title='Inversión' value={10000} />
              <CardMiniInfo title='Utilidad Aprox' value={10000} />
            </div>
          </div>
        </div>
        <div className='row-start-4 row-end-6'>
          <TableUltimasComprasIngresadas />
        </div>
        <div className='row-start-6 row-end-8'>
          <TableDetalleDePrecios />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
