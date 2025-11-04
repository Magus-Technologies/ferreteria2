import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import FiltersMiAlmacen from './_components/filters/filters-mi-almacen'
import TableProductos from './_components/tables/table-productos'
import TableDetalleDePrecios from './_components/tables/table-detalle-de-precios'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import ButtonCreateProducto from './_components/buttons/button-create-producto'
import can from '~/utils/server-validate-permission'
import { auth } from '~/auth/auth'
import CardsInfo from './_components/others/cards-info'
import ButtonCreateIngresoSalida from './_components/buttons/button-create-ingreso-salida'
import { TipoDocumento } from '@prisma/client'
import TableUltimasComprasIngresadasMiAlmacen from './_components/tables/table-ultimas-compras-ingresadas-mi-almacen'

export default async function MiAlmacen() {
  const session = await auth()
  if (!(await can(permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX)))
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <FiltersMiAlmacen
        marca_predeterminada={session?.user?.empresa.marca_id}
      />
      <div className='flex size-full gap-8'>
        <div className='grid grid-rows-7 gap-y-4 size-full'>
          <div className='row-start-1 row-end-4'>
            <TableProductos />
          </div>
          <div className='row-start-4 row-end-6'>
            <TableUltimasComprasIngresadasMiAlmacen />
          </div>
          <div className='row-start-6 row-end-8'>
            <TableDetalleDePrecios />
          </div>
        </div>
        <div className='flex flex-col items-center justify-around gap-8'>
          {(await can(permissions.PRODUCTO_CREATE)) && <ButtonCreateProducto />}
          {(await can(permissions.PRODUCTO_INGRESO_CREATE)) && (
            <ButtonCreateIngresoSalida tipo={TipoDocumento.Ingreso} />
          )}
          {(await can(permissions.PRODUCTO_SALIDA_CREATE)) && (
            <ButtonCreateIngresoSalida tipo={TipoDocumento.Salida} />
          )}
          <CardsInfo />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
