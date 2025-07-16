import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import FiltersMiAlmacen from './_components/filters/filters-mi-almacen'
import TableProductos from './_components/tables/table-productos'
import TableUltimasComprasIngresadas from './_components/tables/table-ultimas-compras-ingresadas'
import TableDetalleDePrecios from './_components/tables/table-detalle-de-precios'

export default function MiAlmacen() {
  return (
    <ContenedorGeneral>
      <FiltersMiAlmacen />
      <div className='grid grid-rows-7 gap-y-4 size-full'>
        <div className='row-start-1 row-end-4'>
          <TableProductos />
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
