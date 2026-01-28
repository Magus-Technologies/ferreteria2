'use client'

import { Card, Alert, Tag, Collapse, Empty } from 'antd'
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import type { UIModule } from '~/lib/ui-permissions-metadata'

interface VistaPreviaProps {
  modulo: UIModule
  permisosActivos: Set<string>
  rolNombre: string
}

export default function VistaPrevia({
  modulo,
  permisosActivos,
  rolNombre
}: VistaPreviaProps) {
  const componentes = Object.values(modulo.componentes)

  // Agrupar por tipo
  const componentesPorTipo = componentes.reduce((acc, comp) => {
    if (!acc[comp.tipo]) {
      acc[comp.tipo] = []
    }
    acc[comp.tipo].push(comp)
    return acc
  }, {} as Record<string, typeof componentes>)

  // Iconos y colores por tipo
  const tipoConfig = {
    page: { icono: '📄', label: 'Páginas', color: 'green' },
    button: { icono: '🔘', label: 'Botones', color: 'blue' },
    field: { icono: '📝', label: 'Campos', color: 'orange' },
    column: { icono: '📊', label: 'Columnas', color: 'purple' },
    modal: { icono: '🪟', label: 'Modales', color: 'cyan' },
    section: { icono: '📦', label: 'Secciones', color: 'magenta' }
  }

  // Contar permisos activos por tipo
  const contarActivos = (tipo: string) => {
    return componentesPorTipo[tipo]?.filter(c => permisosActivos.has(c.permiso)).length || 0
  }

  const contarTotal = (tipo: string) => {
    return componentesPorTipo[tipo]?.length || 0
  }

  return (
    <Card>
      {/* Header de Vista Previa */}
      <Alert
        message={
          <div className="flex items-center gap-2">
            <FaEye className="text-lg" />
            <span className="font-semibold">
              Vista Previa: {rolNombre} en {modulo.nombre}
            </span>
          </div>
        }
        description="Esta es una simulación de cómo verá la interfaz un usuario con el rol seleccionado. Los elementos marcados en verde estarán visibles, los marcados en rojo estarán ocultos."
        type="info"
        className="mb-4"
      />

      {/* Resumen General */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(tipoConfig).map(([tipo, config]) => {
          const activos = contarActivos(tipo)
          const total = contarTotal(tipo)
          const porcentaje = total > 0 ? Math.round((activos / total) * 100) : 0

          return (
            <Card key={tipo} size="small" className="text-center">
              <div className="text-2xl mb-1">{config.icono}</div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                {config.label}
              </div>
              <div className="text-xl font-bold">
                {activos}/{total}
              </div>
              <div className="text-xs text-gray-500">
                {porcentaje}% visible
              </div>
            </Card>
          )
        })}
      </div>

      {/* Lista de Componentes por Tipo */}
      <Collapse
        defaultActiveKey={Object.keys(componentesPorTipo)}
        items={Object.entries(componentesPorTipo).map(([tipo, comps]) => {
          const config = tipoConfig[tipo as keyof typeof tipoConfig]
          const activos = comps.filter(c => permisosActivos.has(c.permiso))
          const ocultos = comps.filter(c => !permisosActivos.has(c.permiso))

          return {
            key: tipo,
            label: (
              <div className="flex items-center gap-2">
                <span>{config.icono}</span>
                <span className="font-semibold">{config.label}</span>
                <Tag color={config.color}>
                  {activos.length} visibles / {comps.length} totales
                </Tag>
              </div>
            ),
            children: (
              <div className="space-y-4">
                {/* Componentes Visibles */}
                {activos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-green-600 font-medium">
                      <FaCheckCircle />
                      <span>Componentes Visibles ({activos.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activos.map(comp => (
                        <div
                          key={comp.id}
                          className="border border-green-200 bg-green-50 rounded p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-green-800">
                                {comp.label}
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {comp.ubicacion}
                              </div>
                            </div>
                            <FaEye className="text-green-500 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Componentes Ocultos */}
                {ocultos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-red-600 font-medium">
                      <FaTimesCircle />
                      <span>Componentes Ocultos ({ocultos.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ocultos.map(comp => (
                        <div
                          key={comp.id}
                          className="border border-red-200 bg-red-50 rounded p-3 opacity-60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-red-800 line-through">
                                {comp.label}
                              </div>
                              <div className="text-xs text-red-600 mt-1">
                                {comp.ubicacion}
                              </div>
                            </div>
                            <FaEyeSlash className="text-red-500 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }
        })}
      />

      {/* Mensaje si no hay componentes */}
      {componentes.length === 0 && (
        <Empty
          description="No hay componentes configurados en este módulo"
          className="py-12"
        />
      )}
    </Card>
  )
}
