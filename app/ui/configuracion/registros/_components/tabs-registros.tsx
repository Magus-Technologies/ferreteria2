'use client'

import { Tabs } from 'antd'
import { FaTags, FaIndustry, FaMapMarkerAlt, FaRuler, FaCubes, FaExchangeAlt, FaTools, FaTruck, FaWarehouse, FaProjectDiagram } from 'react-icons/fa'
import TabCategorias from './tabs/tab-categorias'
import TabMarcas from './tabs/tab-marcas'
import TabUbicaciones from './tabs/tab-ubicaciones'
import TabUnidadesMedida from './tabs/tab-unidades-medida'
import TabUnidadesDerivadas from './tabs/tab-unidades-derivadas'
import TabTiposIngresoSalida from './tabs/tab-tipos-ingreso-salida'
import TabTiposServicio from './tabs/tab-tipos-servicio'
import TabAlmacenes from './tabs/tab-almacenes'
import TabVehiculos from './tabs/tab-vehiculos'
import TabOrganigramo from './tabs/tab-organigramo'

export default function TabsRegistros() {
  const items = [
    {
      key: 'categorias',
      label: <span className='flex items-center gap-2'><FaTags size={14} /> Categorias</span>,
      children: <TabCategorias />,
    },
    {
      key: 'marcas',
      label: <span className='flex items-center gap-2'><FaIndustry size={14} /> Marcas</span>,
      children: <TabMarcas />,
    },
    {
      key: 'ubicaciones',
      label: <span className='flex items-center gap-2'><FaMapMarkerAlt size={14} /> Ubicaciones</span>,
      children: <TabUbicaciones />,
    },
    {
      key: 'unidades-medida',
      label: <span className='flex items-center gap-2'><FaRuler size={14} /> Unidades de Medida</span>,
      children: <TabUnidadesMedida />,
    },
    {
      key: 'unidades-derivadas',
      label: <span className='flex items-center gap-2'><FaCubes size={14} /> Unidades Derivadas</span>,
      children: <TabUnidadesDerivadas />,
    },
    {
      key: 'tipos-ingreso-salida',
      label: <span className='flex items-center gap-2'><FaExchangeAlt size={14} /> Tipos Ingreso/Salida</span>,
      children: <TabTiposIngresoSalida />,
    },
    {
      key: 'tipos-servicio',
      label: <span className='flex items-center gap-2'><FaTools size={14} /> Tipos de Servicio</span>,
      children: <TabTiposServicio />,
    },
    {
      key: 'almacenes',
      label: <span className='flex items-center gap-2'><FaWarehouse size={14} /> Almacenes</span>,
      children: <TabAlmacenes />,
    },
    {
      key: 'vehiculos',
      label: <span className='flex items-center gap-2'><FaTruck size={14} /> Vehículos</span>,
      children: <TabVehiculos />,
    },
    {
      key: 'organigramo',
      label: <span className='flex items-center gap-2'><FaProjectDiagram size={14} /> Organigrama</span>,
      children: <TabOrganigramo />,
    },
  ]

  return (
    <Tabs
      items={items}
      type='card'
      size='large'
      tabBarStyle={{ marginBottom: 0 }}
    />
  )
}
