'use client'

import { useState } from 'react'
import { Input, Collapse, Badge, Tooltip } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { permissionsApi, Permission } from '~/lib/api/permissions'
import { MdSearch, MdSecurity } from 'react-icons/md'

export default function TablePermisos() {
  const [searchTerm, setSearchTerm] = useState('')

  // Obtener todos los permisos
  const { data: permissionsResponse, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll(),
  })

  // Extraer los datos de la respuesta
  const permissionsData = Array.isArray(permissionsResponse?.data?.data)
    ? permissionsResponse.data.data
    : []

  // Agrupar permisos por módulo
  const groupedPermissions = permissionsData.reduce((acc, permission) => {
    const parts = permission.name.split('.')
    const module = parts[0]
    if (!acc[module]) acc[module] = []
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  // Filtrar permisos por búsqueda
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [module, perms]) => {
    const filteredPerms = perms.filter(
      p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filteredPerms.length > 0) {
      acc[module] = filteredPerms
    }
    return acc
  }, {} as Record<string, Permission[]>)

  // Nombres amigables para módulos
  const moduleNames: Record<string, string> = {
    'gestion-comercial-e-inventario': '🏪 Gestión Comercial e Inventario',
    'facturacion-electronica': '📄 Facturación Electrónica',
    'gestion-contable-y-financiera': '💰 Gestión Contable y Financiera',
    'reportes': '📊 Reportes',
    'configuracion': '⚙️ Configuración',
    'producto': '📦 Productos',
    'venta': '🛒 Ventas',
    'compras': '🛍️ Compras',
    'cliente': '👥 Clientes',
    'proveedor': '🏢 Proveedores',
    'marca': '🏷️ Marcas',
    'categoria': '📑 Categorías',
    'almacen': '🏭 Almacenes',
    'ubicacion': '📍 Ubicaciones',
    'unidad-medida': '📏 Unidades de Medida',
    'unidad-derivada': '🔢 Unidades Derivadas',
    'ingreso-salida': '↔️ Ingresos y Salidas',
    'tipo-ingreso-salida': '📋 Tipos de Ingresos y Salidas',
    'recepcion-almacen': '📥 Recepción de Almacén',
    'caja': '💵 Cajas',
    'cotizacion': '📝 Cotizaciones',
    'guia': '🚚 Guías de Remisión',
    'usuario': '👤 Usuarios',
    'egreso-dinero': '💰 Egresos',
    'despliegue-de-pago': '💳 Pagos',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <Input
        size="large"
        placeholder="Buscar permisos por nombre o descripción..."
        prefix={<MdSearch className="text-gray-400" />}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        allowClear
      />

      {/* Contenedor de Permisos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <MdSecurity className="text-purple-600" />
          Permisos del Sistema
          <Badge
            count={Object.values(filteredGroupedPermissions).reduce((sum, perms) => sum + perms.length, 0)}
            showZero
            style={{ backgroundColor: '#52c41a' }}
          />
        </h3>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando permisos...</p>
          </div>
        ) : Object.keys(filteredGroupedPermissions).length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto">
            <Collapse
              items={Object.entries(filteredGroupedPermissions)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([module, perms]) => ({
                  key: module,
                  label: (
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-base">
                        {moduleNames[module] || module}
                      </span>
                      <Badge count={perms.length} showZero style={{ backgroundColor: '#52c41a' }} />
                    </div>
                  ),
                  children: (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(permission => (
                          <div
                            key={permission.id}
                            className="border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all bg-gray-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Tooltip title={permission.name}>
                                  <h4 className="font-semibold text-sm text-gray-800 mb-1">
                                    {permission.descripcion}
                                  </h4>
                                </Tooltip>
                                <p className="text-xs text-gray-500 font-mono">{permission.name}</p>
                              </div>
                              <Badge
                                count={permission.id}
                                style={{ backgroundColor: '#d9d9d9', color: '#666' }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  ),
                }))}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <MdSearch className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron permisos' : 'No hay permisos disponibles'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
