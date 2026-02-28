'use client'

import { useRouter } from 'next/navigation'
import { BiSolidReport } from 'react-icons/bi'
import { FaDollarSign, FaBoxOpen, FaUsers, FaBuilding, FaChevronRight, FaFileInvoice } from 'react-icons/fa'
import { FaCartShopping } from 'react-icons/fa6'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'

interface CategoriaReporte {
  id: string
  titulo: string
  icono: React.ReactNode
  color: string
  ruta: string
  permission: string
}

const categorias: CategoriaReporte[] = [
  {
    id: 'productos',
    titulo: 'Productos / Servicios',
    icono: <FaCartShopping size={32} />,
    color: 'bg-teal-600',
    ruta: '/ui/reportes/inventario',
    permission: permissions.REPORTES_INVENTARIO_INDEX,
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: <FaDollarSign size={32} />,
    color: 'bg-rose-500',
    ruta: '/ui/reportes/ventas',
    permission: permissions.REPORTES_VENTAS_INDEX,
  },
  {
    id: 'compras',
    titulo: 'Compras',
    icono: <FaBoxOpen size={32} />,
    color: 'bg-slate-500',
    ruta: '/ui/reportes/compras',
    permission: permissions.REPORTES_COMPRAS_INDEX,
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    icono: <FaUsers size={32} />,
    color: 'bg-blue-500',
    ruta: '/ui/reportes/clientes',
    permission: permissions.REPORTES_CLIENTES_INDEX,
  },
  {
    id: 'administrativos',
    titulo: 'Administrativos',
    icono: <FaBuilding size={32} />,
    color: 'bg-teal-600',
    ruta: '/ui/reportes/financieros',
    permission: permissions.REPORTES_FINANCIEROS_INDEX,
  },
  {
    id: 'contables',
    titulo: 'Contables',
    icono: <FaFileInvoice size={32} />,
    color: 'bg-emerald-600',
    ruta: '/ui/reportes/contables',
    permission: permissions.REPORTES_FINANCIEROS_INDEX,
  },
]

function CardCategoria({ cat, onClick }: { cat: CategoriaReporte; onClick: () => void }) {
  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer' onClick={onClick}>
      <div className={`${cat.color} px-5 py-7 flex items-center gap-4`}>
        <div className='bg-white/20 rounded-lg p-3 text-white'>
          {cat.icono}
        </div>
        <span className='text-white font-semibold text-lg'>{cat.titulo}</span>
      </div>
      <div className='px-5 py-3'>
        <span className='text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all'>
          Ir a reportes avanzados <FaChevronRight size={10} />
        </span>
      </div>
    </div>
  )
}

export default function ReportesPage() {
  const canAccess = usePermission(permissions.REPORTES_INDEX)
  const router = useRouter()

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Reportes Inteligentes"
        icon={<BiSolidReport className="text-blue-600" />}
      />

      <div className='mt-6 w-full px-4'>
        <h3 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-4'>Categorias</h3>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {categorias.map((cat) => (
            <CardCategoria
              key={cat.id}
              cat={cat}
              onClick={() => router.push(cat.ruta)}
            />
          ))}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
