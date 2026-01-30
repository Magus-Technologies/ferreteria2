# Navegación por módulos y Permisos Visuales

## Resumen

- **`configuracion/permisos`** (lista de permisos por API) ya no se usa.
- **`configuracion/permisos-visuales`** es la pantalla activa: configura qué ve cada rol por módulo (lista negra).
- La navegación de cada módulo (top + bottom) se define en **JSON** y se consume desde `~/lib/navigation`. Los navs de **Facturación Electrónica** y **Configuración** siguen el mismo patrón.

---

## 1. Sistema de navegación (`lib/navigation`)

### Archivos clave

| Archivo | Uso |
|--------|-----|
| `modules.json` | Módulos principales del home (Gestión Comercial, Facturación Electrónica, etc.). Cada uno tiene `id`, `route`, `permission`, `icon`, colores. |
| `module-navs/<modulo>.json` | Navegación **dentro** de un módulo: top nav (botones/dropdowns) y bottom nav (links). |
| `index.ts` | Tipos, registro de `moduleNavs`, y funciones: `getModuleNav(moduleId)`, `getTopNavItems(moduleId, can)`, `getBottomNavItems(moduleId, can)`. |

### Tipos (index.ts)

- **Module**: módulo principal (id, name, icon, route, permission, order, enabled).
- **ModuleNav**: para un `moduleId` tiene `topNav` y `bottomNav`, cada uno con `bgColor`, `activeColor`, `items`.
- **NavItem**: `id`, `type: 'button' | 'dropdown'`, `label`, `icon`, `route?`, `permission?`, `action?`, `items?` (para dropdowns).
- **DropdownItem**: `key`, `label?`, `route?`, `action?`, `permission?`, `type?: 'divider'`.
- **BottomNavItem**: `id`, `label`, `icon`, `route?`, `permission?`.

### Flujo

1. Cada módulo con nav (ej. facturación-electronica, configuracion) tiene su JSON en `module-navs/`.
2. En `index.ts` se importan y se registran en el objeto `moduleNavs`.
3. Las páginas del módulo usan `getModuleNav(moduleId)` y `getTopNavItems` / `getBottomNavItems(moduleId, can)`.
4. `can` viene de `usePermissionHook().can` (permiso = no estar restringido). Los items sin `permission` siempre se muestran.

---

## 2. Cómo está hecho Facturación Electrónica

### JSON (`module-navs/facturacion-electronica.json`)

- **moduleId**: `"facturacion-electronica"`.
- **topNav**: barra superior.
  - **items**: mix de `button` y `dropdown`.
  - **button**: `id`, `type: "button"`, `label`, `icon` (nombre de componente, ej. `MdSpaceDashboard`), `route`, `permission`.
  - **dropdown**: `type: "dropdown"`, `items` con `key`, `label`, `route` o `action`, `permission`. Opcional `type: "divider"` para separador.
- **bottomNav**: barra inferior.
  - **items**: `id`, `label`, `icon`, `route`, `permission`.

Cada ítem puede tener `permission: null` (siempre visible) o un string (ej. `facturacion-electronica.mis-ventas.index`).

### Top nav (`facturacion-electronica/_components/nav/top-nav.tsx`)

1. `const { can } = usePermissionHook()`.
2. `const moduleId = "facturacion-electronica"`.
3. `const nav = getModuleNav(moduleId)` y `const items = getTopNavItems(moduleId, can)`.
4. **Mapa de iconos**: objeto que asocia el string del JSON (ej. `MdSpaceDashboard`) al componente de icono importado.
5. Por cada `item`:
   - Si `item.type === 'dropdown'` y hay `item.items`: se arma el menú del dropdown (rutas → `router.push`, acciones → `actionHandlers[sub.action]`). Se usa `DropdownBase` y `ButtonNav`.
   - Si no: `ButtonNav` con `path={item.route}` y/o `onClick` si tiene `action` en `actionHandlers`.
6. Las **acciones** (ej. `openAperturaCaja`) se resuelven con un `actionHandlers` local que abre modales; los modales se renderizan en el mismo componente.

### Bottom nav (`facturacion-electronica/_components/nav/bottom-nav.tsx`)

