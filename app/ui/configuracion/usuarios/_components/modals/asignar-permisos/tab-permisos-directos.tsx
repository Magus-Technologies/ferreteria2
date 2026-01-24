'use client'

import { Checkbox, Collapse, Badge } from 'antd'
import { Permission } from '~/lib/api/permissions'
import { moduleNames } from './module-names'

interface TabPermisosDirectosProps {
  groupedPermissions: Record<string, Permission[]>
  selectedPermissions: number[]
  onPermissionsChange: (values: number[]) => void
}

export default function TabPermisosDirectos({
  groupedPermissions,
  selectedPermissions,
  onPermissionsChange,
}: TabPermisosDirectosProps) {
  return (
    <div className="max-h-[500px] overflow-y-auto pr-2">
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
        <p className="text-sm text-amber-800">
          <strong>⚠️ Nota:</strong> Los permisos directos se suman a los permisos de los roles. Úsalos solo para casos especiales.
        </p>
      </div>

      <Checkbox.Group
        value={selectedPermissions}
        onChange={(values) => onPermissionsChange(values as number[])}
        className="w-full"
      >
        <Collapse
          accordion
          items={Object.entries(groupedPermissions || {}).map(([module, perms]) => ({
            key: module,
            label: (
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold">
                  {moduleNames[module] || module}
                </span>
                <Badge count={perms.length} showZero style={{ backgroundColor: '#52c41a' }} />
              </div>
            ),
            children: (
              <div className="flex flex-col gap-2 pl-4">
                {perms.map(permission => (
                  <Checkbox key={permission.id} value={permission.id}>
                    <div className="flex flex-col">
                      <span className="text-sm">{permission.descripcion}</span>
                      <span className="text-xs text-gray-400">{permission.name}</span>
                    </div>
                  </Checkbox>
                ))}
              </div>
            ),
          }))}
        />
      </Checkbox.Group>
    </div>
  )
}
