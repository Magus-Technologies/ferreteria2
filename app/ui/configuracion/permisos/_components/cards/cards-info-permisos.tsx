'use client'

import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '~/lib/api/permissions'
import CardInfoPermiso from './card-info-permiso'
import { MdSecurity } from 'react-icons/md'
import { FaUserShield } from 'react-icons/fa'

export default function CardsInfoPermisos() {
  // Obtener todas las restricciones para contar
  const { data: restrictionsResponse, isLoading: loadingRestrictions } = useQuery({
    queryKey: ['restrictions'],
    queryFn: () => permissionsApi.getAll(),
  })

  // Obtener todos los roles
  const { data: rolesResponse, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionsApi.getRoles(),
  })

  // Extraer los datos de las respuestas
  const restrictionsData = Array.isArray(restrictionsResponse?.data) 
    ? restrictionsResponse.data 
    : []
  
  const rolesData = Array.isArray(rolesResponse?.data) 
    ? rolesResponse.data 
    : []

  if (loadingRestrictions || loadingRoles) {
    return (
      <>
        <CardInfoPermiso
          title="Total Restricciones"
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
      </>
    )
  }

  return (
    <>
      <CardInfoPermiso
        title="Total Restricciones"
        value={restrictionsData.length}
        icon={<MdSecurity className="text-purple-600" />}
        className="border-purple-300"
      />
      
      <CardInfoPermiso
        title="Total Roles"
        value={rolesData.length}
        icon={<FaUserShield className="text-blue-600" />}
        className="border-blue-300"
      />
    </>
  )
}