1. `const { can } = usePermissionHook()`.
2. `moduleId = "facturacion-electronica"`, `nav = getModuleNav(moduleId)`, `items = getBottomNavItems(moduleId, can)`.
3. **Mapa de iconos** con todos los iconos usados en el JSON del bottom.
4. Se renderiza `BaseNav` con `bgColorClass={nav.bottomNav.bgColor}` y, por cada item, `ButtonNav` con `path={item.route}`, `colorActive={nav.bottomNav.activeColor}`.

### Layout del módulo

El layout de facturación-electronica (o el que tenga top/bottom) solo incluye `<TopNav />` y `<BottomNav />` y el contenido; no define la estructura de items, esa viene del JSON.

---

## 3. Cómo está hecho Configuración

- **JSON**: `module-navs/configuracion.json` con `moduleId: "configuracion"`.
- El ítem **Permisos** apunta a **permisos-visuales**: `"route": "/ui/configuracion/permisos-visuales"`, `"permission": "configuracion.permisos.index"`.
- **Top nav y Bottom nav**: mismo patrón que facturación: `getModuleNav("configuracion")`, `getTopNavItems` / `getBottomNavItems` con `can`, mapa de iconos, `BaseNav` + `ButtonNav`. Configuración solo tiene botones (no dropdowns).

---

## 4. Permisos visuales (`configuracion/permisos-visuales`)

- **Objetivo**: por rol, decidir qué ítems de la navegación (y qué vistas) se **muestran** o se **ocultan** (lista negra).
- **Datos**: roles y restricciones vía `permissionsApi` (roles con `restrictions`). La página usa el **mismo JSON de navegación** (ej. facturacion-electronica) para saber qué permisos existen y qué labels mostrar.
- **Flujo**:
  1. Usuario elige **Rol** y **Área** (módulo, ej. facturacion-electronica).
  2. Se extraen ítems del JSON (top + bottom) con `extraerItems()` (recursivo por si hay dropdowns).
  3. Cada ítem se muestra como tarjeta con estado visible/oculto según si el permiso está en las restricciones del rol.
  4. Click en “ojo”: modal Mostrar/Ocultar → `permissionsApi.toggleRestriction(rolId, permissionName, mostrar)`.
  5. Si el ítem tiene **vista real** (ej. Mis Ventas), se puede abrir esa vista en modo “configuración” y hacer click en elementos para restringir (mismo modal).

Para añadir otro módulo a permisos-visuales:

- Añadir su JSON a la lista de módulos en la página (selector “Área”).
- Implementar `obtenerModulos()` para ese módulo (extraer top/bottom del JSON).
- Opcional: añadir entradas en `ICON_MAP` y `COMPONENT_MAP` para vistas que se abran en modo configuración.

---

## 5. Cómo replicar el patrón en otro módulo (ej. Gestión Comercial)

1. **Crear** `lib/navigation/module-navs/gestion-comercial-e-inventario.json` (o el id que uses) con la misma estructura: `moduleId`, `topNav` (bgColor, activeColor, items), `bottomNav` (bgColor, activeColor, items). Usar permisos que existan en `lib/permissions.ts`.
2. **Registrar** en `lib/navigation/index.ts`: import del JSON y añadir en el objeto `moduleNavs` la entrada correspondiente al `moduleId`.
3. **Crear** (o reutilizar) layout del módulo que tenga top + bottom nav.
4. **Crear** `gestion-comercial-e-inventario/_components/nav/top-nav.tsx`:
   - Importar `getTopNavItems`, `getModuleNav` desde `~/lib/navigation` y `usePermissionHook` desde `~/hooks/use-permission`.
   - Definir `moduleId`, mapa de iconos con todos los iconos usados en el JSON.
   - Si hay dropdowns o acciones, definir `actionHandlers` y mapear `route` → `router.push`, `action` → handler.
   - Renderizar `BaseNav` y, por cada item, o `DropdownBase` + `ButtonNav` o `ButtonNav` según tipo.
5. **Crear** `gestion-comercial-e-inventario/_components/nav/bottom-nav.tsx`:
   - Mismo esquema: `getBottomNavItems(moduleId, can)`, mapa de iconos, `BaseNav` + `ButtonNav` por item.
6. **Opcional**: En permisos-visuales, añadir el nuevo módulo al selector “Área” y en `obtenerModulos()` leer el nuevo JSON y devolver topNav/bottomNav para ese módulo.

Con esto, el nuevo módulo queda con la misma arquitectura que Facturación Electrónica y Configuración, y permisos-visuales puede usarlo si lo integras en el selector y en `obtenerModulos()`.
