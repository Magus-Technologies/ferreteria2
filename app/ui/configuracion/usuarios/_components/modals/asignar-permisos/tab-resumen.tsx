'use client'

import { Badge } from 'antd'
import { UserPermissions } from '~/lib/api/permissions'

interface TabResumenProps {
  userPermissions?: UserPermissions
}

export default function TabResumen({ userPermissions }: TabResumenProps) {
  return (
    <div className="max-h-[500px] overflow-y-auto pr-2">
      <div className="space-y-4">
        {/* Roles Asignados */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            👥 Roles Asignados
            <Badge count={userPermissions?.roles.length || 0} showZero />
          </h3>
          {userPermissions?.roles && userPermissions.roles.length > 0 ? (
            <div className="space-y-2">
              {userPermissions.roles.map(role => (
                <div key={role.id} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="font-semibold">{role.name}</div>
                  <div className="text-sm text-gray-600">{role.descripcion}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tiene roles asignados</p>
          )}
        </div>

        {/* Permisos de Roles */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            🔓 Permisos de Roles
            <Badge count={userPermissions?.role_permissions.length || 0} showZero style={{ backgroundColor: '#1890ff' }} />
          </h3>
          {userPermissions?.role_permissions && userPermissions.role_permissions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {userPermissions.role_permissions.map(permission => (
                <div key={permission.id} className="text-sm bg-blue-50 p-2 rounded border border-blue-100">
                  {permission.descripcion}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tiene permisos de roles</p>
          )}
        </div>

        {/* Permisos Directos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            🔐 Permisos Directos
            <Badge count={userPermissions?.direct_permissions.length || 0} showZero style={{ backgroundColor: '#faad14' }} />
          </h3>
          {userPermissions?.direct_permissions && userPermissions.direct_permissions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {userPermissions.direct_permissions.map(permission => (
                <div key={permission.id} className="text-sm bg-amber-50 p-2 rounded border border-amber-100">
                  {permission.descripcion}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tiene permisos directos</p>
          )}
        </div>

        {/* Total */}
        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            ✅ Total de Permisos
            <Badge count={userPermissions?.all_permission_ids.length || 0} showZero style={{ backgroundColor: '#52c41a' }} />
          </h3>
          <p className="text-sm text-gray-600">
            Este usuario tiene acceso a {userPermissions?.all_permission_ids.length || 0} permisos únicos
            (combinando roles y permisos directos)
          </p>
        </div>
      </div>
    </div>
  )
}
