'use client'

import { Checkbox, Badge } from 'antd'
import { Role } from '~/lib/api/permissions'

interface TabRolesProps {
  rolesData: Role[]
  selectedRoles: number[]
  onRolesChange: (values: number[]) => void
}

export default function TabRoles({ rolesData, selectedRoles, onRolesChange }: TabRolesProps) {
  console.log('TabRoles - rolesData:', rolesData)
  
  return (
    <div className="max-h-[500px] overflow-y-auto pr-2">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Los roles agrupan múltiples permisos. Es más fácil asignar un rol que permisos individuales.
        </p>
      </div>
      
      {rolesData && rolesData.length > 0 ? (
        <Checkbox.Group
          value={selectedRoles}
          onChange={(values) => onRolesChange(values as number[])}
          className="flex flex-col gap-3 w-full"
        >
          {rolesData.map(role => (
            <div
              key={role.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <Checkbox value={role.id} className="w-full">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-base">{role.name}</span>
                  <span className="text-gray-600 text-sm">{role.descripcion}</span>
                  {role.permissions && (
                    <span className="text-xs text-gray-500 mt-1">
                      {role.permissions.length} permisos incluidos
                    </span>
                  )}
                </div>
              </Checkbox>
            </div>
          ))}
        </Checkbox.Group>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            ⚠️ No hay roles disponibles. Por favor, verifica que los roles estén creados en el sistema.
          </p>
        </div>
      )}
    </div>
  )
}
