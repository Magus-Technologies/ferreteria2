import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { MdSettings } from 'react-icons/md'
import TableSeriesDocumento from './_components/table-series-documento'

export default async function ConfiguracionSeries() {
  if (!(await can(permissions.VENTA_CREATE))) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Configuración de Series de Documentos'
        icon={<MdSettings className='text-blue-600' />}
      />
      <div className='mt-4'>
        <TableSeriesDocumento />
      </div>
    </ContenedorGeneral>
  )
}
