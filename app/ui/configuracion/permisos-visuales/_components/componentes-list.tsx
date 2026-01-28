'use client'

import { Card, Checkbox, Tag, Space, Tooltip } from 'antd'
import { FaInfoCircle, FaLock, FaUnlock, FaLink } from 'react-icons/fa'
import type { UIComponent } from '~/lib/ui-permissions-metadata'

interface ComponentesListProps {
  componentes: UIComponent[]
  permisosActivos: Set<string>
  onToggle: (permiso: string) => void
}

export default function ComponentesList({
  componentes,
  permisosActivos,
  onToggle
}: ComponentesListProps) {
  if (componentes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay componentes de este tipo en el módulo seleccionado
      </div>
    )
  }

  // Iconos por tipo
  const tipoIconos: Record<UIComponent['tipo'], string> = {
    page: '📄',
    button: '🔘',
    field: '📝',
    column: '📊',
    modal: '🪟',
    section: '📦'
  }

  // Colores por tipo
  const tipoColores: Record<UIComponent['tipo'], string> = {
    page: 'green',
    button: 'blue',
    field: 'orange',
    column: 'purple',
    modal: 'cyan',
    section: 'magenta'
  }

  return (
    <div className="space-y-3">
      {componentes.map((componente) => {
        const activo = permisosActivos.has(componente.permiso)
        const tieneDependencias = componente.dependeDe && componente.dependeDe.length > 0

        return (
          <Card
            key={componente.id}
            size="small"
            className={`transition-all ${
              activo
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Checkbox y Info del Componente */}
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={activo}
                  onChange={() => onToggle(componente.permiso)}
                  className="mt-1"
                />

                <div className="flex-1">
                  {/* Título */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tipoIconos[componente.tipo]}</span>
                    <span className="font-semibold text-base">
                      {componente.label}
                    </span>
                    <Tag color={tipoColores[componente.tipo]} className="text-xs">
                      {componente.tipo}
                    </Tag>
                    {activo ? (
                      <FaUnlock className="text-green-500" />
                    ) : (
                      <FaLock className="text-gray-400" />
                    )}
                  </div>

                  {/* Descripción */}
                  {componente.descripcion && (
                    <p className="text-sm text-gray-600 mb-2">
                      {componente.descripcion}
                    </p>
                  )}

                  {/* Ubicación */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaInfoCircle />
                      {componente.ubicacion}
                    </span>

                    {/* Dependencias */}
                    {tieneDependencias && (
                      <Tooltip title={`Depende de: ${componente.dependeDe?.join(', ')}`}>
                        <span className="flex items-center gap-1 text-orange-500">
                          <FaLink />
                          {componente.dependeDe?.length} dependencia(s)
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {/* Permiso Técnico */}
              <div className="text-right">
                <Tooltip title="Nombre técnico del permiso">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {componente.permiso}
                  </code>
                </Tooltip>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
