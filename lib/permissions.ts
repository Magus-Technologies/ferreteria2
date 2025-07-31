export enum permissions {
  // Gestion Comercial e Inventario
  GESTION_COMERCIAL_E_INVENTARIO_INDEX = 'gestion-comercial-e-inventario.index',
  GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX = 'gestion-comercial-e-inventario.mi-almacen.index',
  // Gestion Comercial e Inventario - Mi Almacén
  PRODUCTO_BASE = 'producto',
  PRODUCTO_CREATE = 'producto.create',
  PRODUCTO_UPDATE = 'producto.update',
  PRODUCTO_DUPLICAR = 'producto.duplicar',
  PRODUCTO_DELETE = 'producto.delete',
  PRODUCTO_INGRESO_CREATE = 'producto.ingreso.create',
  PRODUCTO_SALIDA_CREATE = 'producto.salida.create',

  // Facturacion Electronica
  FACTURACION_ELECTRONICA_INDEX = 'facturacion-electronica.index',

  // Gestion Contable y Financiera
  GESTION_CONTABLE_Y_FINANCIERA_INDEX = 'gestion-contable-y-financiera.index',

  // Marcas
  MARCA_BASE = 'marca',
  MARCA_LISTADO = 'marca.listado',
  MARCA_CREATE = 'marca.create',
  MARCA_UPDATE = 'marca.update',
  MARCA_DELETE = 'marca.delete',

  // Almacenes
  ALMACEN_BASE = 'almacen',
  ALMACEN_LISTADO = 'almacen.listado',
  ALMACEN_CREATE = 'almacen.create',
  ALMACEN_UPDATE = 'almacen.update',
  ALMACEN_DELETE = 'almacen.delete',
}

type PermisosValidos = Exclude<
  permissions,
  permissions.PRODUCTO_BASE | permissions.MARCA_BASE | permissions.ALMACEN_BASE
>
const permissionstoDescripcion: Record<PermisosValidos, string> = {
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX]:
    'Ver Página Gestion Comercial e Inventario',
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX]:
    'Ver Página Mi Almacén',

  [permissions.PRODUCTO_CREATE]: 'Crear Producto',
  [permissions.PRODUCTO_UPDATE]: 'Actualizar Producto',
  [permissions.PRODUCTO_DUPLICAR]: 'Duplicar Producto',
  [permissions.PRODUCTO_DELETE]: 'Eliminar Producto',
  [permissions.PRODUCTO_INGRESO_CREATE]: 'Crear Ingreso de Producto',
  [permissions.PRODUCTO_SALIDA_CREATE]: 'Crear Salida de Producto',

  [permissions.FACTURACION_ELECTRONICA_INDEX]:
    'Ver Página Facturación Electronica',
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX]:
    'Ver Página Gestion Contable y Financiera',

  [permissions.MARCA_LISTADO]: 'Ver Listado de Marcas',
  [permissions.MARCA_CREATE]: 'Crear Marca',
  [permissions.MARCA_UPDATE]: 'Actualizar Marca',
  [permissions.MARCA_DELETE]: 'Eliminar Marca',

  [permissions.ALMACEN_LISTADO]: 'Ver Listado de Almacenes',
  [permissions.ALMACEN_CREATE]: 'Crear Almacén',
  [permissions.ALMACEN_UPDATE]: 'Actualizar Almacén',
  [permissions.ALMACEN_DELETE]: 'Eliminar Almacén',
}

export function getAllPermissions() {
  return Object.entries(permissionstoDescripcion).map(([key, value]) => ({
    name: key,
    descripcion: value,
  }))
}
