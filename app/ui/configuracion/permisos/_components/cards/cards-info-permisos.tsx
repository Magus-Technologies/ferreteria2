'use client'

import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '~/lib/api/permissions'
import CardInfoPermiso from './card-info-permiso'
import { MdSecurity } from 'react-icons/md'
import { FaUserShield, FaUsers } from 'react-icons/fa'

export default function CardsInfoPermisos() {
  // Obtener estadísticas
  const { data: statsResponse, isLoading: loadingStats } = useQuery({
    queryKey: ['permissions-stats'],
    queryFn: () => permissionsApi.getStats(),
  })

  // Obtener todos los permisos para contar
  const { data: permissionsResponse, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll(),
  })

  // Extraer los datos de las respuestas
  const statsData = statsResponse?.data?.data
  const permissionsData = Array.isArray(permissionsResponse?.data?.data) 
    ? permissionsResponse.data.data 
    : []

  if (loadingStats || loadingPerms) {
    return (
      <>
        <CardInfoPermiso
          title="Total Permisos"
          value="..."
          icon={<MdSecurity className="text-purple-600" />}
          className="border-purple-300"
        />
        <CardInfoPermiso
          title="Total Roles"
          value="..."
          icon={<FaUserShield className="text-blue-600" />}
          className="border-blue-300"
        />
        <CardInfoPermiso
          title="Total Usuarios"
          value="..."
          icon={<FaUsers className="text-green-600" />}
          className="border-green-300"
        />
      </>
    )
  }

  return (
    <>
      <CardInfoPermiso
        title="Total Permisos"
        value={statsData?.total_permissions || permissionsData.length}
        icon={<MdSecurity className="text-purple-600" />}
        className="border-purple-300"
      />
      
      <CardInfoPermiso
        title="Total Roles"
        value={statsData?.total_roles || 0}
        icon={<FaUserShield className="text-blue-600" />}
        className="border-blue-300"
      />
      
      <CardInfoPermiso
        title="Total Usuarios"
        value={statsData?.total_users || 0}
        icon={<FaUsers className="text-green-600" />}
        className="border-green-300"
      />
    </>
  )
}
