import modulesData from './modules.json'
import facturacionNav from './module-navs/facturacion-electronica.json'
import configuracionNav from './module-navs/configuracion.json'

// Tipos
export interface Module {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  activeColor: string
  route: string
  permission: string
  order: number
  enabled: boolean
}

export interface NavItem {
  id: string
  type: 'button' | 'dropdown'
  label: string
  icon: string
  route?: string | null
  permission?: string | null
  action?: string
  items?: DropdownItem[]
}

export interface DropdownItem {
  key: string
  label?: string
  route?: string | null
  action?: string
  permission?: string | null
  type?: 'divider'
}

export interface BottomNavItem {
  id: string
  label: string
  icon: string
  route?: string | null
  permission?: string | null
}

export interface ModuleNav {
  moduleId: string
  topNav: {
    bgColor: string
    activeColor: string
    items: NavItem[]
  }
  bottomNav: {
    bgColor: string
    activeColor: string
    items: BottomNavItem[]
  }
}

// Mapa de navegaciones por módulo
const moduleNavs: Record<string, ModuleNav> = {
  'facturacion-electronica': facturacionNav as ModuleNav,
  'configuracion': configuracionNav as ModuleNav,
  // Agregar más módulos aquí cuando se creen sus JSON
}

/**
 * Obtener todos los módulos principales habilitados
 */
export function getAllModules(): Module[] {
  return modulesData.modules.filter(m => m.enabled) as Module[]
}

/**
 * Obtener la navegación de un módulo específico
 */
export function getModuleNav(moduleId: string): ModuleNav | null {
  return moduleNavs[moduleId] || null
}

/**
 * Obtener items del top nav filtrados por permisos
 */
export function getTopNavItems(
  moduleId: string,
  can: (permission: string) => boolean
): NavItem[] {
  const nav = getModuleNav(moduleId)
  if (!nav) return []

  return nav.topNav.items
    .filter(item => {
      // Si no tiene permiso, mostrar siempre
      if (!item.permission) return true
      // Si tiene permiso, verificar
      return can(item.permission)
    })
    .map(item => {
      // Si es dropdown, filtrar sus items por permisos
      if (item.type === 'dropdown' && item.items) {
        return {
          ...item,
          items: item.items.filter(subItem =>
            !subItem.permission || can(subItem.permission)
          ),
        }
      }
      return item
    })
    // Filtrar dropdowns vacíos
    .filter(item => {
      if (item.type === 'dropdown') {
        return item.items && item.items.length > 0
      }
      return true
    })
}

/**
 * Obtener items del bottom nav filtrados por permisos
 */
export function getBottomNavItems(
  moduleId: string,
  can: (permission: string) => boolean
): BottomNavItem[] {
  const nav = getModuleNav(moduleId)
  if (!nav) return []

  return nav.bottomNav.items.filter(
    item => !item.permission || can(item.permission)
  )
}

/**
 * Generar todos los permisos automáticamente desde los JSON
 */
export function generateAllPermissions(): string[] {
  const permissions: string[] = []

  // Permisos de módulos principales
  modulesData.modules.forEach(m => {
    if (m.permission) permissions.push(m.permission)
  })

  // Permisos de navegación de cada módulo
  Object.values(moduleNavs).forEach(nav => {
    // Top nav
    nav.topNav.items.forEach(item => {
      if (item.permission) permissions.push(item.permission)
      if (item.items) {
        item.items.forEach(sub => {
          if (sub.permission) permissions.push(sub.permission)
        })
      }
    })

    // Bottom nav
    nav.bottomNav.items.forEach(item => {
      if (item.permission) permissions.push(item.permission)
    })
  })

  // Eliminar duplicados y ordenar
  return [...new Set(permissions)].sort()
}

/**
 * Obtener un módulo por su ID
 */
export function getModuleById(moduleId: string): Module | null {
  return (modulesData.modules.find(m => m.id === moduleId) as Module) || null
}

/**
 * Verificar si un módulo está habilitado
 */
export function isModuleEnabled(moduleId: string): boolean {
  const module = getModuleById(moduleId)
  return module?.enabled ?? false
}
