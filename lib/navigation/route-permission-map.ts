import facturacion from './module-navs/facturacion-electronica.json'
import gestionComercial from './module-navs/gestion-comercial-e-inventario.json'
import configuracion from './module-navs/configuracion.json'
import reportes from './module-navs/reportes.json'

interface NavNode {
  route?: string
  permission?: string | null
  items?: NavNode[]
}

interface RoutePerm {
  route: string
  permission: string
}

function walk(items: NavNode[] | undefined, out: RoutePerm[]) {
  if (!items) return
  for (const it of items) {
    if (it.route && it.permission) out.push({ route: it.route, permission: it.permission })
    if (it.items) walk(it.items, out)
  }
}

let cache: RoutePerm[] | null = null

function buildMap(): RoutePerm[] {
  if (cache) return cache
  const out: RoutePerm[] = []
  for (const nav of [facturacion, gestionComercial, configuracion, reportes] as any[]) {
    walk(nav?.topNav?.items, out)
    walk(nav?.bottomNav?.items, out)
  }
  cache = out
  return out
}

/**
 * Devuelve el `permission` (componentId) de la vista de navegación más
 * específica que coincide con el pathname (match exacto o prefijo más largo).
 */
export function permissionForPath(pathname: string): string | null {
  if (!pathname) return null
  const map = buildMap()
  let best: RoutePerm | null = null
  for (const e of map) {
    if (pathname === e.route || pathname.startsWith(e.route + '/')) {
      if (!best || e.route.length > best.route.length) best = e
    }
  }
  return best?.permission ?? null
}
